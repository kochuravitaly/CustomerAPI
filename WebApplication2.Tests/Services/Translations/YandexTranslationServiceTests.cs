using System.Net;
using System.Text;
using Microsoft.Extensions.Configuration;
using Moq;
using Moq.Protected;
using WebApplication2.Services.Translation.Services;

namespace WebApplication2.Tests.Services.Translation
{
    public class YandexTranslationServiceTests
    {
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<HttpMessageHandler> _httpMessageHandlerMock;
        private readonly HttpClient _httpClient;
        private readonly YandexTranslationService _translationService;

        public YandexTranslationServiceTests()
        {
            _configurationMock = new Mock<IConfiguration>();
            _configurationMock.Setup(x => x["YandexTranslate:ApiKey"]).Returns("test-api-key");
            _configurationMock.Setup(x => x["YandexTranslate:FolderId"]).Returns("test-folder-id");

            _httpMessageHandlerMock = new Mock<HttpMessageHandler>();

            _httpClient = new HttpClient(_httpMessageHandlerMock.Object);

            _translationService = new YandexTranslationService(_httpClient, _configurationMock.Object);
        }

        private void SetupHttpResponse(HttpStatusCode statusCode, string content)
        {
            _httpMessageHandlerMock
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = statusCode,
                    Content = new StringContent(content, Encoding.UTF8, "application/json")
                });
        }

        private void SetupHttpResponseWithVerification(
            HttpStatusCode statusCode,
            string content,
            Action<HttpRequestMessage> verifyRequest)
        {
            _httpMessageHandlerMock
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .Callback<HttpRequestMessage, CancellationToken>((request, _) => verifyRequest(request))
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = statusCode,
                    Content = new StringContent(content, Encoding.UTF8, "application/json")
                });
        }

        [Fact]
        public async Task TranslateSingleAsync_Should_Return_Text_When_Empty()
        {
            var result = await _translationService.TranslateSingleAsync("", "ru");

            Assert.Equal("", result);
        }

        [Fact]
        public async Task TranslateSingleAsync_Should_Return_Text_When_Whitespace()
        {
            var result = await _translationService.TranslateSingleAsync("   ", "ru");

            Assert.Equal("   ", result);
        }

        [Fact]
        public async Task TranslateSingleAsync_Should_Throw_When_ApiKey_Not_Configured()
        {
            _configurationMock.Setup(x => x["YandexTranslate:ApiKey"]).Returns((string)null);

            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _translationService.TranslateSingleAsync("Hello", "ru"));
        }

        [Fact]
        public async Task TranslateSingleAsync_Should_Throw_When_FolderId_Not_Configured()
        {
            _configurationMock.Setup(x => x["YandexTranslate:FolderId"]).Returns((string)null);

            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _translationService.TranslateSingleAsync("Hello", "ru"));
        }

        [Fact]
        public async Task TranslateSingleAsync_Should_Return_Translation_When_Successful()
        {
            var responseJson = "{\"translations\":[{\"text\":\"Привет\",\"detectedLanguageCode\":\"en\"}]}";

            SetupHttpResponseWithVerification(
                HttpStatusCode.OK,
                responseJson,
                request =>
                {
                    Assert.Equal(HttpMethod.Post, request.Method);
                    Assert.Equal("https://translate.api.cloud.yandex.net/translate/v2/translate", request.RequestUri.ToString());
                    Assert.Equal("Api-Key test-api-key", request.Headers.GetValues("Authorization").First());
                });

            var result = await _translationService.TranslateSingleAsync("Hello", "ru");

            Assert.Equal("Привет", result);
        }

        [Fact]
        public async Task TranslateSingleAsync_Should_Throw_When_Error_Status()
        {
            SetupHttpResponse(HttpStatusCode.BadRequest, "{\"error\":\"bad request\"}");

            await Assert.ThrowsAsync<HttpRequestException>(
                () => _translationService.TranslateSingleAsync("Hello", "ru"));
        }

        [Fact]
        public async Task TranslateSingleAsync_Should_Throw_When_Invalid_Json()
        {
            SetupHttpResponse(HttpStatusCode.OK, "invalid-json");

            await Assert.ThrowsAnyAsync<System.Text.Json.JsonException>(
                () => _translationService.TranslateSingleAsync("Hello", "ru"));
        }

        [Fact]
        public async Task TranslateAsync_Should_Translate_All_Languages()
        {
            var responseJson = "{\"translations\":[{\"text\":\"Translated\",\"detectedLanguageCode\":\"en\"}]}";

            _httpMessageHandlerMock
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(responseJson, Encoding.UTF8, "application/json")
                });

            var result = await _translationService.TranslateAsync("Hello", new[] { "ru", "de" });

            Assert.Equal(2, result.Count);
            Assert.Equal("Translated", result["ru"]);
            Assert.Equal("Translated", result["de"]);
        }

        [Fact]
        public async Task TranslateAsync_Should_Return_Empty_Dictionary_When_No_Languages()
        {
            var result = await _translationService.TranslateAsync("Hello", Array.Empty<string>());

            Assert.Empty(result);
        }
    }
}