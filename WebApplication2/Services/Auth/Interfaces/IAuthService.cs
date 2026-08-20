using WebApplication2.DTOs.Auth;

namespace WebApplication2.Services.Auth.Interfaces
{
    public interface IAuthService
    {
        Task<bool> RegisterAsync(RegisterCustomerDto dto);
        Task<TokenResponseDto?> LoginAsync(LoginDto dto);
        Task<bool> VerifyEmailAsync(VerifyEmailDto dto);
        Task<bool> LogoutAsync(RefreshTokenDto dto);
        Task<TokenResponseDto?> RefreshTokenAsync(RefreshTokenDto dto);
        Task<string?> ForgotPasswordAsync(EmailDto dto);
        Task<bool> ResetPasswordAsync(ResetPasswordDto dto);
        Task<bool> ResendVerificationCodeAsync(EmailDto dto);
    }
}
