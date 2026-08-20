using System.Text.Json.Serialization;

namespace WebApplication2.Services.Payments.YooKassa
{
    public class YooKassaPaymentStatusResponse
    {
        [JsonPropertyName("id")]
        public required string Id { get; set; }

        [JsonPropertyName("status")]
        public required string Status { get; set; }
    }
}
