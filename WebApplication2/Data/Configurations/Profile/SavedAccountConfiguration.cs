using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApplication2.Models.Profile;

namespace WebApplication2.Data.Configurations
{
    public class SavedAccountConfiguration : IEntityTypeConfiguration<SavedAccount>
    {
        public void Configure(EntityTypeBuilder<SavedAccount> builder)
        {
            builder.HasOne(sa => sa.Customer)
                .WithMany(c => c.SavedAccounts)
                .HasForeignKey(sa => sa.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(sa => sa.SavedCustomer)
                .WithMany(c => c.SavedByAccounts)
                .HasForeignKey(sa => sa.SavedCustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}