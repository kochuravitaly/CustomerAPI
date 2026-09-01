using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplication2.Models.Products;

namespace WebApplication2.Data.Configurations.Products
{
    public class ProductStyleConfiguration : IEntityTypeConfiguration<ProductStyle>
    {
        public void Configure(EntityTypeBuilder<ProductStyle> builder)
        {
            builder.HasIndex(s => s.Name).IsUnique();
        }
    }
}
