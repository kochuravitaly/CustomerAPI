using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplication2.Models.Products;

namespace WebApplication2.Data.Configurations.Products
{
    public class ProductOccasionConfiguration : IEntityTypeConfiguration<ProductOccasion>
    {
        public void Configure(EntityTypeBuilder<ProductOccasion> builder)
        {
            builder.HasIndex(o => o.Name).IsUnique();
        }
    }
}
