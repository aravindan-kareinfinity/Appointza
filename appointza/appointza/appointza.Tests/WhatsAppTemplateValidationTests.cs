using appointza.Models;
using appointza.Services;

namespace appointza.Tests;

public class WhatsAppTemplateValidationTests
{
    [Fact]
    public void ValidateCreate_accepts_valid_utility_template()
    {
        var errors = WhatsAppTemplateValidation.ValidateCreate(new WhatsAppTemplateCreateReq
        {
            template_name = "appointment_reminder",
            language_code = "en_US",
            category = "UTILITY",
            header_type = "NONE",
            body_text = "Hello {{1}}, your appointment is on {{2}}.",
            body_examples = new List<string> { "Ada", "Monday 10am" },
        });
        Assert.Empty(errors);
    }

    [Fact]
    public void ValidateCreate_rejects_invalid_name_and_placeholders()
    {
        var errors = WhatsAppTemplateValidation.ValidateCreate(new WhatsAppTemplateCreateReq
        {
            template_name = "Bad Name!",
            language_code = "en_US",
            category = "UTILITY",
            body_text = "Hi {{2}}",
            body_examples = new List<string>(),
        });
        Assert.Contains(errors, e => e.Contains("lowercase", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(errors, e => e.Contains("sequential", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void ValidateCreate_requires_examples_for_variables()
    {
        var errors = WhatsAppTemplateValidation.ValidateCreate(new WhatsAppTemplateCreateReq
        {
            template_name = "hello_world",
            language_code = "en_US",
            category = "MARKETING",
            body_text = "Hi {{1}}",
            body_examples = new List<string>(),
        });
        Assert.Contains(errors, e => e.Contains("sample values", StringComparison.OrdinalIgnoreCase));
    }

    [Theory]
    [InlineData("APPROVED", WhatsAppTemplateStatuses.Approved)]
    [InlineData("PENDING", WhatsAppTemplateStatuses.Pending)]
    [InlineData("REJECTED", WhatsAppTemplateStatuses.Rejected)]
    [InlineData("PAUSED", WhatsAppTemplateStatuses.Paused)]
    [InlineData("", WhatsAppTemplateStatuses.Draft)]
    public void MapProviderStatus_does_not_invent_approval(string provider, string expected)
    {
        Assert.Equal(expected, WhatsAppTemplateValidation.MapProviderStatus(provider));
    }

    [Fact]
    public void ExtractBodyPreview_reads_body_component()
    {
        var json = """[{"type":"BODY","text":"Hello {{1}}"}]""";
        Assert.Equal("Hello {{1}}", WhatsAppTemplateValidation.ExtractBodyPreview(json));
        Assert.Equal("TEXT", WhatsAppTemplateValidation.ExtractHeaderType(
            """[{"type":"HEADER","format":"TEXT","text":"Hi"}]"""));
    }
}
