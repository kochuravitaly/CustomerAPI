using WebApplication2.Models.Profile;

namespace WebApplication2.Models.Auth
{
    public class RefreshToken
    {
        public int Id { get; set; }
        public string TokenHash { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public bool IsRevoked { get; set; }
        public Guid CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public int? SessionId { get; set; }
        public Session? Session { get; set; }
    }
}