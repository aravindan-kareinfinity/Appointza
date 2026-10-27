using System.Reflection;
using appointza.Services;

namespace appointza.Tests;

public class WhatsAppSanitizeErrorTests
{
    [Fact]
    public void SanitizeError_redacts_bearer_tokens()
    {
        var method = typeof(WhatsAppCrmService).GetMethod(
            "SanitizeError",
            BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(method);

        var result = method!.Invoke(null, new object[] { "Auth failed Bearer EAABsbCS1234567890xyz" }) as string;
        Assert.NotNull(result);
        Assert.DoesNotContain("EAABsbCS1234567890xyz", result);
        Assert.Contains("Bearer ***", result);
    }
}
