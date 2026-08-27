using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication2.DTOs.Orders;
using WebApplication2.Services.Orders;

namespace WebApplication2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FlashSaleController : ControllerBase
    {
        private readonly IFlashSaleService _flashSaleService;

        public FlashSaleController(IFlashSaleService flashSaleService)
        {
            _flashSaleService = flashSaleService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FlashSaleResponseDto>>> GetActiveFlashSales()
        {
            return Ok(await _flashSaleService.GetActiveFlashSalesAsync());
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<FlashSaleResponseDto>>> GetAllFlashSales()
        {
            return Ok(await _flashSaleService.GetAllFlashSalesAsync());
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult> CreateFlashSale(CreateFlashSaleDto dto)
        {
            var result = await _flashSaleService.CreateFlashSaleAsync(dto);
            if (result == null) return BadRequest("Invalid flash sale data.");
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("{id}")]
        public async Task<ActionResult> UpdateFlashSale(int id, CreateFlashSaleDto dto)
        {
            var result = await _flashSaleService.UpdateFlashSaleAsync(id, dto);
            if (result == null) return BadRequest("Invalid flash sale data or not found.");
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFlashSale(int id)
        {
            var result = await _flashSaleService.DeleteFlashSaleAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}