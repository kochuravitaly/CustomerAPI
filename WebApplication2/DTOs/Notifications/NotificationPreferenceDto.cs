namespace WebApplication2.DTOs.Notifications
{
    public class NotificationPreferenceDto
    {
        public bool PriceDrops { get; set; } = true;
        public bool BackInStock { get; set; } = true;
        public bool DealsAndCoupons { get; set; } = true;
        public bool Recommendations { get; set; } = false;
        public bool WatchListSales { get; set; } = true;
    }
}