namespace WebApplication2.DTOs.Payments.YooKassa
{
    public class YooKassaWebhookDto
    {
        public string Type { get; set; } = string.Empty;
        public string Event { get; set; } = string.Empty;
        public YooKassaWebhookObjectDto? Object { get; set; }
    }
}
