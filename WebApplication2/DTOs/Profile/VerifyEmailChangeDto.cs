namespace WebApplication2.DTOs.Profile
{
    public class VerifyEmailChangeDto
    {
        public string NewEmail { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }
}
