using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApplication2.DTOs.Auth;
using WebApplication2.DTOs.Profile;
using WebApplication2.Services.Profile;

namespace WebApplication2.Controllers.Profile
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;

        public ProfileController(IProfileService profileService)
        {
            _profileService = profileService;
        }

        [HttpGet]
        public async Task<ActionResult<ProfileDto>> GetProfile()
        {
            var customerId = GetCustomerId();
            var profile = await _profileService.GetProfileAsync(customerId);

            if (profile == null)
                return NotFound();

            return Ok(profile);
        }

        [HttpPatch("name")]
        public async Task<IActionResult> UpdateName(UpdateProfileDto dto)
        {
            var customerId = GetCustomerId();
            var result = await _profileService.UpdateNameAsync(customerId, dto);

            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
        {
            var customerId = GetCustomerId();
            var error = await _profileService.ChangePasswordAsync(customerId, dto);

            if (error == null)
                return NotFound();

            if (error.Length > 0)
                return BadRequest(error);

            return NoContent();
        }

        [HttpPost("change-email")]
        public async Task<IActionResult> ChangeEmail(ChangeEmailDto dto)
        {
            var customerId = GetCustomerId();
            var error = await _profileService.ChangeEmailAsync(customerId, dto);

            if (error == null)
                return NotFound();

            if (error.Length > 0)
                return BadRequest(new { error });

            return Ok("Verification code sent to new email.");
        }

        [HttpPost("verify-email-change")]
        public async Task<IActionResult> VerifyEmailChange(VerifyEmailChangeDto dto)
        {
            var customerId = GetCustomerId();
            var error = await _profileService.VerifyEmailChangeAsync(customerId, dto);

            if (error == null)
                return NotFound();

            if (error.Length > 0)
                return BadRequest(new { error });

            return NoContent();
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteAccount(DeleteAccountDto dto)
        {
            var customerId = GetCustomerId();
            var error = await _profileService.DeleteAccountAsync(customerId, dto);

            if (error == null)
                return NotFound();

            if (error.Length > 0)
                return BadRequest(error);

            return NoContent();
        }

        [HttpPost("picture")]
        public async Task<IActionResult> UploadProfilePicture(IFormFile file, CancellationToken cancellationToken)
        {
            var customerId = GetCustomerId();
            var error = await _profileService.UploadProfilePictureAsync(customerId, file, cancellationToken);

            if (error == null) return NotFound();
            if (error.Length > 0) return BadRequest(new { error });

            return Ok();
        }

        [HttpGet("picture")]
        public async Task<IActionResult> GetProfilePicture(CancellationToken cancellationToken)
        {
            var customerId = GetCustomerId();
            var (stream, contentType) = await _profileService.GetProfilePictureAsync(customerId, cancellationToken);

            if (stream == null || contentType == null) return NotFound();

            return File(stream, contentType);
        }

        [HttpGet("accounts")]
        public async Task<ActionResult<List<ProfileAccountDto>>> GetAccounts()
        {
            var customerId = GetCustomerId();
            var accounts = await _profileService.GetAccountsAsync(customerId);
            return Ok(accounts);
        }

        [HttpPost("accounts")]
        public async Task<IActionResult> AddAccount(AddAccountDto dto)
        {
            var customerId = GetCustomerId();
            var error = await _profileService.AddAccountAsync(customerId, dto);

            if (error == null)
                return NotFound();

            if (error.Length > 0)
                return BadRequest(new { error });

            return NoContent();
        }

        [HttpDelete("accounts/{accountId}")]
        public async Task<IActionResult> RemoveAccount(Guid accountId)
        {
            var customerId = GetCustomerId();
            var error = await _profileService.RemoveAccountAsync(customerId, accountId);

            if (error == null)
                return NotFound();

            if (error.Length > 0)
                return BadRequest(new { error });

            return NoContent();
        }

        [HttpPost("switch-account/{accountId}")]
        public async Task<ActionResult<TokenResponseDto>> SwitchAccount(Guid accountId)
        {
            var customerId = GetCustomerId();
            var result = await _profileService.SwitchAccountAsync(customerId, accountId);

            if (result == null)
                return BadRequest(new { error = "Account not found." });

            return Ok(result);
        }

        [AllowAnonymous]
        [HttpGet("picture/{userId}")]
        public async Task<IActionResult> GetProfilePictureByUserId(Guid userId, CancellationToken cancellationToken)
        {
            var (stream, contentType) = await _profileService.GetProfilePictureAsync(userId, cancellationToken);

            if (stream == null || contentType == null) return NotFound();

            return File(stream, contentType);
        }

        private Guid GetCustomerId()
        {
            return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        }
    }
}