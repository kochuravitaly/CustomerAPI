using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Notifications;
using WebApplication2.Models.Profile;
using WebApplication2.Services.Auth.Interfaces;

namespace WebApplication2.Services.Notifications
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public NotificationService(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public async Task<NotificationPreferenceDto> GetPreferencesAsync(Guid customerId)
        {
            var prefs = await _context.NotificationPreferences
                .FirstOrDefaultAsync(p => p.CustomerId == customerId);

            if (prefs == null)
            {
                prefs = new NotificationPreference { CustomerId = customerId };
                _context.NotificationPreferences.Add(prefs);
                await _context.SaveChangesAsync();
            }

            return new NotificationPreferenceDto
            {
                PriceDrops = prefs.PriceDrops,
                BackInStock = prefs.BackInStock,
                DealsAndCoupons = prefs.DealsAndCoupons,
                Recommendations = prefs.Recommendations,
                WatchListSales = prefs.WatchListSales
            };
        }

        public async Task<bool> UpdatePreferencesAsync(Guid customerId, NotificationPreferenceDto dto)
        {
            var prefs = await _context.NotificationPreferences
                .FirstOrDefaultAsync(p => p.CustomerId == customerId);

            if (prefs == null)
            {
                prefs = new NotificationPreference { CustomerId = customerId };
                _context.NotificationPreferences.Add(prefs);
            }

            prefs.PriceDrops = dto.PriceDrops;
            prefs.BackInStock = dto.BackInStock;
            prefs.DealsAndCoupons = dto.DealsAndCoupons;
            prefs.Recommendations = dto.Recommendations;
            prefs.WatchListSales = dto.WatchListSales;
            prefs.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AddPriceAlertAsync(Guid customerId, int productId, decimal? targetPrice = null)
        {
            var existing = await _context.PriceAlerts
                .FirstOrDefaultAsync(pa => pa.CustomerId == customerId && pa.ProductId == productId && pa.IsActive);

            if (existing != null) return true;

            var product = await _context.Products.FindAsync(productId);
            if (product == null) return false;

            _context.PriceAlerts.Add(new PriceAlert
            {
                CustomerId = customerId,
                ProductId = productId,
                TargetPrice = targetPrice ?? product.Price,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemovePriceAlertAsync(Guid customerId, int productId)
        {
            var alert = await _context.PriceAlerts
                .FirstOrDefaultAsync(pa => pa.CustomerId == customerId && pa.ProductId == productId && pa.IsActive);

            if (alert == null) return false;

            alert.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AddStockAlertAsync(Guid customerId, int productId)
        {
            var existing = await _context.StockAlerts
                .FirstOrDefaultAsync(sa => sa.CustomerId == customerId && sa.ProductId == productId && sa.IsActive);

            if (existing != null) return true;

            _context.StockAlerts.Add(new StockAlert
            {
                CustomerId = customerId,
                ProductId = productId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveStockAlertAsync(Guid customerId, int productId)
        {
            var alert = await _context.StockAlerts
                .FirstOrDefaultAsync(sa => sa.CustomerId == customerId && sa.ProductId == productId && sa.IsActive);

            if (alert == null) return false;

            alert.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task CheckPriceAlertsAsync()
        {
            var alerts = await _context.PriceAlerts
                .Include(pa => pa.Customer)
                .Include(pa => pa.Product)
                .Where(pa => pa.IsActive && pa.NotifiedAt == null)
                .ToListAsync();

            foreach (var alert in alerts)
            {
                if (alert.Product.Price <= alert.TargetPrice)
                {
                    await _emailService.SendPriceDropNotificationAsync(
                        alert.Customer.Email,
                        alert.Product.Name,
                        alert.Product.Price.ToString("F2"),
                        "en");

                    alert.NotifiedAt = DateTime.UtcNow;
                    alert.IsActive = false;
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task CheckStockAlertsAsync()
        {
            var alerts = await _context.StockAlerts
                .Include(sa => sa.Customer)
                .Include(sa => sa.Product)
                .Where(sa => sa.IsActive && sa.Product.StockQuantity > 0 && sa.NotifiedAt == null)
                .ToListAsync();

            foreach (var alert in alerts)
            {
                await _emailService.SendBackInStockNotificationAsync(
                    alert.Customer.Email,
                    alert.Product.Name,
                    "en");

                alert.NotifiedAt = DateTime.UtcNow;
                alert.IsActive = false;
            }

            await _context.SaveChangesAsync();
        }

        public async Task CheckWatchListSalesAsync()
        {
            var customers = await _context.Customers
                .Where(c => c.NotificationPreference != null && c.NotificationPreference.WatchListSales)
                .ToListAsync();

            foreach (var customer in customers)
            {
                var watchHistory = await _context.WatchHistory
                    .Include(wh => wh.Product)
                    .Where(wh => wh.CustomerId == customer.Id)
                    .OrderByDescending(wh => wh.ViewedAt)
                    .Take(10)
                    .ToListAsync();

                foreach (var watch in watchHistory)
                {
                    if (watch.Product.Price < watch.Product.Price)
                    {
                        await _emailService.SendWatchListSaleNotificationAsync(
                            customer.Email,
                            watch.Product.Name,
                            watch.Product.Price.ToString("F2"),
                            "en");
                    }
                }
            }
        }

        public async Task CheckFlashSalesAsync()
        {
            var customers = await _context.Customers
                .Where(c => c.NotificationPreference != null && c.NotificationPreference.DealsAndCoupons)
                .ToListAsync();

            var activeFlashSales = await _context.FlashSales
                .Where(f => f.IsActive && f.StartsAt <= DateTime.UtcNow && f.EndsAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var customer in customers)
            {
                foreach (var flashSale in activeFlashSales)
                {
                    await _emailService.SendFlashSaleNotificationAsync(
                        customer.Email,
                        $"-{flashSale.DiscountPercentage}%",
                        "en");
                }
            }
        }
    }
}