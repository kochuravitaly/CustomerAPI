using Microsoft.AspNetCore.Mvc;
using WebApplication2.Services.Auth.Interfaces;

namespace WebApplication2.Controllers.Auth
{
    [ApiController]
    [Route("api/oauth")]
    public class OAuthController : ControllerBase
    {
        private readonly IOAuthService _oauthService;
        private readonly IConfiguration _configuration;

        public OAuthController(IOAuthService oauthService, IConfiguration configuration)
        {
            _oauthService = oauthService;
            _configuration = configuration;
        }

        [HttpGet("yandex/login")]
        public IActionResult LoginWithYandex()
        {
            var clientId = _configuration["Yandex:ClientId"];
            var redirectUri = _configuration["Yandex:RedirectUri"];
            var url = $"https://oauth.yandex.ru/authorize?response_type=code&client_id={clientId}&redirect_uri={redirectUri}&scope=login:email";
            return Redirect(url);
        }

        [HttpGet("yandex/callback")]
        public async Task<IActionResult> YandexCallback(string code)
        {
            var token = await _oauthService.LoginWithYandexAsync(code);

            if (token == null)
                return Redirect($"{_configuration["FrontendUrl"]}/login?error=oauth_failed");

            return Redirect($"{_configuration["FrontendUrl"]}/oauth-callback?token={token.Token}&refreshToken={token.RefreshToken}");
        }
    }
}