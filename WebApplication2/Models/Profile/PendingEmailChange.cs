using WebApplication2.Models.Auth;

namespace WebApplication2.Models.Profile
{
    public class PendingEmailChange
    {
        public int Id { get; set; }
        public Guid CustomerId { get; set; }
        public string NewEmail { get; set; } = string.Empty;
        public string CodeHash { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public Customer? Customer { get; set; }
    }
}
