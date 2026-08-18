using MailKit.Security;
using MimeKit;
using MailKit.Net.Smtp;

namespace WebApplication2.Services
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

        public async Task SendEmailVerificationCodeAsync(string email, string code)
        {
            var message = new MimeMessage();

            message.From.Add(
                MailboxAddress.Parse(
                    _configuration["Email:From"]));

            message.To.Add(
                MailboxAddress.Parse(email));

            message.Subject = "Verify Your Email";

            message.Body = new TextPart("html")
            {
                Text = $"""
                    <h2>Verify Your Email</h2>
                    <p>Use the following code to verify your email address:</p>
                    <h1>{code}</h1>
                    <p>This code expires in 15 minutes.</p>
                    """
            };

            SendEmailAsync(message);
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetToken)
        {
            var message = new MimeMessage();

            message.From.Add(
                MailboxAddress.Parse(
                    _configuration["Email:From"]));

            message.To.Add(
                MailboxAddress.Parse(email));

            message.Subject = "Password Reset";

            var resetLink =
                $"https://localhost:7261/reset-password?token={Uri.EscapeDataString(resetToken)}";

            message.Body = new TextPart("html")
            {
                Text = $"""
                    <h2>Password Reset</h2>
                    <p>You requested a password reset.</p>
                    <p>
                        <a href="{resetLink}">
                            Reset your password
                        </a>
                    </p>
                    <p>This link expires in 15 minutes.</p>
                    """
            };

            SendEmailAsync(message);
        } 
    }
}
