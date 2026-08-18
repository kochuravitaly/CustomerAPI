using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;

namespace WebApplication2.Services
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
        protected async override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = _scopeFactory.CreateScope();

                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                await DeleteRefreshTokensAsync(context, stoppingToken);
                await DeletePasswordResetTokensAsync(context, stoppingToken);
                await DeletePendingRegistrationsAsync(context, stoppingToken);

                await context.SaveChangesAsync(stoppingToken);

                await Task.Delay(
                    TimeSpan.FromSeconds(10),
                    stoppingToken);
            }
        }
    }
}
