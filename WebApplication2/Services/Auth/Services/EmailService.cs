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

        private async Task SendTranslatedEmailAsync(string to, string language,
            (string en, string ru, string de) subjects,
            (string en, string ru, string de) bodies)
        {
            var subject = language switch
            {
                "ru" => subjects.ru,
                "de" => subjects.de,
                _ => subjects.en
            };

            var body = language switch
            {
                "ru" => bodies.ru,
                "de" => bodies.de,
                _ => bodies.en
            };

            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_configuration["Email:From"]));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;
            message.Body = new TextPart("plain") { Text = body };

            await SendEmailAsync(message);
        }

        public async Task SendEmailVerificationCodeAsync(string email, string code, string language = "en")
        {
            await SendTranslatedEmailAsync(
                email,
                language,
                subjects: (
                    en: "Verification Code - CheyenneShop",
                    ru: "Код подтверждения - CheyenneShop",
                    de: "Bestätigungscode - CheyenneShop"
                ),
                bodies: (
                    en: $"Your verification code is: {code}. It expires in 15 minutes.",
                    ru: $"Ваш код подтверждения: {code}. Он истекает через 15 минут.",
                    de: $"Ihr Bestätigungscode: {code}. Er läuft in 15 Minuten ab."
                )
            );
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetToken, string language = "en")
        {
            var resetLink = $"http://195.19.195.236:8080/reset-password?token={Uri.EscapeDataString(resetToken)}";

            await SendTranslatedEmailAsync(
                email,
                language,
                subjects: (
                    en: "Password Reset - CheyenneShop",
                    ru: "Сброс пароля - CheyenneShop",
                    de: "Passwort zurücksetzen - CheyenneShop"
                ),
                bodies: (
                    en: $"To reset your password, click here: {resetLink}. This link expires in 15 minutes.",
                    ru: $"Для сброса пароля перейдите по ссылке: {resetLink}. Ссылка истекает через 15 минут.",
                    de: $"Um Ihr Passwort zurückzusetzen, klicken Sie hier: {resetLink}. Der Link läuft in 15 Minuten ab."
                )
            );
        }

        private (string subject, string body) GetNewLoginNotificationContent(string deviceInfo, string ipAddress, string language)
        {
            var time = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");

            return language switch
            {
                "ru" => (
                    "Новый вход в аккаунт - CheyenneShop",
                    $"Обнаружен новый вход в ваш аккаунт.\n\nУстройство: {deviceInfo}\nIP-адрес: {ipAddress}\nВремя: {time}\n\nЕсли это были не вы, немедленно смените пароль и свяжитесь с поддержкой."
                ),
                "de" => (
                    "Neue Anmeldung - CheyenneShop",
                    $"Eine neue Anmeldung wurde festgestellt.\n\nGerät: {deviceInfo}\nIP-Adresse: {ipAddress}\nZeit: {time}\n\nWenn Sie es nicht waren, ändern Sie sofort Ihr Passwort und kontaktieren Sie den Support."
                ),
                _ => (
                    "New Login - CheyenneShop",
                    $"A new login was detected for your account.\n\nDevice: {deviceInfo}\nIP Address: {ipAddress}\nTime: {time}\n\nIf this wasn't you, please change your password immediately and contact support."
                )
            };
        }

        public async Task SendReviewReportAsync(Review review)
        {
            var link = $"http://195.19.195.236:8080/products/{review.ProductId}";
            var text = $"A review was reported.\n\nProduct: {review.Product?.Name}\nReview ID: {review.Id}\nCustomer: {review.Customer?.Email}\nText: {review.Text}\nLink: {link}";

            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_configuration["Email:From"]));
            message.To.Add(MailboxAddress.Parse(_configuration["Email:Username"]));
            message.Subject = $"Review Reported - Product #{review.ProductId}";
            message.Body = new TextPart("plain") { Text = text };

            await SendEmailAsync(message);
        }

        public async Task SendReviewReportConfirmationAsync(string customerEmail, string language = "en")
        {
            await SendTranslatedEmailAsync(
                customerEmail,
                language,
                subjects: (
                    en: "Report Received - CheyenneShop",
                    ru: "Жалоба получена - CheyenneShop",
                    de: "Meldung erhalten - CheyenneShop"
                ),
                bodies: (
                    en: "Thank you for your report. We will review it and take appropriate action.",
                    ru: "Спасибо за вашу жалобу. Мы рассмотрим её и примем соответствующие меры.",
                    de: "Vielen Dank für Ihre Meldung. Wir werden sie prüfen und entsprechende Maßnahmen ergreifen."
                )
            );
        }
        public async Task SendNewLoginNotificationAsync(string email, string deviceInfo, string ipAddress, string language = "en")
        {
            var content = GetNewLoginNotificationContent(deviceInfo, ipAddress, language);

            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_configuration["Email:From"]));
            message.To.Add(MailboxAddress.Parse(email));
            message.Subject = content.subject;
            message.Body = new TextPart("plain") { Text = content.body };

            await SendEmailAsync(message);
        }

        public async Task SendPriceDropNotificationAsync(string email, string productName, string newPrice, string language = "en")
        {
            await SendTranslatedEmailAsync(
                email,
                language,
                subjects: (
                    en: $"Price Drop - {productName}",
                    ru: $"Снижение цены - {productName}",
                    de: $"Preisreduzierung - {productName}"
                ),
                bodies: (
                    en: $"Good news! The price of {productName} has dropped to ${newPrice}. Visit our store now!",
                    ru: $"Хорошие новости! Цена на {productName} снизилась до ${newPrice}. Заходите в магазин!",
                    de: $"Gute Nachrichten! Der Preis von {productName} ist auf ${newPrice} gefallen. Besuchen Sie unseren Shop!"
                )
            );
        }

        public async Task SendBackInStockNotificationAsync(string email, string productName, string language = "en")
        {
            await SendTranslatedEmailAsync(
                email,
                language,
                subjects: (
                    en: $"Back in Stock - {productName}",
                    ru: $"Снова в наличии - {productName}",
                    de: $"Wieder verfügbar - {productName}"
                ),
                bodies: (
                    en: $"{productName} is back in stock! Order now before it sells out again.",
                    ru: $"{productName} снова в наличии! Закажите сейчас, пока не распродали.",
                    de: $"{productName} ist wieder verfügbar! Bestellen Sie jetzt, bevor es wieder ausverkauft ist."
                )
            );
        }

        public async Task SendWatchListSaleNotificationAsync(string email, string productName, string newPrice, string language = "en")
        {
            await SendTranslatedEmailAsync(
                email,
                language,
                subjects: (
                    en: $"On Sale - {productName}",
                    ru: $"Распродажа - {productName}",
                    de: $"Im Angebot - {productName}"
                ),
                bodies: (
                    en: $"An item you viewed is now on sale! {productName} is now ${newPrice}. Check it out!",
                    ru: $"Товар, который вы смотрели, теперь со скидкой! {productName} теперь ${newPrice}. Посмотрите!",
                    de: $"Ein Artikel, den Sie angesehen haben, ist jetzt im Angebot! {productName} kostet jetzt ${newPrice}."
                )
            );
        }

        public async Task SendFlashSaleNotificationAsync(string email, string discount, string language = "en")
        {
            await SendTranslatedEmailAsync(
                email,
                language,
                subjects: (
                    en: $"Flash Sale - {discount} OFF!",
                    ru: $"Распродажа - скидка {discount}!",
                    de: $"Blitzverkauf - {discount} Rabatt!"
                ),
                bodies: (
                    en: $"Hurry! Flash sale with {discount} discount is now live. Limited time only!",
                    ru: $"Спешите! Распродажа со скидкой {discount} уже началась. Только ограниченное время!",
                    de: $"Beeilen Sie sich! Blitzverkauf mit {discount} Rabatt ist jetzt live. Nur für begrenzte Zeit!"
                )
            );
        }
    }
}