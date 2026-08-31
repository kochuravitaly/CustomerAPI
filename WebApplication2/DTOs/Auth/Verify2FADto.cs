namespace WebApplication2.DTOs.Auth
{
    public class Verify2FADto
    {
        public Guid CustomerId { get; set; }
        public string Code { get; set; } = string.Empty;
    }
}
