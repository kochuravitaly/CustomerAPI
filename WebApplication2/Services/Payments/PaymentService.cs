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

        public PaymentService(
            AppDbContext context,
            IYooKassaClient yooKassaClient)
        {
            _context = context;
            _yooKassaClient = yooKassaClient;
        }

        public async Task<PaymentResponseDto> CreatePaymentAsync(CreatePaymentDto dto, Guid customerId, CancellationToken cancellationToken)
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

            var idempotenceKey = Guid.NewGuid().ToString();

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
                },
                Metadata = new Dictionary<string, string>
                {
                    ["order_id"] = order.Id.ToString()
                }
            };

            var response = await _yooKassaClient.CreatePaymentAsync(
                request,
                idempotenceKey,
                cancellationToken);

            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                Amount = order.TotalAmount,
                Currency = request.Amount.Currency,
                Status = PaymentStatus.Pending,
                ProviderPaymentId = response.Id,
                IdempotenceKey = idempotenceKey,
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

            if (dto.Object is null ||
                string.IsNullOrWhiteSpace(dto.Object.Id))
            {
                throw new ArgumentException(
                    "Invalid YooKassa webhook.");
            }

            var payment = await _context.Payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(
                    p => p.ProviderPaymentId == dto.Object.Id,
                    cancellationToken);

            if (payment is null)
            {
                throw new KeyNotFoundException(
                    "Payment not found.");
            }

            var yooKassaPayment =
                await _yooKassaClient.GetPaymentAsync(
                    dto.Object.Id,
                    cancellationToken);

            if (dto.Event == "payment.succeeded" &&
                yooKassaPayment.Status != "succeeded")
            {
                throw new InvalidOperationException(
                    "YooKassa webhook status does not match payment status.");
            }

            if (dto.Event == "payment.canceled" &&
                yooKassaPayment.Status != "canceled")
            {
                throw new InvalidOperationException(
                    "YooKassa webhook status does not match payment status.");
            }

            if (payment.Status == PaymentStatus.Succeeded ||
                payment.Status == PaymentStatus.Canceled)
            {
                return;
            }

            if (yooKassaPayment.Status == "succeeded")
            {
                payment.Status = PaymentStatus.Succeeded;
                payment.PaidAt = DateTime.UtcNow;

                if (payment.Order is not null)
                {
                    payment.Order.Status = OrderStatus.Paid;
                }
            }
            else if (yooKassaPayment.Status == "canceled")
            {
                payment.Status = PaymentStatus.Canceled;
                payment.CanceledAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}