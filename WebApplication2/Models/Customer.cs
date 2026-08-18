using System.Text.Json.Serialization;
using WebApplication2.Models;

namespace WebApplication2.Data
{
    public class Customer
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public Role? Role { get; set; }
        public string PasswordHash { get; set; } = string.Empty;
        public bool IsEmailConfirmed { get; set; } = false;

        [JsonIgnore]
        public ICollection<Order> Orders { get; set; } = [];
        [JsonIgnore]
        public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
        [JsonIgnore]
        public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = [];
    }
}
