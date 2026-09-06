using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplication2.Models.Profile;

namespace WebApplication2.Data.Configurations.Profile
{
    public class WatchHistoryConfiguration : IEntityTypeConfiguration<WatchHistory>
    {
        public void Configure(EntityTypeBuilder<WatchHistory> builder)
        {
            builder.HasIndex(wh => new { wh.CustomerId, wh.ProductId });
        }
    }
}
