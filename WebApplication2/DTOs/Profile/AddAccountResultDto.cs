namespace WebApplication2.DTOs.Profile
{
    public class AddAccountResultDto
    {
        public string? Error { get; set; }
        public bool RequiresTwoFactor { get; set; }
        public Guid? CustomerId { get; set; }
        public string? TwoFactorMethod { get; set; }
    }
}