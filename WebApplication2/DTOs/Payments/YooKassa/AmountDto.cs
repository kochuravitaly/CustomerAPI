using System.Text.Json.Serialization;

namespace WebApplication2.DTOs.Payments.YooKassa
{
    public class AmountDto
    {
        [JsonPropertyName("value")]
        public required string Value { get; set; }

        [JsonPropertyName("currency")]
        public required string Currency { get; set; }
    }
}
