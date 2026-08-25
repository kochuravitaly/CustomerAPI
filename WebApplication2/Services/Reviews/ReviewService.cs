using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Reviews;
using WebApplication2.Models.Reviews;
using WebApplication2.Services.Auth.Interfaces;
using WebApplication2.Services.FileStorage.Interfaces;

namespace WebApplication2.Services.Reviews
{
    public class ReviewService : IReviewService
    {
        private readonly AppDbContext _context;
        private readonly IFileStorageService _fileStorage;
        private readonly IImageFileValidator _imageValidator;
        private readonly IEmailService _emailService;

        private const long MaxVideoSize = 50 * 1024 * 1024;

        public ReviewService(
            AppDbContext context,
            IFileStorageService fileStorage,
            IImageFileValidator imageValidator,
            IEmailService emailService)
        {
            _context = context;
            _fileStorage = fileStorage;
            _imageValidator = imageValidator;
            _emailService = emailService;
        }

        private ReviewResponseDto MapToDto(Review r)
        {
            return new ReviewResponseDto
            {
                Id = r.Id,
                ProductId = r.ProductId,
                ProductName = r.Product?.Name ?? string.Empty,
                CustomerName = r.Customer?.Name ?? string.Empty,
                Rating = r.Rating,
                Text = r.Text,
                CreatedAt = r.CreatedAt,
                IsVerifiedPurchase = r.IsVerifiedPurchase,
                IsAdmin = r.Customer?.Role?.Name == "Admin",
                HelpfulCount = r.HelpfulCount,
                Media = r.Media.Select(m => new ReviewMediaDto
                {
                    Id = m.Id,
                    ObjectKey = m.ObjectKey,
                    FileName = m.FileName,
                    ContentType = m.ContentType,
                    MediaType = m.MediaType,
                    FileSize = m.FileSize
                }).ToList()
            };
        }

        public async Task<ReviewResponseDto?> CreateReviewAsync(Guid customerId, CreateReviewDto dto)
        {
            var productExists = await _context.Products.AnyAsync(p => p.Id == dto.ProductId);

            if (!productExists) return null;

            var customer = await _context.Customers
                .Include(c => c.Role)
                .FirstOrDefaultAsync(c => c.Id == customerId);

            if (customer == null) return null;

            var isAdmin = customer.Role.Name == "Admin";

            var existingReview = await _context.Reviews
                .AnyAsync(r => r.ProductId == dto.ProductId && r.CustomerId == customerId);

            if (existingReview && !isAdmin) return null;

            var hasPurchased = await _context.OrderItems
                .Include(oi => oi.Order)
                .AnyAsync(oi => oi.ProductId == dto.ProductId &&
                               oi.Order.CustomerId == customerId &&
                               oi.Order.Status == Models.Orders.OrderStatus.Delivered);

            if (!isAdmin && !hasPurchased) return null;

            var review = new Review
            {
                ProductId = dto.ProductId,
                CustomerId = customerId,
                Rating = dto.Rating,
                Text = dto.Text,
                IsVerifiedPurchase = hasPurchased || isAdmin,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            var savedReview = await _context.Reviews
                .AsNoTracking()
                .Include(r => r.Product)
                .Include(r => r.Customer)
                    .ThenInclude(c => c.Role)
                .Include(r => r.Media)
                .FirstOrDefaultAsync(r => r.Id == review.Id);

            return savedReview != null ? MapToDto(savedReview) : null;
        }

        public async Task<IEnumerable<ReviewResponseDto>> GetProductReviewsAsync(int productId, int? rating = null)
        {
            var query = _context.Reviews
                .AsNoTracking()
                .Include(r => r.Product)
                .Include(r => r.Customer)
                    .ThenInclude(c => c.Role)
                .Include(r => r.Media)
                .Where(r => r.ProductId == productId);

            if (rating.HasValue)
            {
                query = query.Where(r => r.Rating == rating.Value);
            }

            var reviews = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
            return reviews.Select(r => MapToDto(r)).ToList();
        }

        public async Task<IEnumerable<ReviewResponseDto>> GetMyReviewsAsync(Guid customerId)
        {
            var reviews = await _context.Reviews
                .AsNoTracking()
                .Include(r => r.Product)
                .Include(r => r.Customer)
                    .ThenInclude(c => c.Role)
                .Include(r => r.Media)
                .Where(r => r.CustomerId == customerId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return reviews.Select(r => MapToDto(r)).ToList();
        }

        public async Task<ProductReviewSummaryDto> GetProductReviewSummaryAsync(int productId)
        {
            var reviews = await _context.Reviews
                .AsNoTracking()
                .Where(r => r.ProductId == productId)
                .ToListAsync();

            if (reviews.Count == 0)
            {
                return new ProductReviewSummaryDto
                {
                    AverageRating = 0,
                    TotalReviews = 0,
                    RatingDistribution = new Dictionary<int, int>()
                };
            }

            return new ProductReviewSummaryDto
            {
                AverageRating = reviews.Average(r => r.Rating),
                TotalReviews = reviews.Count,
                RatingDistribution = new Dictionary<int, int>
                {
                    [1] = reviews.Count(r => r.Rating == 1),
                    [2] = reviews.Count(r => r.Rating == 2),
                    [3] = reviews.Count(r => r.Rating == 3),
                    [4] = reviews.Count(r => r.Rating == 4),
                    [5] = reviews.Count(r => r.Rating == 5)
                }
            };
        }

        public async Task<ReviewResponseDto?> GetReviewByIdAsync(int reviewId)
        {
            var review = await _context.Reviews
                .AsNoTracking()
                .Include(r => r.Product)
                .Include(r => r.Customer)
                    .ThenInclude(c => c.Role)
                .Include(r => r.Media)
                .FirstOrDefaultAsync(r => r.Id == reviewId);

            return review != null ? MapToDto(review) : null;
        }

        public async Task<ReviewMediaDto?> GetMediaAsync(int reviewId, int mediaId)
        {
            var media = await _context.ReviewMedia
                .AsNoTracking()
                .SingleOrDefaultAsync(m => m.Id == mediaId && m.ReviewId == reviewId);

            if (media == null) return null;

            return new ReviewMediaDto
            {
                Id = media.Id,
                ObjectKey = media.ObjectKey,
                FileName = media.FileName,
                ContentType = media.ContentType,
                MediaType = media.MediaType,
                FileSize = media.FileSize
            };
        }

        public async Task<bool> CanReviewAsync(Guid customerId, int productId)
        {
            var customer = await _context.Customers
                .Include(c => c.Role)
                .FirstOrDefaultAsync(c => c.Id == customerId);

            if (customer == null) return false;
            if (customer.Role.Name == "Admin") return true;

            return await _context.OrderItems
                .Include(oi => oi.Order)
                .AnyAsync(oi => oi.ProductId == productId &&
                               oi.Order.CustomerId == customerId &&
                               oi.Order.Status == Models.Orders.OrderStatus.Delivered);
        }

        public async Task<bool> UpdateReviewAsync(Guid customerId, int reviewId, UpdateReviewDto dto)
        {
            var review = await _context.Reviews
                .SingleOrDefaultAsync(r => r.Id == reviewId && r.CustomerId == customerId);

            if (review == null) return false;

            review.Rating = dto.Rating;
            review.Text = dto.Text;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteReviewAsync(Guid customerId, int reviewId)
        {
            var customer = await _context.Customers
                .Include(c => c.Role)
                .FirstOrDefaultAsync(c => c.Id == customerId);

            if (customer == null) return false;

            var isAdmin = customer.Role.Name == "Admin";

            var review = await _context.Reviews
                .Include(r => r.Media)
                .SingleOrDefaultAsync(r => r.Id == reviewId && (isAdmin || r.CustomerId == customerId));

            if (review == null) return false;

            foreach (var media in review.Media)
            {
                await _fileStorage.DeleteAsync(media.ObjectKey, CancellationToken.None);
            }

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<ReviewMediaDto?> UploadMediaAsync(Guid customerId, int reviewId, IFormFile file)
        {
            var review = await _context.Reviews
                .SingleOrDefaultAsync(r => r.Id == reviewId && r.CustomerId == customerId);

            if (review == null) return null;

            var isImage = file.ContentType.StartsWith("image/");
            var isVideo = file.ContentType.StartsWith("video/");

            if (!isImage && !isVideo) return null;

            if (isImage)
            {
                var validationError = _imageValidator.Validate(file);
                if (validationError != null) return null;
            }

            if (isVideo && file.Length > MaxVideoSize) return null;

            var objectKey = $"reviews/{reviewId}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

            using var stream = file.OpenReadStream();
            await _fileStorage.UploadAsync(stream, objectKey, file.ContentType, CancellationToken.None);

            var media = new ReviewMedia
            {
                ReviewId = reviewId,
                ObjectKey = objectKey,
                FileName = file.FileName,
                ContentType = file.ContentType,
                MediaType = isVideo ? "video" : "photo",
                FileSize = file.Length
            };

            _context.ReviewMedia.Add(media);
            await _context.SaveChangesAsync();

            return new ReviewMediaDto
            {
                Id = media.Id,
                ObjectKey = media.ObjectKey,
                FileName = media.FileName,
                ContentType = media.ContentType,
                MediaType = media.MediaType,
                FileSize = media.FileSize
            };
        }

        public async Task<bool> DeleteMediaAsync(Guid customerId, int reviewId, int mediaId)
        {
            var customer = await _context.Customers
                .Include(c => c.Role)
                .FirstOrDefaultAsync(c => c.Id == customerId);

            if (customer == null) return false;

            var isAdmin = customer.Role.Name == "Admin";

            var media = await _context.ReviewMedia
                .Include(m => m.Review)
                .SingleOrDefaultAsync(m => m.Id == mediaId &&
                                          m.ReviewId == reviewId &&
                                          (isAdmin || m.Review.CustomerId == customerId));

            if (media == null) return false;

            await _fileStorage.DeleteAsync(media.ObjectKey, CancellationToken.None);
            _context.ReviewMedia.Remove(media);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> MarkHelpfulAsync(Guid customerId, int reviewId)
        {
            var existing = await _context.ReviewHelpfuls
                .AnyAsync(h => h.ReviewId == reviewId && h.CustomerId == customerId);

            if (existing) return true;

            var review = await _context.Reviews.FindAsync(reviewId);
            if (review == null) return false;

            review.HelpfulCount++;
            _context.ReviewHelpfuls.Add(new ReviewHelpful
            {
                ReviewId = reviewId,
                CustomerId = customerId
            });
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ReportReviewAsync(Guid customerId, int reviewId)
        {
            var existing = await _context.ReviewReports
                .AnyAsync(r => r.ReviewId == reviewId && r.CustomerId == customerId);

            if (existing) return true;

            var review = await _context.Reviews
                .Include(r => r.Product)
                .Include(r => r.Customer)
                .FirstOrDefaultAsync(r => r.Id == reviewId);

            if (review == null) return false;

            _context.ReviewReports.Add(new ReviewReport
            {
                ReviewId = reviewId,
                CustomerId = customerId
            });

            await _emailService.SendReviewReportAsync(review);
            await _emailService.SendReviewReportConfirmationAsync(review.Customer.Email);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> HasMarkedHelpfulAsync(Guid customerId, int reviewId)
        {
            return await _context.ReviewHelpfuls
                .AnyAsync(h => h.ReviewId == reviewId && h.CustomerId == customerId);
        }

        public async Task<bool> HasReportedAsync(Guid customerId, int reviewId)
        {
            return await _context.ReviewReports
                .AnyAsync(r => r.ReviewId == reviewId && r.CustomerId == customerId);
        }
    }
}