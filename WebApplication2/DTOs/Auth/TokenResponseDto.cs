namespace WebApplication2.DTOs.Auth
{
    public class TokenResponseDto
    {
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
        public bool RequiresTwoFactor { get; set; }
        public Guid? CustomerId { get; set; }
        public string? TwoFactorMethod { get; set; }
    }
}