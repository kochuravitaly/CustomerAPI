using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication2.Services.Translation.Interfaces;

namespace WebApplication2.Controllers.Translations
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class TranslationController : ControllerBase
    {
        private readonly ITranslationBackfillService _backfillService;

        public TranslationController(ITranslationBackfillService backfillService)
        {
            _backfillService = backfillService;
        }

        [HttpPost("translate-all")]
        public async Task<IActionResult> TranslateAll()
        {
            await _backfillService.TranslateAllAsync();
            return Ok(new { message = "All translations completed!" });
        }
    }
}