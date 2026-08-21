using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplication2.Models.Products;

namespace WebApplication2.Data.Configurations
{
    public class ProductImageConfiguration: IEntityTypeConfiguration<ProductImage>
    {
        public void Configure(EntityTypeBuilder<ProductImage> builder)
        {
            builder.HasIndex(i => i.ProductId)
                .IsUnique()
                .HasFilter("\"IsMain\" = true");

            builder.HasIndex(i => new
            {
                i.ProductId,
                i.SortOrder
            });
        }
    }
}