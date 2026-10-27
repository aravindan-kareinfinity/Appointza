using appointza.Models;
using appointza.Services;

namespace appointza.Tests;

public class WhatsAppMessageStatusRulesTests
{
    [Theory]
    [InlineData(WhatsAppMessageStatuses.Queued, WhatsAppMessageStatuses.Sent, true)]
    [InlineData(WhatsAppMessageStatuses.Sent, WhatsAppMessageStatuses.Delivered, true)]
    [InlineData(WhatsAppMessageStatuses.Delivered, WhatsAppMessageStatuses.Read, true)]
    [InlineData(WhatsAppMessageStatuses.Sent, WhatsAppMessageStatuses.Failed, true)]
    [InlineData(WhatsAppMessageStatuses.Read, WhatsAppMessageStatuses.Delivered, false)]
    [InlineData(WhatsAppMessageStatuses.Delivered, WhatsAppMessageStatuses.Sent, false)]
    [InlineData(WhatsAppMessageStatuses.Failed, WhatsAppMessageStatuses.Delivered, false)]
    [InlineData(WhatsAppMessageStatuses.Failed, WhatsAppMessageStatuses.Sent, false)]
    [InlineData(WhatsAppMessageStatuses.Read, WhatsAppMessageStatuses.Read, false)]
    [InlineData(WhatsAppMessageStatuses.Sent, WhatsAppMessageStatuses.Sent, false)]
    public void CanApply_follows_documented_transition_rules(string current, string next, bool expected)
    {
        Assert.Equal(expected, WhatsAppMessageStatusRules.CanApply(current, next));
    }
}
