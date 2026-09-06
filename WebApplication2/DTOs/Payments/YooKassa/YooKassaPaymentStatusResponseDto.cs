using System.Text.Json.Serialization;

namespace WebApplication2.DTOs.Payments.YooKassa
{
    public class YooKassaPaymentStatusResponseDto
    {
        [JsonPropertyName("id")]
        public required string Id { get; set; }

        [JsonPropertyName("status")]
        public required string Status { get; set; }
    }
}
