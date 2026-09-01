using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using WebApplication2.Controllers.Reviews;
using WebApplication2.DTOs.Reviews;
using WebApplication2.Services.FileStorage.Interfaces;
using WebApplication2.Services.Reviews;

namespace WebApplication2.Tests.Controllers.Reviews
{
    public class ReviewsControllerTests
    {
        private readonly Mock<IReviewService> _reviewServiceMock;
        private readonly Mock<IFileStorageService> _fileStorageServiceMock;
        private readonly ReviewsController _controller;

        public ReviewsControllerTests()
        {
            _reviewServiceMock = new Mock<IReviewService>();
            _fileStorageServiceMock = new Mock<IFileStorageService>();
            _controller = new ReviewsController(_reviewServiceMock.Object, _fileStorageServiceMock.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
            }));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [Fact]
        public async Task GetProductReviews_Should_Return_Ok_With_Reviews()
        {
            var reviews = new List<ReviewResponseDto> { new ReviewResponseDto { Id = 1 } };
            _reviewServiceMock.Setup(x => x.GetProductReviewsAsync(It.IsAny<int>(), It.IsAny<int?>())).ReturnsAsync(reviews);

            var result = await _controller.GetProductReviews(1);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(reviews, okResult.Value);
        }

        [Fact]
        public async Task GetProductReviewSummary_Should_Return_Ok_With_Summary()
        {
            var summary = new ProductReviewSummaryDto { AverageRating = 4.5, TotalReviews = 10 };
            _reviewServiceMock.Setup(x => x.GetProductReviewSummaryAsync(It.IsAny<int>())).ReturnsAsync(summary);

            var result = await _controller.GetProductReviewSummary(1);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(summary, okResult.Value);
        }

        [Fact]
        public async Task GetMedia_Should_Return_File_When_Found()
        {
            var media = new ReviewMediaDto
            {
                Id = 1,
                ObjectKey = "key",
                ContentType = "image/jpeg",
                FileName = "test.jpg",
                MediaType = "photo",
                FileSize = 100
            };

            _reviewServiceMock.Setup(x => x.GetMediaAsync(It.IsAny<int>(), It.IsAny<int>())).ReturnsAsync(media);
            _fileStorageServiceMock.Setup(x => x.GetFileAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new MemoryStream());

            var result = await _controller.GetMedia(1, 1);

            Assert.IsType<FileStreamResult>(result);
        }

        [Fact]
        public async Task GetMedia_Should_Return_NotFound_When_Not_Found()
        {
            _reviewServiceMock.Setup(x => x.GetMediaAsync(It.IsAny<int>(), It.IsAny<int>())).ReturnsAsync((ReviewMediaDto)null);

            var result = await _controller.GetMedia(1, 1);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task CreateReview_Should_Return_Ok_When_Success()
        {
            var review = new ReviewResponseDto { Id = 1 };
            _reviewServiceMock.Setup(x => x.CreateReviewAsync(It.IsAny<Guid>(), It.IsAny<CreateReviewDto>())).ReturnsAsync(review);

            var result = await _controller.CreateReview(new CreateReviewDto());

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(review, okResult.Value);
        }

        [Fact]
        public async Task CreateReview_Should_Return_BadRequest_When_Failed()
        {
            _reviewServiceMock.Setup(x => x.CreateReviewAsync(It.IsAny<Guid>(), It.IsAny<CreateReviewDto>())).ReturnsAsync((ReviewResponseDto)null);

            var result = await _controller.CreateReview(new CreateReviewDto());

            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public async Task UpdateReview_Should_Return_NoContent_When_Success()
        {
            _reviewServiceMock.Setup(x => x.UpdateReviewAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<UpdateReviewDto>())).ReturnsAsync(true);

            var result = await _controller.UpdateReview(1, new UpdateReviewDto());

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task UpdateReview_Should_Return_NotFound_When_Failed()
        {
            _reviewServiceMock.Setup(x => x.UpdateReviewAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<UpdateReviewDto>())).ReturnsAsync(false);

            var result = await _controller.UpdateReview(1, new UpdateReviewDto());

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeleteReview_Should_Return_NoContent_When_Success()
        {
            _reviewServiceMock.Setup(x => x.DeleteReviewAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(true);

            var result = await _controller.DeleteReview(1);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteReview_Should_Return_NotFound_When_Failed()
        {
            _reviewServiceMock.Setup(x => x.DeleteReviewAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(false);

            var result = await _controller.DeleteReview(1);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task UploadMedia_Should_Return_Ok_When_Success()
        {
            var media = new ReviewMediaDto { Id = 1 };
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(x => x.FileName).Returns("test.jpg");
            fileMock.Setup(x => x.ContentType).Returns("image/jpeg");
            fileMock.Setup(x => x.Length).Returns(100);
            fileMock.Setup(x => x.OpenReadStream()).Returns(new MemoryStream());

            _reviewServiceMock.Setup(x => x.UploadMediaAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<IFormFile>())).ReturnsAsync(media);

            var result = await _controller.UploadMedia(1, fileMock.Object);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(media, okResult.Value);
        }

        [Fact]
        public async Task UploadMedia_Should_Return_BadRequest_When_Failed()
        {
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(x => x.FileName).Returns("test.jpg");
            fileMock.Setup(x => x.ContentType).Returns("image/jpeg");
            fileMock.Setup(x => x.Length).Returns(100);
            fileMock.Setup(x => x.OpenReadStream()).Returns(new MemoryStream());

            _reviewServiceMock.Setup(x => x.UploadMediaAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<IFormFile>())).ReturnsAsync((ReviewMediaDto)null);

            var result = await _controller.UploadMedia(1, fileMock.Object);

            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public async Task DeleteMedia_Should_Return_NoContent_When_Success()
        {
            _reviewServiceMock.Setup(x => x.DeleteMediaAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<int>())).ReturnsAsync(true);

            var result = await _controller.DeleteMedia(1, 1);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteMedia_Should_Return_NotFound_When_Failed()
        {
            _reviewServiceMock.Setup(x => x.DeleteMediaAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<int>())).ReturnsAsync(false);

            var result = await _controller.DeleteMedia(1, 1);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task GetMyReviews_Should_Return_Ok_With_Reviews()
        {
            var reviews = new List<ReviewResponseDto> { new ReviewResponseDto { Id = 1 } };
            _reviewServiceMock.Setup(x => x.GetMyReviewsAsync(It.IsAny<Guid>())).ReturnsAsync(reviews);

            var result = await _controller.GetMyReviews();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(reviews, okResult.Value);
        }

        [Fact]
        public async Task MarkHelpful_Should_Return_NoContent_When_Success()
        {
            _reviewServiceMock.Setup(x => x.MarkHelpfulAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(true);

            var result = await _controller.MarkHelpful(1);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task MarkHelpful_Should_Return_NotFound_When_Failed()
        {
            _reviewServiceMock.Setup(x => x.MarkHelpfulAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(false);

            var result = await _controller.MarkHelpful(1);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task ReportReview_Should_Return_NoContent_When_Success()
        {
            _reviewServiceMock.Setup(x => x.ReportReviewAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(true);

            var result = await _controller.ReportReview(1);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task ReportReview_Should_Return_NotFound_When_Failed()
        {
            _reviewServiceMock.Setup(x => x.ReportReviewAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(false);

            var result = await _controller.ReportReview(1);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task HasMarkedHelpful_Should_Return_Ok_With_Value()
        {
            _reviewServiceMock.Setup(x => x.HasMarkedHelpfulAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(true);

            var result = await _controller.HasMarkedHelpful(1);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.True((bool)okResult.Value);
        }

        [Fact]
        public async Task HasReported_Should_Return_Ok_With_Value()
        {
            _reviewServiceMock.Setup(x => x.HasReportedAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(false);

            var result = await _controller.HasReported(1);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.False((bool)okResult.Value);
        }

        [Fact]
        public async Task CanReview_Should_Return_Ok_With_Value()
        {
            _reviewServiceMock.Setup(x => x.CanReviewAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(true);

            var result = await _controller.CanReview(1);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.True((bool)okResult.Value);
        }
    }
}