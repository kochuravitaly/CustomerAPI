namespace WebApplication2.DTOs.Auth
{
    public class YandexTokenResponseFullDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string? IdToken { get; set; }
    }
}
