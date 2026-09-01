using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using WebApplication2.Data;
using WebApplication2.DTOs.Reviews;
using WebApplication2.Models.Auth;
using WebApplication2.Models.Orders;
using WebApplication2.Models.Products;
using WebApplication2.Models.Reviews;
using WebApplication2.Services.Auth.Interfaces;
using WebApplication2.Services.FileStorage.Interfaces;
using WebApplication2.Services.Reviews;

namespace WebApplication2.Tests.Services.Reviews
{
    public class ReviewServiceTests
    {
        private readonly Mock<IFileStorageService> _fileStorageMock;
        private readonly Mock<IImageFileValidator> _imageValidatorMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly AppDbContext _context;
        private readonly ReviewService _reviewService;

        public ReviewServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _fileStorageMock = new Mock<IFileStorageService>();
            _imageValidatorMock = new Mock<IImageFileValidator>();
            _emailServiceMock = new Mock<IEmailService>();

            _reviewService = new ReviewService(
                _context,
                _fileStorageMock.Object,
                _imageValidatorMock.Object,
                _emailServiceMock.Object);

            _context.Roles.Add(new Role { Id = 1, Name = "Customer" });
            _context.Roles.Add(new Role { Id = 2, Name = "Admin" });
            _context.Categories.Add(new Category { Name = "Test Category", Description = "" });
            _context.SaveChanges();
        }

        private async Task<Customer> CreateCustomerAsync(
            string email = "test@test.com",
            string name = "Test User",
            int roleId = 1)
        {
            var customer = new Customer
            {
                Id = Guid.NewGuid(),
                Name = name,
                Email = email,
                PasswordHash = "hashed-password",
                IsEmailConfirmed = true,
                RoleId = roleId
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            return customer;
        }

        private async Task<Product> CreateProductAsync(string name = "Test Product")
        {
            var product = new Product
            {
                Name = name,
                Description = "",
                Price = 100,
                StockQuantity = 10,
                CategoryId = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        private async Task<Review> CreateReviewAsync(
            int productId,
            Guid customerId,
            int rating = 5,
            string text = "Great product")
        {
            var review = new Review
            {
                ProductId = productId,
                CustomerId = customerId,
                Rating = rating,
                Text = text,
                IsVerifiedPurchase = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();
            return review;
        }

        [Fact]
        public async Task CreateReviewAsync_Should_Return_Null_When_Product_Not_Found()
        {
            var customer = await CreateCustomerAsync();

            var result = await _reviewService.CreateReviewAsync(
                customer.Id,
                new CreateReviewDto
                {
                    ProductId = 999,
                    Rating = 5,
                    Text = "Test"
                });

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateReviewAsync_Should_Return_Null_When_Customer_Not_Found()
        {
            var product = await CreateProductAsync();

            var result = await _reviewService.CreateReviewAsync(
                Guid.NewGuid(),
                new CreateReviewDto
                {
                    ProductId = product.Id,
                    Rating = 5,
                    Text = "Test"
                });

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateReviewAsync_Should_Return_Null_When_Existing_Review_And_Not_Admin()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();
            await CreateReviewAsync(product.Id, customer.Id);

            var result = await _reviewService.CreateReviewAsync(
                customer.Id,
                new CreateReviewDto
                {
                    ProductId = product.Id,
                    Rating = 5,
                    Text = "Another review"
                });

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateReviewAsync_Should_Return_Null_When_Not_Purchased_And_Not_Admin()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();

            var result = await _reviewService.CreateReviewAsync(
                customer.Id,
                new CreateReviewDto
                {
                    ProductId = product.Id,
                    Rating = 5,
                    Text = "Test"
                });

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateReviewAsync_Should_Create_Review_When_Purchased()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();

            _context.Orders.Add(new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = customer.Id,
                Status = OrderStatus.Delivered,
                TotalAmount = 100,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            _context.OrderItems.Add(new OrderItem
            {
                OrderId = _context.Orders.First().Id,
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = 1,
                Total = product.Price
            });
            await _context.SaveChangesAsync();

            var result = await _reviewService.CreateReviewAsync(
                customer.Id,
                new CreateReviewDto
                {
                    ProductId = product.Id,
                    Rating = 5,
                    Text = "Great!"
                });

            Assert.NotNull(result);
            Assert.Equal(5, result.Rating);
            Assert.Equal("Great!", result.Text);
            Assert.True(result.IsVerifiedPurchase);
        }

        [Fact]
        public async Task CreateReviewAsync_Should_Create_Review_When_Admin()
        {
            var admin = await CreateCustomerAsync("admin@test.com", "Admin", 2);
            var product = await CreateProductAsync();

            var result = await _reviewService.CreateReviewAsync(
                admin.Id,
                new CreateReviewDto
                {
                    ProductId = product.Id,
                    Rating = 4,
                    Text = "Admin review"
                });

            Assert.NotNull(result);
            Assert.True(result.IsAdmin);
        }

        [Fact]
        public async Task GetProductReviewsAsync_Should_Return_All_Reviews()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();
            await CreateReviewAsync(product.Id, customer.Id, 5, "Review 1");
            await CreateReviewAsync(product.Id, customer.Id, 4, "Review 2");

            var result = await _reviewService.GetProductReviewsAsync(product.Id);

            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task GetProductReviewsAsync_Should_Filter_By_Rating()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();
            await CreateReviewAsync(product.Id, customer.Id, 5, "Five stars");
            await CreateReviewAsync(product.Id, customer.Id, 3, "Three stars");

            var result = await _reviewService.GetProductReviewsAsync(product.Id, 5);

            Assert.Single(result);
            Assert.Equal(5, result.First().Rating);
        }

        [Fact]
        public async Task GetMyReviewsAsync_Should_Return_Customer_Reviews()
        {
            var customer1 = await CreateCustomerAsync("user1@test.com");
            var customer2 = await CreateCustomerAsync("user2@test.com");
            var product = await CreateProductAsync();

            await CreateReviewAsync(product.Id, customer1.Id, 5, "User 1 review");
            await CreateReviewAsync(product.Id, customer2.Id, 3, "User 2 review");

            var result = await _reviewService.GetMyReviewsAsync(customer1.Id);

            Assert.Single(result);
            Assert.Equal("User 1 review", result.First().Text);
        }

        [Fact]
        public async Task GetProductReviewSummaryAsync_Should_Return_Empty_When_No_Reviews()
        {
            var product = await CreateProductAsync();

            var result = await _reviewService.GetProductReviewSummaryAsync(product.Id);

            Assert.Equal(0, result.AverageRating);
            Assert.Equal(0, result.TotalReviews);
        }

        [Fact]
        public async Task GetProductReviewSummaryAsync_Should_Calculate_Average_And_Distribution()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();

            await CreateReviewAsync(product.Id, customer.Id, 5, "Five");
            await CreateReviewAsync(product.Id, customer.Id, 4, "Four");
            await CreateReviewAsync(product.Id, customer.Id, 3, "Three");

            var result = await _reviewService.GetProductReviewSummaryAsync(product.Id);

            Assert.Equal(3, result.TotalReviews);
            Assert.Equal(4, result.AverageRating);
            Assert.Equal(1, result.RatingDistribution[5]);
            Assert.Equal(1, result.RatingDistribution[4]);
            Assert.Equal(1, result.RatingDistribution[3]);
        }

        [Fact]
        public async Task GetReviewByIdAsync_Should_Return_Review_When_Found()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();
            var review = await CreateReviewAsync(product.Id, customer.Id);

            var result = await _reviewService.GetReviewByIdAsync(review.Id);

            Assert.NotNull(result);
            Assert.Equal(review.Id, result.Id);
        }

        [Fact]
        public async Task GetReviewByIdAsync_Should_Return_Null_When_Not_Found()
        {
            var result = await _reviewService.GetReviewByIdAsync(999);

            Assert.Null(result);
        }

        [Fact]
        public async Task CanReviewAsync_Should_Return_True_When_Admin()
        {
            var admin = await CreateCustomerAsync("admin@test.com", "Admin", 2);

            var result = await _reviewService.CanReviewAsync(admin.Id, 1);

            Assert.True(result);
        }

        [Fact]
        public async Task CanReviewAsync_Should_Return_False_When_Not_Purchased()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();

            var result = await _reviewService.CanReviewAsync(customer.Id, product.Id);

            Assert.False(result);
        }

        [Fact]
        public async Task CanReviewAsync_Should_Return_True_When_Purchased_And_Delivered()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();

            _context.Orders.Add(new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = customer.Id,
                Status = OrderStatus.Delivered,
                TotalAmount = 100,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            _context.OrderItems.Add(new OrderItem
            {
                OrderId = _context.Orders.First().Id,
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = 1,
                Total = product.Price
            });
            await _context.SaveChangesAsync();

            var result = await _reviewService.CanReviewAsync(customer.Id, product.Id);

            Assert.True(result);
        }

        [Fact]
        public async Task UpdateReviewAsync_Should_Return_False_When_Not_Found()
        {
            var customer = await CreateCustomerAsync();

            var result = await _reviewService.UpdateReviewAsync(
                customer.Id,
                999,
                new UpdateReviewDto { Rating = 3, Text = "Updated" });

            Assert.False(result);
        }

        [Fact]
        public async Task UpdateReviewAsync_Should_Update_Review()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();
            var review = await CreateReviewAsync(product.Id, customer.Id);

            var result = await _reviewService.UpdateReviewAsync(
                customer.Id,
                review.Id,
                new UpdateReviewDto { Rating = 2, Text = "Updated text" });

            Assert.True(result);
            var updated = await _context.Reviews.FindAsync(review.Id);
            Assert.Equal(2, updated.Rating);
            Assert.Equal("Updated text", updated.Text);
        }

        [Fact]
        public async Task DeleteReviewAsync_Should_Return_False_When_Not_Found()
        {
            var customer = await CreateCustomerAsync();

            var result = await _reviewService.DeleteReviewAsync(customer.Id, 999);

            Assert.False(result);
        }

        [Fact]
        public async Task DeleteReviewAsync_Should_Delete_Review_When_Owner()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();
            var review = await CreateReviewAsync(product.Id, customer.Id);

            var result = await _reviewService.DeleteReviewAsync(customer.Id, review.Id);

            Assert.True(result);
            Assert.Empty(await _context.Reviews.ToListAsync());
        }

        [Fact]
        public async Task DeleteReviewAsync_Should_Delete_Review_When_Admin()
        {
            var customer = await CreateCustomerAsync();
            var admin = await CreateCustomerAsync("admin@test.com", "Admin", 2);
            var product = await CreateProductAsync();
            var review = await CreateReviewAsync(product.Id, customer.Id);

            var result = await _reviewService.DeleteReviewAsync(admin.Id, review.Id);

            Assert.True(result);
            Assert.Empty(await _context.Reviews.ToListAsync());
        }

        [Fact]
        public async Task MarkHelpfulAsync_Should_Return_True_When_Already_Marked()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();
            var review = await CreateReviewAsync(product.Id, customer.Id);

            _context.ReviewHelpfuls.Add(new ReviewHelpful
            {
                ReviewId = review.Id,
                CustomerId = customer.Id
            });
            await _context.SaveChangesAsync();

            var result = await _reviewService.MarkHelpfulAsync(customer.Id, review.Id);

            Assert.True(result);
        }

        [Fact]
        public async Task MarkHelpfulAsync_Should_Return_False_When_Review_Not_Found()
        {
            var customer = await CreateCustomerAsync();

            var result = await _reviewService.MarkHelpfulAsync(customer.Id, 999);

            Assert.False(result);
        }

        [Fact]
        public async Task MarkHelpfulAsync_Should_Increment_Count()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();
            var review = await CreateReviewAsync(product.Id, customer.Id);

            var result = await _reviewService.MarkHelpfulAsync(customer.Id, review.Id);

            Assert.True(result);
            var updated = await _context.Reviews.FindAsync(review.Id);
            Assert.Equal(1, updated.HelpfulCount);
        }

        [Fact]
        public async Task ReportReviewAsync_Should_Return_True_When_Already_Reported()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();
            var review = await CreateReviewAsync(product.Id, customer.Id);

            _context.ReviewReports.Add(new ReviewReport
            {
                ReviewId = review.Id,
                CustomerId = customer.Id
            });
            await _context.SaveChangesAsync();

            var result = await _reviewService.ReportReviewAsync(customer.Id, review.Id);

            Assert.True(result);
        }

        [Fact]
        public async Task ReportReviewAsync_Should_Return_False_When_Review_Not_Found()
        {
            var customer = await CreateCustomerAsync();

            var result = await _reviewService.ReportReviewAsync(customer.Id, 999);

            Assert.False(result);
        }

        [Fact]
        public async Task ReportReviewAsync_Should_Create_Report()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();
            var review = await CreateReviewAsync(product.Id, customer.Id);

            var result = await _reviewService.ReportReviewAsync(customer.Id, review.Id);

            Assert.True(result);
            Assert.Single(await _context.ReviewReports.ToListAsync());
        }

        [Fact]
        public async Task HasMarkedHelpfulAsync_Should_Return_False_When_Not_Marked()
        {
            var customer = await CreateCustomerAsync();

            var result = await _reviewService.HasMarkedHelpfulAsync(customer.Id, 999);

            Assert.False(result);
        }

        [Fact]
        public async Task HasMarkedHelpfulAsync_Should_Return_True_When_Marked()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();
            var review = await CreateReviewAsync(product.Id, customer.Id);

            _context.ReviewHelpfuls.Add(new ReviewHelpful
            {
                ReviewId = review.Id,
                CustomerId = customer.Id
            });
            await _context.SaveChangesAsync();

            var result = await _reviewService.HasMarkedHelpfulAsync(customer.Id, review.Id);

            Assert.True(result);
        }

        [Fact]
        public async Task HasReportedAsync_Should_Return_False_When_Not_Reported()
        {
            var customer = await CreateCustomerAsync();

            var result = await _reviewService.HasReportedAsync(customer.Id, 999);

            Assert.False(result);
        }

        [Fact]
        public async Task HasReportedAsync_Should_Return_True_When_Reported()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();
            var review = await CreateReviewAsync(product.Id, customer.Id);

            _context.ReviewReports.Add(new ReviewReport
            {
                ReviewId = review.Id,
                CustomerId = customer.Id
            });
            await _context.SaveChangesAsync();

            var result = await _reviewService.HasReportedAsync(customer.Id, review.Id);

            Assert.True(result);
        }

        [Fact]
        public async Task CreateReviewAsync_Should_Return_Null_When_Rating_Invalid()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();

            var result = await _reviewService.CreateReviewAsync(
                customer.Id,
                new CreateReviewDto
                {
                    ProductId = product.Id,
                    Rating = 0,
                    Text = "Invalid rating"
                });

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateReviewAsync_Should_Return_Null_When_Rating_Too_High()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();

            var result = await _reviewService.CreateReviewAsync(
                customer.Id,
                new CreateReviewDto
                {
                    ProductId = product.Id,
                    Rating = 6,
                    Text = "Invalid rating"
                });

            Assert.Null(result);
        }
    }
}