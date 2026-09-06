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
            var result = await _profileService.AddAccountAsync(customerId, dto);

            if (result == null)
                return NotFound();

            if (!string.IsNullOrEmpty(result.Error))
                return BadRequest(new { error = result.Error });

            if (result.RequiresTwoFactor)
                return Ok(new
                {
                    requiresTwoFactor = true,
                    customerId = result.CustomerId,
                    twoFactorMethod = result.TwoFactorMethod
                });

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

        [HttpDelete("picture")]
        public async Task<IActionResult> DeleteProfilePicture(CancellationToken cancellationToken)
        {
            var customerId = GetCustomerId();
            var error = await _profileService.DeleteProfilePictureAsync(customerId, cancellationToken);

            if (error == null) return NotFound();
            if (error.Length > 0) return BadRequest(new { error });

            return NoContent();
        }

        [HttpGet("2fa/setup")]
        public async Task<ActionResult<TwoFactorSetupDto>> Get2FASetup()
        {
            var customerId = GetCustomerId();
            var result = await _profileService.Get2FASetupAsync(customerId);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost("2fa/enable")]
        public async Task<IActionResult> Enable2FA(TwoFactorVerifyDto dto)
        {
            var customerId = GetCustomerId();
            var error = await _profileService.Enable2FAAsync(customerId, dto.Code);
            if (error == null) return NotFound();
            if (error.Length > 0) return BadRequest(new { error });
            return Ok(new { message = "2FA enabled" });
        }

        [HttpPost("2fa/disable")]
        public async Task<IActionResult> Disable2FA(TwoFactorVerifyDto dto)
        {
            var customerId = GetCustomerId();
            var error = await _profileService.Disable2FAAsync(customerId, dto.Code);
            if (error == null) return NotFound();
            if (error.Length > 0) return BadRequest(new { error });
            return Ok(new { message = "2FA disabled" });
        }

        [HttpGet("sessions")]
        public async Task<ActionResult<List<SessionDto>>> GetSessions()
        {
            var customerId = GetCustomerId();
            var sessions = await _profileService.GetSessionsAsync(customerId);
            return Ok(sessions);
        }

        [HttpDelete("sessions/{sessionId}")]
        public async Task<IActionResult> RevokeSession(int sessionId)
        {
            var customerId = GetCustomerId();
            var error = await _profileService.RevokeSessionAsync(customerId, sessionId);
            if (error == null) return NotFound();
            if (error.Length > 0) return BadRequest(new { error });
            return NoContent();
        }

        [HttpPost("2fa/email-setup")]
        public async Task<IActionResult> SetupEmail2FA()
        {
            var customerId = GetCustomerId();
            var error = await _profileService.SetupEmail2FAAsync(customerId);
            if (error == null) return NotFound();
            if (error.Length > 0) return BadRequest(new { error });
            return Ok(new { message = "Email code sent" });
        }

        [HttpPost("2fa/email-verify")]
        public async Task<IActionResult> VerifyEmail2FA(EmailTwoFactorVerifyDto dto)
        {
            var customerId = GetCustomerId();
            var error = await _profileService.VerifyEmail2FAAsync(customerId, dto.Code);
            if (error == null) return NotFound();
            if (error.Length > 0) return BadRequest(new { error });
            return Ok(new { message = "2FA enabled via email" });
        }

        [HttpGet("2fa/status")]
        public async Task<ActionResult<bool>> Get2FAStatus()
        {
            var customerId = GetCustomerId();
            var isEnabled = await _profileService.Is2FAEnabledAsync(customerId);
            return Ok(isEnabled);
        }

        [HttpGet("2fa/info")]
        public async Task<ActionResult<TwoFactorInfoDto>> Get2FAInfo()
        {
            var customerId = GetCustomerId();
            var info = await _profileService.Get2FAInfoAsync(customerId);
            return Ok(info);
        }

        [HttpPost("2fa/send-disable-code")]
        public async Task<IActionResult> SendDisableCode()
        {
            var customerId = GetCustomerId();
            var error = await _profileService.SendDisable2FACodeAsync(customerId);
            if (error == null) return NotFound();
            if (error.Length > 0) return BadRequest(new { error });
            return Ok(new { message = "Code sent" });
        }
        [HttpPost("watch-history/{productId}")]
        public async Task<IActionResult> RecordWatch(int productId)
        {
            var customerId = GetCustomerId();
            await _profileService.RecordWatchAsync(customerId, productId);
            return NoContent();
        }

        [HttpGet("watch-history")]
        public async Task<ActionResult<List<WatchHistoryDto>>> GetWatchHistory()
        {
            var customerId = GetCustomerId();
            var history = await _profileService.GetWatchHistoryAsync(customerId);
            return Ok(history);
        }

        [HttpGet("addresses")]
        public async Task<ActionResult<List<AddressDto>>> GetAddresses()
        {
            var customerId = GetCustomerId();
            var addresses = await _profileService.GetAddressesAsync(customerId);
            return Ok(addresses);
        }

        [HttpGet("addresses/{addressId}")]
        public async Task<ActionResult<AddressDto>> GetAddress(int addressId)
        {
            var customerId = GetCustomerId();
            var address = await _profileService.GetAddressByIdAsync(customerId, addressId);

            if (address == null) return NotFound();

            return Ok(address);
        }

        [HttpPost("addresses")]
        public async Task<ActionResult<AddressDto>> CreateAddress(CreateAddressDto dto)
        {
            var customerId = GetCustomerId();
            var address = await _profileService.CreateAddressAsync(customerId, dto);

            if (address == null) return BadRequest();

            return Ok(address);
        }

        [HttpPatch("addresses/{addressId}")]
        public async Task<ActionResult<AddressDto>> UpdateAddress(int addressId, CreateAddressDto dto)
        {
            var customerId = GetCustomerId();
            var address = await _profileService.UpdateAddressAsync(customerId, addressId, dto);

            if (address == null) return NotFound();

            return Ok(address);
        }

        [HttpDelete("addresses/{addressId}")]
        public async Task<IActionResult> DeleteAddress(int addressId)
        {
            var customerId = GetCustomerId();
            var result = await _profileService.DeleteAddressAsync(customerId, addressId);

            if (!result) return NotFound();

            return NoContent();
        }

        [HttpPost("addresses/{addressId}/default")]
        public async Task<IActionResult> SetDefaultAddress(int addressId)
        {
            var customerId = GetCustomerId();
            var result = await _profileService.SetDefaultAddressAsync(customerId, addressId);

            if (!result) return NotFound();

            return NoContent();
        }

        private Guid GetCustomerId()
        {
            return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        }
    }
}