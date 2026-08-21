using Microsoft.EntityFrameworkCore;
using System.Globalization;
using WebApplication2.Data;
using WebApplication2.DTOs.Payments;
using WebApplication2.DTOs.Payments.YooKassa;
using WebApplication2.Models.Orders;
using WebApplication2.Models.Payments;
using WebApplication2.Services.Payments.YooKassa;

namespace WebApplication2.Services.Payments
{
    public class PaymentService : IPaymentService
    {
        private readonly AppDbContext _context;
        private readonly IYooKassaClient _yooKassaClient;
        private readonly IConfiguration _configuration;

        public PaymentService(
            AppDbContext context,
            IYooKassaClient yooKassaClient,
            IConfiguration configuration)
        {
            _context = context;
            _yooKassaClient = yooKassaClient;
            _configuration = configuration;
        }

        public async Task<PaymentResponseDto> CreatePaymentAsync(
            CreatePaymentDto dto,
            Guid customerId,
            CancellationToken cancellationToken)
        {
            var order = await _context.Orders
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(
                    o => o.Id == dto.OrderId &&
                         o.CustomerId == customerId,
                    cancellationToken);

            if (order is null)
                throw new KeyNotFoundException("Order not found.");

            if (order.Payment is not null)
                throw new InvalidOperationException(
                    "Payment already exists for this order.");

            var request = new YooKassaPaymentRequest
            {
                Amount = new Amount
                {
                    Value = order.TotalAmount.ToString(
                        "F2",
                        CultureInfo.InvariantCulture),
                    Currency = "RUB"
                },
                Confirmation = new Confirmation
                {
                    ReturnUrl = "https://example.com/payment/success"
                }
            };

            var response = await _yooKassaClient.CreatePaymentAsync(
                request,
                cancellationToken);

            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                Amount = order.TotalAmount,
                Currency = request.Amount.Currency,
                Status = PaymentStatus.Pending,
                ProviderPaymentId = response.Id,
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);

            await _context.SaveChangesAsync(cancellationToken);

            return new PaymentResponseDto
            {
                PaymentId = payment.Id,
                PaymentUrl = response.Confirmation.ConfirmationUrl
            };
        }

        public async Task HandleWebhookAsync(YooKassaWebhookDto dto, CancellationToken cancellationToken)
        {
            if (dto.Event != "payment.succeeded" &&
                dto.Event != "payment.canceled")
            {
                return;
            }

            if (dto.Object is null || string.IsNullOrWhiteSpace(dto.Object.Id))
            {
                throw new ArgumentException("Invalid YooKassa webhook.");
            }

            var payment = await _context.Payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(
                    p => p.ProviderPaymentId == dto.Object.Id,
                    cancellationToken);

            if (payment is null)
            {
                throw new KeyNotFoundException("Payment not found.");
            }

            var yooKassaPayment = await _yooKassaClient.GetPaymentAsync(
                dto.Object.Id,
                cancellationToken);

            if (yooKassaPayment.Status == "succeeded")
            {
                if (payment.Status == PaymentStatus.Succeeded)
                    return;

                payment.Status = PaymentStatus.Succeeded;
                payment.PaidAt = DateTime.UtcNow;

                if (payment.Order is not null)
                    payment.Order.Status = OrderStatus.Paid;
            }
            else if (yooKassaPayment.Status == "canceled")
            {
                if (payment.Status == PaymentStatus.Canceled)
                    return;

                payment.Status = PaymentStatus.Canceled;
                payment.CanceledAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}