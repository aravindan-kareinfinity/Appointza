using appointza.Models;
using appointza.Utils;
using appointza.WhatsAppMsg.Services;
using System.Data.Common;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;

namespace appointza.Services
{
    public class EventBookingService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        ILogger<EventBookingService> logger;
        IServiceProvider serviceProvider;
        CreditWalletService creditWalletService;
        
        public EventBookingService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate, ILogger<EventBookingService> logger, IServiceProvider serviceProvider, CreditWalletService creditWalletService)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.logger = logger;
            this.serviceProvider = serviceProvider;
            this.creditWalletService = creditWalletService;
        }
        
        public async Task<List<EventBooking>> Select(EventBookingSelectReq req)
        {
            if (req == null)
            {
                req = new EventBookingSelectReq();
            }
            
            List<EventBooking> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result ?? new List<EventBooking>();
        }
        
        public async Task<List<EventBooking>> SelectTransaction(IDb db, EventBookingSelectReq req)
        {
            List<EventBooking> result = new List<EventBooking>();
            bool scopeByOrganisation = req.organisation_id > 0 || req.organisation_location_id > 0;
            string query = scopeByOrganisation
                ? @"
                SELECT 
                    eb.id, eb.event_id, eb.user_id, eb.number_of_people, eb.total_amount, 
                    eb.payment_status, eb.payment_reference, eb.check_in_status, eb.confirmation_status, eb.notes, 
                    eb.created_at, eb.updated_at, eb.isactive,
                    u.name as user_name, u.mobile as user_mobile,
                    e.event_name as event_name
                FROM event_bookings eb
                INNER JOIN events e ON e.id = eb.event_id AND e.isactive = TRUE
                LEFT JOIN users u ON eb.user_id = u.id
                "
                : @"
                SELECT 
                    eb.id, eb.event_id, eb.user_id, eb.number_of_people, eb.total_amount, 
                    eb.payment_status, eb.payment_reference, eb.check_in_status, eb.confirmation_status, eb.notes, 
                    eb.created_at, eb.updated_at, eb.isactive,
                    u.name as user_name, u.mobile as user_mobile,
                    '' as event_name
                FROM event_bookings eb
                LEFT JOIN users u ON eb.user_id = u.id
                ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            // Always filter by isactive = TRUE
            queryBuilder.AddParameter("eb.isactive", "=", "isactive", true, DbTypes.Types.Boolean);
            
            if (req.id > 0)
            {
                queryBuilder.AddParameter("eb.id", "=", "id", req.id, DbTypes.Types.Long);
            }
            
            if (req.event_id > 0)
            {
                queryBuilder.AddParameter("eb.event_id", "=", "event_id", req.event_id, DbTypes.Types.Long);
            }
            
            if (req.user_id > 0)
            {
                queryBuilder.AddParameter("eb.user_id", "=", "user_id", req.user_id, DbTypes.Types.Long);
            }

            if (req.organisation_id > 0)
            {
                queryBuilder.AddParameter("e.organisation_id", "=", "organisation_id", req.organisation_id, DbTypes.Types.Integer);
            }

            if (req.organisation_location_id > 0)
            {
                queryBuilder.AddParameter("e.organisation_location_id", "=", "organisation_location_id", req.organisation_location_id, DbTypes.Types.Integer);
            }
            
            if (!string.IsNullOrWhiteSpace(req.payment_status))
            {
                queryBuilder.AddParameter("eb.payment_status", "=", "payment_status", req.payment_status, DbTypes.Types.String);
            }
            
            if (!string.IsNullOrWhiteSpace(req.check_in_status))
            {
                queryBuilder.AddParameter("eb.check_in_status", "=", "check_in_status", req.check_in_status, DbTypes.Types.String);
            }
            
            if (!string.IsNullOrWhiteSpace(req.confirmation_status))
            {
                queryBuilder.AddParameter("eb.confirmation_status", "=", "confirmation_status", req.confirmation_status, DbTypes.Types.String);
            }

            if (!string.IsNullOrWhiteSpace(req.search))
            {
                var searchValue = $"%{req.search.Trim()}%";
                if (scopeByOrganisation)
                {
                    queryBuilder.AddParameter(
                        "(u.name ILIKE @search OR u.mobile ILIKE @search OR e.event_name ILIKE @search)",
                        "search",
                        searchValue,
                        DbTypes.Types.String);
                }
                else
                {
                    queryBuilder.AddParameter(
                        "(u.name ILIKE @search OR u.mobile ILIKE @search)",
                        "search",
                        searchValue,
                        DbTypes.Types.String);
                }
            }
            
            queryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "eb.created_at");
            if (req.take > 0)
            {
                var take = Math.Min(req.take, 200);
                var skip = req.skip < 0 ? 0 : req.skip;
                queryBuilder.AddLimitOffset(take, skip);
            }
            var command = queryBuilder.GetCommand(db);
            
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    EventBooking temp = new EventBooking();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.event_id = reader["event_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["event_id"]);
                    temp.user_id = reader["user_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["user_id"]);
                    temp.number_of_people = reader["number_of_people"] == DBNull.Value ? 1 : Convert.ToInt32(reader["number_of_people"]);
                    temp.total_amount = reader["total_amount"] == DBNull.Value ? null : (decimal?)Convert.ToDecimal(reader["total_amount"]);
                    temp.payment_status = reader["payment_status"] == DBNull.Value ? "pending" : reader["payment_status"].ToString();
                    temp.payment_reference = reader["payment_reference"] == DBNull.Value ? "" : reader["payment_reference"].ToString();
                    temp.check_in_status = reader["check_in_status"] == DBNull.Value ? "not_checked_in" : reader["check_in_status"].ToString();
                    temp.confirmation_status = reader["confirmation_status"] == DBNull.Value ? "pending" : reader["confirmation_status"].ToString();
                    temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                    temp.created_at = reader["created_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["created_at"]);
                    temp.updated_at = reader["updated_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["updated_at"]);
                    temp.isactive = reader["isactive"] == DBNull.Value ? true : Convert.ToBoolean(reader["isactive"]);
                    temp.user_name = reader["user_name"] == DBNull.Value ? "" : reader["user_name"].ToString();
                    temp.user_mobile = reader["user_mobile"] == DBNull.Value ? "" : reader["user_mobile"].ToString();
                    temp.event_name = reader["event_name"] == DBNull.Value ? "" : reader["event_name"].ToString();
                    
                    result.Add(temp);
                }
            }
            
            return result;
        }
        
        public async Task<EventBooking> Insert(EventBooking eventBooking)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, eventBooking);

                long organisationId = await GetEventOrganisationIdTransaction(db, eventBooking.event_id);
                if (organisationId > 0 && eventBooking.id > 0)
                {
                    try
                    {
                        await creditWalletService.ConsumeForBookingTransaction(
                            db,
                            organisationId,
                            null,
                            eventBooking.id);
                    }
                    catch
                    {
                        await RollbackInsertedEventBookingTransaction(db, eventBooking);
                        throw;
                    }
                }

                // Update event remainingslot
                await this.UpdateEventRemainingSlot(db, eventBooking.event_id, eventBooking.number_of_people);
            }
            
            // Send WhatsApp notifications to both organization and customer after successful booking
            _ = Task.Run(async () => await SendEventBookingNotifications(eventBooking));

            // Phase 7: durable org-scoped automation (customer). Legacy GrowAasan path above unchanged.
            try
            {
                PublishEventAutomation(eventBooking, WhatsAppAutomationTriggers.EventRegistration);
                PublishEventAutomation(eventBooking, WhatsAppAutomationTriggers.EventReminder);
            }
            catch (Exception autoEx)
            {
                logger.LogWarning(autoEx, "Failed to enqueue event registration automation");
            }
            
            return eventBooking;
        }
        
        private async Task SendEventBookingNotifications(EventBooking eventBooking)
        {
            try
            {
                // Get event details
                var eventService = serviceProvider.GetRequiredService<EventService>();
                var eventReq = new EventSelectReq { id = (int)eventBooking.event_id };
                var events = await eventService.Select(eventReq);
                
                if (events == null || events.Count == 0)
                {
                    logger.LogWarning("Event not found for booking {BookingId}, event_id: {EventId}", eventBooking.id, eventBooking.event_id);
                    return;
                }
                
                var eventDetails = events.First();
                
                // Get user details
                string userName = eventBooking.user_name ?? "Customer";
                string userMobile = eventBooking.user_mobile ?? "";
                
                // Get organization details
                string organizationName = await GetOrganizationName(eventDetails.organisation_id);
                string organizationMobile = await GetOrganizationMobileNumber(eventDetails.organisation_id, eventDetails.organisation_location_id);
                string location = await GetOrganizationLocationName(eventDetails.organisation_id, eventDetails.organisation_location_id);
                
                // Format event date as DD/MM/YY (same format as appointment booking)
                DateTime eventDate = eventDetails.event_date ?? eventDetails.from_date ?? DateTime.UtcNow;
                string formattedDate = eventDate.ToString("dd/MM/yy");
                
                // Format time - use event time if available, otherwise use "TBD"
                string formattedTime = FormatEventTime(eventDetails);
                
                // Use event name as service name, and location as department
                string serviceName = eventDetails.event_name ?? "Event";
                string department = eventDetails.location ?? location ?? "Event";
                
                var whatsAppService = serviceProvider.GetRequiredService<WhatsAppMsg.Services.WhatsAppService>();
                
                // Send notification to organization
                if (!string.IsNullOrEmpty(organizationMobile))
                {
                    bool orgSent = await whatsAppService.SendBookingNotificationAsync(
                        customerMobile: organizationMobile,
                        hospitalName: organizationName,
                        customerName: userName,
                        appointmentDate: eventDate,
                        appointmentTime: formattedTime,
                        serviceName: serviceName,
                        department: department
                    );
                    
                    if (orgSent)
                    {
                        logger.LogInformation("WhatsApp notification sent to organization {Mobile} for event booking {BookingId}", 
                            organizationMobile, eventBooking.id);
                    }
                    else
                    {
                        logger.LogWarning("Failed to send WhatsApp notification to organization {Mobile} for event booking {BookingId}", 
                            organizationMobile, eventBooking.id);
                    }
                }
                
                // Send notification to customer
                if (!string.IsNullOrEmpty(userMobile))
                {
                    bool customerSent = await whatsAppService.SendBookingNotificationAsync(
                        customerMobile: userMobile,
                        hospitalName: organizationName,
                        customerName: userName,
                        appointmentDate: eventDate,
                        appointmentTime: formattedTime,
                        serviceName: serviceName,
                        department: department
                    );
                    
                    if (customerSent)
                    {
                        logger.LogInformation("WhatsApp notification sent to customer {Mobile} for event booking {BookingId}", 
                            userMobile, eventBooking.id);
                    }
                    else
                    {
                        logger.LogWarning("Failed to send WhatsApp notification to customer {Mobile} for event booking {BookingId}", 
                            userMobile, eventBooking.id);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error sending WhatsApp notifications for event booking {BookingId}", eventBooking.id);
                // Don't throw - notification failure shouldn't affect booking
            }
        }
        
        private async Task<string> GetOrganizationName(int organisationId)
        {
            try
            {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    
                    string query = @"
                        SELECT name
                        FROM Organisation
                        WHERE id = @organisation_id
                    ";
                    
                    DbCommand command = db.GetCommand(query);
                    db.AddParameter(command, "organisation_id", DbTypes.Types.Integer).Value = organisationId;
                    
                    using (DbDataReader reader = await db.Execute(command))
                    {
                        if (await reader.ReadAsync())
                        {
                            string name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
                            return name ?? "";
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting organization name for organisation_id: {OrgId}", organisationId);
            }
            
            return "";
        }
        
        private async Task<string> GetOrganizationMobileNumber(int organisationId, int organisationLocationId)
        {
            try
            {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    
                    // Send only to organisation location's WhatsApp mobile (not organisation or user)
                    if (organisationLocationId > 0)
                    {
                        string locationQuery = @"
                            SELECT ol.whatsapp_mobile FROM OrganisationLocation ol 
                            WHERE ol.id = @organisation_location_id AND ol.isactive = true
                        ";
                        DbCommand locCmd = db.GetCommand(locationQuery);
                        db.AddParameter(locCmd, "organisation_location_id", DbTypes.Types.Integer).Value = organisationLocationId;
                        using (DbDataReader locReader = await db.Execute(locCmd))
                        {
                            if (await locReader.ReadAsync())
                            {
                                string locationMobile = locReader["whatsapp_mobile"] == DBNull.Value ? "" : locReader["whatsapp_mobile"].ToString();
                                if (!string.IsNullOrWhiteSpace(locationMobile))
                                    return locationMobile.Trim();
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting organization mobile number for organisation_id: {OrgId}, location_id: {LocationId}", 
                    organisationId, organisationLocationId);
            }
            
            return "";
        }
        
        async Task<long> GetEventOrganisationIdTransaction(IDb db, long eventId)
        {
            if (eventId <= 0)
            {
                return 0;
            }

            const string query = @"
                SELECT organisation_id
                FROM events
                WHERE id = @event_id
                LIMIT 1";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "event_id", DbTypes.Types.Long).Value = eventId;
            using DbDataReader reader = await db.Execute(command);
            if (await reader.ReadAsync())
            {
                return reader["organisation_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_id"]);
            }

            return 0;
        }

        async Task RollbackInsertedEventBookingTransaction(IDb db, EventBooking eventBooking)
        {
            if (eventBooking.id <= 0)
            {
                return;
            }

            const string query = @"
                UPDATE event_bookings
                SET isactive = false,
                    updated_at = @updated_at
                WHERE id = @id";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = eventBooking.id;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        public async Task InsertTransaction(IDb db, EventBooking eventBooking)
        {
            String query = @"
                INSERT INTO event_bookings (
                    event_id, user_id, number_of_people, total_amount, 
                    payment_status, payment_reference, check_in_status, confirmation_status, notes, 
                    created_at, updated_at, isactive
                )
                VALUES (
                   @event_id, @user_id, @number_of_people, @total_amount, 
                   @payment_status, @payment_reference, @check_in_status, @confirmation_status, @notes, 
                   @created_at, @updated_at, @isactive
                )
                RETURNING id;
                ";
            
            // Always set payment_status and confirmation_status to "pending" for new bookings
            // Payment must be processed separately, and booking must be approved by organization
            eventBooking.payment_status = "pending";
            eventBooking.check_in_status = string.IsNullOrEmpty(eventBooking.check_in_status) ? "not_checked_in" : eventBooking.check_in_status;
            eventBooking.confirmation_status = "pending";
            eventBooking.created_at = DateTime.UtcNow;
            eventBooking.updated_at = DateTime.UtcNow;
            eventBooking.isactive = true; // Always set to active when creating

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "event_id", DbTypes.Types.Long).Value = eventBooking.event_id;
            db.AddParameter(command, "user_id", DbTypes.Types.Long).Value = eventBooking.user_id;
            db.AddParameter(command, "number_of_people", DbTypes.Types.Integer).Value = eventBooking.number_of_people;
            db.AddParameter(command, "total_amount", DbTypes.Types.Decimal).Value = eventBooking.total_amount.HasValue ? (object)eventBooking.total_amount.Value : DBNull.Value;
            db.AddParameter(command, "payment_status", DbTypes.Types.String).Value = eventBooking.payment_status;
            db.AddParameter(command, "payment_reference", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventBooking.payment_reference) ? "" : eventBooking.payment_reference;
            db.AddParameter(command, "check_in_status", DbTypes.Types.String).Value = eventBooking.check_in_status;
            db.AddParameter(command, "confirmation_status", DbTypes.Types.String).Value = eventBooking.confirmation_status;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventBooking.notes) ? "" : eventBooking.notes;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = eventBooking.created_at;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = eventBooking.updated_at;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = eventBooking.isactive;
            
            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    eventBooking.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }
        
        private async Task UpdateEventRemainingSlot(IDb db, long eventId, int numberOfPeople)
        {
            try
            {
                // Decrease remainingslot by number_of_people
                string updateQuery = @"
                    UPDATE events
                    SET remainingslot = GREATEST(0, remainingslot - @number_of_people), 
                        updated_at = @updated_at
                    WHERE id = @event_id
                ";
                
                DbCommand updateCommand = db.GetCommand(updateQuery);
                db.AddParameter(updateCommand, "event_id", DbTypes.Types.Long).Value = eventId;
                db.AddParameter(updateCommand, "number_of_people", DbTypes.Types.Integer).Value = numberOfPeople;
                db.AddParameter(updateCommand, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                
                await db.ExecuteNonQuery(updateCommand);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating event remainingslot: {ex.Message}");
                // Don't throw - booking should still succeed
            }
        }
        
        public async Task<bool> Delete(EventBookingDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                // Get booking details before soft deleting to restore remainingslot
                // Check if booking is active and get details
                string getBookingQuery = @"
                    SELECT event_id, number_of_people, isactive
                    FROM event_bookings
                    WHERE id = @id
                ";
                DbCommand getBookingCommand = db.GetCommand(getBookingQuery);
                db.AddParameter(getBookingCommand, "id", DbTypes.Types.Long).Value = req.id;
                
                long eventId = 0;
                int numberOfPeople = 0;
                bool wasActive = false;
                using (DbDataReader reader = await db.Execute(getBookingCommand))
                {
                    if (await reader.ReadAsync())
                    {
                        eventId = reader["event_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["event_id"]);
                        numberOfPeople = reader["number_of_people"] == DBNull.Value ? 0 : Convert.ToInt32(reader["number_of_people"]);
                        wasActive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
                    }
                }
                
                if (eventId > 0 && numberOfPeople > 0)
                {
                    result = await this.DeleteTransaction(db, req);
                    // Restore remainingslot only if booking was active before soft delete
                    if (wasActive)
                    {
                        await this.RestoreEventRemainingSlot(db, eventId, numberOfPeople);
                    }
                }
            }
            return result;
        }
        
        public async Task<bool> DeleteTransaction(IDb db, EventBookingDeleteReq req)
        {
            // Soft delete: Set isactive = false instead of deleting
            string query = @"
                UPDATE event_bookings
                SET isactive = FALSE, updated_at = @updated_at
                WHERE id = @id
            ";
            
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = req.id;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            
            var ok = await db.ExecuteNonQuery(command) > 0;
            if (ok)
            {
                try
                {
                    var booking = await GetBookingById(db, req.id);
                    if (booking != null)
                    {
                        var publisher = serviceProvider.GetRequiredService<WhatsAppAutomationPublisher>();
                        var orgId = await ResolveEventOrganisationId(booking.event_id);
                        if (orgId > 0)
                        {
                            publisher.InvalidatePending(orgId, WhatsAppAutomationEntityTypes.EventBooking, booking.id);
                            PublishEventAutomation(booking, WhatsAppAutomationTriggers.EventCancelled, orgId);
                        }
                    }
                }
                catch (Exception autoEx)
                {
                    logger.LogWarning(autoEx, "Failed to enqueue event cancel automation");
                }
            }
            return ok;
        }
        
        private async Task RestoreEventRemainingSlot(IDb db, long eventId, int numberOfPeople)
        {
            try
            {
                // Increase remainingslot by number_of_people (up to slot_limit)
                string updateQuery = @"
                    UPDATE events
                    SET remainingslot = LEAST(slot_limit, remainingslot + @number_of_people), 
                        updated_at = @updated_at
                    WHERE id = @event_id
                ";
                
                DbCommand updateCommand = db.GetCommand(updateQuery);
                db.AddParameter(updateCommand, "event_id", DbTypes.Types.Long).Value = eventId;
                db.AddParameter(updateCommand, "number_of_people", DbTypes.Types.Integer).Value = numberOfPeople;
                db.AddParameter(updateCommand, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                
                await db.ExecuteNonQuery(updateCommand);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error restoring event remainingslot: {ex.Message}");
            }
        }
        
        public async Task<EventBooking> Update(EventBooking eventBooking)
        {
            EventBooking oldBooking = null;
            
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                
                // Get old booking details to detect status changes (before update)
                oldBooking = await GetBookingById(db, eventBooking.id);
                
                await this.UpdateTransaction(db, eventBooking);
            }
            
            // Send status update notifications if status changed (after update completes)
            if (oldBooking != null)
            {
                _ = Task.Run(async () => await SendEventStatusUpdateNotification(eventBooking, oldBooking));
                try
                {
                    if (!string.Equals(oldBooking.payment_status, eventBooking.payment_status, StringComparison.OrdinalIgnoreCase) ||
                        !string.Equals(oldBooking.confirmation_status, eventBooking.confirmation_status, StringComparison.OrdinalIgnoreCase) ||
                        !string.Equals(oldBooking.check_in_status, eventBooking.check_in_status, StringComparison.OrdinalIgnoreCase))
                    {
                        PublishEventAutomation(eventBooking, WhatsAppAutomationTriggers.EventStatusChanged);
                    }
                }
                catch (Exception autoEx)
                {
                    logger.LogWarning(autoEx, "Failed to enqueue event status automation");
                }
            }
            
            return eventBooking;
        }
        
        private async Task<EventBooking> GetBookingById(IDb db, long bookingId)
        {
            try
            {
                string query = @"
                    SELECT 
                        eb.id, eb.event_id, eb.user_id, eb.number_of_people, eb.total_amount, 
                        eb.payment_status, eb.payment_reference, eb.check_in_status, eb.confirmation_status, eb.notes, 
                        eb.created_at, eb.updated_at, eb.isactive,
                        u.name as user_name, u.mobile as user_mobile
                    FROM event_bookings eb
                    LEFT JOIN users u ON eb.user_id = u.id
                    WHERE eb.id = @id
                ";
                
                DbCommand command = db.GetCommand(query);
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = bookingId;
                
                using (DbDataReader reader = await db.Execute(command))
                {
                    if (await reader.ReadAsync())
                    {
                        EventBooking temp = new EventBooking();
                        temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                        temp.event_id = reader["event_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["event_id"]);
                        temp.user_id = reader["user_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["user_id"]);
                        temp.payment_status = reader["payment_status"] == DBNull.Value ? "pending" : reader["payment_status"].ToString();
                        temp.confirmation_status = reader["confirmation_status"] == DBNull.Value ? "pending" : reader["confirmation_status"].ToString();
                        temp.user_name = reader["user_name"] == DBNull.Value ? "" : reader["user_name"].ToString();
                        temp.user_mobile = reader["user_mobile"] == DBNull.Value ? "" : reader["user_mobile"].ToString();
                        return temp;
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting booking by id: {BookingId}", bookingId);
            }
            
            return null;
        }
        
        private async Task SendEventStatusUpdateNotification(EventBooking newBooking, EventBooking oldBooking)
        {
            try
            {
                // Check if confirmation_status or payment_status changed
                bool statusChanged = oldBooking.confirmation_status != newBooking.confirmation_status;
                bool paymentStatusChanged = oldBooking.payment_status != newBooking.payment_status;
                
                if (!statusChanged && !paymentStatusChanged)
                {
                    return; // No status change, no notification needed
                }
                
                // Get event details
                var eventService = serviceProvider.GetRequiredService<EventService>();
                var eventReq = new EventSelectReq { id = (int)newBooking.event_id };
                var events = await eventService.Select(eventReq);
                
                if (events == null || events.Count == 0)
                {
                    return;
                }
                
                var eventDetails = events.First();
                
                // Get organization details
                string organizationName = await GetOrganizationName(eventDetails.organisation_id);
                string organizationMobile = await GetOrganizationMobileNumber(eventDetails.organisation_id, eventDetails.organisation_location_id);
                string location = await GetOrganizationLocationName(eventDetails.organisation_id, eventDetails.organisation_location_id);
                
                // Format event date as DD/MM/YY
                DateTime eventDate = eventDetails.event_date ?? eventDetails.from_date ?? DateTime.UtcNow;
                string formattedDate = eventDate.ToString("dd/MM/yy");
                
                // Format time
                string formattedTime = FormatEventTime(eventDetails);
                
                // Determine status message
                string statusMessage = "";
                if (statusChanged)
                {
                    statusMessage = $"Booking {newBooking.confirmation_status}";
                }
                else if (paymentStatusChanged)
                {
                    statusMessage = $"Payment {newBooking.payment_status}";
                }
                
                var whatsAppService = serviceProvider.GetRequiredService<WhatsAppMsg.Services.WhatsAppService>();
                
                // Send status notification to customer
                string customerMobile = newBooking.user_mobile ?? "";
                if (!string.IsNullOrEmpty(customerMobile))
                {
                    bool customerSent = await whatsAppService.SendStatusNotificationAsync(
                        customerMobile: customerMobile,
                        customerName: newBooking.user_name ?? "Customer",
                        status: statusMessage,
                        appointmentDate: eventDate,
                        appointmentTime: formattedTime,
                        location: location,
                        department: eventDetails.location ?? "Event",
                        hospitalName: organizationName
                    );
                    
                    if (customerSent)
                    {
                        logger.LogInformation("Status update notification sent to customer {Mobile} for event booking {BookingId}", 
                            customerMobile, newBooking.id);
                    }
                    else
                    {
                        logger.LogWarning("Failed to send status update notification to customer {Mobile} for event booking {BookingId}", 
                            customerMobile, newBooking.id);
                    }
                }
                
                // Send status notification to organization
                if (!string.IsNullOrEmpty(organizationMobile))
                {
                    bool orgSent = await whatsAppService.SendStatusNotificationAsync(
                        customerMobile: organizationMobile,
                        customerName: newBooking.user_name ?? "Customer",
                        status: statusMessage,
                        appointmentDate: eventDate,
                        appointmentTime: formattedTime,
                        location: location,
                        department: eventDetails.location ?? "Event",
                        hospitalName: organizationName
                    );
                    
                    if (orgSent)
                    {
                        logger.LogInformation("Status update notification sent to organization {Mobile} for event booking {BookingId}", 
                            organizationMobile, newBooking.id);
                    }
                    else
                    {
                        logger.LogWarning("Failed to send status update notification to organization {Mobile} for event booking {BookingId}", 
                            organizationMobile, newBooking.id);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error sending status update notification for event booking {BookingId}", newBooking.id);
            }
        }
        
        private async Task<string> GetOrganizationLocationName(int organisationId, int organisationLocationId)
        {
            try
            {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    
                    string query = @"
                        SELECT name
                        FROM OrganisationLocation
                        WHERE id = @organisation_location_id
                        AND organisationid = @organisation_id
                    ";
                    
                    DbCommand command = db.GetCommand(query);
                    db.AddParameter(command, "organisation_id", DbTypes.Types.Integer).Value = organisationId;
                    db.AddParameter(command, "organisation_location_id", DbTypes.Types.Integer).Value = organisationLocationId;
                    
                    using (DbDataReader reader = await db.Execute(command))
                    {
                        if (await reader.ReadAsync())
                        {
                            string name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
                            return name ?? "";
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting organization location name for organisation_id: {OrgId}, location_id: {LocationId}", 
                    organisationId, organisationLocationId);
            }
            
            return "";
        }
        
        public async Task<bool> UpdateTransaction(IDb db, EventBooking eventBooking)
        {
            bool result = false;
            String query = @"
                UPDATE event_bookings
                    SET 
                        payment_status = @payment_status,
                        payment_reference = @payment_reference,
                        check_in_status = @check_in_status,
                        confirmation_status = @confirmation_status,
                        notes = @notes,
                        updated_at = @updated_at
                WHERE id = @id
                ";
            
            eventBooking.updated_at = DateTime.UtcNow;
            
            DbCommand command = db.GetCommand(query);
            
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = eventBooking.id;
            db.AddParameter(command, "payment_status", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventBooking.payment_status) ? "pending" : eventBooking.payment_status;
            db.AddParameter(command, "payment_reference", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventBooking.payment_reference) ? "" : eventBooking.payment_reference;
            db.AddParameter(command, "check_in_status", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventBooking.check_in_status) ? "not_checked_in" : eventBooking.check_in_status;
            db.AddParameter(command, "confirmation_status", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventBooking.confirmation_status) ? "pending" : eventBooking.confirmation_status;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventBooking.notes) ? "" : eventBooking.notes;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = eventBooking.updated_at;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }

        private void PublishEventAutomation(EventBooking booking, string trigger, long? organisationId = null)
        {
            if (booking == null || booking.id <= 0) return;
            if (string.IsNullOrWhiteSpace(booking.user_mobile)) return;

            _ = Task.Run(async () =>
            {
                try
                {
                    var orgId = organisationId ?? await ResolveEventOrganisationId(booking.event_id);
                    if (orgId <= 0) return;

                    DateTime? occurrence = null;
                    string eventName = booking.event_name ?? "Event";
                    try
                    {
                        var eventService = serviceProvider.GetRequiredService<EventService>();
                        var events = await eventService.Select(new EventSelectReq { id = (int)booking.event_id });
                        var ev = events?.FirstOrDefault();
                        if (ev != null)
                        {
                            eventName = ev.event_name ?? eventName;
                            occurrence = ev.event_date ?? ev.from_date;
                        }
                    }
                    catch { /* best effort */ }

                    var publisher = serviceProvider.GetRequiredService<WhatsAppAutomationPublisher>();
                    publisher.Enqueue(new WhatsAppAutomationBusinessEvent
                    {
                        organisation_id = orgId,
                        trigger_type = trigger,
                        business_entity_type = WhatsAppAutomationEntityTypes.EventBooking,
                        business_entity_id = booking.id,
                        recipient_phone = booking.user_mobile,
                        recipient_display_name = booking.user_name ?? "",
                        occurrence_at_utc = occurrence.HasValue
                            ? DateTime.SpecifyKind(occurrence.Value, DateTimeKind.Utc)
                            : null,
                        variables = new Dictionary<string, string>
                        {
                            ["customer_name"] = booking.user_name ?? "",
                            ["event_name"] = eventName,
                            ["booking_reference"] = booking.id.ToString(),
                            ["phone"] = booking.user_mobile ?? "",
                        },
                    });
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "PublishEventAutomation failed for booking {Id}", booking.id);
                }
            });
        }

        private async Task<long> ResolveEventOrganisationId(long eventId)
        {
            try
            {
                using var db = await dbprovider.GetDb();
                await db.Connect();
                using var command = db.GetCommand("SELECT organisation_id FROM events WHERE id = @id LIMIT 1;");
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = eventId;
                using var reader = await db.Execute(command);
                if (await reader.ReadAsync())
                    return reader["organisation_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_id"]);
            }
            catch { /* ignore */ }
            return 0;
        }

        private static string FormatEventTime(Event eventDetails)
        {
            if (eventDetails == null)
            {
                return "TBD";
            }

            var start = eventDetails.start_time?.Trim();
            var end = eventDetails.end_time?.Trim();
            if (!string.IsNullOrEmpty(start) && !string.IsNullOrEmpty(end))
            {
                return $"{start} - {end}";
            }
            if (!string.IsNullOrEmpty(start))
            {
                return start;
            }
            if (!string.IsNullOrEmpty(end))
            {
                return end;
            }

            if (eventDetails.timing_config != null)
            {
                var cfgStart = eventDetails.timing_config.StartTime?.Trim();
                var cfgEnd = eventDetails.timing_config.EndTime?.Trim();
                if (!string.IsNullOrEmpty(cfgStart) && !string.IsNullOrEmpty(cfgEnd))
                {
                    return $"{cfgStart} - {cfgEnd}";
                }
            }

            if (eventDetails.timing_config?.Days != null && eventDetails.timing_config.Days.Count > 0)
            {
                var firstDay = eventDetails.timing_config.Days.First();
                if (firstDay.Value != null && firstDay.Value.Count > 0)
                {
                    return firstDay.Value[0];
                }
            }

            return "TBD";
        }
    }
}

