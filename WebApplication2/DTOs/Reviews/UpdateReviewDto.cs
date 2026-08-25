namespace WebApplication2.DTOs.Reviews
{
    public class UpdateReviewDto
    {
        public int Rating { get; set; }
        public string Text { get; set; } = string.Empty;
    }
}
