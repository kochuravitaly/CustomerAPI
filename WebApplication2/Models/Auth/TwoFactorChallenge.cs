namespace WebApplication2.Models.Auth
{
    public class TwoFactorChallenge
    {
        public int Id { get; set; }
        public Guid CustomerId { get; set; }
        public string ChallengeToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public int Attempts { get; set; }
        public bool IsUsed { get; set; }
        public Customer? Customer { get; set; }
    }
}