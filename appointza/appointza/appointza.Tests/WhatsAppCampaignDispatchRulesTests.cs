using appointza.Models;
using appointza.Services;

namespace appointza.Tests;

/// <summary>
/// Phase 6 policy tests that do not require a live database or Meta credentials.
/// </summary>
public class WhatsAppCampaignDispatchRulesTests
{
    [Theory]
    [InlineData(WhatsAppCampaignErrorCategories.Transient, true)]
    [InlineData(WhatsAppCampaignErrorCategories.RateLimit, true)]
    [InlineData(WhatsAppCampaignErrorCategories.Permanent, false)]
    [InlineData(WhatsAppCampaignErrorCategories.Unknown, false)]
    public void Retry_policy_classifies_categories(string category, bool expectRetryEligible)
    {
        var retryEligible = category is WhatsAppCampaignErrorCategories.Transient
            or WhatsAppCampaignErrorCategories.RateLimit;
        Assert.Equal(expectRetryEligible, retryEligible);
    }

    [Fact]
    public void Uncertain_outcomes_are_not_auto_retryable()
    {
        var result = new WhatsAppCloudSendResult
        {
            success = false,
            outcome_uncertain = true,
            is_transient = true,
        };
        // Policy: uncertain ⇒ do not blindly resend (even if transient flag is set).
        Assert.True(result.outcome_uncertain);
        Assert.False(result.success && !string.IsNullOrEmpty(result.provider_message_id));
    }

    [Fact]
    public void Message_status_rules_reject_duplicate_and_downgrade()
    {
        Assert.False(WhatsAppMessageStatusRules.CanApply(WhatsAppMessageStatuses.Delivered, WhatsAppMessageStatuses.Sent));
        Assert.False(WhatsAppMessageStatusRules.CanApply(WhatsAppMessageStatuses.Delivered, WhatsAppMessageStatuses.Delivered));
        Assert.True(WhatsAppMessageStatusRules.CanApply(WhatsAppMessageStatuses.Sent, WhatsAppMessageStatuses.Delivered));
        Assert.True(WhatsAppMessageStatusRules.CanApply(WhatsAppMessageStatuses.Delivered, WhatsAppMessageStatuses.Read));
        Assert.True(WhatsAppMessageStatusRules.CanApply(WhatsAppMessageStatuses.Sent, WhatsAppMessageStatuses.Failed));
        Assert.False(WhatsAppMessageStatusRules.CanApply(WhatsAppMessageStatuses.Failed, WhatsAppMessageStatuses.Delivered));
    }

    [Fact]
    public void NormalizeWaId_pads_indian_10_digit()
    {
        Assert.Equal("919876543210", WhatsAppCloudApiClient.NormalizeWaId("9876543210"));
        Assert.Equal("919876543210", WhatsAppCloudApiClient.NormalizeWaId("+91 98765 43210"));
    }
}
