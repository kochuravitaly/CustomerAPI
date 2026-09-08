using WebApplication2.Models.Reviews;

namespace WebApplication2.Services.Auth.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailVerificationCodeAsync(string email, string code, string language = "en");
        Task SendPasswordResetEmailAsync(string email, string resetToken, string language = "en");
        Task SendReviewReportAsync(Review review);
        Task SendReviewReportConfirmationAsync(string customerEmail, string language = "en");
        Task SendNewLoginNotificationAsync(string email, string deviceInfo, string ipAddress, string language = "en");
        Task SendPriceDropNotificationAsync(string email, string productName, string newPrice, string language);
        Task SendBackInStockNotificationAsync(string email, string productName, string language);
        Task SendWatchListSaleNotificationAsync(string email, string productName, string newPrice, string language);
        Task SendFlashSaleNotificationAsync(string email, string discount, string language);
    }
}