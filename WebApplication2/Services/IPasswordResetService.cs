using WebApplication2.DTOs;

namespace WebApplication2.Services
{
    public interface IPasswordResetService
    {
        Task<string?> ForgotPasswordAsync(ForgotPasswordDto dto);
        Task<bool> ResetPasswordAsync(ResetPasswordDto dto);
    }
}
