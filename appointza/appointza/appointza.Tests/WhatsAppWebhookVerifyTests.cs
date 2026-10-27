using appointza.Services;

namespace appointza.Tests;

/// <summary>
/// Documents expected Meta GET verification contract used by WhatsAppWebhookController.
/// </summary>
public class WhatsAppWebhookVerifyTests
{
    [Theory]
    [InlineData("subscribe", "my-token", "my-token", true)]
    [InlineData("subscribe", "wrong", "my-token", false)]
    [InlineData("unsubscribe", "my-token", "my-token", false)]
    [InlineData("", "my-token", "my-token", false)]
    public void Verify_token_rules(string mode, string provided, string expected, bool shouldPass)
    {
        var ok =
            string.Equals(mode, "subscribe", StringComparison.OrdinalIgnoreCase) &&
            WhatsAppWebhookSecurity.FixedTimeEqualsUtf8(provided, expected) &&
            !string.IsNullOrEmpty(expected);

        Assert.Equal(shouldPass, ok);
    }
}
