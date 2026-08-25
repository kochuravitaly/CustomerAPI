using Microsoft.EntityFrameworkCore;
using WebApplication2.Models.Auth;
using WebApplication2.Models.Home;
using WebApplication2.Models.Orders;
using WebApplication2.Models.Payments;
using WebApplication2.Models.Products;
using WebApplication2.Models.Profile;
using WebApplication2.Models.Reviews;
using WebApplication2.Models.ShoppingCart;

namespace WebApplication2.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) 
        {

        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(
                typeof(AppDbContext).Assembly);
        }

        public DbSet<Customer> Customers { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<PendingRegistration> PendingRegistrations { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<PendingEmailChange> PendingEmailChanges { get; set; }
        public DbSet<ProductTranslation> ProductTranslations { get; set; }
        public DbSet<CategoryTranslation> CategoryTranslations { get; set; }
        public DbSet<ProductColor> ProductColors { get; set; }
        public DbSet<ProductSize> ProductSizes { get; set; }
        public DbSet<ProductVariant> ProductVariants { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<ReviewMedia> ReviewMedia { get; set; }
        public DbSet<ReviewHelpful> ReviewHelpfuls { get; set; }
        public DbSet<ReviewReport> ReviewReports { get; set; }
        public DbSet<ProductMaterial> ProductMaterials { get; set; }
        public DbSet<ProductStyle> ProductStyles { get; set; }
        public DbSet<ProductOccasion> ProductOccasions { get; set; }
        public DbSet<ProductPattern> ProductPatterns { get; set; }
        public DbSet<FlashSale> FlashSales { get; set; }
        public DbSet<Coupon> Coupons { get; set; }
        public DbSet<HomeSection> HomeSections { get; set; }
    }
}
