using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplication2.Models.Payments;

namespace WebApplication2.Data.Configurations.Payments
{
    public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
    {
        public void Configure(EntityTypeBuilder<Payment> builder)
        {
            builder.Property(p => p.Amount)
                .HasPrecision(18, 2);

            builder.Property(p => p.Status)
                .HasConversion<string>();

            builder.HasOne(p => p.Order)
                .WithOne(o => o.Payment)
                .HasForeignKey<Payment>(p => p.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(p => p.ProviderPaymentId)
                .IsUnique();

            builder.HasIndex(p => p.IdempotenceKey)
                .IsUnique();
        }
    }
}
