using Microsoft.EntityFrameworkCore;
using Moq;
using WebApplication2.Data;
using WebApplication2.DTOs.Orders;
using WebApplication2.Models.Orders;
using WebApplication2.Services.Orders;

namespace WebApplication2.Tests.Services.Orders
{
    public class CouponServiceTests
    {
        private readonly AppDbContext _context;
        private readonly CouponService _couponService;

        public CouponServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _couponService = new CouponService(_context);
        }

        private async Task<Coupon> CreateCouponAsync(
            string code = "TEST",
            int discountType = 0,
            decimal discountValue = 10,
            decimal? minOrderAmount = null,
            DateTime? expiryDate = null,
            int? usageLimit = null,
            int timesUsed = 0,
            bool isActive = true,
            string productIdsJson = "[]",
            string categoryIdsJson = "[]")
        {
            var coupon = new Coupon
            {
                Code = code,
                DiscountType = discountType,
                DiscountValue = discountValue,
                MinOrderAmount = minOrderAmount,
                ExpiryDate = expiryDate,
                UsageLimit = usageLimit,
                TimesUsed = timesUsed,
                IsActive = isActive,
                ProductIdsJson = productIdsJson,
                CategoryIdsJson = categoryIdsJson
            };

            _context.Coupons.Add(coupon);
            await _context.SaveChangesAsync();
            return coupon;
        }

        private CreateCouponDto CreateDto(
            string code = "TEST",
            int discountType = 0,
            decimal discountValue = 10,
            decimal? minOrderAmount = null,
            DateTime? expiryDate = null,
            int? usageLimit = null,
            string? productIdsJson = "[]",
            string? categoryIdsJson = "[]")
        {
            return new CreateCouponDto
            {
                Code = code,
                DiscountType = discountType,
                DiscountValue = discountValue,
                MinOrderAmount = minOrderAmount,
                ExpiryDate = expiryDate,
                UsageLimit = usageLimit,
                ProductIdsJson = productIdsJson,
                CategoryIdsJson = categoryIdsJson
            };
        }

        [Fact]
        public async Task GetCouponsAsync_Should_Return_All_Coupons()
        {
            await CreateCouponAsync("COUPON1");
            await CreateCouponAsync("COUPON2");
            await CreateCouponAsync("COUPON3");

            var result = await _couponService.GetCouponsAsync();

            Assert.Equal(3, result.Count());
        }

        [Fact]
        public async Task GetCouponsAsync_Should_Return_Empty_When_No_Coupons()
        {
            var result = await _couponService.GetCouponsAsync();

            Assert.Empty(result);
        }

        [Fact]
        public async Task CreateCouponAsync_Should_Create_Coupon()
        {
            var dto = CreateDto("SAVE10");

            var result = await _couponService.CreateCouponAsync(dto);

            Assert.NotNull(result);
            Assert.Equal("SAVE10", result.Code);
            Assert.Equal(10, result.DiscountValue);
            Assert.True(result.IsActive);
        }

        [Fact]
        public async Task CreateCouponAsync_Should_Return_Null_When_Percentage_Over_100()
        {
            var dto = CreateDto("INVALID", discountType: 0, discountValue: 150);

            var result = await _couponService.CreateCouponAsync(dto);

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateCouponAsync_Should_Return_Null_When_Discount_Value_Is_Zero_Or_Negative()
        {
            var zeroDto = CreateDto("ZERO", discountValue: 0);
            var negativeDto = CreateDto("NEGATIVE", discountValue: -10);

            var zeroResult = await _couponService.CreateCouponAsync(zeroDto);
            var negativeResult = await _couponService.CreateCouponAsync(negativeDto);

            Assert.Null(zeroResult);
            Assert.Null(negativeResult);
        }

        [Fact]
        public async Task CreateCouponAsync_Should_Return_Null_When_Code_Already_Exists()
        {
            await CreateCouponAsync("EXISTING");

            var dto = CreateDto("existing");

            var result = await _couponService.CreateCouponAsync(dto);

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateCouponAsync_Should_Uppercase_Code()
        {
            var dto = CreateDto("save20");

            var result = await _couponService.CreateCouponAsync(dto);

            Assert.Equal("SAVE20", result.Code);
        }

        [Fact]
        public async Task CreateCouponAsync_Should_Set_Default_Json_When_Null()
        {
            var dto = CreateDto("NULLJSON", productIdsJson: null, categoryIdsJson: null);

            var result = await _couponService.CreateCouponAsync(dto);

            Assert.Equal("[]", result.ProductIdsJson);
            Assert.Equal("[]", result.CategoryIdsJson);
        }

        [Fact]
        public async Task UpdateCouponAsync_Should_Return_Null_When_Coupon_Not_Found()
        {
            var dto = CreateDto("UPDATED");

            var result = await _couponService.UpdateCouponAsync(999, dto);

            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateCouponAsync_Should_Return_Null_When_Percentage_Over_100()
        {
            var coupon = await CreateCouponAsync("ORIGINAL");
            var dto = CreateDto("UPDATED", discountType: 0, discountValue: 150);

            var result = await _couponService.UpdateCouponAsync(coupon.Id, dto);

            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateCouponAsync_Should_Update_Coupon()
        {
            var coupon = await CreateCouponAsync("ORIGINAL");
            var dto = CreateDto("UPDATED", discountValue: 25);

            var result = await _couponService.UpdateCouponAsync(coupon.Id, dto);

            Assert.NotNull(result);
            Assert.Equal("UPDATED", result.Code);
            Assert.Equal(25, result.DiscountValue);
        }

        [Fact]
        public async Task DeleteCouponAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _couponService.DeleteCouponAsync(999);

            Assert.False(result);
        }

        [Fact]
        public async Task DeleteCouponAsync_Should_Return_True_When_Deleted()
        {
            var coupon = await CreateCouponAsync("DELETE");

            var result = await _couponService.DeleteCouponAsync(coupon.Id);

            Assert.True(result);
            Assert.Empty(await _context.Coupons.ToListAsync());
        }

        [Fact]
        public async Task ApplyCouponAsync_Should_Return_Error_When_Coupon_Not_Found()
        {
            var result = await _couponService.ApplyCouponAsync(new ApplyCouponDto
            {
                Code = "NOTFOUND",
                OrderTotal = 100
            });

            Assert.Equal("Invalid coupon code.", result.Error);
        }

        [Fact]
        public async Task ApplyCouponAsync_Should_Return_Error_When_Coupon_Inactive()
        {
            await CreateCouponAsync("INACTIVE", isActive: false);

            var result = await _couponService.ApplyCouponAsync(new ApplyCouponDto
            {
                Code = "INACTIVE",
                OrderTotal = 100
            });

            Assert.Equal("Invalid coupon code.", result.Error);
        }

        [Fact]
        public async Task ApplyCouponAsync_Should_Return_Error_When_Expired()
        {
            await CreateCouponAsync("EXPIRED", expiryDate: DateTime.UtcNow.AddDays(-1));

            var result = await _couponService.ApplyCouponAsync(new ApplyCouponDto
            {
                Code = "EXPIRED",
                OrderTotal = 100
            });

            Assert.Equal("Coupon has expired.", result.Error);
        }

        [Fact]
        public async Task ApplyCouponAsync_Should_Return_Error_When_Usage_Limit_Reached()
        {
            await CreateCouponAsync("USEDUP", usageLimit: 100, timesUsed: 100);

            var result = await _couponService.ApplyCouponAsync(new ApplyCouponDto
            {
                Code = "USEDUP",
                OrderTotal = 100
            });

            Assert.Equal("Coupon usage limit reached.", result.Error);
        }

        [Fact]
        public async Task ApplyCouponAsync_Should_Return_Error_When_Order_Total_Below_Minimum()
        {
            await CreateCouponAsync("MIN50", minOrderAmount: 50);

            var result = await _couponService.ApplyCouponAsync(new ApplyCouponDto
            {
                Code = "MIN50",
                OrderTotal = 30
            });

            Assert.Equal("Minimum order amount is $50.", result.Error);
        }

        [Fact]
        public async Task ApplyCouponAsync_Should_Return_Error_When_Product_Not_Allowed()
        {
            await CreateCouponAsync("PRODUCT1", productIdsJson: "[1,2,3]");

            var result = await _couponService.ApplyCouponAsync(new ApplyCouponDto
            {
                Code = "PRODUCT1",
                OrderTotal = 100,
                ProductId = 99
            });

            Assert.Equal("This coupon is not valid for this product.", result.Error);
        }

        [Fact]
        public async Task ApplyCouponAsync_Should_Return_Error_When_Product_Id_Not_Provided()
        {
            await CreateCouponAsync("PRODUCT2", productIdsJson: "[1,2,3]");

            var result = await _couponService.ApplyCouponAsync(new ApplyCouponDto
            {
                Code = "PRODUCT2",
                OrderTotal = 100
            });

            Assert.Equal("This coupon is not valid for this product.", result.Error);
        }

        [Fact]
        public async Task ApplyCouponAsync_Should_Return_Error_When_Category_Not_Allowed()
        {
            await CreateCouponAsync("CATEGORY1", categoryIdsJson: "[1,2,3]");

            var result = await _couponService.ApplyCouponAsync(new ApplyCouponDto
            {
                Code = "CATEGORY1",
                OrderTotal = 100,
                CategoryId = 99
            });

            Assert.Equal("This coupon is not valid for this category.", result.Error);
        }

        [Fact]
        public async Task ApplyCouponAsync_Should_Return_Error_When_Category_Id_Not_Provided()
        {
            await CreateCouponAsync("CATEGORY2", categoryIdsJson: "[1,2,3]");

            var result = await _couponService.ApplyCouponAsync(new ApplyCouponDto
            {
                Code = "CATEGORY2",
                OrderTotal = 100
            });

            Assert.Equal("This coupon is not valid for this category.", result.Error);
        }

        [Fact]
        public async Task ApplyCouponAsync_Should_Calculate_Percentage_Discount()
        {
            await CreateCouponAsync("PERCENT10", discountType: 0, discountValue: 10);

            var result = await _couponService.ApplyCouponAsync(new ApplyCouponDto
            {
                Code = "PERCENT10",
                OrderTotal = 100
            });

            Assert.Null(result.Error);
            Assert.Equal(10, result.Discount);
            Assert.Equal(90, result.FinalTotal);
        }

        [Fact]
        public async Task ApplyCouponAsync_Should_Calculate_Fixed_Discount()
        {
            await CreateCouponAsync("FIXED15", discountType: 1, discountValue: 15);

            var result = await _couponService.ApplyCouponAsync(new ApplyCouponDto
            {
                Code = "FIXED15",
                OrderTotal = 100
            });

            Assert.Null(result.Error);
            Assert.Equal(15, result.Discount);
            Assert.Equal(85, result.FinalTotal);
        }

        [Fact]
        public async Task ApplyCouponAsync_Should_Cap_Discount_At_Order_Total()
        {
            await CreateCouponAsync("BIGDISCOUNT", discountType: 1, discountValue: 150);

            var result = await _couponService.ApplyCouponAsync(new ApplyCouponDto
            {
                Code = "BIGDISCOUNT",
                OrderTotal = 100
            });

            Assert.Null(result.Error);
            Assert.Equal(100, result.Discount);
            Assert.Equal(0, result.FinalTotal);
        }

        [Fact]
        public async Task CalculateDiscountAsync_Should_Return_Zero_When_Coupon_Not_Found()
        {
            var result = await _couponService.CalculateDiscountAsync("NOTFOUND", 100);

            Assert.Equal(0, result);
        }

        [Fact]
        public async Task CalculateDiscountAsync_Should_Return_Zero_When_Inactive()
        {
            await CreateCouponAsync("INACTIVE", isActive: false);

            var result = await _couponService.CalculateDiscountAsync("INACTIVE", 100);

            Assert.Equal(0, result);
        }

        [Fact]
        public async Task CalculateDiscountAsync_Should_Calculate_Percentage()
        {
            await CreateCouponAsync("PERCENT20", discountType: 0, discountValue: 20);

            var result = await _couponService.CalculateDiscountAsync("PERCENT20", 100);

            Assert.Equal(20, result);
        }

        [Fact]
        public async Task CalculateDiscountAsync_Should_Calculate_Fixed()
        {
            await CreateCouponAsync("FIXED25", discountType: 1, discountValue: 25);

            var result = await _couponService.CalculateDiscountAsync("FIXED25", 100);

            Assert.Equal(25, result);
        }

        [Fact]
        public async Task MarkCouponAsUsedAsync_Should_Increment_Times_Used()
        {
            var coupon = await CreateCouponAsync("USED", usageLimit: 100, timesUsed: 0);

            await _couponService.MarkCouponAsUsedAsync("USED");

            var updated = await _context.Coupons.FindAsync(coupon.Id);
            Assert.Equal(1, updated.TimesUsed);
        }

        [Fact]
        public async Task MarkCouponAsUsedAsync_Should_Deactivate_When_Limit_Reached()
        {
            var coupon = await CreateCouponAsync("LIMIT", usageLimit: 1, timesUsed: 0);

            await _couponService.MarkCouponAsUsedAsync("LIMIT");

            var updated = await _context.Coupons.FindAsync(coupon.Id);
            Assert.False(updated.IsActive);
        }

        [Fact]
        public async Task MarkCouponAsUsedAsync_Should_Not_Fail_When_Coupon_Not_Found()
        {
            await _couponService.MarkCouponAsUsedAsync("NOTFOUND");
        }
    }
}