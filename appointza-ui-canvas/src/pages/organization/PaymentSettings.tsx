import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrganizationPageShell } from "@/components/layout/OrganizationPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CreditCard, Save, Plus, Trash2, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { environment } from "@/utils/environment";
import { getAuthHeaders } from "@/utils/authSession.util";
import { PaymentService, CreatePaymentOrderReq, VerifyPaymentReq } from "@/services/payment.service";
import { loadScript } from "@/utils/razorpay.util";
import { useOrganisationLocations } from "@/hooks/useOrganisationLocations";
import {
  usePaymentGatewayCredentials,
  type PaymentGatewayCredential,
} from "@/hooks/usePaymentGatewayCredentials";
import SettingsEmbeddedHeader from "@/components/layout/SettingsEmbeddedHeader";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import { cn } from "@/lib/utils";

interface PaymentGatewayCredentials extends PaymentGatewayCredential {}

const PaymentSettings = ({ embedded = false }: { embedded?: boolean }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const organizationId = user?.organisationid || 0;

  const [credentials, setCredentials] = useState<PaymentGatewayCredentials[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [testingPaymentId, setTestingPaymentId] = useState<number | null>(null);
  const [togglingCredentialId, setTogglingCredentialId] = useState<number | null>(null);
  const paymentService = useMemo(() => new PaymentService(), []);
  const { data: organisationLocations = [] } = useOrganisationLocations({
    organisationId: organizationId,
    enabled: organizationId > 0,
  });

  const {
    data: credentialsData = [],
    isFetching: isLoading,
    refetch: refetchCredentials,
  } = usePaymentGatewayCredentials({
    organisationId: organizationId,
    enabled: organizationId > 0,
  });

  const applyCredentialsToForm = (
    loadedCredentials: PaymentGatewayCredentials[],
    autoLoadFirst: boolean,
  ) => {
    setCredentials(loadedCredentials);
    if (autoLoadFirst && loadedCredentials.length > 0 && editingId === null) {
      const activeCredential =
        loadedCredentials.find((credential) => credential.is_active) || loadedCredentials[0];
      if (activeCredential) {
        setFormData({
          gateway_id: activeCredential.gateway_id,
          gateway_name: activeCredential.gateway_name,
          api_key: "",
          api_secret: "",
          webhook_secret: "",
          environment: activeCredential.environment,
          is_active: activeCredential.is_active,
        });
        setEditingId(activeCredential.id);
      }
    }
  };

  useEffect(() => {
    if (organizationId <= 0) {
      setCredentials([]);
      return;
    }
    applyCredentialsToForm(credentialsData, true);
  }, [organizationId, credentialsData]);

  const loadCredentials = async (autoLoadFirst: boolean = true) => {
    if (!organizationId) return;
    const result = await refetchCredentials();
    if (result.data) {
      applyCredentialsToForm(result.data, autoLoadFirst);
      return;
    }
    toast({
      title: "Error",
      description: "Failed to load payment gateway credentials",
      variant: "destructive",
    });
  };

  const [formData, setFormData] = useState({
    gateway_id: 1,
    gateway_name: 'razorpay',
    api_key: '',
    api_secret: '',
    upi_id: '',
    webhook_secret: '',
    environment: 'production',
    is_active: true,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEdit = (credential: PaymentGatewayCredentials) => {
    setFormData({
      gateway_id: credential.gateway_id,
      gateway_name: credential.gateway_name,
      // Don't pre-fill sensitive fields - they are masked from API
      // User must enter new values if they want to change them
      api_key: '',
      api_secret: '',
      webhook_secret: '',
      upi_id: credential.upi_id || '',
      environment: credential.environment,
      is_active: credential.is_active,
    });
    setEditingId(credential.id);
  };

  const handleCancel = () => {
    setFormData({
      gateway_id: 1,
      gateway_name: 'razorpay',
      api_key: '',
      api_secret: '',
      upi_id: '',
      webhook_secret: '',
      environment: 'production',
      is_active: true,
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    // For new credentials, API Key and API Secret are required
    // For updates, they can be empty (will preserve existing values)
    if (!editingId && (!formData.api_key || !formData.api_secret)) {
      toast({
        title: "Validation Error",
        description: "API Key and API Secret are required for new credentials",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Check if credentials already exist for this organization and gateway_name
      let existingCredential: PaymentGatewayCredentials | null = null;
      
      if (!editingId) {
        // Only check for existing if not already editing
        existingCredential = credentials.find(
          cred => cred.organization_id === organizationId && 
                  cred.gateway_name === formData.gateway_name
        ) || null;
      }

      // If editing or found existing, use update; otherwise insert
      const shouldUpdate = editingId || existingCredential !== null;
      const credentialId = editingId || existingCredential?.id;

      const url = shouldUpdate
        ? `${environment.baseurl}/api/PaymentGatewayCredentials/Update`
        : `${environment.baseurl}/api/PaymentGatewayCredentials/Insert`;

      const payload = shouldUpdate
        ? {
            item: {
              id: credentialId,
              gateway_id: formData.gateway_id,
              organization_id: organizationId,
              gateway_name: formData.gateway_name,
              // For updates, send null for empty sensitive fields to preserve existing values
              api_key: formData.api_key && formData.api_key.trim() ? formData.api_key : null,
              api_secret: formData.api_secret && formData.api_secret.trim() ? formData.api_secret : null,
              webhook_secret: formData.webhook_secret && formData.webhook_secret.trim() ? formData.webhook_secret : null,
              upi_id: formData.upi_id || null,
              environment: formData.environment,
              is_active: formData.is_active
            }
          }
        : {
            item: {
              gateway_id: formData.gateway_id,
              organization_id: organizationId,
              gateway_name: formData.gateway_name,
              // For inserts, require all fields
              api_key: formData.api_key || '',
              api_secret: formData.api_secret || '',
              webhook_secret: formData.webhook_secret || null,
              upi_id: formData.upi_id || null,
              environment: formData.environment,
              is_active: formData.is_active
            }
          };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: shouldUpdate 
            ? "Payment gateway credentials updated successfully" 
            : "Payment gateway credentials added successfully"
        });
        handleCancel();
        loadCredentials(false); // Don't auto-load after save
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to save credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast({
        title: "Error",
        description: "An error occurred while saving credentials",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPayment = async (credential: PaymentGatewayCredentials) => {
    if (!organizationId || !user?.id) {
      toast({
        title: "Error",
        description: "Organization ID or User ID is missing",
        variant: "destructive"
      });
      return;
    }

    if (credential.gateway_name !== 'razorpay') {
      toast({
        title: "Not Supported",
        description: "Test payment is currently only available for Razorpay",
        variant: "destructive"
      });
      return;
    }

    try {
      setTestingPaymentId(credential.id);
      
      // Get first location for the organization (required for payment order)
      let locationId = organisationLocations[0]?.id || 0;
      if (!locationId) {
        toast({
          title: "No Location Found",
          description: "Please add at least one location to test payment",
          variant: "destructive"
        });
        setTestingPaymentId(null);
        return;
      }
      
      // Create a test payment order for ₹1
      const paymentReq: CreatePaymentOrderReq = {
        organizationid: organizationId,
        organisationlocationid: locationId,
        userid: user.id,
        amount: 1, // ₹1 test amount (server will recalculate, but we'll use fixed amount)
        currency: "INR",
        receipt: `test_${credential.id}_${Date.now()}`,
        appointmentdate: new Date().toISOString(),
        servicelist: [] // No services for test - will use fixed amount
      };

      const paymentOrder = await paymentService.createOrder(paymentReq);
      
      // Load Razorpay script
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      
      // Initialize Razorpay checkout
      const options = {
        key: paymentOrder.key,
        amount: paymentOrder.amount * 100, // Convert to paise (₹1 = 100 paise)
        currency: paymentOrder.currency,
        name: "Payment Test",
        description: `Test payment for ₹${paymentOrder.amount} - Credential ID: ${credential.id}`,
        order_id: paymentOrder.orderid,
        handler: async function (response: any) {
          await handleTestPaymentSuccess(response, credential);
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.mobile || ""
        },
        theme: {
          color: "#2563eb"
        },
        modal: {
          ondismiss: function() {
            setTestingPaymentId(null);
            toast({
              title: "Test Cancelled",
              description: "Payment test was cancelled",
            });
          }
        }
      };

      const razorpay = (window as any).Razorpay(options);
      razorpay.open();
      
    } catch (error: any) {
      console.error('Error initiating test payment:', error);
      toast({
        title: "Test Payment Failed",
        description: error.message || "Failed to initiate test payment. Please check your credentials.",
        variant: "destructive"
      });
      setTestingPaymentId(null);
    }
  };

  const handleTestPaymentSuccess = async (response: any, credential: PaymentGatewayCredentials) => {
    try {
      // Verify the payment (test payment - no appointment)
      const verifyReq: VerifyPaymentReq = {
        organizationid: organizationId || 0, // Provide organizationid for test payment
        appointmentid: 0, // No appointment for test payment
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      };

      const verifyResult = await paymentService.verifyPayment(verifyReq);

      if (verifyResult.isvalid) {
        toast({
          title: "✅ Test Payment Successful!",
          description: `Payment credentials are working correctly. Payment ID: ${verifyResult.paymentid || response.razorpay_payment_id}`,
        });
      } else {
        toast({
          title: "⚠️ Payment Verification Failed",
          description: verifyResult.message || "Payment was made but verification failed. Please check your credentials.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error verifying test payment:', error);
      toast({
        title: "Verification Error",
        description: error.message || "Payment was made but verification failed. Please check your credentials.",
        variant: "destructive"
      });
    } finally {
      setTestingPaymentId(null);
    }
  };

  const handleCredentialActiveChange = async (credential: PaymentGatewayCredentials, is_active: boolean) => {
    setTogglingCredentialId(credential.id);
    try {
      const response = await fetch(`${environment.baseurl}/api/PaymentGatewayCredentials/SetIsActive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          item: {
            id: credential.id,
            is_active,
          },
        }),
      });

      if (response.ok) {
        toast({
          title: is_active ? 'Gateway enabled' : 'Gateway disabled',
          description: is_active
            ? 'Customers can pay with this gateway when booking.'
            : 'This gateway will not be used for new checkouts until you turn it back on.',
        });
        setCredentials((prev) =>
          prev.map((c) => (c.id === credential.id ? { ...c, is_active } : c)),
        );
        if (editingId === credential.id) {
          setFormData((prev) => ({ ...prev, is_active }));
        }
      } else {
        let message = 'Failed to update gateway status';
        try {
          const err = await response.json();
          message = err.message || message;
        } catch {
          /* ignore */
        }
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling gateway active:', error);
      toast({
        title: 'Error',
        description: 'Could not update gateway status. Try again.',
        variant: 'destructive',
      });
    } finally {
      setTogglingCredentialId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment gateway credential?')) {
      return;
    }

    try {
      const response = await fetch(`${environment.baseurl}/api/PaymentGatewayCredentials/Delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          item: id
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Payment gateway credential deleted successfully"
        });
        loadCredentials();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete credential",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting credential:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting credential",
        variant: "destructive"
      });
    }
  };

  return (
    <OrganizationPageShell embedded={embedded}>
      {embedded ? (
        <SettingsEmbeddedHeader
          icon={CreditCard}
          title="Payment Settings"
          description="Manage payment gateway credentials for your organization."
        />
      ) : null}
      <div className={cn(embedded ? settingsEmbedded.sectionBody : "space-y-4 sm:space-y-6")}>
        {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <span className="truncate">Payment Settings</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage payment gateway credentials for your organization
            </p>
          </div>
            <Button
              variant="outline"
              onClick={() => navigate('/organization/profile')}
              className="w-full sm:w-auto h-10 sm:h-11"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Profile</span>
              <span className="sm:hidden">Back</span>
            </Button>
        </div>
        )}

        {/* Add/Edit Form */}
        <Card className={cn(settingsEmbedded.card(embedded), "w-full rounded-2xl border-stone-200 bg-white shadow-none")}>
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg sm:text-xl">
              {editingId ? 'Update Payment Gateway Credentials' : 'Add Payment Gateway Credentials'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {editingId 
                ? 'Update your existing payment gateway API credentials. Leave sensitive fields (API Key, API Secret, Webhook Secret) empty to keep existing values unchanged.'
                : 'Configure payment gateway API credentials for processing payments. If credentials already exist, they will be updated instead of creating duplicates.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gateway_name" className="text-sm sm:text-base">Gateway Name</Label>
                <Select
                  value={formData.gateway_name}
                  onValueChange={(value) => handleInputChange('gateway_name', value)}
                >
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue placeholder="Select gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                    <SelectItem value="phonepe">PhonePe</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gateway_id" className="text-sm sm:text-base">Gateway ID</Label>
                <NumberInput
                  id="gateway_id"
                  min={1}
                  value={formData.gateway_id}
                  onValueChange={(gateway_id) => handleInputChange('gateway_id', gateway_id)}
                  placeholder="Enter gateway ID"
                  className="h-10 sm:h-11"
                />
              </div>

              <div>
                <Label htmlFor="api_key" className="text-sm sm:text-base">API Key {!editingId ? '*' : ''}</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => handleInputChange('api_key', e.target.value)}
                  placeholder={editingId ? "Leave empty to keep existing value" : "Enter API key"}
                  required={!editingId}
                  className="h-10 sm:h-11"
                />
                {editingId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to preserve existing value (masked for security)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="api_secret" className="text-sm sm:text-base">API Secret {!editingId ? '*' : ''}</Label>
                <Input
                  id="api_secret"
                  type="password"
                  value={formData.api_secret}
                  onChange={(e) => handleInputChange('api_secret', e.target.value)}
                  placeholder={editingId ? "Leave empty to keep existing value" : "Enter API secret"}
                  required={!editingId}
                  className="h-10 sm:h-11"
                />
                {editingId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to preserve existing value (masked for security)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="upi_id" className="text-sm sm:text-base">UPI ID (Optional)</Label>
                <Input
                  id="upi_id"
                  type="text"
                  value={formData.upi_id}
                  onChange={(e) => handleInputChange('upi_id', e.target.value)}
                  placeholder="Enter UPI ID (e.g., yourname@paytm)"
                  className="h-10 sm:h-11"
                />
              </div>

              <div>
                <Label htmlFor="webhook_secret" className="text-sm sm:text-base">Webhook Secret (Optional)</Label>
                <Input
                  id="webhook_secret"
                  type="password"
                  value={formData.webhook_secret}
                  onChange={(e) => handleInputChange('webhook_secret', e.target.value)}
                  placeholder={editingId ? "Leave empty to keep existing value" : "Enter webhook secret"}
                  className="h-10 sm:h-11"
                />
                {editingId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to preserve existing value (masked for security)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="environment" className="text-sm sm:text-base">Environment</Label>
                <Select
                  value={formData.environment}
                  onValueChange={(value) => handleInputChange('environment', value)}
                >
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active" className="text-sm sm:text-base cursor-pointer">Active</Label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
              {editingId && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full sm:w-auto h-10 sm:h-11"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto h-10 sm:h-11"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingId ? 'Update' : 'Add'} Credentials
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Credentials List */}
        <Card className="rounded-2xl border-stone-200 bg-white shadow-none">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg sm:text-xl">Payment Gateway Credentials</CardTitle>
            <CardDescription className="max-w-3xl text-xs sm:text-sm">
              Enable <strong>Accept payments</strong> for the gateway that should charge customers at checkout. For
              Razorpay, run <strong>Test payment</strong> while the row is active to verify keys.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                <p className="mt-2 text-sm sm:text-base text-muted-foreground">Loading credentials...</p>
              </div>
            ) : credentials.length === 0 ? (
              <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">
                No payment gateway credentials configured yet
              </div>
            ) : (
              <div className="space-y-5">
                {credentials.map((credential) => (
                  <div
                    key={credential.id}
                    className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-none transition-colors hover:border-blue-200"
                  >
                    <div className="border-b border-stone-200 bg-white px-4 py-4 sm:px-5 sm:py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold capitalize tracking-tight text-foreground">
                              {credential.gateway_name}
                            </h3>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                credential.is_active
                                  ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/60'
                                  : 'bg-muted text-muted-foreground ring-1 ring-border'
                              }`}
                            >
                              {credential.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                credential.environment === 'production'
                                  ? 'bg-sky-100 text-sky-800 ring-1 ring-sky-200/60'
                                  : 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/60'
                              }`}
                            >
                              {credential.environment}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">Saved payment gateway connection</p>
                        </div>
                        <div className="flex shrink-0 items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3 sm:min-w-[220px] sm:justify-between">
                          <Label
                            htmlFor={`active-${credential.id}`}
                            className="cursor-pointer text-sm font-medium leading-none text-foreground"
                          >
                            Accept payments
                          </Label>
                          <Switch
                            id={`active-${credential.id}`}
                            checked={credential.is_active}
                            disabled={togglingCredentialId === credential.id}
                            onCheckedChange={(checked) =>
                              handleCredentialActiveChange(credential, checked === true)
                            }
                            className="data-[state=checked]:bg-emerald-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
                      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4">
                        <div className="rounded-xl border border-stone-200 bg-white px-3 py-2.5">
                          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Gateway ID</dt>
                          <dd className="mt-1 font-mono text-base font-semibold tabular-nums text-foreground">
                            {credential.gateway_id}
                          </dd>
                        </div>
                        <div className="rounded-xl border border-stone-200 bg-white px-3 py-2.5">
                          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">API key</dt>
                          <dd className="mt-1 break-all font-mono text-sm text-foreground" title={credential.api_key}>
                            {credential.api_key || '—'}
                            <span className="ml-1 text-xs font-sans font-normal text-muted-foreground">(masked)</span>
                          </dd>
                        </div>
                      </dl>

                      {credential.gateway_name === 'razorpay' && credential.is_active && (
                        <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-sm font-semibold text-emerald-950">Use these credentials to take payment</p>
                            <p className="text-sm leading-relaxed text-emerald-900/90">
                              Checkout charges this Razorpay account. Run a test payment to confirm keys and webhooks.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="default"
                            onClick={() => handleTestPayment(credential)}
                            disabled={testingPaymentId === credential.id}
                            className="h-10 w-full shrink-0 border-blue-200 bg-white text-blue-700 shadow-none hover:bg-blue-50 sm:h-10 sm:w-auto sm:min-w-[140px]"
                          >
                            {testingPaymentId === credential.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Testing…
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Test payment
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {credential.gateway_name === 'razorpay' && !credential.is_active && (
                        <div className="rounded-xl border border-dashed border-stone-200 bg-white px-3 py-2.5 text-sm text-muted-foreground">
                          Turn <strong className="text-foreground">Accept payments</strong> on to use this Razorpay
                          profile for live checkout and to run a test payment.
                        </div>
                      )}

                      {credential.is_active && credential.gateway_name !== 'razorpay' && (
                        <p className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-muted-foreground">
                          This gateway is used when customers pay during booking.
                        </p>
                      )}

                      <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end sm:gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="default"
                          onClick={() => handleEdit(credential)}
                          className="h-10 w-full sm:w-auto sm:min-w-[100px]"
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="default"
                          onClick={() => handleDelete(credential.id)}
                          className="h-10 w-full border-destructive/30 text-destructive hover:bg-destructive/10 sm:w-auto sm:min-w-[100px]"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OrganizationPageShell>
  );
};

export default PaymentSettings;

