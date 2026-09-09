namespace WebApplication2.DTOs.Auth
{
    public class Verify2FADto
    {
        public string ChallengeToken { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }
}
