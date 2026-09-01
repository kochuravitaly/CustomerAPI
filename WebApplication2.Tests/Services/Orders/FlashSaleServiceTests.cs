using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Orders;
using WebApplication2.Models.Orders;
using WebApplication2.Services.Orders;

namespace WebApplication2.Tests.Services.Orders
{
    public class FlashSaleServiceTests
    {
        private readonly AppDbContext _context;
        private readonly FlashSaleService _flashSaleService;

        public FlashSaleServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _flashSaleService = new FlashSaleService(_context);
        }

        private async Task<FlashSale> CreateFlashSaleAsync(
            decimal discountPercentage = 50,
            DateTime? startsAt = null,
            DateTime? endsAt = null,
            bool isActive = true,
            string productIdsJson = "[]",
            string categoryIdsJson = "[]")
        {
            var flashSale = new FlashSale
            {
                DiscountPercentage = discountPercentage,
                StartsAt = startsAt ?? DateTime.UtcNow.AddHours(-1),
                EndsAt = endsAt ?? DateTime.UtcNow.AddHours(1),
                IsActive = isActive,
                ProductIdsJson = productIdsJson,
                CategoryIdsJson = categoryIdsJson
            };

            _context.FlashSales.Add(flashSale);
            await _context.SaveChangesAsync();
            return flashSale;
        }

        private CreateFlashSaleDto CreateDto(
            decimal discountPercentage = 50,
            DateTime? startsAt = null,
            DateTime? endsAt = null,
            string? productIdsJson = "[]",
            string? categoryIdsJson = "[]")
        {
            return new CreateFlashSaleDto
            {
                DiscountPercentage = discountPercentage,
                StartsAt = startsAt ?? DateTime.UtcNow.AddHours(-1),
                EndsAt = endsAt ?? DateTime.UtcNow.AddHours(1),
                ProductIdsJson = productIdsJson,
                CategoryIdsJson = categoryIdsJson
            };
        }

        [Fact]
        public async Task GetActiveFlashSalesAsync_Should_Return_Only_Active_And_Current()
        {
            await CreateFlashSaleAsync(50, DateTime.UtcNow.AddHours(-2), DateTime.UtcNow.AddHours(2), true);
            await CreateFlashSaleAsync(30, DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-1), true);
            await CreateFlashSaleAsync(40, DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(3), true);
            await CreateFlashSaleAsync(60, DateTime.UtcNow.AddHours(-2), DateTime.UtcNow.AddHours(2), false);

            var result = await _flashSaleService.GetActiveFlashSalesAsync();

            Assert.Single(result);
            Assert.Equal(50, result.First().DiscountPercentage);
        }

        [Fact]
        public async Task GetActiveFlashSalesAsync_Should_Return_Empty_When_None_Active()
        {
            await CreateFlashSaleAsync(50, DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-1), true);

            var result = await _flashSaleService.GetActiveFlashSalesAsync();

            Assert.Empty(result);
        }

        [Fact]
        public async Task GetAllFlashSalesAsync_Should_Return_All()
        {
            await CreateFlashSaleAsync(50, DateTime.UtcNow.AddHours(-2), DateTime.UtcNow.AddHours(2), true);
            await CreateFlashSaleAsync(30, DateTime.UtcNow.AddHours(-3), DateTime.UtcNow.AddHours(-1), true);
            await CreateFlashSaleAsync(60, DateTime.UtcNow.AddHours(-2), DateTime.UtcNow.AddHours(2), false);

            var result = await _flashSaleService.GetAllFlashSalesAsync();

            Assert.Equal(3, result.Count());
        }

        [Fact]
        public async Task CreateFlashSaleAsync_Should_Create()
        {
            var dto = CreateDto(25);

            var result = await _flashSaleService.CreateFlashSaleAsync(dto);

            Assert.NotNull(result);
            Assert.Equal(25, result.DiscountPercentage);
            Assert.True(result.IsActive);
        }

        [Fact]
        public async Task CreateFlashSaleAsync_Should_Return_Null_When_Discount_Zero_Or_Negative()
        {
            var zeroDto = CreateDto(0);
            var negativeDto = CreateDto(-10);

            var zeroResult = await _flashSaleService.CreateFlashSaleAsync(zeroDto);
            var negativeResult = await _flashSaleService.CreateFlashSaleAsync(negativeDto);

            Assert.Null(zeroResult);
            Assert.Null(negativeResult);
        }

        [Fact]
        public async Task CreateFlashSaleAsync_Should_Return_Null_When_Discount_100_Or_More()
        {
            var hundredDto = CreateDto(100);
            var overDto = CreateDto(150);

            var hundredResult = await _flashSaleService.CreateFlashSaleAsync(hundredDto);
            var overResult = await _flashSaleService.CreateFlashSaleAsync(overDto);

            Assert.Null(hundredResult);
            Assert.Null(overResult);
        }

        [Fact]
        public async Task CreateFlashSaleAsync_Should_Set_Default_Json_When_Null()
        {
            var dto = CreateDto(50, productIdsJson: null, categoryIdsJson: null);

            var result = await _flashSaleService.CreateFlashSaleAsync(dto);

            Assert.Equal("[]", result.ProductIdsJson);
            Assert.Equal("[]", result.CategoryIdsJson);
        }

        [Fact]
        public async Task UpdateFlashSaleAsync_Should_Return_Null_When_Not_Found()
        {
            var dto = CreateDto(50);

            var result = await _flashSaleService.UpdateFlashSaleAsync(999, dto);

            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateFlashSaleAsync_Should_Return_Null_When_Discount_Invalid()
        {
            var flashSale = await CreateFlashSaleAsync(50);
            var invalidDto = CreateDto(0);

            var result = await _flashSaleService.UpdateFlashSaleAsync(flashSale.Id, invalidDto);

            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateFlashSaleAsync_Should_Update()
        {
            var flashSale = await CreateFlashSaleAsync(50);
            var dto = CreateDto(75, DateTime.UtcNow.AddHours(-5), DateTime.UtcNow.AddHours(5));

            var result = await _flashSaleService.UpdateFlashSaleAsync(flashSale.Id, dto);

            Assert.NotNull(result);
            Assert.Equal(75, result.DiscountPercentage);
        }

        [Fact]
        public async Task DeleteFlashSaleAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _flashSaleService.DeleteFlashSaleAsync(999);

            Assert.False(result);
        }

        [Fact]
        public async Task DeleteFlashSaleAsync_Should_Return_True_When_Deleted()
        {
            var flashSale = await CreateFlashSaleAsync(50);

            var result = await _flashSaleService.DeleteFlashSaleAsync(flashSale.Id);

            Assert.True(result);
            Assert.Empty(await _context.FlashSales.ToListAsync());
        }
    }
}