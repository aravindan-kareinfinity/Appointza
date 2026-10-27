using appointza.Services;

namespace appointza.Tests;

public class WhatsAppWebhookSecurityTests
{
    [Fact]
    public void ValidateSignature_accepts_valid_hmac()
    {
        const string secret = "test-app-secret";
        const string body = "{\"object\":\"whatsapp_business_account\"}";
        var header = WhatsAppWebhookSecurity.ComputeSignatureHeader(secret, body);

        Assert.True(WhatsAppWebhookSecurity.ValidateSignature(secret, body, header));
    }

    [Fact]
    public void ValidateSignature_rejects_invalid_hmac()
    {
        const string secret = "test-app-secret";
        const string body = "{\"object\":\"whatsapp_business_account\"}";

        Assert.False(WhatsAppWebhookSecurity.ValidateSignature(secret, body, "sha256=deadbeef"));
    }

    [Fact]
    public void ValidateSignature_rejects_missing_header()
    {
        Assert.False(WhatsAppWebhookSecurity.ValidateSignature("secret", "{}", null));
        Assert.False(WhatsAppWebhookSecurity.ValidateSignature("secret", "{}", ""));
    }

    [Fact]
    public void ValidateSignature_rejects_empty_secret()
    {
        var header = WhatsAppWebhookSecurity.ComputeSignatureHeader("secret", "{}");
        Assert.False(WhatsAppWebhookSecurity.ValidateSignature("", "{}", header));
    }

    [Fact]
    public void ValidateSignature_uses_exact_raw_body()
    {
        const string secret = "test-app-secret";
        const string body = "{\"a\":1}";
        var header = WhatsAppWebhookSecurity.ComputeSignatureHeader(secret, body);

        Assert.False(WhatsAppWebhookSecurity.ValidateSignature(secret, "{\"a\": 1}", header));
    }
}
