using WebApplication2.Models.Reviews;

namespace WebApplication2.Services.Auth.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailVerificationCodeAsync(string email, string code, string language = "en");
        Task SendPasswordResetEmailAsync(string email, string resetToken, string language = "en");
        Task SendReviewReportAsync(Review review);
        Task SendReviewReportConfirmationAsync(string customerEmail);
    }
}