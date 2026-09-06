using System.Text.Json.Serialization;

namespace WebApplication2.DTOs.Payments.YooKassa
{
    public class PaymentMethodDataDto
    {
        [JsonPropertyName("type")]
        public required string Type { get; set; }
    }
}
