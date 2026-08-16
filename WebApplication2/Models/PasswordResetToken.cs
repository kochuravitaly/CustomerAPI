using WebApplication2.Data;

namespace WebApplication2.Models
{
    public class PasswordResetToken
    {
        public int Id { get; set; }
        public Guid CustomerId { get; set; }
        public string TokenHash { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public bool IsUsed { get; set; }
        public Customer? Customer { get; set; }
    }
}
