using System.Text.Json.Serialization;

namespace WebApplication2.DTOs.Payments.YooKassa
{
    public class ConfirmationResponseDto
    {
        [JsonPropertyName("confirmation_url")]
        public required string ConfirmationUrl { get; set; }
    }
}
