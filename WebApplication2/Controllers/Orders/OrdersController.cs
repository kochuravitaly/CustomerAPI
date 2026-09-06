using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;
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
                return BadRequest("Cart is empty or there is not enough stock.");

            return Ok(order);
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
                return NotFound("Order not found.");

            return Ok(order);
        }

        [HttpPost("{id}/reorder")]
        public async Task<ActionResult<OrderResponseDto>> Reorder(Guid id)
        {
            var customerId = GetCustomerId();
            var order = await _orderService.ReorderAsync(customerId, id);

            if (order == null)
                return NotFound("Order not found.");

            return Ok(order);
        }

        [HttpPost("direct")]
        public async Task<ActionResult<OrderResponseDto>> CreateDirectOrder(CreateDirectOrderDto dto)
        {
            var customerId = GetCustomerId();
            var order = await _orderService.CreateDirectOrderAsync(customerId, dto);

            if (order == null)
                return BadRequest("Not enough stock.");

            return Ok(order);
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
            return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        }
    }
}