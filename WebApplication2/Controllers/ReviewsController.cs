using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApplication2.DTOs.Reviews;
using WebApplication2.Services.FileStorage.Interfaces;
using WebApplication2.Services.Reviews;

namespace WebApplication2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly IFileStorageService _fileStorageService;

        public ReviewsController(
            IReviewService reviewService,
            IFileStorageService fileStorageService)
        {
            _reviewService = reviewService;
            _fileStorageService = fileStorageService;
        }

        [HttpGet("product/{productId}")]
        public async Task<ActionResult<IEnumerable<ReviewResponseDto>>> GetProductReviews(
            int productId,
            [FromQuery] int? rating = null)
        {
            var reviews = await _reviewService.GetProductReviewsAsync(productId, rating);

            return Ok(reviews);
        }

        [HttpGet("product/{productId}/summary")]
        public async Task<ActionResult<ProductReviewSummaryDto>> GetProductReviewSummary(int productId)
        {
            var summary = await _reviewService.GetProductReviewSummaryAsync(productId);

            return Ok(summary);
        }

        [HttpGet("{reviewId}/media/{mediaId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMedia(int reviewId, int mediaId)
        {
            var media = await _reviewService.GetMediaAsync(reviewId, mediaId);

            if (media == null)
            {
                return NotFound();
            }

            var stream = await _fileStorageService.GetFileAsync(
                media.ObjectKey,
                CancellationToken.None);

            return File(stream, media.ContentType);
        }

        [Authorize]
        [HttpPost]
        public async Task<ActionResult<ReviewResponseDto>> CreateReview(CreateReviewDto dto)
        {
            var customerId = GetCustomerId();

            var review = await _reviewService.CreateReviewAsync(customerId, dto);

            if (review == null)
            {
                return BadRequest("Unable to create review.");
            }

            return Ok(review);
        }

        [Authorize]
        [HttpPatch("{reviewId}")]
        public async Task<IActionResult> UpdateReview(int reviewId, UpdateReviewDto dto)
        {
            var customerId = GetCustomerId();

            var result = await _reviewService.UpdateReviewAsync(customerId, reviewId, dto);

            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }

        [Authorize]
        [HttpDelete("{reviewId}")]
        public async Task<IActionResult> DeleteReview(int reviewId)
        {
            var customerId = GetCustomerId();

            var result = await _reviewService.DeleteReviewAsync(customerId, reviewId);

            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }

        [Authorize]
        [HttpPost("{reviewId}/media")]
        public async Task<ActionResult<ReviewMediaDto>> UploadMedia(int reviewId, IFormFile file)
        {
            var customerId = GetCustomerId();

            var media = await _reviewService.UploadMediaAsync(customerId, reviewId, file);

            if (media == null)
            {
                return BadRequest("Invalid file.");
            }

            return Ok(media);
        }

        [Authorize]
        [HttpDelete("{reviewId}/media/{mediaId}")]
        public async Task<IActionResult> DeleteMedia(int reviewId, int mediaId)
        {
            var customerId = GetCustomerId();

            var result = await _reviewService.DeleteMediaAsync(customerId, reviewId, mediaId);

            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }

        [Authorize]
        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<ReviewResponseDto>>> GetMyReviews()
        {
            var customerId = GetCustomerId();
            var reviews = await _reviewService.GetMyReviewsAsync(customerId);
            return Ok(reviews);
        }

        [Authorize]
        [HttpPost("{reviewId}/helpful")]
        public async Task<IActionResult> MarkHelpful(int reviewId)
        {
            var customerId = GetCustomerId();
            var result = await _reviewService.MarkHelpfulAsync(customerId, reviewId);
            if (!result) return NotFound();
            return NoContent();
        }

        [Authorize]
        [HttpPost("{reviewId}/report")]
        public async Task<IActionResult> ReportReview(int reviewId)
        {
            var customerId = GetCustomerId();
            var result = await _reviewService.ReportReviewAsync(customerId, reviewId);
            if (!result) return NotFound();
            return NoContent();
        }

        [Authorize]
        [HttpGet("{reviewId}/has-marked-helpful")]
        public async Task<ActionResult<bool>> HasMarkedHelpful(int reviewId)
        {
            var customerId = GetCustomerId();
            return Ok(await _reviewService.HasMarkedHelpfulAsync(customerId, reviewId));
        }

        [Authorize]
        [HttpGet("{reviewId}/has-reported")]
        public async Task<ActionResult<bool>> HasReported(int reviewId)
        {
            var customerId = GetCustomerId();
            return Ok(await _reviewService.HasReportedAsync(customerId, reviewId));
        }

        [Authorize]
        [HttpGet("can-review/{productId}")]
        public async Task<ActionResult<bool>> CanReview(int productId)
        {
            var customerId = GetCustomerId();
            var canReview = await _reviewService.CanReviewAsync(customerId, productId);
            return Ok(canReview);
        }

        private Guid GetCustomerId()
        {
            return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        }
    }
}