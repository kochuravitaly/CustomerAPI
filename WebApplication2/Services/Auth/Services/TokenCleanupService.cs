using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;

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

                await context.SaveChangesAsync(stoppingToken);

                await Task.Delay(
                    TimeSpan.FromHours(1),
                    stoppingToken);
            }
        }
    }
}
