using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using WebApplication2.Models.Reviews;
using WebApplication2.Services.Auth.Interfaces;

namespace WebApplication2.Services.Auth.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        private async Task SendEmailAsync(MimeMessage message)
        {
            using var smtp = new SmtpClient();

            await smtp.ConnectAsync(
                _configuration["Email:Host"],
                int.Parse(_configuration["Email:Port"]),
                SecureSocketOptions.StartTls);

            await smtp.AuthenticateAsync(
                _configuration["Email:Username"],
                _configuration["Email:Password"]);

            await smtp.SendAsync(message);

            await smtp.DisconnectAsync(true);
        }

        private (string subject, string body) GetVerificationEmailContent(string code, string language)
        {
            return language switch
            {
                "ru" => (
                    "Код подтверждения - CheynneShop",
                    $"Ваш код подтверждения: {code}. Он истекает через 15 минут."
                ),
                "de" => (
                    "Bestätigungscode - CheynneShop",
                    $"Ihr Bestätigungscode: {code}. Er läuft in 15 Minuten ab."
                ),
                _ => (
                    "Verification Code - CheynneShop",
                    $"Your verification code is: {code}. It expires in 15 minutes."
                )
            };
        }

        private (string subject, string body) GetPasswordResetEmailContent(string resetToken, string language)
        {
            var resetLink = $"http://195.19.195.236:8080/reset-password?token={Uri.EscapeDataString(resetToken)}";

            return language switch
            {
                "ru" => (
                    "Сброс пароля - CheynneShop",
                    $"Для сброса пароля перейдите по ссылке: {resetLink}. Ссылка истекает через 15 минут."
                ),
                "de" => (
                    "Passwort zurücksetzen - CheynneShop",
                    $"Um Ihr Passwort zurückzusetzen, klicken Sie hier: {resetLink}. Der Link läuft in 15 Minuten ab."
                ),
                _ => (
                    "Password Reset - CheynneShop",
                    $"To reset your password, click here: {resetLink}. This link expires in 15 minutes."
                )
            };
        }

        public async Task SendEmailVerificationCodeAsync(string email, string code, string language = "en")
        {
            var content = GetVerificationEmailContent(code, language);

            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_configuration["Email:From"]));
            message.To.Add(MailboxAddress.Parse(email));
            message.Subject = content.subject;
            message.Body = new TextPart("plain") { Text = content.body };

            await SendEmailAsync(message);
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetToken, string language = "en")
        {
            var content = GetPasswordResetEmailContent(resetToken, language);

            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_configuration["Email:From"]));
            message.To.Add(MailboxAddress.Parse(email));
            message.Subject = content.subject;
            message.Body = new TextPart("plain") { Text = content.body };

            await SendEmailAsync(message);
        }

        public async Task SendReviewReportAsync(Review review)
        {
            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_configuration["Email:From"]));
            message.To.Add(MailboxAddress.Parse(_configuration["Email:Username"]));
            message.Subject = $"Review Reported - Product #{review.ProductId}";
            message.Body = new TextPart("plain")
            {
                Text = $"Review reported\n\nProduct: {review.Product?.Name}\nReview ID: {review.Id}\nCustomer: {review.Customer?.Email}\nText: {review.Text}\nLink: http://195.19.195.236:8080/products/{review.ProductId}"
            };
            await SendEmailAsync(message);
        }

        public async Task SendReviewReportConfirmationAsync(string customerEmail)
        {
            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_configuration["Email:From"]));
            message.To.Add(MailboxAddress.Parse(customerEmail));
            message.Subject = "Report Received - CheyenneShop";
            message.Body = new TextPart("plain")
            {
                Text = "Thank you for your report. We will review it and take appropriate action."
            };
            await SendEmailAsync(message);
        }
    }
}