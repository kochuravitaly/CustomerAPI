using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApplication2.DTOs.Orders;
using WebApplication2.Services.Orders;

namespace WebApplication2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpPost]
        public async Task<ActionResult<OrderResponseDto>> CreateOrder()
        {
            var customerId = GetCustomerId();

            var order = await _orderService.CreateOrderAsync(customerId);

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

        private Guid GetCustomerId()
        {
            return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        }
    }
}