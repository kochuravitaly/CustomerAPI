namespace WebApplication2.DTOs.Reviews
{
    public class ReviewMediaDto
    {
        public int Id { get; set; }
        public string ObjectKey { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public string MediaType { get; set; } = string.Empty;
        public long FileSize { get; set; }
    }
}
