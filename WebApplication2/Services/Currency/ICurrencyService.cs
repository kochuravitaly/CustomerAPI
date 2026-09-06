namespace WebApplication2.Services.Currency
{
    public interface ICurrencyService
    {
        Task<Dictionary<string, decimal>> GetRatesAsync();
        decimal Convert(decimal amount, string from, string to);
        Task<decimal> ConvertAsync(decimal amount, string from, string to);
    }
}
