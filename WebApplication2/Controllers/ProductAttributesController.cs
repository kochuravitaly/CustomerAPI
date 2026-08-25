using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Products;
using WebApplication2.Models.Products;

namespace WebApplication2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductAttributesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductAttributesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("materials")]
        public async Task<ActionResult<IEnumerable<ProductAttributeDto>>> GetMaterials()
        {
            return await _context.ProductMaterials
                .Select(m => new ProductAttributeDto { Id = m.Id, Name = m.Name })
                .ToListAsync();
        }

        [HttpGet("styles")]
        public async Task<ActionResult<IEnumerable<ProductAttributeDto>>> GetStyles()
        {
            return await _context.ProductStyles
                .Select(s => new ProductAttributeDto { Id = s.Id, Name = s.Name })
                .ToListAsync();
        }

        [HttpGet("occasions")]
        public async Task<ActionResult<IEnumerable<ProductAttributeDto>>> GetOccasions()
        {
            return await _context.ProductOccasions
                .Select(o => new ProductAttributeDto { Id = o.Id, Name = o.Name })
                .ToListAsync();
        }

        [HttpGet("patterns")]
        public async Task<ActionResult<IEnumerable<ProductAttributeDto>>> GetPatterns()
        {
            return await _context.ProductPatterns
                .Select(p => new ProductAttributeDto { Id = p.Id, Name = p.Name })
                .ToListAsync();
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("materials")]
        public async Task<ActionResult<ProductAttributeDto>> CreateMaterial(CreateProductAttributeDto dto)
        {
            var material = new ProductMaterial { Name = dto.Name };
            _context.ProductMaterials.Add(material);
            await _context.SaveChangesAsync();

            return Ok(new ProductAttributeDto { Id = material.Id, Name = material.Name });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("styles")]
        public async Task<ActionResult<ProductAttributeDto>> CreateStyle(CreateProductAttributeDto dto)
        {
            var style = new ProductStyle { Name = dto.Name };
            _context.ProductStyles.Add(style);
            await _context.SaveChangesAsync();

            return Ok(new ProductAttributeDto { Id = style.Id, Name = style.Name });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("occasions")]
        public async Task<ActionResult<ProductAttributeDto>> CreateOccasion(CreateProductAttributeDto dto)
        {
            var occasion = new ProductOccasion { Name = dto.Name };
            _context.ProductOccasions.Add(occasion);
            await _context.SaveChangesAsync();

            return Ok(new ProductAttributeDto { Id = occasion.Id, Name = occasion.Name });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("patterns")]
        public async Task<ActionResult<ProductAttributeDto>> CreatePattern(CreateProductAttributeDto dto)
        {
            var pattern = new ProductPattern { Name = dto.Name };
            _context.ProductPatterns.Add(pattern);
            await _context.SaveChangesAsync();

            return Ok(new ProductAttributeDto { Id = pattern.Id, Name = pattern.Name });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("materials/{id}")]
        public async Task<IActionResult> DeleteMaterial(int id)
        {
            var material = await _context.ProductMaterials.FindAsync(id);
            if (material == null) return NotFound();

            _context.ProductMaterials.Remove(material);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("styles/{id}")]
        public async Task<IActionResult> DeleteStyle(int id)
        {
            var style = await _context.ProductStyles.FindAsync(id);
            if (style == null) return NotFound();

            _context.ProductStyles.Remove(style);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("occasions/{id}")]
        public async Task<IActionResult> DeleteOccasion(int id)
        {
            var occasion = await _context.ProductOccasions.FindAsync(id);
            if (occasion == null) return NotFound();

            _context.ProductOccasions.Remove(occasion);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("patterns/{id}")]
        public async Task<IActionResult> DeletePattern(int id)
        {
            var pattern = await _context.ProductPatterns.FindAsync(id);
            if (pattern == null) return NotFound();

            _context.ProductPatterns.Remove(pattern);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}