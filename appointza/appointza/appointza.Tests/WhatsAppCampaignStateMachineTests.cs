using appointza.Models;
using appointza.Services;

namespace appointza.Tests;

public class WhatsAppCampaignStateMachineTests
{
    [Theory]
    [InlineData(WhatsAppCampaignStatuses.Draft, WhatsAppCampaignStatuses.Ready, true)]
    [InlineData(WhatsAppCampaignStatuses.Ready, WhatsAppCampaignStatuses.Scheduled, true)]
    [InlineData(WhatsAppCampaignStatuses.Ready, WhatsAppCampaignStatuses.Queued, true)]
    [InlineData(WhatsAppCampaignStatuses.Scheduled, WhatsAppCampaignStatuses.Queued, true)]
    [InlineData(WhatsAppCampaignStatuses.Scheduled, WhatsAppCampaignStatuses.Cancelled, true)]
    [InlineData(WhatsAppCampaignStatuses.Queued, WhatsAppCampaignStatuses.Dispatching, true)]
    [InlineData(WhatsAppCampaignStatuses.Dispatching, WhatsAppCampaignStatuses.Paused, true)]
    [InlineData(WhatsAppCampaignStatuses.Dispatching, WhatsAppCampaignStatuses.Cancelling, true)]
    [InlineData(WhatsAppCampaignStatuses.Dispatching, WhatsAppCampaignStatuses.Completed, true)]
    [InlineData(WhatsAppCampaignStatuses.Dispatching, WhatsAppCampaignStatuses.CompletedWithErrors, true)]
    [InlineData(WhatsAppCampaignStatuses.Paused, WhatsAppCampaignStatuses.Queued, true)]
    [InlineData(WhatsAppCampaignStatuses.Cancelling, WhatsAppCampaignStatuses.Cancelled, true)]
    [InlineData(WhatsAppCampaignStatuses.Scheduled, WhatsAppCampaignStatuses.Completed, false)]
    [InlineData(WhatsAppCampaignStatuses.Draft, WhatsAppCampaignStatuses.Completed, false)]
    [InlineData(WhatsAppCampaignStatuses.Cancelled, WhatsAppCampaignStatuses.Scheduled, false)]
    [InlineData(WhatsAppCampaignStatuses.Completed, WhatsAppCampaignStatuses.Queued, false)]
    public void CanTransition_enforces_phase6_rules(string from, string to, bool expected)
    {
        Assert.Equal(expected, WhatsAppCampaignStateMachine.CanTransition(from, to));
    }

    [Fact]
    public void IsSchedulable_only_ready()
    {
        Assert.True(WhatsAppCampaignStateMachine.IsSchedulable(WhatsAppCampaignStatuses.Ready));
        Assert.False(WhatsAppCampaignStateMachine.IsSchedulable(WhatsAppCampaignStatuses.Draft));
        Assert.False(WhatsAppCampaignStateMachine.IsSchedulable(WhatsAppCampaignStatuses.Scheduled));
    }

    [Fact]
    public void IsDispatchable_ready_scheduled_queued()
    {
        Assert.True(WhatsAppCampaignStateMachine.IsDispatchable(WhatsAppCampaignStatuses.Ready));
        Assert.True(WhatsAppCampaignStateMachine.IsDispatchable(WhatsAppCampaignStatuses.Scheduled));
        Assert.True(WhatsAppCampaignStateMachine.IsDispatchable(WhatsAppCampaignStatuses.Queued));
        Assert.False(WhatsAppCampaignStateMachine.IsDispatchable(WhatsAppCampaignStatuses.Draft));
        Assert.False(WhatsAppCampaignStateMachine.IsDispatchable(WhatsAppCampaignStatuses.Paused));
    }

    [Fact]
    public void IsTerminal_completed_cancelled_failed()
    {
        Assert.True(WhatsAppCampaignStateMachine.IsTerminal(WhatsAppCampaignStatuses.Completed));
        Assert.True(WhatsAppCampaignStateMachine.IsTerminal(WhatsAppCampaignStatuses.CompletedWithErrors));
        Assert.True(WhatsAppCampaignStateMachine.IsTerminal(WhatsAppCampaignStatuses.Cancelled));
        Assert.True(WhatsAppCampaignStateMachine.IsTerminal(WhatsAppCampaignStatuses.Failed));
        Assert.False(WhatsAppCampaignStateMachine.IsTerminal(WhatsAppCampaignStatuses.Dispatching));
    }
}
