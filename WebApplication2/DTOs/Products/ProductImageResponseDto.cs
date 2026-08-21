namespace WebApplication2.DTOs.Products
{
    public class ProductImageResponseDto
    {
        public int Id { get; set; }

        public int ProductId { get; set; }

        public string FileName { get; set; } = string.Empty;

        public string ContentType { get; set; } = string.Empty;

        public long FileSize { get; set; }

        public int SortOrder { get; set; }

        public bool IsMain { get; set; }

        public string ObjectKey { get; set; } = string.Empty;
    }
}
