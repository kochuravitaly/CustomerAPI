namespace WebApplication2.Models.Profile
{
    public class TwoFactorAuth
    {
        public int Id { get; set; }
        public Guid CustomerId { get; set; }
        public Auth.Customer? Customer { get; set; }
        public string SecretKey { get; set; } = string.Empty;
        public bool IsEnabled { get; set; } = false;
        public bool IsEmailEnabled { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}