namespace WebApplication2.DTOs.Profile
{
    public class ProfileAccountDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool HasProfilePicture { get; set; }
    }
}