namespace WebApplication2.DTOs.Reviews
{
    public class ReviewResponseDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsVerifiedPurchase { get; set; }
        public bool IsAdmin { get; set; }
        public int HelpfulCount { get; set; }
        public List<ReviewMediaDto> Media { get; set; } = [];
    }
}