using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApplication2.DTOs.Notifications;
using WebApplication2.Services.Notifications;

namespace WebApplication2.Controllers.Notifications
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet("preferences")]
        public async Task<ActionResult<NotificationPreferenceDto>> GetPreferences()
        {
            var customerId = GetCustomerId();
            return Ok(await _notificationService.GetPreferencesAsync(customerId));
        }

        [HttpPut("preferences")]
        public async Task<IActionResult> UpdatePreferences(NotificationPreferenceDto dto)
        {
            var customerId = GetCustomerId();
            var result = await _notificationService.UpdatePreferencesAsync(customerId, dto);
            return result ? NoContent() : BadRequest();
        }

        [HttpPost("price-alerts/{productId}")]
        public async Task<IActionResult> AddPriceAlert(int productId)
        {
            var customerId = GetCustomerId();
            var result = await _notificationService.AddPriceAlertAsync(customerId, productId);
            return result ? NoContent() : BadRequest();
        }

        [HttpDelete("price-alerts/{productId}")]
        public async Task<IActionResult> RemovePriceAlert(int productId)
        {
            var customerId = GetCustomerId();
            var result = await _notificationService.RemovePriceAlertAsync(customerId, productId);
            return result ? NoContent() : BadRequest();
        }

        [HttpPost("stock-alerts/{productId}")]
        public async Task<IActionResult> AddStockAlert(int productId)
        {
            var customerId = GetCustomerId();
            var result = await _notificationService.AddStockAlertAsync(customerId, productId);
            return result ? NoContent() : BadRequest();
        }

        [HttpDelete("stock-alerts/{productId}")]
        public async Task<IActionResult> RemoveStockAlert(int productId)
        {
            var customerId = GetCustomerId();
            var result = await _notificationService.RemoveStockAlertAsync(customerId, productId);
            return result ? NoContent() : BadRequest();
        }

        private Guid GetCustomerId()
        {
            return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        }
    }
}