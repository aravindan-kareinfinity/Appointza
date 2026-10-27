using appointza.Models;

namespace appointza.Tests;

public class WhatsAppAutomationTriggersTests
{
    [Theory]
    [InlineData(WhatsAppAutomationTriggers.BookingCreated, true)]
    [InlineData(WhatsAppAutomationTriggers.PaymentConfirmed, true)]
    [InlineData(WhatsAppAutomationTriggers.EventReminder, true)]
    [InlineData("not_a_real_trigger", false)]
    public void All_contains_supported_triggers(string trigger, bool expected)
    {
        Assert.Equal(expected, WhatsAppAutomationTriggers.All.Contains(trigger));
    }

    [Fact]
    public void Reminder_triggers_detected()
    {
        Assert.True(WhatsAppAutomationTriggers.IsReminder(WhatsAppAutomationTriggers.BookingReminder));
        Assert.True(WhatsAppAutomationTriggers.IsReminder(WhatsAppAutomationTriggers.EventReminder));
        Assert.False(WhatsAppAutomationTriggers.IsReminder(WhatsAppAutomationTriggers.BookingCreated));
    }

    [Fact]
    public void Marketing_triggers_require_opt_in_purpose()
    {
        Assert.True(WhatsAppAutomationTriggers.IsMarketingPurposeTrigger(WhatsAppAutomationTriggers.FeedbackRequest));
        Assert.True(WhatsAppAutomationTriggers.IsMarketingPurposeTrigger(WhatsAppAutomationTriggers.FollowUp));
        Assert.False(WhatsAppAutomationTriggers.IsMarketingPurposeTrigger(WhatsAppAutomationTriggers.BookingCreated));
    }

    [Fact]
    public void Idempotency_key_shape_is_stable()
    {
        var org = 12L;
        var rule = 3L;
        var trigger = WhatsAppAutomationTriggers.BookingCreated;
        var entityType = WhatsAppAutomationEntityTypes.Appointment;
        var entityId = 99L;
        var occurrence = "20261021100000";
        var key = $"{org}:{rule}:{trigger}:{entityType}:{entityId}:{occurrence}";
        Assert.Equal("12:3:booking_created:appointment:99:20261021100000", key);
    }
}
