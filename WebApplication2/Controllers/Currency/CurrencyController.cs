using Microsoft.AspNetCore.Mvc;
using WebApplication2.Services.Currency;

namespace WebApplication2.Controllers.Currency
{
    [ApiController]
    [Route("api/[controller]")]
    public class CurrencyController : ControllerBase
    {
        private readonly ICurrencyService _currencyService;

        public CurrencyController(ICurrencyService currencyService)
        {
            _currencyService = currencyService;
        }

        [HttpGet("rates")]
        public async Task<IActionResult> GetRates()
        {
            var rates = await _currencyService.GetRatesAsync();
            return Ok(new
            {
                baseCurrency = "USD",
                rates,
                updatedAt = DateTime.UtcNow
            });
        }

        [HttpGet("convert")]
        public async Task<IActionResult> Convert(decimal amount, string from = "USD", string to = "USD")
        {
            var converted = await _currencyService.ConvertAsync(amount, from, to);
            return Ok(new { amount, from, to, converted });
        }
    }
}