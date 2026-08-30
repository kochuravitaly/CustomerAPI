using System.Text.Json.Serialization;
using WebApplication2.Models.Orders;
using WebApplication2.Models.ShoppingCart;
using WebApplication2.Models.Translations;

namespace WebApplication2.Models.Products
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int CategoryId { get; set; }
        public Category? Category { get; set; }

        public ProductGender? Gender { get; set; }
        public ProductSeason? Season { get; set; }
        public ProductAgeGroup? AgeGroup { get; set; }

        public string SeasonsJson { get; set; } = "[]";
        public string AgeGroupsJson { get; set; } = "[]";
        public string MaterialCompositionJson { get; set; } = "[]";

        public int? MaterialId { get; set; }
        public ProductMaterial? Material { get; set; }

        public int? StyleId { get; set; }
        public ProductStyle? Style { get; set; }

        public int? OccasionId { get; set; }
        public ProductOccasion? Occasion { get; set; }

        public int? PatternId { get; set; }
        public ProductPattern? Pattern { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        [JsonIgnore]
        public ICollection<Order> Orders { get; set; } = [];
        public ICollection<CartItem> CartItems { get; set; } = [];
        public ICollection<OrderItem> OrderItems { get; set; } = [];
        public ICollection<ProductImage> ProductImages { get; set; } = [];
        public ICollection<ProductTranslation> Translations { get; set; } = [];
        public ICollection<ProductColor> ProductColors { get; set; } = [];
        public ICollection<ProductSize> ProductSizes { get; set; } = [];
    }
}