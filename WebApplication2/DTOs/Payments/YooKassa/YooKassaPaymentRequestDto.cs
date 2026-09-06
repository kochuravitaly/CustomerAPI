using System.Text.Json.Serialization;

namespace WebApplication2.DTOs.Payments.YooKassa
{
    public class YooKassaPaymentRequestDto
    {
        [JsonPropertyName("amount")]
        public required AmountDto Amount { get; set; }

        [JsonPropertyName("confirmation")]
        public required ConfirmationRequestDto Confirmation { get; set; }

        [JsonPropertyName("payment_method_data")]
        public PaymentMethodDataDto? PaymentMethodData { get; set; }

        [JsonPropertyName("capture")]
        public bool Capture { get; set; } = true;

        [JsonPropertyName("metadata")]
        public Dictionary<string, string>? Metadata { get; set; }
    }
}