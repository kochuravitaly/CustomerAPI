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
        public IActionResult LoginWithYandex(bool rememberMe = false)
        {
            var clientId = _configuration["Yandex:ClientId"];
            var redirectUri = _configuration["Yandex:RedirectUri"];
            var state = rememberMe ? "remember=true" : "remember=false";
            var url = $"https://oauth.yandex.ru/authorize?response_type=code&client_id={clientId}&redirect_uri={redirectUri}&scope=login:email&state={state}";
            return Redirect(url);
        }

        [HttpGet("yandex/callback")]
        public async Task<IActionResult> YandexCallback(string code, string state)
        {
            var rememberMe = state?.Contains("remember=true") == true;
            var token = await _oauthService.LoginWithYandexAsync(code, rememberMe);

            if (token == null)
                return Redirect($"{_configuration["FrontendUrl"]}/login?error=oauth_failed");

            return Redirect($"{_configuration["FrontendUrl"]}/oauth-callback?token={token.Token}&refreshToken={token.RefreshToken}");
        }
    }
}