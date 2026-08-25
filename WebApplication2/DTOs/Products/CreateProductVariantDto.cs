namespace WebApplication2.DTOs.Products
{
    public class CreateProductVariantDto
    {
        public int ColorId { get; set; }
        public int SizeId { get; set; }
        public int StockQuantity { get; set; }
        public string SKU { get; set; } = string.Empty;
        public decimal? Price { get; set; }
    }
}
