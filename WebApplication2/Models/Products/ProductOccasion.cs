using System.Text.Json.Serialization;

namespace WebApplication2.Models.Products
{
    public class ProductOccasion
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        [JsonIgnore]
        public ICollection<Product> Products { get; set; } = [];
    }
}
