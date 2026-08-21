using System.Text.Json.Serialization;

public class YooKassaPaymentRequest
{
    [JsonPropertyName("amount")]
    public required Amount Amount { get; set; }
    [JsonPropertyName("confirmation")]
    public required Confirmation Confirmation { get; set; }
    [JsonPropertyName("capture")]
    public bool Capture { get; set; } = true;
    [JsonPropertyName("metadata")]
    public Dictionary<string, string>? Metadata { get; set; }
}

public class Amount
{
    [JsonPropertyName("value")]
    public required string Value { get; set; }
    [JsonPropertyName("currency")]
    public required string Currency { get; set; }
}

public class Confirmation
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "redirect";
    [JsonPropertyName("return_url")]
    public string ReturnUrl { get; set; } = string.Empty;
}