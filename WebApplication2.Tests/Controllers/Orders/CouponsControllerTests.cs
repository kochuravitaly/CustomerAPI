using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApplication2.Controllers.Orders;
using WebApplication2.DTOs.Orders;
using WebApplication2.Services.Orders;

namespace WebApplication2.Tests.Controllers
{
    public class CouponsControllerTests
    {
        private readonly Mock<ICouponService> _couponServiceMock;
        private readonly CouponsController _controller;

        public CouponsControllerTests()
        {
            _couponServiceMock = new Mock<ICouponService>();
            _controller = new CouponsController(_couponServiceMock.Object);
        }

        [Fact]
        public async Task GetCoupons_Should_Return_Ok_With_Coupons()
        {
            var coupons = new List<CouponResponseDto>
            {
                new CouponResponseDto { Id = 1, Code = "SAVE10" },
                new CouponResponseDto { Id = 2, Code = "SAVE20" }
            };

            _couponServiceMock
                .Setup(x => x.GetCouponsAsync())
                .ReturnsAsync(coupons);

            var result = await _controller.GetCoupons();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(coupons, okResult.Value);
        }

        [Fact]
        public async Task GetCoupons_Should_Return_Ok_With_Empty_When_No_Coupons()
        {
            _couponServiceMock
                .Setup(x => x.GetCouponsAsync())
                .ReturnsAsync(new List<CouponResponseDto>());

            var result = await _controller.GetCoupons();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var coupons = Assert.IsAssignableFrom<IEnumerable<CouponResponseDto>>(okResult.Value);
            Assert.Empty(coupons);
        }

        [Fact]
        public async Task CreateCoupon_Should_Return_Ok_When_Created()
        {
            var createdCoupon = new CouponResponseDto
            {
                Id = 1,
                Code = "SAVE10"
            };

            _couponServiceMock
                .Setup(x => x.CreateCouponAsync(It.IsAny<CreateCouponDto>()))
                .ReturnsAsync(createdCoupon);

            var result = await _controller.CreateCoupon(new CreateCouponDto
            {
                Code = "SAVE10",
                DiscountType = 0,
                DiscountValue = 10
            });

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(createdCoupon, okResult.Value);
        }

        [Fact]
        public async Task CreateCoupon_Should_Return_BadRequest_When_Invalid()
        {
            _couponServiceMock
                .Setup(x => x.CreateCouponAsync(It.IsAny<CreateCouponDto>()))
                .ReturnsAsync((CouponResponseDto)null);

            var result = await _controller.CreateCoupon(new CreateCouponDto
            {
                Code = "INVALID",
                DiscountType = 0,
                DiscountValue = 150
            });

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Invalid coupon data or code already exists.", badRequestResult.Value);
        }

        [Fact]
        public async Task UpdateCoupon_Should_Return_Ok_When_Updated()
        {
            var updatedCoupon = new CouponResponseDto
            {
                Id = 1,
                Code = "UPDATED"
            };

            _couponServiceMock
                .Setup(x => x.UpdateCouponAsync(1, It.IsAny<CreateCouponDto>()))
                .ReturnsAsync(updatedCoupon);

            var result = await _controller.UpdateCoupon(1, new CreateCouponDto
            {
                Code = "UPDATED"
            });

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(updatedCoupon, okResult.Value);
        }

        [Fact]
        public async Task UpdateCoupon_Should_Return_BadRequest_When_Invalid()
        {
            _couponServiceMock
                .Setup(x => x.UpdateCouponAsync(999, It.IsAny<CreateCouponDto>()))
                .ReturnsAsync((CouponResponseDto)null);

            var result = await _controller.UpdateCoupon(999, new CreateCouponDto
            {
                Code = "INVALID"
            });

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Invalid coupon data or not found.", badRequestResult.Value);
        }

        [Fact]
        public async Task DeleteCoupon_Should_Return_NoContent_When_Deleted()
        {
            _couponServiceMock
                .Setup(x => x.DeleteCouponAsync(1))
                .ReturnsAsync(true);

            var result = await _controller.DeleteCoupon(1);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteCoupon_Should_Return_NotFound_When_Not_Found()
        {
            _couponServiceMock
                .Setup(x => x.DeleteCouponAsync(999))
                .ReturnsAsync(false);

            var result = await _controller.DeleteCoupon(999);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task ApplyCoupon_Should_Return_Ok_When_Applied()
        {
            var applyResult = new ApplyCouponResultDto
            {
                Discount = 10,
                FinalTotal = 90,
                Error = null
            };

            _couponServiceMock
                .Setup(x => x.ApplyCouponAsync(It.IsAny<ApplyCouponDto>()))
                .ReturnsAsync(applyResult);

            var result = await _controller.ApplyCoupon(new ApplyCouponDto
            {
                Code = "SAVE10",
                OrderTotal = 100
            });

            var okResult = Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task ApplyCoupon_Should_Return_BadRequest_When_Error()
        {
            var applyResult = new ApplyCouponResultDto
            {
                Error = "Invalid coupon code."
            };

            _couponServiceMock
                .Setup(x => x.ApplyCouponAsync(It.IsAny<ApplyCouponDto>()))
                .ReturnsAsync(applyResult);

            var result = await _controller.ApplyCoupon(new ApplyCouponDto
            {
                Code = "INVALID",
                OrderTotal = 100
            });

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task ApplyCoupon_Should_Return_BadRequest_When_Null()
        {
            _couponServiceMock
                .Setup(x => x.ApplyCouponAsync(It.IsAny<ApplyCouponDto>()))
                .ReturnsAsync((ApplyCouponResultDto)null);

            var result = await _controller.ApplyCoupon(new ApplyCouponDto
            {
                Code = "ERROR",
                OrderTotal = 100
            });

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task ValidateCoupon_Should_Return_Ok_When_Valid()
        {
            var applyResult = new ApplyCouponResultDto
            {
                Discount = 10,
                FinalTotal = 90,
                Error = null
            };

            _couponServiceMock
                .Setup(x => x.ApplyCouponAsync(It.IsAny<ApplyCouponDto>()))
                .ReturnsAsync(applyResult);

            var result = await _controller.ValidateCoupon(new ApplyCouponDto
            {
                Code = "SAVE10",
                OrderTotal = 100
            });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task ValidateCoupon_Should_Return_BadRequest_When_Error()
        {
            var applyResult = new ApplyCouponResultDto
            {
                Error = "Coupon has expired."
            };

            _couponServiceMock
                .Setup(x => x.ApplyCouponAsync(It.IsAny<ApplyCouponDto>()))
                .ReturnsAsync(applyResult);

            var result = await _controller.ValidateCoupon(new ApplyCouponDto
            {
                Code = "EXPIRED",
                OrderTotal = 100
            });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task ValidateCoupon_Should_Return_BadRequest_When_Null()
        {
            _couponServiceMock
                .Setup(x => x.ApplyCouponAsync(It.IsAny<ApplyCouponDto>()))
                .ReturnsAsync((ApplyCouponResultDto)null);

            var result = await _controller.ValidateCoupon(new ApplyCouponDto
            {
                Code = "ERROR",
                OrderTotal = 100
            });

            Assert.IsType<BadRequestObjectResult>(result);
        }
    }
}