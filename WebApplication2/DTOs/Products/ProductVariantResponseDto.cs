namespace WebApplication2.DTOs.Products
{
    public class ProductVariantResponseDto
    {
        public int Id { get; set; }
        public int ColorId { get; set; }
        public string ColorName { get; set; } = string.Empty;
        public string HexCode { get; set; } = "#000000";
        public int SizeId { get; set; }
        public string SizeName { get; set; } = string.Empty;
        public int StockQuantity { get; set; }
        public string SKU { get; set; } = string.Empty;
        public decimal? Price { get; set; }
    }
}
