using System.Text.Json.Serialization;

namespace WebApplication2.DTOs.Payments.YooKassa
{
    public class ConfirmationRequestDto
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = "redirect";

        [JsonPropertyName("return_url")]
        public string ReturnUrl { get; set; } = string.Empty;
    }
}
