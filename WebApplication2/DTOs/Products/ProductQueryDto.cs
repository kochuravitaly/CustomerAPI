namespace WebApplication2.DTOs.Products
{
    public class ProductQueryDto
    {
        public string? Search { get; set; }
        public int? CategoryId { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public string SortBy { get; set; } = "createdAt";
        public string SortDirection { get; set; } = "desc";
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public List<int>? ColorIds { get; set; }
        public List<string>? Sizes { get; set; }
        public List<int>? Genders { get; set; }
        public List<int>? Seasons { get; set; }
        public List<int>? AgeGroups { get; set; }
        public List<int>? MaterialIds { get; set; }
        public List<int>? StyleIds { get; set; }
        public List<int>? OccasionIds { get; set; }
        public List<int>? PatternIds { get; set; }
        public double? MinRating { get; set; }
    }
}