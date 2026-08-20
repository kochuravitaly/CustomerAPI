using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApplication2.DTOs.Payments;
using WebApplication2.DTOs.Payments.YooKassa;
using WebApplication2.Services.Payments;

namespace WebApplication2.Controllers
{
    [ApiController]
    [Route("api/payments")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost]
        public async Task<ActionResult<PaymentResponseDto>> CreatePayment(
            CreatePaymentDto dto,
            CancellationToken cancellationToken)
        {
            var customerId = Guid.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var result = await _paymentService.CreatePaymentAsync(
                dto,
                customerId,
                cancellationToken);

            return Ok(result);
        }

        [AllowAnonymous]
        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook(
            YooKassaWebhookDto dto,
            CancellationToken cancellationToken)
        {
            await _paymentService.HandleWebhookAsync(
                dto,
                cancellationToken);

            return Ok();
        }
    }
}
