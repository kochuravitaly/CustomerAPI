using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Auth;
using WebApplication2.Models.Auth;
using WebApplication2.Services.Auth.Interfaces;

namespace WebApplication2.Services.Auth.Services
{
    public class OAuthService : IOAuthService
    {
        private readonly AppDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly IRefreshTokenService _refreshTokenService;
        private readonly ISecureTokenGeneratorService _secureTokenGenerator;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public OAuthService(
            AppDbContext context,
            ITokenService tokenService,
            IRefreshTokenService refreshTokenService,
            ISecureTokenGeneratorService secureTokenGenerator,
            IConfiguration configuration,
            HttpClient httpClient,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _tokenService = tokenService;
            _refreshTokenService = refreshTokenService;
            _secureTokenGenerator = secureTokenGenerator;
            _configuration = configuration;
            _httpClient = httpClient;
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetDeviceInfo()
        {
            var userAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString();
            if (string.IsNullOrEmpty(userAgent)) return "Unknown device";

            if (userAgent.Contains("iPhone")) return "iPhone";
            if (userAgent.Contains("iPad")) return "iPad";
            if (userAgent.Contains("Android")) return "Android";
            if (userAgent.Contains("Windows")) return "Windows";
            if (userAgent.Contains("Mac")) return "Mac";
            if (userAgent.Contains("Linux")) return "Linux";

            return "Unknown device";
        }

        private string GetIpAddress()
        {
            var ip = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
            return ip ?? "Unknown IP";
        }

        private async Task<Models.Profile.Session> CreateSessionAsync(Guid customerId)
        {
            var deviceInfo = GetDeviceInfo();
            var ipAddress = GetIpAddress();

            var session = new Models.Profile.Session
            {
                CustomerId = customerId,
                DeviceInfo = deviceInfo,
                IpAddress = ipAddress,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                LastActiveAt = DateTime.UtcNow
            };

            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();

            return session;
        }

        public async Task<TokenResponseDto?> LoginWithYandexAsync(string code)
        {
            var clientId = _configuration["Yandex:ClientId"];
            var clientSecret = _configuration["Yandex:ClientSecret"];

            var tokenResponse = await _httpClient.PostAsync(
                "https://oauth.yandex.ru/token",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["grant_type"] = "authorization_code",
                    ["code"] = code,
                    ["client_id"] = clientId,
                    ["client_secret"] = clientSecret
                }));

            if (!tokenResponse.IsSuccessStatusCode) return null;

            var responseBody = await tokenResponse.Content.ReadAsStringAsync();
            var tokenData = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(responseBody);

            string? accessToken = null;
            if (tokenData != null && tokenData.TryGetValue("access_token", out var tokenEl))
            {
                accessToken = tokenEl.GetString();
            }

            if (string.IsNullOrEmpty(accessToken)) return null;

            using var request = new HttpRequestMessage(HttpMethod.Get,
                "https://login.yandex.ru/info?format=json");
            request.Headers.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("OAuth", accessToken);

            var userResponse = await _httpClient.SendAsync(request);

            if (!userResponse.IsSuccessStatusCode) return null;

            var userData = await userResponse.Content.ReadFromJsonAsync<YandexUserResponseDto>();
            if (userData == null) return null;

            var email = userData.DefaultEmail ?? userData.Emails?.FirstOrDefault();
            if (string.IsNullOrEmpty(email)) return null;

            var customer = await _context.Customers
                .Include(c => c.Role)
                .FirstOrDefaultAsync(c => c.Email == email);

            if (customer == null)
            {
                customer = new Customer
                {
                    Email = email,
                    Name = userData.RealName ?? email.Split('@')[0],
                    RoleId = 1,
                    IsEmailConfirmed = true,
                    PasswordHash = _secureTokenGenerator.CreateToken()
                };

                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();

                customer = await _context.Customers
                    .Include(c => c.Role)
                    .FirstOrDefaultAsync(c => c.Id == customer.Id);
            }

            if (customer == null) return null;

            var session = await CreateSessionAsync(customer.Id);

            var accessTokenForApp = _tokenService.CreateToken(customer, session.Id);
            var refreshToken = _secureTokenGenerator.CreateToken();
            await _refreshTokenService.SaveRefreshTokenAsync(refreshToken, customer.Id, session.Id);

            return new TokenResponseDto
            {
                Token = accessTokenForApp,
                RefreshToken = refreshToken
            };
        }
    }
}