namespace WebApplication2.DTOs.Currency
{
    public class ExchangeRateResponseDto
    {
        public string Result { get; set; } = string.Empty;
        public Dictionary<string, decimal> Rates { get; set; } = new();
    }
}
