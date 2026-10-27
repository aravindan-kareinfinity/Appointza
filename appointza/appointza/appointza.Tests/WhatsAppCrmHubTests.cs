using appointza.Hubs;

namespace appointza.Tests;

public class WhatsAppCrmHubTests
{
    [Fact]
    public void OrgGroup_is_tenant_scoped()
    {
        Assert.Equal("wa-org:42", WhatsAppCrmHub.OrgGroup(42));
        Assert.NotEqual(WhatsAppCrmHub.OrgGroup(1), WhatsAppCrmHub.OrgGroup(2));
    }

    [Fact]
    public void ConversationGroup_embeds_organisation_id()
    {
        var group = WhatsAppCrmHub.ConversationGroup(7, 99);
        Assert.Contains("wa-org:7", group);
        Assert.Contains("conv:99", group);
        Assert.DoesNotContain("wa-org:8", group);
    }
}
