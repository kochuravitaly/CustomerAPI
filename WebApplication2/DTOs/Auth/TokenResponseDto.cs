namespace WebApplication2.DTOs.Auth
{
    public class TokenResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public bool RequiresTwoFactor { get; set; }
        public Guid CustomerId { get; set; }
        public string? TwoFactorMethod { get; set; }
        public string? TwoFactorChallengeToken { get; set; }
    }
}