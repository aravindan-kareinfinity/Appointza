using appointza.Models;
using appointza.Razorpay;
using appointza.Utils;
using System.Data.Common;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Net.Http;
using System.Net.Http.Headers;

namespace appointza.Services
{
    public class PaymentService
    {
        IDbProvider dbprovider;
        PaymentGatewayCredentialsService paymentGatewayCredentialsService;
        RazorpayService razorpayService;
        RequestState requeststate;
        OrganisationService organisationService;
        OrganisationServicesService organisationServicesService;
        EventService eventService;
        BookingFeeService bookingFeeService;
        WhatsAppAutomationPublisher whatsAppAutomationPublisher;

        public PaymentService(
            IDbProvider dbprovider,
            PaymentGatewayCredentialsService paymentGatewayCredentialsService,
            RazorpayService razorpayService,
            RequestState requeststate,
            OrganisationService organisationService,
            OrganisationServicesService organisationServicesService,
            EventService eventService,
            BookingFeeService bookingFeeService,
            WhatsAppAutomationPublisher whatsAppAutomationPublisher)
        {
            this.dbprovider = dbprovider;
            this.paymentGatewayCredentialsService = paymentGatewayCredentialsService;
            this.razorpayService = razorpayService;
            this.requeststate = requeststate;
            this.organisationService = organisationService;
            this.organisationServicesService = organisationServicesService;
            this.eventService = eventService;
            this.bookingFeeService = bookingFeeService;
            this.whatsAppAutomationPublisher = whatsAppAutomationPublisher;
        }

        public async Task<CreatePaymentOrderRes> CreatePaymentOrder(CreatePaymentOrderReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await CreatePaymentOrderTransaction(db, req);
            }
        }

        public async Task<CreatePaymentOrderRes> CreatePaymentOrderTransaction(IDb db, CreatePaymentOrderReq req)
        {
            // Validate request
            if (req == null)
            {
                throw new ArgumentNullException(nameof(req), "Payment order request cannot be null");
            }

            if (req.organizationid <= 0)
            {
                throw new ArgumentException("Organization ID is required", nameof(req.organizationid));
            }

            // SECURITY: Calculate amount on server-side to prevent tampering
            decimal calculatedAmount = await CalculateAmountTransaction(db, req);
            
            if (calculatedAmount <= 0)
            {
                throw new ArgumentException("Calculated amount must be greater than zero", nameof(calculatedAmount));
            }

            // Get payment credentials from database (organization-specific)
            var credentials = await GetRazorpayCredentialsFromDb(db, req.organizationid);
            
            // Create Razorpay order using database credentials
            var razorpayReq = new RazorpayOrderReq
            {
                amount = (int)(calculatedAmount * 100), // Convert to paise - use calculated amount, not req.amount
                currency = req.currency,
                receipt = req.receipt ?? $"appt_{req.organisationlocationid}_{DateTime.UtcNow.Ticks}",
                notes = new RazorpayOrderNotes
                {
                    customerid = req.userid,
                    appointmentid = !string.IsNullOrEmpty(req.appointmentid) && long.TryParse(req.appointmentid, out var apptId) ? apptId : null,
                    organisation_location_id = req.organisationlocationid,
                    eventid = req.eventid
                }
            };

            // Use database credentials to create Razorpay order
            var razorpayOrder = await CreateRazorpayOrderWithCredentials(credentials, razorpayReq);
            
            // Get Razorpay key from database credentials (for frontend)
            string razorpayKey = credentials.api_key;

            return new CreatePaymentOrderRes
            {
                orderid = razorpayOrder.id,
                key = razorpayKey,
                amount = calculatedAmount, // Return calculated amount, not req.amount
                currency = req.currency,
                receipt = razorpayOrder.receipt
            };
        }

        /// <summary>
        /// Calculate payment amount on server-side based on organization settings and selected services
        /// This prevents clients from tampering with the amount
        /// </summary>
        private async Task<decimal> CalculateAmountTransaction(IDb db, CreatePaymentOrderReq req)
        {
            // Handle event bookings separately
            if (req.eventid.HasValue && req.eventid.Value > 0)
            {
                // Get event details
                var eventDetails = (await eventService.SelectTransaction(db, new EventSelectReq 
                { 
                    id = req.eventid.Value 
                })).FirstOrDefault();

                if (eventDetails == null)
                {
                    throw new Exception($"Event {req.eventid.Value} not found");
                }

                // Return event entry amount
                return eventDetails.entry_amount;
            }

            // Get organization details
            var organisation = (await organisationService.SelectTransaction(db, new OrganisationSelectReq 
            { 
                id = req.organizationid 
            })).FirstOrDefault();

            if (organisation == null)
            {
                throw new Exception($"Organization {req.organizationid} not found");
            }

            // If organization uses service-based pricing
            if (organisation.isserviceamount)
            {
                // Validate that servicelist is provided
                if (req.servicelist == null || req.servicelist.Count == 0)
                {
                    throw new ArgumentException("Service list is required for service-based pricing", nameof(req.servicelist));
                }

                // Validate appointment date is provided (needed for weekend/weekday pricing)
                if (!req.appointmentdate.HasValue)
                {
                    throw new ArgumentException("Appointment date is required for service-based pricing", nameof(req.appointmentdate));
                }

                decimal totalAmount = 0;
                DateTime appointmentDate = req.appointmentdate.Value;
                bool isWeekend = appointmentDate.DayOfWeek == DayOfWeek.Saturday || appointmentDate.DayOfWeek == DayOfWeek.Sunday;

                // Get all services for this organization
                var allServices = await organisationServicesService.SelectTransaction(db, new OrganisationServicesSelectReq 
                { 
                    organisationid = req.organizationid,
                    organisationlocationid = req.organisationlocationid,
                });

                // Calculate total based on selected services
                foreach (var selectedService in req.servicelist)
                {
                    var service = allServices.FirstOrDefault(s => s.id == selectedService.id);
                    if (service == null)
                    {
                        throw new Exception($"Service {selectedService.id} not found for organization {req.organizationid}");
                    }

                    // Skip if service doesn't show price
                    if (!service.show_price)
                    {
                        continue;
                    }

                    decimal servicePrice = 0;

                    // Check if service has different weekend/weekday pricing
                    if (service.is_price_different)
                    {
                        if (isWeekend && service.weekend_price > 0)
                        {
                            servicePrice = (decimal)service.weekend_price;
                        }
                        else if (!isWeekend && service.weekday_price > 0)
                        {
                            servicePrice = (decimal)service.weekday_price;
                        }
                        else
                        {
                            // Fallback to regular price
                            servicePrice = (decimal)service.prize;
                        }
                    }
                    else
                    {
                        // Use regular price
                        servicePrice = (decimal)service.prize;
                    }

                    // Offer only when same price all days
                    if (!service.is_price_different && service.offerprize > 0 && (decimal)service.offerprize < servicePrice)
                    {
                        servicePrice = (decimal)service.offerprize;
                    }

                    totalAmount += servicePrice;
                }

                return totalAmount;
            }
            else
            {
                // Use fixed booking amount
                return organisation.booking_amount > 0 ? organisation.booking_amount : 5.10m;
            }
        }

        /// <summary>
        /// Get Razorpay credentials from database for the organization
        /// </summary>
        private async Task<PaymentGatewayCredentials> GetRazorpayCredentialsFromDb(IDb db, long organizationId)
        {
            var credentials = await paymentGatewayCredentialsService.SelectTransaction(db, new PaymentGatewayCredentialsSelectReq
            {
                organization_id = organizationId,
                gateway_name = "razorpay",
                is_active = true
            });
            
            if (credentials == null || credentials.Count == 0)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, 
                    $"Razorpay credentials not found for organization {organizationId}. Please configure payment gateway credentials.");
            }
            
            return credentials.First();
        }

        private async Task<RazorpayOrder> CreateRazorpayOrderWithCredentials(
            PaymentGatewayCredentials credentials, 
            RazorpayOrderReq req)
        {
            // Create HTTP client with organization-specific credentials
            var client = new HttpClient();
            var baseUrl = "https://api.razorpay.com/v1/";
            
            client.BaseAddress = new Uri(baseUrl);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));

            // Create Basic Auth token: base64(api_key:api_secret)
            // IMPORTANT: Use ASCII encoding for Basic Auth (Razorpay requirement)
            var authString = $"{credentials.api_key}:{credentials.api_secret}";
            var authBytes = Encoding.ASCII.GetBytes(authString);
            var token = Convert.ToBase64String(authBytes);
            client.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Basic", token);

            // Create order
            var request = new HttpRequestMessage(HttpMethod.Post, "orders");
            request.Content = new StringContent(
                JsonSerializer.Serialize(req),
                Encoding.UTF8,
                "application/json");

            var response = await client.SendAsync(request);
            var responseContentText = await response.Content.ReadAsStringAsync();

            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {
                return JsonSerializer.Deserialize<RazorpayOrder>(responseContentText);
            }
            else
            {
                throw new Exception($"Razorpay API error: {responseContentText}");
            }
        }

        public async Task<VerifyPaymentRes> VerifyPayment(VerifyPaymentReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await VerifyPaymentTransaction(db, req);
            }
        }

        public async Task<VerifyPaymentRes> VerifyPaymentTransaction(IDb db, VerifyPaymentReq req)
        {
            long organizationid = 0;
            long organisationlocationid = 0;
            bool isEventBooking = req.eventbookingid.HasValue && req.eventbookingid.Value > 0;
            
            // For test payments, organizationid can be provided directly
            if (req.organizationid.HasValue && req.organizationid.Value > 0 && req.appointmentid == 0)
            {
                organizationid = req.organizationid.Value;
                organisationlocationid = 0; // Not needed for test payments
            }
            else if (isEventBooking)
            {
                // Get event booking to find organization
                string eventBookingQuery = @"
                    SELECT eb.id, eb.event_id, eb.user_id, eb.payment_status,
                           e.organisation_id, e.organisation_location_id
                    FROM event_bookings eb
                    INNER JOIN events e ON eb.event_id = e.id
                    WHERE eb.id = @eventbookingid
                ";
                
                DbCommand eventBookingCmd = db.GetCommand(eventBookingQuery);
                db.AddParameter(eventBookingCmd, "eventbookingid", DbTypes.Types.Long).Value = req.eventbookingid.Value;
                
                using (DbDataReader reader = await db.Execute(eventBookingCmd))
                {
                    if (await reader.ReadAsync())
                    {
                        organizationid = reader["organisation_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_id"]);
                        organisationlocationid = reader["organisation_location_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_location_id"]);
                    }
                    else
                    {
                        return new VerifyPaymentRes
                        {
                            isvalid = false,
                            message = "Event booking not found"
                        };
                    }
                }
            }
            else
            {
                // For test payments, organizationid is provided directly (appointmentid = 0)
                if (req.appointmentid == 0 && req.organizationid.HasValue && req.organizationid.Value > 0)
                {
                    organizationid = req.organizationid.Value;
                    organisationlocationid = 0; // Not needed for test payments
                }
                else if (req.appointmentid > 0)
                {
                    // Get appointment to find organization - using direct query
                    string appointmentQuery = @"
                        SELECT id, userid, organisationid, ispaid, organisationlocationid
                        FROM Appoinment
                        WHERE id = @appointmentid
                    ";
                    
                    DbCommand appointmentCmd = db.GetCommand(appointmentQuery);
                    db.AddParameter(appointmentCmd, "appointmentid", DbTypes.Types.Long).Value = req.appointmentid;
                    
                    using (DbDataReader reader = await db.Execute(appointmentCmd))
                    {
                        if (await reader.ReadAsync())
                        {
                            organizationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                            organisationlocationid = reader["organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlocationid"]);
                        }
                        else
                        {
                            return new VerifyPaymentRes
                            {
                                isvalid = false,
                                message = "Appointment not found"
                            };
                        }
                    }
                }
            }

            if (organizationid == 0)
            {
                return new VerifyPaymentRes
                {
                    isvalid = false,
                    message = "Invalid organization"
                };
            }

            // Get payment credentials from database (organization-specific)
            var credentials = await GetRazorpayCredentialsFromDb(db, organizationid);
            
            // Get secret from database credentials for signature verification
            string secret = credentials.api_secret;
            
            if (string.IsNullOrEmpty(secret))
            {
                return new VerifyPaymentRes
                {
                    isvalid = false,
                    message = $"Payment gateway credentials not configured for organization {organizationid}"
                };
            }

            // Verify signature
            string payload = $"{req.razorpay_order_id}|{req.razorpay_payment_id}";
            
            using (HMACSHA256 hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret)))
            {
                byte[] hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
                string generatedSignature = BitConverter.ToString(hashBytes)
                    .Replace("-", "")
                    .ToLower();

                bool isValid = generatedSignature == req.razorpay_signature.ToLower();

                if (isValid)
                {
                    // Fetch payment details from Razorpay using database credentials
                    var paymentDetailsJson = await FetchRazorpayPaymentWithCredentials(credentials, req.razorpay_payment_id);
                    var orderDetailsJson = await FetchRazorpayOrderWithCredentials(credentials, req.razorpay_order_id);

                    // Extract payment details
                    string paymentMethod = paymentDetailsJson.TryGetProperty("method", out var methodProp) 
                        ? methodProp.GetString() ?? "unknown" 
                        : "unknown";
                    int paymentAmount = paymentDetailsJson.TryGetProperty("amount", out var amountProp) 
                        ? amountProp.GetInt32() 
                        : 0;
                    string paymentStatus = paymentDetailsJson.TryGetProperty("status", out var statusProp) 
                        ? statusProp.GetString() ?? "unknown" 
                        : "unknown";
                    string paymentCurrency = paymentDetailsJson.TryGetProperty("currency", out var currencyProp) 
                        ? currencyProp.GetString() ?? "INR" 
                        : "INR";

                    // Extract order ID (remove "order_" prefix if present)
                    string orderIdStr = orderDetailsJson.TryGetProperty("id", out var orderIdProp) 
                        ? orderIdProp.GetString() ?? "0" 
                        : "0";
                    orderIdStr = orderIdStr.Replace("order_", "");
                    long orderIdLong = long.TryParse(orderIdStr, out var parsedOrderId) ? parsedOrderId : 0;

                    // Update payment status based on booking type (skip for test payments)
                    bool isTestPayment = req.appointmentid == 0 && req.organizationid.HasValue && req.organizationid.Value > 0;
                    
                    if (!isTestPayment)
                    {
                        if (isEventBooking)
                        {
                            // Update event booking payment status
                            string updateEventBookingQuery = @"
                                UPDATE event_bookings
                                SET payment_status = 'paid', payment_reference = @payment_reference, updated_at = @updated_at
                                WHERE id = @eventbookingid
                            ";
                            
                            DbCommand updateEventBookingCmd = db.GetCommand(updateEventBookingQuery);
                            db.AddParameter(updateEventBookingCmd, "eventbookingid", DbTypes.Types.Long).Value = req.eventbookingid.Value;
                            db.AddParameter(updateEventBookingCmd, "payment_reference", DbTypes.Types.String).Value = req.razorpay_payment_id;
                            db.AddParameter(updateEventBookingCmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                            
                            await db.ExecuteNonQuery(updateEventBookingCmd);
                        }
                        else if (req.appointmentid > 0)
                        {
                            // Update appointment payment status
                            string updateQuery = @"
                                UPDATE Appoinment
                                SET ispaid = true, modifiedon = @modifiedon, modifiedby = @modifiedby
                                WHERE id = @appointmentid
                            ";
                            
                            DbCommand updateCmd = db.GetCommand(updateQuery);
                            db.AddParameter(updateCmd, "appointmentid", DbTypes.Types.Long).Value = req.appointmentid;
                            db.AddParameter(updateCmd, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                            db.AddParameter(updateCmd, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext?.id ?? 0;
                            
                            await db.ExecuteNonQuery(updateCmd);
                        }
                    }

                    // Create payment group (optional - for grouping multiple payments)
                    long? paymentGroupId = null;
                    // For now, we'll skip creating payment group unless needed

                    // Create payment record
                    string paymentAttributesJson = JsonSerializer.Serialize(new
                    {
                        razorpay_order_id = req.razorpay_order_id,
                        razorpay_payment_id = req.razorpay_payment_id,
                        razorpay_signature = req.razorpay_signature,
                        payment_details = paymentDetailsJson,
                        order_details = orderDetailsJson
                    });

                    long paymentId = await CreatePaymentRecord(
                        db,
                        key: req.razorpay_payment_id,
                        mode: GetPaymentModeFromMethod(paymentMethod),
                        amount: paymentAmount / 100.0m, // Convert from paise to rupees
                        status: GetPaymentStatus(paymentStatus),
                        typecode: isTestPayment ? 99 : 1, // Use type 99 for test payments
                        groupid: paymentGroupId,
                        orderid: orderIdLong,
                        appoinmentid: isTestPayment ? 0 : (isEventBooking ? 0 : req.appointmentid), // 0 for test payments and event bookings
                        paymentmodetype: GetPaymentModeType(paymentMethod),
                        paymentmodecode: paymentMethod,
                        createdby: requeststate.usercontext?.id ?? 0,
                        modifiedby: requeststate.usercontext?.id ?? 0,
                        attributes_json: paymentAttributesJson
                    );

                    // Create payment gateway log
                    string logAttributesJson = JsonSerializer.Serialize(new
                    {
                        razorpay_order_id = req.razorpay_order_id,
                        razorpay_payment_id = req.razorpay_payment_id,
                        payment_status = paymentStatus,
                        payment_method = paymentMethod,
                        amount = paymentAmount,
                        currency = paymentCurrency
                    });

                    await CreatePaymentGatewayLog(
                        db,
                        vendor: "razorpay",
                        paymentid: paymentId,
                        createdby: requeststate.usercontext?.id ?? 0,
                        modifiedby: requeststate.usercontext?.id ?? 0,
                        attributes_json: logAttributesJson
                    );

                    if (!isTestPayment && organizationid > 0)
                    {
                        try
                        {
                            decimal bookingAmountInr = paymentAmount / 100.0m;
                            await bookingFeeService.RecordBookingFeeTransaction(
                                db,
                                organizationid,
                                bookingAmountInr,
                                isEventBooking ? null : (req.appointmentid > 0 ? req.appointmentid : null),
                                isEventBooking ? req.eventbookingid : null,
                                paymentId);
                        }
                        catch (Exception feeEx)
                        {
                            Console.WriteLine($"⚠️ Booking fee ledger skipped: {feeEx.Message}");
                        }
                    }

                    // Phase 7: enqueue payment confirmation automation only after trusted backend verification.
                    try
                    {
                        if (!isTestPayment && organizationid > 0 && paymentId > 0)
                        {
                            var (payPhone, payName) = await ResolvePaymentRecipient(db, req, isEventBooking);
                            if (!string.IsNullOrWhiteSpace(payPhone))
                            {
                                whatsAppAutomationPublisher.Enqueue(new WhatsAppAutomationBusinessEvent
                                {
                                    organisation_id = organizationid,
                                    trigger_type = WhatsAppAutomationTriggers.PaymentConfirmed,
                                    business_entity_type = WhatsAppAutomationEntityTypes.Payment,
                                    business_entity_id = paymentId,
                                    recipient_phone = payPhone,
                                    recipient_display_name = payName,
                                    variables = new Dictionary<string, string>
                                    {
                                        ["customer_name"] = payName,
                                        ["booking_reference"] = isEventBooking
                                            ? req.eventbookingid.ToString()
                                            : req.appointmentid.ToString(),
                                        ["payment_amount"] = (paymentAmount / 100.0m).ToString("0.00"),
                                        ["phone"] = payPhone,
                                    },
                                });
                            }
                        }
                    }
                    catch (Exception autoEx)
                    {
                        Console.WriteLine($"Error enqueueing payment automation: {autoEx.Message}");
                    }

                    return new VerifyPaymentRes
                    {
                        isvalid = true,
                        message = "Payment verified successfully",
                        paymentid = paymentId
                    };
                }
                else
                {
                    return new VerifyPaymentRes
                    {
                        isvalid = false,
                        message = "Invalid payment signature"
                    };
                }
            }
        }

        private async Task<JsonElement> FetchRazorpayPaymentWithCredentials(PaymentGatewayCredentials credentials, string paymentId)
        {
            var client = new HttpClient();
            var baseUrl = "https://api.razorpay.com/v1/";
            
            client.BaseAddress = new Uri(baseUrl);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));

            // Create Basic Auth token: base64(api_key:api_secret)
            // IMPORTANT: Use ASCII encoding for Basic Auth (Razorpay requirement)
            var authString = $"{credentials.api_key}:{credentials.api_secret}";
            var authBytes = Encoding.ASCII.GetBytes(authString);
            var token = Convert.ToBase64String(authBytes);
            client.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Basic", token);

            var request = new HttpRequestMessage(HttpMethod.Get, $"payments/{paymentId}");
            var response = await client.SendAsync(request);
            var responseContentText = await response.Content.ReadAsStringAsync();

            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {
                return JsonSerializer.Deserialize<JsonElement>(responseContentText);
            }
            else
            {
                throw new Exception($"Failed to fetch payment details from Razorpay: {responseContentText}");
            }
        }

        private async Task<JsonElement> FetchRazorpayOrderWithCredentials(PaymentGatewayCredentials credentials, string orderId)
        {
            var client = new HttpClient();
            var baseUrl = "https://api.razorpay.com/v1/";
            
            client.BaseAddress = new Uri(baseUrl);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));

            // Create Basic Auth token: base64(api_key:api_secret)
            // IMPORTANT: Use ASCII encoding for Basic Auth (Razorpay requirement)
            var authString = $"{credentials.api_key}:{credentials.api_secret}";
            var authBytes = Encoding.ASCII.GetBytes(authString);
            var token = Convert.ToBase64String(authBytes);
            client.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Basic", token);

            var request = new HttpRequestMessage(HttpMethod.Get, $"orders/{orderId}");
            var response = await client.SendAsync(request);
            var responseContentText = await response.Content.ReadAsStringAsync();

            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {
                return JsonSerializer.Deserialize<JsonElement>(responseContentText);
            }
            else
            {
                throw new Exception($"Failed to fetch order details from Razorpay: {responseContentText}");
            }
        }

        private async Task<long> CreatePaymentRecord(
            IDb db,
            string key,
            int mode,
            decimal amount,
            int status,
            int typecode,
            long? groupid,
            long orderid,
            long appoinmentid,
            string paymentmodetype,
            string paymentmodecode,
            long createdby,
            long modifiedby,
            string attributes_json)
        {
            string query = @"
                INSERT INTO payment (
                    key, mode, amount, status, typecode, groupid, orderid, 
                    appoinmentid, paymentmodetype, paymentmodecode,
                    version, createdby, createdon, modifiedby, modifiedon, 
                    attributes_json, isactive, issuspended, parentid, isfactory, notes
                )
                VALUES (
                    @key, @mode, @amount, @status, @typecode, @groupid, @orderid,
                    @appoinmentid, @paymentmodetype, @paymentmodecode,
                    @version, @createdby, @createdon, @modifiedby, @modifiedon,
                    @attributes_json::jsonb, @isactive, @issuspended, @parentid, @isfactory, @notes
                )
                RETURNING id;
            ";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "key", DbTypes.Types.String).Value = key ?? "";
            db.AddParameter(command, "mode", DbTypes.Types.Integer).Value = mode;
            db.AddParameter(command, "amount", DbTypes.Types.Decimal).Value = amount;
            db.AddParameter(command, "status", DbTypes.Types.Integer).Value = status;
            db.AddParameter(command, "typecode", DbTypes.Types.Integer).Value = typecode;
            db.AddParameter(command, "groupid", DbTypes.Types.Long).Value = groupid ?? (object)DBNull.Value;
            db.AddParameter(command, "orderid", DbTypes.Types.Long).Value = orderid;
            db.AddParameter(command, "appoinmentid", DbTypes.Types.Long).Value = appoinmentid;
            db.AddParameter(command, "paymentmodetype", DbTypes.Types.String).Value = paymentmodetype ?? "OnlineGateway";
            db.AddParameter(command, "paymentmodecode", DbTypes.Types.String).Value = paymentmodecode ?? "razorpay";
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = 1;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "attributes_json", DbTypes.Types.String).Value = attributes_json ?? "{}";
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = true;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = false;
            db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = (object)DBNull.Value;
            db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = false;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = "";

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    return reader.GetInt64(0);
                }
            }
            return 0;
        }

        private async Task CreatePaymentGatewayLog(
            IDb db,
            string vendor,
            long paymentid,
            long createdby,
            long modifiedby,
            string attributes_json)
        {
            string query = @"
                INSERT INTO paymentgatewaylogs (
                    vendor, paymentid, version, createdby, createdon, 
                    modifiedby, modifiedon, attributes_json, isactive, 
                    issuspended, parentid, isfactory, notes
                )
                VALUES (
                    @vendor, @paymentid, @version, @createdby, @createdon,
                    @modifiedby, @modifiedon, @attributes_json::jsonb, @isactive,
                    @issuspended, @parentid, @isfactory, @notes
                )
                RETURNING id;
            ";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "vendor", DbTypes.Types.String).Value = vendor ?? "razorpay";
            db.AddParameter(command, "paymentid", DbTypes.Types.Long).Value = paymentid;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = 1;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "attributes_json", DbTypes.Types.String).Value = attributes_json ?? "{}";
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = true;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = false;
            db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = (object)DBNull.Value;
            db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = false;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = "";

            await db.ExecuteNonQuery(command);
        }

        private int GetPaymentModeFromMethod(string method)
        {
            // Map Razorpay payment methods to payment mode codes
            // 0 = Cash, 1 = Card, 2 = UPI, 3 = BankTransfer, 4 = Cheque, 5 = OnlineGateway
            return method?.ToLower() switch
            {
                "card" => 1,
                "upi" => 2,
                "netbanking" => 3,
                "wallet" => 5,
                _ => 5 // Default to OnlineGateway
            };
        }

        private int GetPaymentStatus(string status)
        {
            // Map Razorpay payment status to our status codes
            // Assuming: 0 = Pending, 1 = Success, 2 = Failed, 3 = Refunded
            return status?.ToLower() switch
            {
                "captured" => 1,
                "authorized" => 0,
                "failed" => 2,
                "refunded" => 3,
                _ => 0 // Default to Pending
            };
        }

        private string GetPaymentModeType(string method)
        {
            return method?.ToLower() switch
            {
                "card" => "Card",
                "upi" => "UPI",
                "netbanking" => "BankTransfer",
                "wallet" => "Wallet",
                _ => "OnlineGateway"
            };
        }

        private async Task<(string phone, string name)> ResolvePaymentRecipient(
            IDb db, VerifyPaymentReq req, bool isEventBooking)
        {
            try
            {
                if (isEventBooking && req.eventbookingid is > 0)
                {
                    using var cmd = db.GetCommand(@"
                        SELECT user_mobile, user_name FROM event_bookings WHERE id = @id LIMIT 1;");
                    db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = req.eventbookingid.Value;
                    using var reader = await db.Execute(cmd);
                    if (await reader.ReadAsync())
                    {
                        return (
                            reader["user_mobile"]?.ToString() ?? "",
                            reader["user_name"]?.ToString() ?? "");
                    }
                }
                else if (req.appointmentid > 0)
                {
                    using var cmd = db.GetCommand(@"
                        SELECT u.mobile, u.name
                        FROM Appoinment a
                        INNER JOIN users u ON u.id = a.userid
                        WHERE a.id = @id
                        LIMIT 1;");
                    db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = req.appointmentid;
                    using var reader = await db.Execute(cmd);
                    if (await reader.ReadAsync())
                    {
                        return (
                            reader["mobile"]?.ToString() ?? "",
                            reader["name"]?.ToString() ?? "");
                    }
                }
            }
            catch
            {
                // ignore lookup failures
            }
            return ("", "");
        }
    }
}

