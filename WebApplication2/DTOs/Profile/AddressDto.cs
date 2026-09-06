namespace WebApplication2.DTOs.Profile
{
    public class AddressDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string? Apartment { get; set; }
        public string City { get; set; } = string.Empty;
        public string Region { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
    }
}