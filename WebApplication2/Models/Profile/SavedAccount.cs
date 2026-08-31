using WebApplication2.Models.Auth;

namespace WebApplication2.Models.Profile
{
    public class SavedAccount
    {
        public int Id { get; set; }
        public Guid CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public Guid SavedCustomerId { get; set; }
        public Customer? SavedCustomer { get; set; }
        public DateTime LastUsedAt { get; set; } = DateTime.UtcNow;
    }
}