using WebApplication2.Models.Auth;

namespace WebApplication2.Models.Profile
{
    public class WatchHistory
    {
        public int Id { get; set; }
        public Guid CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public int ProductId { get; set; }
        public Products.Product? Product { get; set; }
        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
    }
}
