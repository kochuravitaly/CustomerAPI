namespace WebApplication2.Models.Products
{
    public class ProductSize
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int StockQuantity { get; set; }
        public string SKU { get; set; } = string.Empty;
        public decimal? Price { get; set; }
        public Product? Product { get; set; }
        public ICollection<ProductColor> Colors { get; set; } = [];
    }
}
