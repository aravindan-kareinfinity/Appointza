using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using appointza.Services;
using appointza.Utils;
using Microsoft.Extensions.Options;

namespace appointza.Tests;

public class WhatsAppPhase8HardeningTests
{
    [Fact]
    public void ValidateSignature_rejects_mismatched_hex_length_without_throwing()
    {
        const string secret = "test-app-secret";
        const string body = "{\"object\":\"whatsapp_business_account\"}";

        Assert.False(WhatsAppWebhookSecurity.ValidateSignature(secret, body, "sha256=abcd"));
        Assert.False(WhatsAppWebhookSecurity.ValidateSignature(secret, body, "sha256=not-hex!!!"));
    }

    [Fact]
    public void FixedTimeEqualsUtf8_rejects_wrong_verify_token()
    {
        Assert.True(WhatsAppWebhookSecurity.FixedTimeEqualsUtf8("token-a", "token-a"));
        Assert.False(WhatsAppWebhookSecurity.FixedTimeEqualsUtf8("token-a", "token-b"));
        Assert.False(WhatsAppWebhookSecurity.FixedTimeEqualsUtf8("token-a", null));
        Assert.False(WhatsAppWebhookSecurity.FixedTimeEqualsUtf8(null, "token-a"));
    }

    [Theory]
    [InlineData("stop", true)]
    [InlineData("STOP", true)]
    [InlineData("unsubscribe", true)]
    [InlineData("opt-out", true)]
    [InlineData("hello", false)]
    [InlineData("please stop messaging", false)]
    public void IsStopKeyword_matches_exact_keywords_only(string text, bool expected)
    {
        var method = typeof(WhatsAppCrmService).GetMethod(
            "IsStopKeyword",
            BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(method);
        var result = (bool)method!.Invoke(null, new object[] { text })!;
        Assert.Equal(expected, result);
    }

    [Fact]
    public void SecretProtector_roundtrips_and_rejects_empty_key_outside_dev()
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");
        try
        {
            var protector = new SecretProtector(Options.Create(new ApplicationEnvironment
            {
                jwtsecret = "unit-test-jwt-secret-material-32b"
            }));
            var cipher = protector.Encrypt("wa-access-token");
            Assert.False(string.IsNullOrWhiteSpace(cipher));
            Assert.DoesNotContain("wa-access-token", cipher, StringComparison.Ordinal);
            Assert.Equal("wa-access-token", protector.Decrypt(cipher));
        }
        finally
        {
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", null);
        }

        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Production");
        try
        {
            Assert.Throws<InvalidOperationException>(() =>
                new SecretProtector(Options.Create(new ApplicationEnvironment { jwtsecret = "" })));
        }
        finally
        {
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", null);
        }
    }

    [Fact]
    public void ComputeEventKey_is_stable_for_identical_payloads()
    {
        var method = typeof(WhatsAppCrmService).GetMethod(
            "ComputeEventKey",
            BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(method);
        const string body = "{\"entry\":[{\"id\":\"1\"}]}";
        var a = (string)method!.Invoke(null, new object[] { body })!;
        var b = (string)method.Invoke(null, new object[] { body })!;
        Assert.Equal(a, b);
        Assert.Equal(64, a.Length);

        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(body))).ToLowerInvariant();
        Assert.Equal(hash, a);
    }

    [Fact]
    public void Outbound_config_defaults_enabled()
    {
        var cfg = new ApplicationEnvironmentWhatsAppConfigData();
        Assert.True(cfg.outbound_enabled);
    }
}
