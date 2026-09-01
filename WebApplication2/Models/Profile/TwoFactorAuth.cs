using WebApplication2.Models.Auth;

namespace WebApplication2.Models.Profile
{
    public class TwoFactorAuth
    {
        public int Id { get; set; }
        public Guid CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public string SecretKey { get; set; } = string.Empty;
        public bool IsEnabled { get; set; } = false;
        public bool IsEmailEnabled { get; set; } = false;
        public DateTime? LastCodeSentAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}