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
    }
}
