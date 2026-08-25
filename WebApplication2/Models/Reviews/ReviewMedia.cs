namespace WebApplication2.Models.Reviews
{
    public class ReviewMedia
    {
        public int Id { get; set; }
        public int ReviewId { get; set; }
        public string ObjectKey { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public string MediaType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public Review? Review { get; set; }
    }
}
