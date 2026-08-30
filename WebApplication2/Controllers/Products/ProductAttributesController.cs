using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication2.DTOs.Products;
using WebApplication2.Services.Products.Interfaces;
using WebApplication2.Services.Products.Services;

namespace WebApplication2.Controllers.Products
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductAttributesController : ControllerBase
    {
        private readonly IAttributeService _attributeService;

        public ProductAttributesController(IAttributeService attributeService)
        {
            _attributeService = attributeService;
        }

        [HttpGet("materials")]
        public async Task<ActionResult<IEnumerable<ProductAttributeDto>>> GetMaterials([FromHeader(Name = "Accept-Language")] string? languageCode = "en")
        {
            var lang = languageCode?.Split(',')[0].Split('-')[0] ?? "en";
            return Ok(await _attributeService.GetMaterialsAsync(lang));
        }

        [HttpGet("styles")]
        public async Task<ActionResult<IEnumerable<ProductAttributeDto>>> GetStyles([FromHeader(Name = "Accept-Language")] string? languageCode = "en")
        {
            var lang = languageCode?.Split(',')[0].Split('-')[0] ?? "en";
            return Ok(await _attributeService.GetStylesAsync(lang));
        }

        [HttpGet("occasions")]
        public async Task<ActionResult<IEnumerable<ProductAttributeDto>>> GetOccasions([FromHeader(Name = "Accept-Language")] string? languageCode = "en")
        {
            var lang = languageCode?.Split(',')[0].Split('-')[0] ?? "en";
            return Ok(await _attributeService.GetOccasionsAsync(lang));
        }

        [HttpGet("patterns")]
        public async Task<ActionResult<IEnumerable<ProductAttributeDto>>> GetPatterns([FromHeader(Name = "Accept-Language")] string? languageCode = "en")
        {
            var lang = languageCode?.Split(',')[0].Split('-')[0] ?? "en";
            return Ok(await _attributeService.GetPatternsAsync(lang));
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("materials")]
        public async Task<ActionResult<ProductAttributeDto>> CreateMaterial(CreateProductAttributeDto dto)
        {
            var material = await _attributeService.CreateMaterialAsync(dto);
            if (material == null) return BadRequest("Failed to create material");
            return Ok(material);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("styles")]
        public async Task<ActionResult<ProductAttributeDto>> CreateStyle(CreateProductAttributeDto dto)
        {
            var style = await _attributeService.CreateStyleAsync(dto);
            if (style == null) return BadRequest("Failed to create style");
            return Ok(style);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("occasions")]
        public async Task<ActionResult<ProductAttributeDto>> CreateOccasion(CreateProductAttributeDto dto)
        {
            var occasion = await _attributeService.CreateOccasionAsync(dto);
            if (occasion == null) return BadRequest("Failed to create occasion");
            return Ok(occasion);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("patterns")]
        public async Task<ActionResult<ProductAttributeDto>> CreatePattern(CreateProductAttributeDto dto)
        {
            var pattern = await _attributeService.CreatePatternAsync(dto);
            if (pattern == null) return BadRequest("Failed to create pattern");
            return Ok(pattern);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("materials/{id}")]
        public async Task<IActionResult> DeleteMaterial(int id)
        {
            var result = await _attributeService.DeleteMaterialAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("styles/{id}")]
        public async Task<IActionResult> DeleteStyle(int id)
        {
            var result = await _attributeService.DeleteStyleAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("occasions/{id}")]
        public async Task<IActionResult> DeleteOccasion(int id)
        {
            var result = await _attributeService.DeleteOccasionAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("patterns/{id}")]
        public async Task<IActionResult> DeletePattern(int id)
        {
            var result = await _attributeService.DeletePatternAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("materials/{id}")]
        public async Task<IActionResult> UpdateMaterial(int id, CreateProductAttributeDto dto)
        {
            var result = await _attributeService.UpdateMaterialAsync(id, dto);
            if (!result) return NotFound();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("styles/{id}")]
        public async Task<IActionResult> UpdateStyle(int id, CreateProductAttributeDto dto)
        {
            var result = await _attributeService.UpdateStyleAsync(id, dto);
            if (!result) return NotFound();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("occasions/{id}")]
        public async Task<IActionResult> UpdateOccasion(int id, CreateProductAttributeDto dto)
        {
            var result = await _attributeService.UpdateOccasionAsync(id, dto);
            if (!result) return NotFound();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("patterns/{id}")]
        public async Task<IActionResult> UpdatePattern(int id, CreateProductAttributeDto dto)
        {
            var result = await _attributeService.UpdatePatternAsync(id, dto);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}