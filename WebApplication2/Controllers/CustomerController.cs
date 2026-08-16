using Microsoft.AspNetCore.Mvc;
using WebApplication2.Data;
using WebApplication2.DTOs;
using WebApplication2.Services;
using Microsoft.AspNetCore.Authorization;

namespace WebApplication2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly ICustomerService _customerService;
        private readonly IPasswordResetService _passwordResetService;

        public CustomersController(ICustomerService customerService, IPasswordResetService passwordResetService)
        {
            _customerService = customerService;
            _passwordResetService = passwordResetService;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Customer>> GetCustomerById(Guid id)
        {
            var customer = await _customerService.GetCustomerByIdAsync(id);

            if (customer == null)
            {
                return NotFound();
            }

            return Ok(customer);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterCustomerDto dto)
        {
            var customer = await _customerService.RegisterAsync(dto);

            if (customer == null)
            {
                return Conflict("Email is already taken");
            }

            return Ok();
        }

        [HttpPost("login")]
        public async Task<ActionResult<TokenResponseDto>> Login(LoginDto dto)
        {
            var response = await _customerService.LoginAsync(dto);

            if (response == null)
            {
                return Unauthorized("Invalid email or password");
            }

            return Ok(response);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
        {
            var resetToken = await _passwordResetService.ForgotPasswordAsync(dto);

            if (resetToken == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                message = "Password reset token generated.",
                token = resetToken
            });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
        {
            var success = await _passwordResetService.ResetPasswordAsync(dto);

            if (!success)
            {
                return BadRequest("Invalid or expired reset token.");
            }

            return Ok(new
            {
                message = "Password has been reset successfully."
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomerByIdAsync(Guid id)
        {
            var deleted = await _customerService.DeleteCustomerByIdAsync(id);

            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}
