using System.Text.Json.Serialization;
using WebApplication2.Models.Products;

namespace WebApplication2.Models.Orders
{
    public class FlashSale
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public decimal DiscountPercentage { get; set; }
        public DateTime StartsAt { get; set; }
        public DateTime EndsAt { get; set; }
        public bool IsActive { get; set; } = true;

        [JsonIgnore]
        public Product? Product { get; set; }
    }
}
