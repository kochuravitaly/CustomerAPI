using System.Text.Json.Serialization;
using WebApplication2.Models.Auth;
using WebApplication2.Models.Products;

namespace WebApplication2.Models.Wishlist
{
    public class WishlistItem
    {
        public int Id { get; set; }
        public Guid CustomerId { get; set; }
        public int ProductId { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public Customer? Customer { get; set; }

        [JsonIgnore]
        public Product? Product { get; set; }
    }
}