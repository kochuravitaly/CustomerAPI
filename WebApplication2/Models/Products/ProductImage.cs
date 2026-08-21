namespace WebApplication2.Models.Products
{
    public class ProductImage
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public Product? Product { get; set; }
        public string ObjectKey { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public int SortOrder { get; set; }
        public bool IsMain { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
