using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace WebApplication2.Controllers
{
    public abstract class BaseApiController : ControllerBase
    {
        protected Guid GetCustomerId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(claim, out var customerId))
                return customerId;

            throw new UnauthorizedAccessException("Invalid user claim");
        }

        protected IActionResult Error(string message, int statusCode = 400)
        {
            return StatusCode(statusCode, new { error = message });
        }
    }
}