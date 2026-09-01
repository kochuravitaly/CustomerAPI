using System.Net.Http.Json;
using System.Text.Json;
using WebApplication2.Services.Translation.Interfaces;

namespace WebApplication2.Services.Translation.Services
{
    public class YandexTranslationService : ITranslationService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public YandexTranslationService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
        }

        public async Task<Dictionary<string, string>> TranslateAsync(string text, string[] targetLanguages)
        {
            var result = new Dictionary<string, string>();
            foreach (var lang in targetLanguages)
            {
                result[lang] = await TranslateSingleAsync(text, lang);
            }
            return result;
        }

        public async Task<string> TranslateSingleAsync(string text, string targetLanguage)
        {
            if (string.IsNullOrWhiteSpace(text))
                return text;

            var apiKey = _configuration["YandexTranslate:ApiKey"]
                ?? throw new InvalidOperationException("Yandex Translate API key not configured.");

            var folderId = _configuration["YandexTranslate:FolderId"]
                ?? throw new InvalidOperationException("Yandex Translate FolderId not configured.");

            var requestBody = new
            {
                folderId = folderId,
                texts = new[] { text },
                targetLanguageCode = targetLanguage
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://translate.api.cloud.yandex.net/translate/v2/translate");
            request.Headers.Add("Authorization", $"Api-Key {apiKey}");
            request.Content = JsonContent.Create(requestBody);

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Yandex Translate returned {(int)response.StatusCode}: {errorContent}");
            }

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            var translations = root.GetProperty("translations");
            return translations[0].GetProperty("text").GetString() ?? text;
        }
    }
}