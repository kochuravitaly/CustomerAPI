using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApplication2.DTOs.Orders;
using WebApplication2.Services.Orders.Interfaces;

namespace WebApplication2.Controllers.Orders
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly IInvoiceService _invoiceService;

        public OrdersController(IOrderService orderService, IInvoiceService invoiceService)
        {
            _orderService = orderService;
            _invoiceService = invoiceService;
        }

        [HttpPost]
        public async Task<ActionResult<OrderResponseDto>> CreateOrder(CreateOrderRequestDto? request)
        {
            var customerId = GetCustomerId();

            var order = await _orderService.CreateOrderAsync(
                customerId,
                request?.Coupons);

            if (order == null)
                return BadRequest(new { error = "Cart is empty or there is not enough stock." });

            return CreatedAtAction(nameof(GetOrderById), new { id = order.Id }, order);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderResponseDto>>> GetMyOrders()
        {
            var customerId = GetCustomerId();

            var orders = await _orderService.GetCustomerOrdersAsync(customerId);

            return Ok(orders);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OrderResponseDto>> GetOrderById(Guid id)
        {
            var customerId = GetCustomerId();

            var order = await _orderService.GetOrderByIdAsync(
                id,
                customerId);

            if (order == null)
                return NotFound(new { error = "Order not found." });

            return Ok(order);
        }

        [HttpPost("{id}/reorder")]
        public async Task<IActionResult> Reorder(Guid id)
        {
            var customerId = GetCustomerId();
            var result = await _orderService.ReorderAsync(customerId, id);

            if (!result)
                return NotFound(new { error = "Order not found." });

            return NoContent();
        }

        [HttpPost("direct")]
        public async Task<ActionResult<OrderResponseDto>> CreateDirectOrder(CreateDirectOrderDto dto)
        {
            var customerId = GetCustomerId();
            var order = await _orderService.CreateDirectOrderAsync(customerId, dto);

            if (order == null)
                return BadRequest(new { error = "Not enough stock." });

            return CreatedAtAction(nameof(GetOrderById), new { id = order.Id }, order);
        }

        [HttpGet("{id}/invoice")]
        public async Task<IActionResult> DownloadInvoice(Guid id, string language = "en")
        {
            var customerId = GetCustomerId();
            var invoice = await _invoiceService.GenerateInvoiceAsync(id, customerId, language);

            if (invoice == null) return NotFound();

            return File(invoice, "application/pdf", $"invoice-{id.ToString().Substring(0, 8)}.pdf");
        }

        private Guid GetCustomerId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(claim, out var customerId))
                return customerId;

            throw new UnauthorizedAccessException("Invalid user claim");
        }
    }
}