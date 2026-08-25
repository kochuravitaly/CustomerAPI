using WebApplication2.DTOs.Reviews;

namespace WebApplication2.Services.Reviews
{
    public interface IReviewService
    {
        Task<ReviewResponseDto?> CreateReviewAsync(Guid customerId, CreateReviewDto dto);
        Task<IEnumerable<ReviewResponseDto>> GetProductReviewsAsync(int productId, int? rating = null);
        Task<IEnumerable<ReviewResponseDto>> GetMyReviewsAsync(Guid customerId);
        Task<ProductReviewSummaryDto> GetProductReviewSummaryAsync(int productId);
        Task<ReviewResponseDto?> GetReviewByIdAsync(int reviewId);
        Task<ReviewMediaDto?> GetMediaAsync(int reviewId, int mediaId);
        Task<bool> CanReviewAsync(Guid customerId, int productId);
        Task<bool> UpdateReviewAsync(Guid customerId, int reviewId, UpdateReviewDto dto);
        Task<bool> DeleteReviewAsync(Guid customerId, int reviewId);
        Task<ReviewMediaDto?> UploadMediaAsync(Guid customerId, int reviewId, IFormFile file);
        Task<bool> DeleteMediaAsync(Guid customerId, int reviewId, int mediaId);
        Task<bool> MarkHelpfulAsync(Guid customerId, int reviewId);
        Task<bool> ReportReviewAsync(Guid customerId, int reviewId);
        Task<bool> HasMarkedHelpfulAsync(Guid customerId, int reviewId);
        Task<bool> HasReportedAsync(Guid customerId, int reviewId);
    }
}