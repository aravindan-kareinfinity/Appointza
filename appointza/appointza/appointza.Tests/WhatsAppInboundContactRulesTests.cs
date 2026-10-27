using appointza.Services;

namespace appointza.Tests;

public class WhatsAppInboundContactRulesTests
{
    [Theory]
    [InlineData("9876543210", "919876543210")]
    [InlineData("+91 98765 43210", "919876543210")]
    [InlineData("919876543210", "919876543210")]
    [InlineData("", "")]
    public void NormalizePhoneDigits_matches_inbox_rules(string input, string expected)
    {
        Assert.Equal(expected, WhatsAppInboundContactRules.NormalizePhoneDigits(input));
    }

    [Fact]
    public void PhoneLookupVariants_includes_primary_and_local_10()
    {
        var variants = WhatsAppInboundContactRules.PhoneLookupVariants("919876543210");
        Assert.Contains("919876543210", variants);
        Assert.Contains("9876543210", variants);
    }

    [Fact]
    public void PreferDisplayName_keeps_existing_crm_name()
    {
        var name = WhatsAppInboundContactRules.PreferDisplayName("Priya", "WA Profile", "919876543210");
        Assert.Equal("Priya", name);
    }

    [Fact]
    public void PreferDisplayName_uses_profile_when_crm_empty()
    {
        var name = WhatsAppInboundContactRules.PreferDisplayName("", "WA Profile", "919876543210");
        Assert.Equal("WA Profile", name);
    }

    [Fact]
    public void PreferDisplayName_falls_back_to_phone()
    {
        var name = WhatsAppInboundContactRules.PreferDisplayName(null, null, "919876543210");
        Assert.Equal("919876543210", name);
    }

    [Fact]
    public void HasValidSender_rejects_empty()
    {
        Assert.False(WhatsAppInboundContactRules.HasValidSender(""));
        Assert.False(WhatsAppInboundContactRules.HasValidSender("abc"));
        Assert.True(WhatsAppInboundContactRules.HasValidSender("919876543210"));
    }

    [Fact]
    public void LeadSource_is_whatsapp()
    {
        Assert.Equal("whatsapp", WhatsAppInboundContactRules.LeadSourceWhatsApp);
    }

    [Fact]
    public void Inbound_resolve_method_exists_status_path_is_separate()
    {
        var flags = System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic;
        Assert.NotNull(typeof(WhatsAppCrmService).GetMethod("UpsertInboundMessage", flags));
        Assert.NotNull(typeof(WhatsAppCrmService).GetMethod("ApplyStatusUpdate", flags));
        Assert.NotNull(typeof(WhatsAppCrmService).GetMethod("ResolveOrCreateInboundContact", flags));
    }
}
