using WebApplication2.DTOs.Auth;
using WebApplication2.DTOs.Profile;

namespace WebApplication2.Services.Profile
{
    public interface IProfileService
    {
        Task<ProfileDto?> GetProfileAsync(Guid customerId);
        Task<bool> UpdateNameAsync(Guid customerId, UpdateProfileDto dto);
        Task<string?> ChangePasswordAsync(Guid customerId, ChangePasswordDto dto);
        Task<string?> DeleteAccountAsync(Guid customerId, DeleteAccountDto dto);
        Task<string?> ChangeEmailAsync(Guid customerId, ChangeEmailDto dto);
        Task<string?> VerifyEmailChangeAsync(Guid customerId, VerifyEmailChangeDto dto);
        Task<string?> UploadProfilePictureAsync(Guid customerId, IFormFile file, CancellationToken cancellationToken);
        Task<(Stream? stream, string? contentType)> GetProfilePictureAsync(Guid customerId, CancellationToken cancellationToken);
        Task<string?> DeleteProfilePictureAsync(Guid customerId, CancellationToken cancellationToken);
        Task<List<ProfileAccountDto>> GetAccountsAsync(Guid customerId);
        Task<AddAccountResultDto?> AddAccountAsync(Guid customerId, AddAccountDto dto);
        Task<string?> RemoveAccountAsync(Guid customerId, Guid accountId);
        Task<TokenResponseDto?> SwitchAccountAsync(Guid customerId, Guid accountId);
        Task<TwoFactorSetupDto?> Get2FASetupAsync(Guid customerId);
        Task<string?> Enable2FAAsync(Guid customerId, string code);
        Task<string?> Disable2FAAsync(Guid customerId, string code);
        Task<List<SessionDto>> GetSessionsAsync(Guid customerId);
        Task<string?> RevokeSessionAsync(Guid customerId, int sessionId);
        Task<string?> SetupEmail2FAAsync(Guid customerId);
        Task<string?> VerifyEmail2FAAsync(Guid customerId, string code);
        Task<bool> Is2FAEnabledAsync(Guid customerId);
        Task<TwoFactorInfoDto> Get2FAInfoAsync(Guid customerId);
        Task<string?> SendDisable2FACodeAsync(Guid customerId);
    }
}