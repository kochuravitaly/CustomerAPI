using Microsoft.Extensions.Configuration;
using Moq;
using WebApplication2.Models.Reviews;
using WebApplication2.Services.Auth.Services;

namespace WebApplication2.Tests.Services.Auth
{
    public class EmailServiceTests
    {
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly EmailService _emailService;

        public EmailServiceTests()
        {
            _configurationMock = new Mock<IConfiguration>();

            _configurationMock.Setup(x => x["Email:Host"]).Returns("smtp.gmail.com");
            _configurationMock.Setup(x => x["Email:Port"]).Returns("587");
            _configurationMock.Setup(x => x["Email:Username"]).Returns("test@gmail.com");
            _configurationMock.Setup(x => x["Email:Password"]).Returns("password");
            _configurationMock.Setup(x => x["Email:From"]).Returns("test@gmail.com");

            _emailService = new EmailService(_configurationMock.Object);
        }

        [Fact]
        public void GetNewLoginNotificationContent_English_ReturnsEnglish()
        {
            var method = typeof(EmailService).GetMethod(
                "GetNewLoginNotificationContent",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            var result = ((string subject, string body))method.Invoke(
                _emailService,
                new object[] { "Windows", "127.0.0.1", "en" });

            Assert.Contains("New Login - CheyenneShop", result.subject);
            Assert.Contains("Device: Windows", result.body);
            Assert.Contains("IP Address: 127.0.0.1", result.body);
        }

        [Fact]
        public void GetNewLoginNotificationContent_Russian_ReturnsRussian()
        {
            var method = typeof(EmailService).GetMethod(
                "GetNewLoginNotificationContent",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            var result = ((string subject, string body))method.Invoke(
                _emailService,
                new object[] { "Windows", "127.0.0.1", "ru" });

            Assert.Contains("Новый вход в аккаунт - CheyenneShop", result.subject);
            Assert.Contains("Устройство: Windows", result.body);
            Assert.Contains("IP-адрес: 127.0.0.1", result.body);
        }

        [Fact]
        public void GetNewLoginNotificationContent_German_ReturnsGerman()
        {
            var method = typeof(EmailService).GetMethod(
                "GetNewLoginNotificationContent",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            var result = ((string subject, string body))method.Invoke(
                _emailService,
                new object[] { "Windows", "127.0.0.1", "de" });

            Assert.Contains("Neue Anmeldung - CheyenneShop", result.subject);
            Assert.Contains("Gerät: Windows", result.body);
            Assert.Contains("IP-Adresse: 127.0.0.1", result.body);
        }

        [Fact]
        public void GetNewLoginNotificationContent_UnknownLanguage_FallsBackToEnglish()
        {
            var method = typeof(EmailService).GetMethod(
                "GetNewLoginNotificationContent",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            var result = ((string subject, string body))method.Invoke(
                _emailService,
                new object[] { "Windows", "127.0.0.1", "fr" });

            Assert.Contains("New Login - CheyenneShop", result.subject);
            Assert.Contains("Device: Windows", result.body);
        }

        [Fact]
        public void GetNewLoginNotificationContent_EmptyDeviceInfo_ReturnsEmptyInBody()
        {
            var method = typeof(EmailService).GetMethod(
                "GetNewLoginNotificationContent",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            var result = ((string subject, string body))method.Invoke(
                _emailService,
                new object[] { "", "127.0.0.1", "en" });

            Assert.Contains("Device: \n", result.body);
        }

        [Fact]
        public void GetNewLoginNotificationContent_EmptyIpAddress_ReturnsEmptyInBody()
        {
            var method = typeof(EmailService).GetMethod(
                "GetNewLoginNotificationContent",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            var result = ((string subject, string body))method.Invoke(
                _emailService,
                new object[] { "Windows", "", "en" });

            Assert.Contains("IP Address: \n", result.body);
        }

        [Fact]
        public void GetNewLoginNotificationContent_DifferentDevices_ReturnsDeviceInBody()
        {
            var method = typeof(EmailService).GetMethod(
                "GetNewLoginNotificationContent",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            var iphoneResult = ((string subject, string body))method.Invoke(
                _emailService,
                new object[] { "iPhone", "127.0.0.1", "en" });
            var androidResult = ((string subject, string body))method.Invoke(
                _emailService,
                new object[] { "Android", "127.0.0.1", "en" });
            var macResult = ((string subject, string body))method.Invoke(
                _emailService,
                new object[] { "Mac", "127.0.0.1", "en" });

            Assert.Contains("Device: iPhone", iphoneResult.body);
            Assert.Contains("Device: Android", androidResult.body);
            Assert.Contains("Device: Mac", macResult.body);
        }

        [Fact]
        public void GetNewLoginNotificationContent_Contains_Time()
        {
            var method = typeof(EmailService).GetMethod(
                "GetNewLoginNotificationContent",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            var result = ((string subject, string body))method.Invoke(
                _emailService,
                new object[] { "Windows", "127.0.0.1", "en" });

            Assert.Contains("Time:", result.body);
        }
    }
}