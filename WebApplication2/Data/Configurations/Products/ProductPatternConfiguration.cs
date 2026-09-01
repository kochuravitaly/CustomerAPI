using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplication2.Models.Products;

namespace WebApplication2.Data.Configurations.Products
{
    public class ProductPatternConfiguration : IEntityTypeConfiguration<ProductPattern>
    {
        public void Configure(EntityTypeBuilder<ProductPattern> builder)
        {
            builder.HasIndex(p => p.Name).IsUnique();
        }
    }
}
