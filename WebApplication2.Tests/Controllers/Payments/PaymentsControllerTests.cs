using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApplication2.Controllers.Payments;
using WebApplication2.DTOs.Payments;
using WebApplication2.DTOs.Payments.YooKassa;
using WebApplication2.Services.Payments;

namespace WebApplication2.Tests.Controllers
{
    public class PaymentsControllerTests
    {
        private readonly Mock<IPaymentService> _paymentServiceMock;
        private readonly PaymentsController _controller;
        private readonly Guid _customerId = Guid.NewGuid();

        public PaymentsControllerTests()
        {
            _paymentServiceMock = new Mock<IPaymentService>();
            _controller = new PaymentsController(_paymentServiceMock.Object);

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
        public async Task CreatePayment_Should_Return_Ok_When_Payment_Created()
        {
            var paymentResponse = new PaymentResponseDto
            {
                PaymentId = Guid.NewGuid(),
                PaymentUrl = "https://yookassa.ru/payment/123"
            };

            _paymentServiceMock
                .Setup(x => x.CreatePaymentAsync(
                    It.IsAny<CreatePaymentDto>(),
                    _customerId,
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(paymentResponse);

            var result = await _controller.CreatePayment(
                new CreatePaymentDto { OrderId = Guid.NewGuid() },
                CancellationToken.None);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(paymentResponse, okResult.Value);
        }

        [Fact]
        public async Task CreatePayment_Should_Call_Service_With_Correct_Customer_Id()
        {
            var orderId = Guid.NewGuid();
            var dto = new CreatePaymentDto { OrderId = orderId };

            _paymentServiceMock
                .Setup(x => x.CreatePaymentAsync(
                    dto,
                    _customerId,
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PaymentResponseDto
                {
                    PaymentId = Guid.NewGuid(),
                    PaymentUrl = "https://yookassa.ru/payment/123"
                });

            await _controller.CreatePayment(dto, CancellationToken.None);

            _paymentServiceMock.Verify(
                x => x.CreatePaymentAsync(dto, _customerId, CancellationToken.None),
                Times.Once);
        }

        [Fact]
        public async Task Webhook_Should_Return_Ok_When_Processed()
        {
            _paymentServiceMock
                .Setup(x => x.HandleWebhookAsync(
                    It.IsAny<YooKassaWebhookDto>(),
                    It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var result = await _controller.Webhook(
                new YooKassaWebhookDto
                {
                    Event = "payment.succeeded",
                    Object = new YooKassaWebhookObject { Id = "payment-123" }
                },
                CancellationToken.None);

            Assert.IsType<OkResult>(result);
        }

        [Fact]
        public async Task Webhook_Should_Call_Service_With_Correct_Dto()
        {
            var webhookDto = new YooKassaWebhookDto
            {
                Event = "payment.succeeded",
                Object = new YooKassaWebhookObject { Id = "payment-123" }
            };

            _paymentServiceMock
                .Setup(x => x.HandleWebhookAsync(
                    webhookDto,
                    CancellationToken.None))
                .Returns(Task.CompletedTask);

            await _controller.Webhook(webhookDto, CancellationToken.None);

            _paymentServiceMock.Verify(
                x => x.HandleWebhookAsync(webhookDto, CancellationToken.None),
                Times.Once);
        }
    }
}