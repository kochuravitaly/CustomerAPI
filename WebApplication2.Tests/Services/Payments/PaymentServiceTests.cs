using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using WebApplication2.Data;
using WebApplication2.DTOs.Payments;
using WebApplication2.DTOs.Payments.YooKassa;
using WebApplication2.Models.Orders;
using WebApplication2.Models.Payments;
using WebApplication2.Models.Products;
using WebApplication2.Services.Payments;
using WebApplication2.Services.Payments.YooKassa;

namespace WebApplication2.Tests.Services.Payments
{
    public class PaymentServiceTests
    {
        private readonly Mock<IYooKassaClient> _yooKassaClientMock;
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly AppDbContext _context;
        private readonly PaymentService _paymentService;

        public PaymentServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _yooKassaClientMock = new Mock<IYooKassaClient>();
            _configurationMock = new Mock<IConfiguration>();

            _configurationMock.Setup(x => x["YooKassa:ReturnUrl"]).Returns("http://localhost:8080/payment/success");

            _paymentService = new PaymentService(
                _context,
                _yooKassaClientMock.Object,
                _configurationMock.Object);

            _context.Categories.Add(new Category { Name = "Test Category", Description = "" });
            _context.SaveChanges();
        }

        private async Task<Order> CreateOrderAsync(
            Guid customerId,
            decimal totalAmount = 100,
            OrderStatus status = OrderStatus.Pending)
        {
            var order = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = customerId,
                TotalAmount = totalAmount,
                Status = status,
                CreatedAt = DateTime.UtcNow
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            return order;
        }

        private async Task<Payment> CreatePaymentAsync(
            Guid orderId,
            string providerPaymentId = "payment-123",
            PaymentStatus status = PaymentStatus.Pending)
        {
            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                OrderId = orderId,
                Amount = 100,
                Currency = "USD",
                Status = status,
                ProviderPaymentId = providerPaymentId,
                IdempotenceKey = Guid.NewGuid().ToString(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();
            return payment;
        }

        private async Task<Product> CreateProductAsync(
            string name = "Test Product",
            decimal price = 100,
            int stockQuantity = 10)
        {
            var product = new Product
            {
                Name = name,
                Description = "",
                Price = price,
                StockQuantity = stockQuantity,
                CategoryId = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        [Fact]
        public async Task CreatePaymentAsync_Should_Throw_When_Order_Not_Found()
        {
            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _paymentService.CreatePaymentAsync(
                    new CreatePaymentDto { OrderId = Guid.NewGuid() },
                    Guid.NewGuid(),
                    CancellationToken.None));
        }

        [Fact]
        public async Task CreatePaymentAsync_Should_Throw_When_Order_Belongs_To_Other_Customer()
        {
            var order = await CreateOrderAsync(Guid.NewGuid());

            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _paymentService.CreatePaymentAsync(
                    new CreatePaymentDto { OrderId = order.Id },
                    Guid.NewGuid(),
                    CancellationToken.None));
        }

        [Fact]
        public async Task CreatePaymentAsync_Should_Throw_When_Payment_Already_Exists()
        {
            var customerId = Guid.NewGuid();
            var order = await CreateOrderAsync(customerId);
            await CreatePaymentAsync(order.Id);

            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _paymentService.CreatePaymentAsync(
                    new CreatePaymentDto { OrderId = order.Id },
                    customerId,
                    CancellationToken.None));
        }

        [Fact]
        public async Task CreatePaymentAsync_Should_Create_Payment_When_Successful()
        {
            var customerId = Guid.NewGuid();
            var order = await CreateOrderAsync(customerId, 150);

            _yooKassaClientMock
                .Setup(x => x.CreatePaymentAsync(
                    It.IsAny<YooKassaPaymentRequest>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new YooKassaPaymentResponse
                {
                    Id = "payment-123",
                    Status = "pending",
                    Confirmation = new WebApplication2.Services.Payments.YooKassa.Confirmation
                    {
                        ConfirmationUrl = "https://yookassa.ru/payment/123"
                    }
                });

            var result = await _paymentService.CreatePaymentAsync(
                new CreatePaymentDto { OrderId = order.Id },
                customerId,
                CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal("https://yookassa.ru/payment/123", result.PaymentUrl);
            Assert.Single(await _context.Payments.ToListAsync());
            Assert.Equal("payment-123", await _context.Payments.Select(p => p.ProviderPaymentId).FirstAsync());
        }

        [Fact]
        public async Task HandleWebhookAsync_Should_Return_When_Event_Not_Relevant()
        {
            await _paymentService.HandleWebhookAsync(
                new YooKassaWebhookDto
                {
                    Event = "payment.pending",
                    Object = new YooKassaWebhookObject { Id = "payment-123" }
                },
                CancellationToken.None);

            _yooKassaClientMock.Verify(
                x => x.GetPaymentAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        [Fact]
        public async Task HandleWebhookAsync_Should_Throw_When_Object_Is_Null()
        {
            await Assert.ThrowsAsync<ArgumentException>(
                () => _paymentService.HandleWebhookAsync(
                    new YooKassaWebhookDto
                    {
                        Event = "payment.succeeded",
                        Object = null
                    },
                    CancellationToken.None));
        }

        [Fact]
        public async Task HandleWebhookAsync_Should_Throw_When_Object_Id_Is_Empty()
        {
            await Assert.ThrowsAsync<ArgumentException>(
                () => _paymentService.HandleWebhookAsync(
                    new YooKassaWebhookDto
                    {
                        Event = "payment.succeeded",
                        Object = new YooKassaWebhookObject { Id = "" }
                    },
                    CancellationToken.None));
        }

        [Fact]
        public async Task HandleWebhookAsync_Should_Throw_When_Payment_Not_Found()
        {
            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _paymentService.HandleWebhookAsync(
                    new YooKassaWebhookDto
                    {
                        Event = "payment.succeeded",
                        Object = new YooKassaWebhookObject { Id = "nonexistent" }
                    },
                    CancellationToken.None));
        }

        [Fact]
        public async Task HandleWebhookAsync_Should_Return_When_Payment_Already_Succeeded()
        {
            var customerId = Guid.NewGuid();
            var order = await CreateOrderAsync(customerId);
            await CreatePaymentAsync(order.Id, "payment-123", PaymentStatus.Succeeded);

            await _paymentService.HandleWebhookAsync(
                new YooKassaWebhookDto
                {
                    Event = "payment.succeeded",
                    Object = new YooKassaWebhookObject { Id = "payment-123" }
                },
                CancellationToken.None);

            _yooKassaClientMock.Verify(
                x => x.GetPaymentAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        [Fact]
        public async Task HandleWebhookAsync_Should_Return_When_Payment_Already_Canceled()
        {
            var customerId = Guid.NewGuid();
            var order = await CreateOrderAsync(customerId);
            await CreatePaymentAsync(order.Id, "payment-123", PaymentStatus.Canceled);

            await _paymentService.HandleWebhookAsync(
                new YooKassaWebhookDto
                {
                    Event = "payment.canceled",
                    Object = new YooKassaWebhookObject { Id = "payment-123" }
                },
                CancellationToken.None);

            _yooKassaClientMock.Verify(
                x => x.GetPaymentAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        [Fact]
        public async Task HandleWebhookAsync_Should_Throw_When_Succeeded_Event_But_Status_Not_Succeeded()
        {
            var customerId = Guid.NewGuid();
            var order = await CreateOrderAsync(customerId);
            await CreatePaymentAsync(order.Id, "payment-123", PaymentStatus.Pending);

            _yooKassaClientMock
                .Setup(x => x.GetPaymentAsync("payment-123", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new YooKassaPaymentStatusResponse
                {
                    Id = "payment-123",
                    Status = "pending"
                });

            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _paymentService.HandleWebhookAsync(
                    new YooKassaWebhookDto
                    {
                        Event = "payment.succeeded",
                        Object = new YooKassaWebhookObject { Id = "payment-123" }
                    },
                    CancellationToken.None));
        }

        [Fact]
        public async Task HandleWebhookAsync_Should_Throw_When_Canceled_Event_But_Status_Not_Canceled()
        {
            var customerId = Guid.NewGuid();
            var order = await CreateOrderAsync(customerId);
            await CreatePaymentAsync(order.Id, "payment-123", PaymentStatus.Pending);

            _yooKassaClientMock
                .Setup(x => x.GetPaymentAsync("payment-123", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new YooKassaPaymentStatusResponse
                {
                    Id = "payment-123",
                    Status = "succeeded"
                });

            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _paymentService.HandleWebhookAsync(
                    new YooKassaWebhookDto
                    {
                        Event = "payment.canceled",
                        Object = new YooKassaWebhookObject { Id = "payment-123" }
                    },
                    CancellationToken.None));
        }

        [Fact]
        public async Task HandleWebhookAsync_Should_Update_Payment_And_Order_When_Succeeded()
        {
            var customerId = Guid.NewGuid();
            var order = await CreateOrderAsync(customerId, 100, OrderStatus.Pending);
            await CreatePaymentAsync(order.Id, "payment-123", PaymentStatus.Pending);

            _yooKassaClientMock
                .Setup(x => x.GetPaymentAsync("payment-123", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new YooKassaPaymentStatusResponse
                {
                    Id = "payment-123",
                    Status = "succeeded"
                });

            await _paymentService.HandleWebhookAsync(
                new YooKassaWebhookDto
                {
                    Event = "payment.succeeded",
                    Object = new YooKassaWebhookObject { Id = "payment-123" }
                },
                CancellationToken.None);

            var payment = await _context.Payments.FirstAsync();
            Assert.Equal(PaymentStatus.Succeeded, payment.Status);
            Assert.NotNull(payment.PaidAt);

            var updatedOrder = await _context.Orders.FindAsync(order.Id);
            Assert.Equal(OrderStatus.Paid, updatedOrder.Status);
        }

        [Fact]
        public async Task HandleWebhookAsync_Should_Restore_Stock_When_Canceled()
        {
            var customerId = Guid.NewGuid();
            var order = await CreateOrderAsync(customerId, 100, OrderStatus.Paid);
            var product = await CreateProductAsync(stockQuantity: 5);
            await CreatePaymentAsync(order.Id, "payment-123", PaymentStatus.Pending);

            _context.OrderItems.Add(new OrderItem
            {
                OrderId = order.Id,
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = 100,
                Quantity = 3,
                Total = 300
            });
            await _context.SaveChangesAsync();

            product.StockQuantity = 2;
            await _context.SaveChangesAsync();

            _yooKassaClientMock
                .Setup(x => x.GetPaymentAsync("payment-123", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new YooKassaPaymentStatusResponse
                {
                    Id = "payment-123",
                    Status = "canceled"
                });

            await _paymentService.HandleWebhookAsync(
                new YooKassaWebhookDto
                {
                    Event = "payment.canceled",
                    Object = new YooKassaWebhookObject { Id = "payment-123" }
                },
                CancellationToken.None);

            var updatedOrder = await _context.Orders.FindAsync(order.Id);
            Assert.Equal(OrderStatus.Canceled, updatedOrder.Status);

            var updatedProduct = await _context.Products.FindAsync(product.Id);
            Assert.Equal(5, updatedProduct.StockQuantity);
        }
    }
}