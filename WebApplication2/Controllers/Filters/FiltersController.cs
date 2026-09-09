using Microsoft.AspNetCore.Mvc;
using WebApplication2.DTOs.Filters;
using WebApplication2.Services.Filters;

namespace WebApplication2.Controllers.Filters
{
    [ApiController]
    [Route("api/[controller]")]
    public class FiltersController : ControllerBase
    {
        private readonly IFilterService _filterService;

        public FiltersController(IFilterService filterService)
        {
            _filterService = filterService;
        }

        [HttpGet("options")]
        public async Task<ActionResult<FilterOptionsDto>> GetFilterOptions()
        {
            var options = await _filterService.GetFilterOptionsAsync();
            return Ok(options);
        }
    }
}