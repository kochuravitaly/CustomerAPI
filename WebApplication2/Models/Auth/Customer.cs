using System.Text.Json.Serialization;
using WebApplication2.Models.Orders;
using WebApplication2.Models.Profile;
using WebApplication2.Models.ShoppingCart;

namespace WebApplication2.Models.Auth
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
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Cart? Cart { get; set; }
        public string? ProfilePictureObjectKey { get; set; }
        public string? PhoneNumber { get; set; }

        [JsonIgnore]
        public ICollection<Order> Orders { get; set; } = [];
        [JsonIgnore]
        public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
        [JsonIgnore]
        public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = [];
        [JsonIgnore]
        public ICollection<SavedAccount> SavedAccounts { get; set; } = [];
        [JsonIgnore]
        public ICollection<SavedAccount> SavedByAccounts { get; set; } = [];
        [JsonIgnore]
        public ICollection<TwoFactorAuth> TwoFactorAuths { get; set; } = [];
        [JsonIgnore]
        public ICollection<Session> Sessions { get; set; } = [];
        [JsonIgnore]
        public ICollection<WatchHistory> WatchHistory { get; set; } = [];
        [JsonIgnore]
        public ICollection<Address> Addresses { get; set; } = [];
    }
}
