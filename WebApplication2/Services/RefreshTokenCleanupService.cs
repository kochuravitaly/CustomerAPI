using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;

namespace WebApplication2.Services
{
    public class RefreshTokenCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<RefreshTokenCleanupService> _logger;

        public RefreshTokenCleanupService(IServiceScopeFactory scopeFactory, ILogger<RefreshTokenCleanupService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task DeleteRefreshTokensAsync(CancellationToken stoppingToken)
        {
            using var scope = _scopeFactory.CreateScope();

            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var revokedOrExpiredTokens =
                await context.RefreshTokens
                    .Where(rt =>
                        rt.IsRevoked ||
                        rt.ExpiresAt < DateTime.UtcNow)
                    .ToListAsync(stoppingToken);

            if (revokedOrExpiredTokens.Any())
            {
                context.RefreshTokens.RemoveRange(revokedOrExpiredTokens);

                await context.SaveChangesAsync(stoppingToken);

                _logger.LogInformation("Deleted {Count} refresh tokens.", revokedOrExpiredTokens.Count);
            }
        }

        protected async override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                await DeleteRefreshTokensAsync(stoppingToken);

                await Task.Delay(
                    TimeSpan.FromSeconds(10),
                    stoppingToken);
            }
        }
    }
}
