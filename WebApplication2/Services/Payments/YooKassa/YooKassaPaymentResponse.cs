using System.Text.Json.Serialization;

namespace WebApplication2.Services.Payments.YooKassa
{
    public class YooKassaPaymentResponse
    {
        [JsonPropertyName("id")]
        public required string Id { get; set; }
        [JsonPropertyName("status")]
        public required string Status { get; set; }
        [JsonPropertyName("confirmation")]
        public required Confirmation Confirmation { get; set; }
    }

    public class Confirmation
    {
        [JsonPropertyName("confirmation_url")]
        public required string ConfirmationUrl { get; set; }
    }
}