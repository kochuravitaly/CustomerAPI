using System.Net;
using System.Text;
using Microsoft.Extensions.Configuration;
using Moq;
using Moq.Protected;
using WebApplication2.Services.Payments.YooKassa;

namespace WebApplication2.Tests.Services.Payments
{
    public class YooKassaClientTests
    {
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<HttpMessageHandler> _httpMessageHandlerMock;
        private readonly HttpClient _httpClient;
        private readonly YooKassaClient _yooKassaClient;

        public YooKassaClientTests()
        {
            _configurationMock = new Mock<IConfiguration>();
            _configurationMock.Setup(x => x["YooKassa:ShopId"]).Returns("test-shop-id");
            _configurationMock.Setup(x => x["YooKassa:SecretKey"]).Returns("test-secret-key");

            _httpMessageHandlerMock = new Mock<HttpMessageHandler>();

            _httpClient = new HttpClient(_httpMessageHandlerMock.Object)
            {
                BaseAddress = new Uri("https://api.yookassa.ru/")
            };

            _yooKassaClient = new YooKassaClient(_httpClient, _configurationMock.Object);
        }

        private YooKassaPaymentRequest CreatePaymentRequest()
        {
            return new YooKassaPaymentRequest
            {
                Amount = new Amount
                {
                    Value = "100.00",
                    Currency = "RUB"
                },
                Confirmation = new Confirmation
                {
                    Type = "redirect",
                    ReturnUrl = "http://localhost:8080/payment/success"
                }
            };
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
        public async Task CreatePaymentAsync_Should_Return_Response_When_Successful()
        {
            var responseJson = "{\"id\":\"payment-123\",\"status\":\"pending\",\"confirmation\":{\"confirmation_url\":\"https://yookassa.ru/payment/123\"}}";

            SetupHttpResponseWithVerification(
                HttpStatusCode.OK,
                responseJson,
                request =>
                {
                    Assert.Equal(HttpMethod.Post, request.Method);
                    Assert.Equal("https://api.yookassa.ru/v3/payments", request.RequestUri.ToString());
                    Assert.Equal(
                        "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes("test-shop-id:test-secret-key")),
                        request.Headers.Authorization.ToString());
                    Assert.Equal("idempotence-key-123", request.Headers.GetValues("Idempotence-Key").First());
                });

            var result = await _yooKassaClient.CreatePaymentAsync(
                CreatePaymentRequest(),
                "idempotence-key-123",
                CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal("payment-123", result.Id);
            Assert.Equal("pending", result.Status);
        }

        [Fact]
        public async Task CreatePaymentAsync_Should_Throw_When_Error_Status()
        {
            SetupHttpResponse(HttpStatusCode.BadRequest, "{\"error\":\"bad request\"}");

            await Assert.ThrowsAsync<HttpRequestException>(
                () => _yooKassaClient.CreatePaymentAsync(
                    CreatePaymentRequest(),
                    "idempotence-key",
                    CancellationToken.None));
        }

        [Fact]
        public async Task CreatePaymentAsync_Should_Throw_When_Empty_Response()
        {
            SetupHttpResponse(HttpStatusCode.OK, "");

            await Assert.ThrowsAsync<System.Text.Json.JsonException>(
                () => _yooKassaClient.CreatePaymentAsync(
                    CreatePaymentRequest(),
                    "idempotence-key",
                    CancellationToken.None));
        }

        [Fact]
        public async Task CreatePaymentAsync_Should_Throw_When_Invalid_Json()
        {
            SetupHttpResponse(HttpStatusCode.OK, "invalid-json");

            await Assert.ThrowsAsync<System.Text.Json.JsonException>(
                () => _yooKassaClient.CreatePaymentAsync(
                    CreatePaymentRequest(),
                    "idempotence-key",
                    CancellationToken.None));
        }

        [Fact]
        public async Task GetPaymentAsync_Should_Return_Response_When_Successful()
        {
            var responseJson = "{\"id\":\"payment-123\",\"status\":\"succeeded\"}";

            SetupHttpResponseWithVerification(
                HttpStatusCode.OK,
                responseJson,
                request =>
                {
                    Assert.Equal(HttpMethod.Get, request.Method);
                    Assert.Equal("https://api.yookassa.ru/v3/payments/payment-123", request.RequestUri.ToString());
                    Assert.Equal(
                        "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes("test-shop-id:test-secret-key")),
                        request.Headers.Authorization.ToString());
                });

            var result = await _yooKassaClient.GetPaymentAsync("payment-123", CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal("payment-123", result.Id);
            Assert.Equal("succeeded", result.Status);
        }

        [Fact]
        public async Task GetPaymentAsync_Should_Throw_When_Error_Status()
        {
            SetupHttpResponse(HttpStatusCode.NotFound, "{\"error\":\"not found\"}");

            await Assert.ThrowsAsync<HttpRequestException>(
                () => _yooKassaClient.GetPaymentAsync(
                    "payment-999",
                    CancellationToken.None));
        }

        [Fact]
        public async Task GetPaymentAsync_Should_Throw_When_Empty_Response()
        {
            SetupHttpResponse(HttpStatusCode.OK, "");

            await Assert.ThrowsAsync<System.Text.Json.JsonException>(
                () => _yooKassaClient.GetPaymentAsync(
                    "payment-123",
                    CancellationToken.None));
        }

        [Fact]
        public async Task GetPaymentAsync_Should_Throw_When_Invalid_Json()
        {
            SetupHttpResponse(HttpStatusCode.OK, "invalid-json");

            await Assert.ThrowsAsync<System.Text.Json.JsonException>(
                () => _yooKassaClient.GetPaymentAsync(
                    "payment-123",
                    CancellationToken.None));
        }
    }
}