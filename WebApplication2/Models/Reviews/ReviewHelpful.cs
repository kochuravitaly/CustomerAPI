using System.Text.Json.Serialization;

namespace WebApplication2.Models.Reviews
{
    public class ReviewHelpful
    {
        public int Id { get; set; }
        public int ReviewId { get; set; }
        public Guid CustomerId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public Review? Review { get; set; }
    }
}