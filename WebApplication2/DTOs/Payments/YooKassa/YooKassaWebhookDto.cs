namespace WebApplication2.DTOs.Payments.YooKassa
{
    public class YooKassaWebhookDto
    {
        public string Type { get; set; } = string.Empty;
        public string Event { get; set; } = string.Empty;
        public YooKassaWebhookObject? Object { get; set; }
    }

    public class YooKassaWebhookObject
    {
        public string Id { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}
