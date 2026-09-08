using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.Models.Orders;
using WebApplication2.Services.Auth.Interfaces;

namespace WebApplication2.Services.Auth.Services
{
    public class TokenCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<TokenCleanupService> _logger;

        public TokenCleanupService(IServiceScopeFactory scopeFactory, ILogger<TokenCleanupService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task DeleteRefreshTokensAsync(AppDbContext context, CancellationToken stoppingToken)
        {
            var revokedOrExpiredTokens =
                await context.RefreshTokens
                    .Where(rt =>
                        rt.IsRevoked ||
                        rt.ExpiresAt < DateTime.UtcNow)
                    .ToListAsync(stoppingToken);

            if (revokedOrExpiredTokens.Any())
            {
                context.RefreshTokens.RemoveRange(revokedOrExpiredTokens);

                _logger.LogInformation(
                    "Deleted {Count} refresh tokens.",
                    revokedOrExpiredTokens.Count);
            }
        }
        public async Task DeletePasswordResetTokensAsync(AppDbContext context, CancellationToken stoppingToken)
        {
            var usedOrExpiredTokens =
                await context.PasswordResetTokens
                    .Where(prt =>
                        prt.IsUsed ||
                        prt.ExpiresAt < DateTime.UtcNow)
                    .ToListAsync(stoppingToken);

            if (usedOrExpiredTokens.Any())
            {
                context.PasswordResetTokens.RemoveRange(usedOrExpiredTokens);

                _logger.LogInformation(
                    "Deleted {Count} password reset tokens.",
                    usedOrExpiredTokens.Count);
            }
        }

        public async Task DeletePendingRegistrationsAsync(AppDbContext context, CancellationToken stoppingToken)
        {
            var expiredRegistrations =
                await context.PendingRegistrations
                    .Where(pr =>
                        pr.ExpiresAt < DateTime.UtcNow)
                    .ToListAsync(stoppingToken);

            if (expiredRegistrations.Any())
            {
                context.PendingRegistrations.RemoveRange(expiredRegistrations);

                _logger.LogInformation(
                    "Deleted {Count} expired pending registrations.",
                    expiredRegistrations.Count);
            }
        }
        public async Task DeleteExpiredFlashSalesAsync(AppDbContext context, CancellationToken stoppingToken)
        {
            var expiredFlashSales =
                await context.FlashSales
                    .Where(f => f.EndsAt <= DateTime.UtcNow)
                    .ToListAsync(stoppingToken);

            if (expiredFlashSales.Any())
            {
                context.FlashSales.RemoveRange(expiredFlashSales);

                _logger.LogInformation(
                    "Deleted {Count} expired flash sales.",
                    expiredFlashSales.Count);
            }
        }

        public async Task DeleteExpiredCouponsAsync(AppDbContext context, CancellationToken stoppingToken)
        {
            var usedOrExpiredCoupons =
                           await context.Coupons
                               .Where(c =>
                                   (c.ExpiryDate.HasValue && c.ExpiryDate <= DateTime.UtcNow) ||
                                   (c.UsageLimit.HasValue && c.TimesUsed >= c.UsageLimit.Value))
                               .ToListAsync(stoppingToken);

            if (usedOrExpiredCoupons.Any())
            {
                context.Coupons.RemoveRange(usedOrExpiredCoupons);

                _logger.LogInformation(
                       "Deleted {Count} expired or used coupons.",
                       usedOrExpiredCoupons.Count);
            }
        }

        public async Task CancelExpiredOrdersAsync(AppDbContext context, CancellationToken stoppingToken)
        {
            var expiredOrders =
                await context.Orders
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.Product)
                    .Where(o =>
                        o.Status == OrderStatus.Pending &&
                        o.CreatedAt < DateTime.UtcNow.AddMinutes(-30))
                    .ToListAsync(stoppingToken);

            if (expiredOrders.Any())
            {
                foreach (var order in expiredOrders)
                {
                    order.Status = OrderStatus.Canceled;

                    foreach (var item in order.OrderItems)
                    {
                        if (item.Product != null)
                        {
                            item.Product.StockQuantity += item.Quantity;
                        }
                    }
                }

                _logger.LogInformation(
                    "Canceled {Count} expired pending orders.",
                    expiredOrders.Count);
            }
        }

        public async Task CheckPriceAlertsAsync(AppDbContext context, CancellationToken stoppingToken)
        {
            var alerts = await context.PriceAlerts
                .Include(pa => pa.Customer)
                .Include(pa => pa.Product)
                .Where(pa => pa.IsActive && pa.NotifiedAt == null && pa.Product.Price <= pa.TargetPrice)
                .ToListAsync(stoppingToken);

            if (alerts.Any())
            {
                var emailService = _scopeFactory.CreateScope().ServiceProvider.GetRequiredService<IEmailService>();

                foreach (var alert in alerts)
                {
                    await emailService.SendPriceDropNotificationAsync(
                        alert.Customer.Email,
                        alert.Product.Name,
                        alert.Product.Price.ToString("F2"),
                        "en");

                    alert.NotifiedAt = DateTime.UtcNow;
                    alert.IsActive = false;
                }

                _logger.LogInformation("Sent {Count} price drop notifications.", alerts.Count);
            }
        }

        public async Task CheckStockAlertsAsync(AppDbContext context, CancellationToken stoppingToken)
        {
            var alerts = await context.StockAlerts
                .Include(sa => sa.Customer)
                .Include(sa => sa.Product)
                .Where(sa => sa.IsActive && sa.NotifiedAt == null && sa.Product.StockQuantity > 0)
                .ToListAsync(stoppingToken);

            if (alerts.Any())
            {
                var emailService = _scopeFactory.CreateScope().ServiceProvider.GetRequiredService<IEmailService>();

                foreach (var alert in alerts)
                {
                    await emailService.SendBackInStockNotificationAsync(
                        alert.Customer.Email,
                        alert.Product.Name,
                        "en");

                    alert.NotifiedAt = DateTime.UtcNow;
                    alert.IsActive = false;
                }

                _logger.LogInformation("Sent {Count} back in stock notifications.", alerts.Count);
            }
        }

        protected async override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = _scopeFactory.CreateScope();

                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                await DeleteRefreshTokensAsync(context, stoppingToken);
                await DeletePasswordResetTokensAsync(context, stoppingToken);
                await DeletePendingRegistrationsAsync(context, stoppingToken);
                await DeleteExpiredFlashSalesAsync(context, stoppingToken);
                await DeleteExpiredCouponsAsync(context, stoppingToken);
                await CancelExpiredOrdersAsync(context, stoppingToken);
                await CheckPriceAlertsAsync(context, stoppingToken);
                await CheckStockAlertsAsync(context, stoppingToken);

                await context.SaveChangesAsync(stoppingToken);

                await Task.Delay(
                    TimeSpan.FromMinutes(5),
                    stoppingToken);
            }
        }
    }
}