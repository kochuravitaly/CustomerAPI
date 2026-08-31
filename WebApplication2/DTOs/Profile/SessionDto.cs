namespace WebApplication2.DTOs.Profile
{
    public class SessionDto
    {
        public int Id { get; set; }
        public string DeviceInfo { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime LastActiveAt { get; set; }
        public bool IsCurrentSession { get; set; }
    }
}
