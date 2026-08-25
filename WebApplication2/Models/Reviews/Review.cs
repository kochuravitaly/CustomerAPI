using System.Text.Json.Serialization;
using WebApplication2.Models.Auth;
using WebApplication2.Models.Products;

namespace WebApplication2.Models.Reviews
{
    public class Review
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public Guid CustomerId { get; set; }
        public int Rating { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsVerifiedPurchase { get; set; }
        public int HelpfulCount { get; set; }
        public bool HasReported { get; set; }
        public bool HasMarkedHelpful { get; set; }

        [JsonIgnore]
        public Product? Product { get; set; }

        [JsonIgnore]
        public Customer? Customer { get; set; }

        public ICollection<ReviewMedia> Media { get; set; } = [];
    }
}