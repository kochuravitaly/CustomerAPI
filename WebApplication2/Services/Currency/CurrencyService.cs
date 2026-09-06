using System.Net.Http.Json;
using WebApplication2.DTOs.Currency;

namespace WebApplication2.Services.Currency
{
    public class CurrencyService : ICurrencyService
    {
        private readonly HttpClient _httpClient;
        private Dictionary<string, decimal> _rates = new();
        private DateTime _lastUpdated = DateTime.MinValue;
        private readonly SemaphoreSlim _semaphore = new(1, 1);

        public CurrencyService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<Dictionary<string, decimal>> GetRatesAsync()
        {
            if (_rates.Count == 0 || (DateTime.UtcNow - _lastUpdated).TotalHours >= 4)
            {
                await RefreshRatesAsync();
            }

            return _rates;
        }

        public decimal Convert(decimal amount, string from, string to)
        {
            if (from == to) return amount;

            var rates = GetRatesAsync().GetAwaiter().GetResult();
            return ConvertWithRates(amount, from, to, rates);
        }

        public async Task<decimal> ConvertAsync(decimal amount, string from, string to)
        {
            if (from == to) return amount;

            var rates = await GetRatesAsync();
            return ConvertWithRates(amount, from, to, rates);
        }

        private decimal ConvertWithRates(decimal amount, string from, string to, Dictionary<string, decimal> rates)
        {
            var usdAmount = from == "USD" ? amount : amount / rates[from];
            return Math.Round(usdAmount * rates[to], 2);
        }

        private async Task RefreshRatesAsync()
        {
            await _semaphore.WaitAsync();
            try
            {
                if (_rates.Count > 0 && (DateTime.UtcNow - _lastUpdated).TotalHours < 4)
                    return;

                var response = await _httpClient.GetAsync(
                    "https://open.er-api.com/v6/latest/USD");

                if (response.IsSuccessStatusCode)
                {
                    var data = await response.Content.ReadFromJsonAsync<ExchangeRateResponseDto>();
                    if (data?.Rates != null)
                    {
                        _rates = new Dictionary<string, decimal>
                        {
                            ["USD"] = 1m,
                            ["EUR"] = data.Rates.GetValueOrDefault("EUR", 0.86m),
                            ["RUB"] = data.Rates.GetValueOrDefault("RUB", 86.68m),
                        };
                        _lastUpdated = DateTime.UtcNow;
                    }
                }
            }
            catch
            {
                _rates = new Dictionary<string, decimal>
                {
                    ["USD"] = 1m,
                    ["EUR"] = 0.86m,
                    ["RUB"] = 86.68m,
                };
                _lastUpdated = DateTime.UtcNow;
            }
            finally
            {
                _semaphore.Release();
            }
        }
    }
}