using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApplication2.Controllers.Orders;
using WebApplication2.DTOs.Orders;
using WebApplication2.Models.Orders;
using WebApplication2.Services.Orders.Interfaces;

namespace WebApplication2.Tests.Controllers
{
    public class OrdersControllerTests
    {
        private readonly Mock<IOrderService> _orderServiceMock;
        private readonly OrdersController _controller;
        private readonly Guid _customerId = Guid.NewGuid();

        public OrdersControllerTests()
        {
            _orderServiceMock = new Mock<IOrderService>();
            _controller = new OrdersController(_orderServiceMock.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, _customerId.ToString())
            }, "TestAuth"));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [Fact]
        public async Task CreateOrder_Should_Return_Ok_When_Order_Created()
        {
            var order = new OrderResponseDto
            {
                Id = Guid.NewGuid(),
                TotalAmount = 100,
                Status = OrderStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                Items = new List<OrderItemResponseDto>()
            };

            _orderServiceMock
                .Setup(x => x.CreateOrderAsync(_customerId))
                .ReturnsAsync(order);

            var result = await _controller.CreateOrder();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(order, okResult.Value);
        }

        [Fact]
        public async Task CreateOrder_Should_Return_BadRequest_When_Cart_Empty()
        {
            _orderServiceMock
                .Setup(x => x.CreateOrderAsync(_customerId))
                .ReturnsAsync((OrderResponseDto)null);

            var result = await _controller.CreateOrder();

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Cart is empty or there is not enough stock.", badRequestResult.Value);
        }

        [Fact]
        public async Task GetMyOrders_Should_Return_Ok_With_Orders()
        {
            var orders = new List<OrderResponseDto>
            {
                new OrderResponseDto
                {
                    Id = Guid.NewGuid(),
                    TotalAmount = 100,
                    Status = OrderStatus.Pending,
                    CreatedAt = DateTime.UtcNow,
                    Items = new List<OrderItemResponseDto>()
                },
                new OrderResponseDto
                {
                    Id = Guid.NewGuid(),
                    TotalAmount = 200,
                    Status = OrderStatus.Paid,
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    Items = new List<OrderItemResponseDto>()
                }
            };

            _orderServiceMock
                .Setup(x => x.GetCustomerOrdersAsync(_customerId))
                .ReturnsAsync(orders);

            var result = await _controller.GetMyOrders();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(orders, okResult.Value);
        }

        [Fact]
        public async Task GetMyOrders_Should_Return_Ok_With_Empty_When_No_Orders()
        {
            _orderServiceMock
                .Setup(x => x.GetCustomerOrdersAsync(_customerId))
                .ReturnsAsync(new List<OrderResponseDto>());

            var result = await _controller.GetMyOrders();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var orders = Assert.IsAssignableFrom<IEnumerable<OrderResponseDto>>(okResult.Value);
            Assert.Empty(orders);
        }

        [Fact]
        public async Task GetOrderById_Should_Return_Ok_When_Found()
        {
            var orderId = Guid.NewGuid();
            var order = new OrderResponseDto
            {
                Id = orderId,
                TotalAmount = 100,
                Status = OrderStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                Items = new List<OrderItemResponseDto>()
            };

            _orderServiceMock
                .Setup(x => x.GetOrderByIdAsync(orderId, _customerId))
                .ReturnsAsync(order);

            var result = await _controller.GetOrderById(orderId);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(order, okResult.Value);
        }

        [Fact]
        public async Task GetOrderById_Should_Return_NotFound_When_Not_Found()
        {
            var orderId = Guid.NewGuid();

            _orderServiceMock
                .Setup(x => x.GetOrderByIdAsync(orderId, _customerId))
                .ReturnsAsync((OrderResponseDto)null);

            var result = await _controller.GetOrderById(orderId);

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal("Order not found.", notFoundResult.Value);
        }

        [Fact]
        public async Task GetOrderById_Should_Return_NotFound_When_Order_Belongs_To_Other_Customer()
        {
            var orderId = Guid.NewGuid();

            _orderServiceMock
                .Setup(x => x.GetOrderByIdAsync(orderId, _customerId))
                .ReturnsAsync((OrderResponseDto)null);

            var result = await _controller.GetOrderById(orderId);

            Assert.IsType<NotFoundObjectResult>(result.Result);
        }
    }
}