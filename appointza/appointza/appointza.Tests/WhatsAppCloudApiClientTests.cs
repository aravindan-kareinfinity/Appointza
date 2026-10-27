using appointza.Services;

namespace appointza.Tests;

public class WhatsAppCloudApiClientTests
{
    [Theory]
    [InlineData("9876543210", "919876543210")]
    [InlineData("919876543210", "919876543210")]
    [InlineData("+91 98765-43210", "919876543210")]
    public void NormalizeWaId_formats_indian_numbers(string input, string expected)
    {
        Assert.Equal(expected, WhatsAppCloudApiClient.NormalizeWaId(input));
    }
}
