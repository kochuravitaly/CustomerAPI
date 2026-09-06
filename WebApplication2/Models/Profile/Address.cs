using WebApplication2.Models.Auth;

namespace WebApplication2.Models.Profile
{
    public class Address
    {
        public int Id { get; set; }
        public Guid CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string? Apartment { get; set; }
        public string City { get; set; } = string.Empty;
        public string Region { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public bool IsDefault { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}