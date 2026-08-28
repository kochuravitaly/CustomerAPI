using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication2.DTOs.Home;
using WebApplication2.Services.Home;

namespace WebApplication2.Controllers.Home
{
    [ApiController]
    [Route("api/[controller]")]
    public class HomeSectionsController : ControllerBase
    {
        private readonly IHomeSectionService _homeSectionService;

        public HomeSectionsController(IHomeSectionService homeSectionService)
        {
            _homeSectionService = homeSectionService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<HomeSectionResponseDto>>> GetActiveSections()
        {
            return Ok(await _homeSectionService.GetActiveSectionsAsync());
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<HomeSectionResponseDto>>> GetAllSections()
        {
            return Ok(await _homeSectionService.GetAllSectionsAsync());
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<HomeSectionResponseDto>> CreateSection(CreateHomeSectionDto dto)
        {
            return Ok(await _homeSectionService.CreateSectionAsync(dto));
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("{id}")]
        public async Task<ActionResult<HomeSectionResponseDto>> UpdateSection(int id, CreateHomeSectionDto dto)
        {
            var result = await _homeSectionService.UpdateSectionAsync(id, dto);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSection(int id)
        {
            var result = await _homeSectionService.DeleteSectionAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        [HttpGet("{id}/products")]
        public async Task<ActionResult> GetSectionProducts(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 4)
        {
            return Ok(await _homeSectionService.GetSectionProductsAsync(id, page, pageSize));
        }
    }
}