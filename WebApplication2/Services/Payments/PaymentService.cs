using Microsoft.EntityFrameworkCore;
using System.Globalization;
using WebApplication2.Data;
using WebApplication2.DTOs.Payments;
using WebApplication2.DTOs.Payments.YooKassa;
using WebApplication2.Models.Orders;
using WebApplication2.Models.Payments;
using WebApplication2.Services.Currency;
using WebApplication2.Services.Payments.YooKassa;

namespace WebApplication2.Services.Payments
{
    public class PaymentService : IPaymentService
    {
        private readonly AppDbContext _context;
        private readonly IYooKassaClient _yooKassaClient;
        private readonly IConfiguration _configuration;
        private readonly ICurrencyService _currencyService;

        public PaymentService(
            AppDbContext context,
            IYooKassaClient yooKassaClient,
            IConfiguration configuration,
            ICurrencyService currencyService)
        {
            _context = context;
            _yooKassaClient = yooKassaClient;
            _configuration = configuration;
            _currencyService = currencyService;
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

            if (order.Status == OrderStatus.Paid)
                throw new InvalidOperationException("Order is already paid.");

            if (order.Status == OrderStatus.Canceled)
                throw new InvalidOperationException("Order is canceled.");

            if (order.Payment is not null && order.Payment.Status == PaymentStatus.Pending)
            {
                return new PaymentResponseDto
                {
                    PaymentId = order.Payment.Id,
                    PaymentUrl = order.Payment.PaymentUrl ?? ""
                };
            }

            var idempotenceKey = Guid.NewGuid().ToString();

            var request = new YooKassaPaymentRequestDto
            {
                Amount = new AmountDto
                {
                    Value = order.TotalAmount.ToString("F2", CultureInfo.InvariantCulture),
                    Currency = "RUB"
                },
                PaymentMethodData = dto.PaymentMethod != null ? new PaymentMethodDataDto
                {
                    Type = dto.PaymentMethod
                } : null,
                Confirmation = new ConfirmationRequestDto
                {
                    Type = "redirect",
                    ReturnUrl = _configuration["YooKassa:ReturnUrl"]
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
                Currency = "RUB",
                Status = PaymentStatus.Pending,
                ProviderPaymentId = response.Id,
                IdempotenceKey = idempotenceKey,
                PaymentUrl = response.Confirmation.ConfirmationUrl,
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

            if (payment.Status == PaymentStatus.Succeeded ||
                payment.Status == PaymentStatus.Canceled)
            {
                return;
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

                if (payment.Order is not null)
                {
                    payment.Order.Status = OrderStatus.Canceled;

                    var orderItems = await _context.OrderItems
                        .Where(oi => oi.OrderId == payment.Order.Id)
                        .Include(oi => oi.Product)
                        .ToListAsync(cancellationToken);

                    foreach (var orderItem in orderItems)
                    {
                        if (orderItem.Product is not null)
                        {
                            orderItem.Product.StockQuantity += orderItem.Quantity;
                        }
                    }
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}