namespace WebApplication2.Models.Products
{
    public class ProductVariant
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int ColorId { get; set; }
        public int SizeId { get; set; }
        public int StockQuantity { get; set; }
        public string SKU { get; set; } = string.Empty;
        public decimal? Price { get; set; }
        public Product? Product { get; set; }
        public ProductColor? Color { get; set; }
        public ProductSize? Size { get; set; }
    }
}
