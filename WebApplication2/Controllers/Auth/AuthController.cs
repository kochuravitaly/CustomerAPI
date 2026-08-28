using Microsoft.AspNetCore.Mvc;
using WebApplication2.DTOs.Auth;
using WebApplication2.Services.Auth.Interfaces;

namespace WebApplication2.Controllers.NewFolder
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterCustomerDto dto)
        {
            var success = await _authService.RegisterAsync(dto);

            if (!success)
            {
                return Conflict("Email is already taken");
            }

            return Ok();
        }

        [HttpPost("login")]
        public async Task<ActionResult<TokenResponseDto>> Login(LoginDto dto)
        {
            var response = await _authService.LoginAsync(dto);

            if (response == null)
            {
                return Unauthorized("Invalid email or password");
            }

            return Ok(response);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(EmailDto dto)
        {
            var resetToken = await _authService.ForgotPasswordAsync(dto);

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
            var success = await _authService.ResetPasswordAsync(dto);

            if (!success)
            {
                return BadRequest("Invalid or expired reset token.");
            }

            return Ok(new
            {
                message = "Password has been reset successfully."
            });
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail(VerifyEmailDto dto)
        {
            var result = await _authService.VerifyEmailAsync(dto);

            if (!result)
            {
                return BadRequest("Invalid or expired verification code.");
            }

            return Ok("Email verified successfully.");
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification(EmailDto dto)
        {
            var result = await _authService.ResendVerificationCodeAsync(dto);

            if (!result)
                return BadRequest("No pending registration found.");

            return Ok("Verification code sent.");
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<TokenResponseDto>> Refresh(RefreshTokenDto dto)
        {
            var response = await _authService.RefreshTokenAsync(dto);

            if (response == null)
                return Unauthorized();

            return Ok(response);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout(RefreshTokenDto dto)
        {
            var result = await _authService.LogoutAsync(dto);

            if (!result)
                return BadRequest("Invalid or already revoked refresh token.");

            return NoContent();
        }
    }
}
