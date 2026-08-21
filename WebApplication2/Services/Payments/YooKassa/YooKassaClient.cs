using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace WebApplication2.Services.Payments.YooKassa
{
    public class YooKassaClient : IYooKassaClient
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public YooKassaClient(
            HttpClient httpClient,
            IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<YooKassaPaymentResponse> CreatePaymentAsync(YooKassaPaymentRequest request, string idempotenceKey, CancellationToken cancellationToken)
        {
            var shopId = _configuration["YooKassa:ShopId"];
            var secretKey = _configuration["YooKassa:SecretKey"];

            var credentials = Convert.ToBase64String(
                Encoding.UTF8.GetBytes(
                    $"{shopId}:{secretKey}"));

            using var httpRequest = new HttpRequestMessage(
                HttpMethod.Post,
                "v3/payments");

            httpRequest.Headers.Authorization =
                new AuthenticationHeaderValue(
                    "Basic",
                    credentials);

            httpRequest.Headers.Add(
                "Idempotence-Key",
                idempotenceKey);

            httpRequest.Content = JsonContent.Create(request);

            var response = await _httpClient.SendAsync(
                httpRequest,
                cancellationToken);

            var responseContent =
                await response.Content.ReadAsStringAsync(
                    cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException(
                    $"ЮKassa returned {(int)response.StatusCode}: " +
                    responseContent);
            }

            return JsonSerializer.Deserialize<YooKassaPaymentResponse>(
                responseContent)
                ?? throw new InvalidOperationException(
                    "ЮKassa returned an empty response.");
        }

        public async Task<YooKassaPaymentStatusResponse> GetPaymentAsync(string paymentId, CancellationToken cancellationToken)
        {
            var shopId = _configuration["YooKassa:ShopId"];
            var secretKey = _configuration["YooKassa:SecretKey"];

            var credentials = Convert.ToBase64String(
                Encoding.UTF8.GetBytes(
                    $"{shopId}:{secretKey}"));

            using var httpRequest = new HttpRequestMessage(
                HttpMethod.Get,
                $"v3/payments/{paymentId}");

            httpRequest.Headers.Authorization =
                new AuthenticationHeaderValue(
                    "Basic",
                    credentials);

            var response = await _httpClient.SendAsync(
                httpRequest,
                cancellationToken);

            var responseContent =
                await response.Content.ReadAsStringAsync(
                    cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException(
                    $"ЮKassa returned {(int)response.StatusCode}: " +
                    responseContent);
            }

            return JsonSerializer.Deserialize<YooKassaPaymentStatusResponse>(
                responseContent)
                ?? throw new InvalidOperationException(
                    "ЮKassa returned an empty response.");
        }
    }
}