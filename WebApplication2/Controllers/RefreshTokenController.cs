using Microsoft.AspNetCore.Mvc;
using WebApplication2.DTOs;
using WebApplication2.Services;

namespace WebApplication2.Controllers
{        
    [ApiController]
    [Route("api/[controller]")]
    public class RefreshTokenController : ControllerBase
    {
        private readonly IRefreshTokenService _refreshTokenService;

        public RefreshTokenController(IRefreshTokenService refreshTokenService)
        {
            _refreshTokenService = refreshTokenService;
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<TokenResponseDto>> Refresh(string refreshToken)
        {
            var response = await _refreshTokenService.RefreshTokenAsync(refreshToken);

            if (response == null)
                return Unauthorized();

            return Ok(response);
        }
    }
}
