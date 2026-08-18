namespace WebApplication2.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string email, string resetToken);
        Task SendEmailVerificationCodeAsync(string email, string code);
    }
}
