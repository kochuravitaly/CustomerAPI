namespace WebApplication2.DTOs.Auth
{
    public class TokenResponseDto
    {
        public required string Token { get; set; }

        public required string RefreshToken { get; set; }
    }
}
