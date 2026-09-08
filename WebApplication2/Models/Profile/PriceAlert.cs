using WebApplication2.Models.Auth;
using WebApplication2.Models.Products;

namespace WebApplication2.Models.Profile
{
    public class PriceAlert
    {
        public int Id { get; set; }
        public Guid CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public int ProductId { get; set; }
        public Product? Product { get; set; }
        public decimal TargetPrice { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? NotifiedAt { get; set; }
    }
}