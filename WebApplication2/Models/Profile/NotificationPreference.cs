using WebApplication2.Models.Auth;

namespace WebApplication2.Models.Profile
{
    public class NotificationPreference
    {
        public int Id { get; set; }
        public Guid CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public bool PriceDrops { get; set; } = true;
        public bool BackInStock { get; set; } = true;
        public bool DealsAndCoupons { get; set; } = true;
        public bool Recommendations { get; set; } = false;
        public bool WatchListSales { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}