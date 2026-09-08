using WebApplication2.DTOs.Notifications;
using WebApplication2.Models.Profile;

namespace WebApplication2.Services.Notifications
{
    public interface INotificationService
    {
        Task<NotificationPreferenceDto> GetPreferencesAsync(Guid customerId);
        Task<bool> UpdatePreferencesAsync(Guid customerId, NotificationPreferenceDto dto);
        Task<bool> AddPriceAlertAsync(Guid customerId, int productId, decimal? targetPrice = null);
        Task<bool> RemovePriceAlertAsync(Guid customerId, int productId);
        Task<bool> AddStockAlertAsync(Guid customerId, int productId);
        Task<bool> RemoveStockAlertAsync(Guid customerId, int productId);
        Task CheckPriceAlertsAsync();
        Task CheckStockAlertsAsync();
        Task CheckWatchListSalesAsync();
        Task CheckFlashSalesAsync();
    }
}