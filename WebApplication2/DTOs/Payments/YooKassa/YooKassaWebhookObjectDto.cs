using System.Text.Json.Serialization;

namespace WebApplication2.DTOs.Payments.YooKassa
{
    public class YooKassaWebhookObjectDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
    }
}