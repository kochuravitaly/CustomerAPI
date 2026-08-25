using System.Text.Json.Serialization;

namespace WebApplication2.Models.Products
{
    public class ProductColor
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string HexCode { get; set; } = "#000000";

        [JsonIgnore]
        public Product? Product { get; set; }

        public ICollection<ProductImage> Images { get; set; } = [];
    }
}