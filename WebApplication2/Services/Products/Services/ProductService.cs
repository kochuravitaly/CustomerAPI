using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using WebApplication2.Data;
using WebApplication2.DTOs.Products;
using WebApplication2.Models.Products;
using WebApplication2.Models.Translations;
using WebApplication2.Services.Products.Interfaces;
using WebApplication2.Services.Translation.Interfaces;

namespace WebApplication2.Services.Products.Services
{
    public class ProductService : IProductService
    {
        private readonly AppDbContext _context;
        private readonly ITranslationService _translationService;

        public ProductService(AppDbContext context, ITranslationService translationService)
        {
            _context = context;
            _translationService = translationService;
        }

        private ProductResponseDto MapToDto(Product p)
        {
            return new ProductResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                StockQuantity = p.StockQuantity,
                CategoryId = p.CategoryId,
                CategoryName = p.Category?.Name ?? string.Empty,
                Gender = p.Gender,
                Season = p.Season,
                AgeGroup = p.AgeGroup,
                SeasonsJson = p.SeasonsJson,
                AgeGroupsJson = p.AgeGroupsJson,
                MaterialCompositionJson = p.MaterialCompositionJson,
                MaterialId = p.MaterialId,
                MaterialName = p.Material?.Name,
                MaterialNameTranslations = p.Material?.Translations.ToDictionary(t => t.LanguageCode, t => t.Name),
                StyleId = p.StyleId,
                StyleName = p.Style?.Name,
                StyleNameTranslations = p.Style?.Translations.ToDictionary(t => t.LanguageCode, t => t.Name),
                OccasionId = p.OccasionId,
                OccasionName = p.Occasion?.Name,
                OccasionNameTranslations = p.Occasion?.Translations.ToDictionary(t => t.LanguageCode, t => t.Name),
                PatternId = p.PatternId,
                PatternName = p.Pattern?.Name,
                PatternNameTranslations = p.Pattern?.Translations.ToDictionary(t => t.LanguageCode, t => t.Name),
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                Images = p.ProductImages
                    .OrderBy(i => i.SortOrder)
                    .Select(i => new ProductImageResponseDto
                    {
                        Id = i.Id,
                        ProductId = i.ProductId,
                        ColorId = i.ColorId,
                        FileName = i.FileName,
                        ContentType = i.ContentType,
                        FileSize = i.FileSize,
                        SortOrder = i.SortOrder,
                        IsMain = i.IsMain,
                        ObjectKey = i.ObjectKey
                    })
                    .ToList(),
                NameTranslations = p.Translations.ToDictionary(t => t.LanguageCode, t => t.Name),
                DescriptionTranslations = p.Translations.ToDictionary(t => t.LanguageCode, t => t.Description)
            };
        }

        private async Task SaveTranslationsAsync(int productId, string name, string? description)
        {
            var languages = new[] { "en", "ru", "de" };

            var nameTranslations = await _translationService.TranslateAsync(name, languages);
            var descriptionTranslations = description != null
                ? await _translationService.TranslateAsync(description, languages)
                : null;

            foreach (var lang in languages)
            {
                _context.ProductTranslations.Add(new ProductTranslation
                {
                    ProductId = productId,
                    LanguageCode = lang,
                    Name = nameTranslations[lang],
                    Description = descriptionTranslations?[lang]
                });
            }
        }

        private async Task<string> TranslateListJsonAsync(string json, string[] languages)
        {
            if (string.IsNullOrEmpty(json)) return "{}";

            try
            {
                var items = JsonSerializer.Deserialize<List<string>>(json);
                if (items == null || items.Count == 0) return "{}";

                var result = new Dictionary<string, List<string>>();

                foreach (var item in items)
                {
                    var translations = await _translationService.TranslateAsync(item, languages);
                    foreach (var lang in languages)
                    {
                        if (!result.ContainsKey(lang)) result[lang] = new List<string>();
                        result[lang].Add(translations[lang]);
                    }
                }

                return JsonSerializer.Serialize(result);
            }
            catch
            {
                return json;
            }
        }

        public async Task<ProductResponseDto?> CreateProductAsync(CreateProductDto dto)
        {
            var categoryExists = await _context.Categories
                .AnyAsync(c => c.Id == dto.CategoryId);

            if (!categoryExists)
                return null;

            var languages = new[] { "en", "ru", "de" };

            var product = new Product
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                StockQuantity = dto.StockQuantity,
                CategoryId = dto.CategoryId,
                Gender = dto.Gender,
                Season = dto.Season,
                AgeGroup = dto.AgeGroup,
                SeasonsJson = await TranslateListJsonAsync(dto.SeasonsJson, languages),
                AgeGroupsJson = await TranslateListJsonAsync(dto.AgeGroupsJson, languages),
                MaterialCompositionJson = dto.MaterialCompositionJson,
                MaterialId = dto.MaterialId,
                StyleId = dto.StyleId,
                OccasionId = dto.OccasionId,
                PatternId = dto.PatternId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            var hasTranslations = await _context.ProductTranslations
                .AnyAsync(t => t.ProductId == product.Id);

            if (!hasTranslations)
            {
                await SaveTranslationsAsync(product.Id, product.Name, product.Description);
                await _context.SaveChangesAsync();
            }

            return await GetProductByIdAsync(product.Id);
        }

        public async Task<ProductResponseDto?> GetProductByIdAsync(int id)
        {
            var product = await _context.Products
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.Material)
                    .ThenInclude(m => m.Translations)
                .Include(p => p.Style)
                    .ThenInclude(s => s.Translations)
                .Include(p => p.Occasion)
                    .ThenInclude(o => o.Translations)
                .Include(p => p.Pattern)
                    .ThenInclude(pt => pt.Translations)
                .Include(p => p.ProductImages)
                .Include(p => p.Translations)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return null;

            return MapToDto(product);
        }

        public async Task<bool> UpdateProductAsync(int id, UpdateProductDto dto)
        {
            var product = await _context.Products
                .SingleOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return false;

            if (dto.CategoryId.HasValue)
            {
                var categoryExists = await _context.Categories
                    .AnyAsync(c => c.Id == dto.CategoryId.Value);

                if (!categoryExists)
                    return false;

                product.CategoryId = dto.CategoryId.Value;
            }

            if (dto.Name is not null)
                product.Name = dto.Name;

            if (dto.Description is not null)
                product.Description = dto.Description;

            if (dto.Price.HasValue)
                product.Price = dto.Price.Value;

            if (dto.StockQuantity.HasValue)
                product.StockQuantity = dto.StockQuantity.Value;

            if (dto.Gender.HasValue)
                product.Gender = dto.Gender;

            if (dto.Season.HasValue)
                product.Season = dto.Season;

            if (dto.AgeGroup.HasValue)
                product.AgeGroup = dto.AgeGroup;

            if (dto.MaterialId.HasValue)
                product.MaterialId = dto.MaterialId;

            if (dto.StyleId.HasValue)
                product.StyleId = dto.StyleId;

            if (dto.OccasionId.HasValue)
                product.OccasionId = dto.OccasionId;

            if (dto.PatternId.HasValue)
                product.PatternId = dto.PatternId;

            var languages = new[] { "en", "ru", "de" };

            if (dto.SeasonsJson != null)
                product.SeasonsJson = await TranslateListJsonAsync(dto.SeasonsJson, languages);

            if (dto.AgeGroupsJson != null)
                product.AgeGroupsJson = await TranslateListJsonAsync(dto.AgeGroupsJson, languages);

            if (dto.MaterialCompositionJson != null)
                product.MaterialCompositionJson = dto.MaterialCompositionJson;

            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            if (dto.Name is not null || dto.Description is not null)
            {
                var hasTranslations = await _context.ProductTranslations
                    .AnyAsync(t => t.ProductId == id);

                if (!hasTranslations)
                {
                    await SaveTranslationsAsync(product.Id, product.Name, product.Description);
                    await _context.SaveChangesAsync();
                }
            }

            return true;
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var product = await _context.Products
                .SingleOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return false;

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<PagedResponseDto<ProductResponseDto>> GetAllProductsAsync(ProductQueryDto query)
        {
            var productsQuery = _context.Products.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.Trim();

                productsQuery = productsQuery
                    .Where(p =>
                        EF.Functions.ILike(p.Name, $"%{search}%") ||
                        EF.Functions.ILike(p.Description, $"%{search}%") ||
                        p.Translations.Any(t =>
                            EF.Functions.ILike(t.Name, $"%{search}%") ||
                            (t.Description != null && EF.Functions.ILike(t.Description, $"%{search}%"))
                        )
                    );
            }

            if (query.CategoryId.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.CategoryId == query.CategoryId.Value);
            }

            if (query.MinPrice.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.Price >= query.MinPrice.Value);
            }

            if (query.MaxPrice.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.Price <= query.MaxPrice.Value);
            }

            if (query.ColorIds != null && query.ColorIds.Count > 0)
            {
                productsQuery = productsQuery.Where(p => p.ProductColors.Any(c => query.ColorIds.Contains(c.Id)));
            }

            if (query.Sizes != null && query.Sizes.Count > 0)
            {
                productsQuery = productsQuery.Where(p => p.ProductSizes.Any(s => query.Sizes.Contains(s.Name)));
            }

            if (query.Genders != null && query.Genders.Count > 0)
            {
                productsQuery = productsQuery.Where(p => p.Gender.HasValue && query.Genders.Contains((int)p.Gender.Value));
            }

            if (query.Seasons != null && query.Seasons.Count > 0)
            {
                productsQuery = productsQuery.Where(p => p.Season.HasValue && query.Seasons.Contains((int)p.Season.Value));
            }

            if (query.AgeGroups != null && query.AgeGroups.Count > 0)
            {
                productsQuery = productsQuery.Where(p => p.AgeGroup.HasValue && query.AgeGroups.Contains((int)p.AgeGroup.Value));
            }

            if (query.MaterialIds != null && query.MaterialIds.Count > 0)
            {
                productsQuery = productsQuery.Where(p => p.MaterialId.HasValue && query.MaterialIds.Contains(p.MaterialId.Value));
            }

            if (query.StyleIds != null && query.StyleIds.Count > 0)
            {
                productsQuery = productsQuery.Where(p => p.StyleId.HasValue && query.StyleIds.Contains(p.StyleId.Value));
            }

            if (query.OccasionIds != null && query.OccasionIds.Count > 0)
            {
                productsQuery = productsQuery.Where(p => p.OccasionId.HasValue && query.OccasionIds.Contains(p.OccasionId.Value));
            }

            if (query.PatternIds != null && query.PatternIds.Count > 0)
            {
                productsQuery = productsQuery.Where(p => p.PatternId.HasValue && query.PatternIds.Contains(p.PatternId.Value));
            }

            if (query.MinRating.HasValue)
            {
                var minRating = query.MinRating.Value;
                productsQuery = productsQuery.Where(p =>
                    _context.Reviews.Any(r => r.ProductId == p.Id) &&
                    _context.Reviews.Where(r => r.ProductId == p.Id).Average(r => (double)r.Rating) >= minRating);
            }

            var totalCount = await productsQuery.CountAsync();

            productsQuery = query.SortBy.ToLower() switch
            {
                "name" => query.SortDirection.ToLower() == "asc"
                    ? productsQuery.OrderBy(p => p.Name)
                    : productsQuery.OrderByDescending(p => p.Name),
                "price" => query.SortDirection.ToLower() == "asc"
                    ? productsQuery.OrderBy(p => p.Price)
                    : productsQuery.OrderByDescending(p => p.Price),
                "rating" => query.SortDirection.ToLower() == "asc"
                    ? productsQuery.OrderBy(p =>
                        _context.Reviews.Where(r => r.ProductId == p.Id).Average(r => (double?)r.Rating) ?? 0)
                    : productsQuery.OrderByDescending(p =>
                        _context.Reviews.Where(r => r.ProductId == p.Id).Average(r => (double?)r.Rating) ?? 0),
                _ => query.SortDirection.ToLower() == "asc"
                    ? productsQuery.OrderBy(p => p.CreatedAt)
                    : productsQuery.OrderByDescending(p => p.CreatedAt)
            };

            var page = Math.Max(query.Page, 1);
            var pageSize = Math.Clamp(query.PageSize, 1, 100);

            var products = await productsQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(p => p.Category)
                .Include(p => p.Material)
                    .ThenInclude(m => m.Translations)
                .Include(p => p.Style)
                    .ThenInclude(s => s.Translations)
                .Include(p => p.Occasion)
                    .ThenInclude(o => o.Translations)
                .Include(p => p.Pattern)
                    .ThenInclude(pt => pt.Translations)
                .Include(p => p.ProductImages)
                .Include(p => p.Translations)
                .ToListAsync();

            var items = products.Select(p => MapToDto(p)).ToList();

            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            return new PagedResponseDto<ProductResponseDto>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };
        }

        public async Task<IEnumerable<ProductResponseDto>> GetBestSellersAsync()
        {
            var products = await _context.Products
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.Material)
                    .ThenInclude(m => m.Translations)
                .Include(p => p.Style)
                    .ThenInclude(s => s.Translations)
                .Include(p => p.Occasion)
                    .ThenInclude(o => o.Translations)
                .Include(p => p.Pattern)
                    .ThenInclude(pt => pt.Translations)
                .Include(p => p.ProductImages)
                .Include(p => p.Translations)
                .Include(p => p.OrderItems)
                .Where(p => p.OrderItems.Any())
                .OrderByDescending(p => p.OrderItems.Sum(oi => oi.Quantity))
                .Take(50)
                .ToListAsync();

            return products.Select(p => MapToDto(p)).ToList();
        }

        public async Task<List<RecommendationDto>> GetRecommendationsAsync(int productId)
        {
            var orderIds = await _context.OrderItems
                .Where(oi => oi.ProductId == productId)
                .Select(oi => oi.OrderId)
                .Distinct()
                .ToListAsync();

            if (!orderIds.Any())
                return new List<RecommendationDto>();

            var relatedProducts = await _context.OrderItems
                .Where(oi => orderIds.Contains(oi.OrderId) && oi.ProductId != productId)
                .GroupBy(oi => oi.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    TimesBoughtTogether = g.Count()
                })
                .OrderByDescending(x => x.TimesBoughtTogether)
                .Take(4)
                .ToListAsync();

            var productIds = relatedProducts.Select(x => x.ProductId).ToList();

            var products = await _context.Products
                .Include(p => p.ProductImages)
                .Include(p => p.Translations)
                .Where(p => productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            var result = new List<RecommendationDto>();

            foreach (var item in relatedProducts)
            {
                if (products.TryGetValue(item.ProductId, out var product))
                {
                    var mainImage = product.ProductImages
                        .OrderBy(i => i.SortOrder)
                        .FirstOrDefault(i => i.IsMain) ?? product.ProductImages.FirstOrDefault();

                    result.Add(new RecommendationDto
                    {
                        ProductId = product.Id,
                        ProductName = product.Name,
                        ProductNameTranslations = product.Translations.ToDictionary(t => t.LanguageCode, t => t.Name),
                        ProductDescription = product.Description,
                        ProductDescriptionTranslations = product.Translations.ToDictionary(t => t.LanguageCode, t => t.Description),
                        Price = product.Price,
                        StockQuantity = product.StockQuantity,
                        ImageUrl = mainImage != null
                            ? $"/api/products/{product.Id}/images/{mainImage.Id}"
                            : null,
                        Images = product.ProductImages
                            .OrderBy(i => i.SortOrder)
                            .Select(i => new ProductImageResponseDto
                            {
                                Id = i.Id,
                                ProductId = i.ProductId,
                                FileName = i.FileName,
                                ContentType = i.ContentType,
                                FileSize = i.FileSize,
                                SortOrder = i.SortOrder,
                                IsMain = i.IsMain,
                                ObjectKey = i.ObjectKey
                            })
                            .ToList(),
                        TimesBoughtTogether = item.TimesBoughtTogether
                    });
                }
            }

            return result;
        }

        public async Task<List<ProductSuggestionDto>> GetSuggestionsAsync(string search)
        {
            if (string.IsNullOrWhiteSpace(search) || search.Length < 1)
                return new List<ProductSuggestionDto>();

            var searchTerm = search.Trim();

            var products = await _context.Products
                .AsNoTracking()
                .Include(p => p.Translations)
                .ToListAsync();

            var suggestions = new List<ProductSuggestionDto>();
            var seenNames = new HashSet<string>();

            foreach (var product in products)
            {
                string? matchedName = null;

                if (product.Name.StartsWith(searchTerm, StringComparison.OrdinalIgnoreCase))
                {
                    matchedName = product.Name;
                }
                else
                {
                    foreach (var translation in product.Translations)
                    {
                        if (translation.Name.StartsWith(searchTerm, StringComparison.OrdinalIgnoreCase))
                        {
                            matchedName = translation.Name;
                            break;
                        }
                    }
                }

                if (matchedName != null)
                {
                    var key = matchedName.ToLower();
                    if (!seenNames.Contains(key))
                    {
                        seenNames.Add(key);
                        suggestions.Add(new ProductSuggestionDto
                        {
                            Id = product.Id,
                            Name = product.Name,
                            MatchedName = matchedName
                        });
                    }
                }
            }

            return suggestions.Take(5).ToList();
        }

        public async Task<List<RecommendationDto>> GetAllRecommendationsAsync(
            int productId,
            string? sortBy = null,
            string? sortDirection = "desc",
            decimal? minPrice = null,
            decimal? maxPrice = null,
            int? minTimesBought = null)
        {
            var orderIds = await _context.OrderItems
                .Where(oi => oi.ProductId == productId)
                .Select(oi => oi.OrderId)
                .Distinct()
                .ToListAsync();

            if (!orderIds.Any())
                return new List<RecommendationDto>();

            var relatedProductsQuery = _context.OrderItems
                .Where(oi => orderIds.Contains(oi.OrderId) && oi.ProductId != productId)
                .GroupBy(oi => oi.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    TimesBoughtTogether = g.Count()
                });

            if (minTimesBought.HasValue)
            {
                relatedProductsQuery = relatedProductsQuery.Where(x => x.TimesBoughtTogether >= minTimesBought.Value);
            }

            var relatedProducts = await relatedProductsQuery.ToListAsync();

            var productIds = relatedProducts.Select(x => x.ProductId).ToList();

            var productsQuery = _context.Products
                .Include(p => p.ProductImages)
                .Include(p => p.Translations)
                .Where(p => productIds.Contains(p.Id));

            if (minPrice.HasValue)
                productsQuery = productsQuery.Where(p => p.Price >= minPrice.Value);

            if (maxPrice.HasValue)
                productsQuery = productsQuery.Where(p => p.Price <= maxPrice.Value);

            var products = await productsQuery.ToDictionaryAsync(p => p.Id);

            var result = new List<RecommendationDto>();

            foreach (var item in relatedProducts)
            {
                if (products.TryGetValue(item.ProductId, out var product))
                {
                    var mainImage = product.ProductImages
                        .OrderBy(i => i.SortOrder)
                        .FirstOrDefault(i => i.IsMain) ?? product.ProductImages.FirstOrDefault();

                    result.Add(new RecommendationDto
                    {
                        ProductId = product.Id,
                        ProductName = product.Name,
                        ProductNameTranslations = product.Translations.ToDictionary(t => t.LanguageCode, t => t.Name),
                        ProductDescription = product.Description,
                        ProductDescriptionTranslations = product.Translations.ToDictionary(t => t.LanguageCode, t => t.Description),
                        Price = product.Price,
                        StockQuantity = product.StockQuantity,
                        ImageUrl = mainImage != null
                            ? $"/api/products/{product.Id}/images/{mainImage.Id}"
                            : null,
                        Images = product.ProductImages
                            .OrderBy(i => i.SortOrder)
                            .Select(i => new ProductImageResponseDto
                            {
                                Id = i.Id,
                                ProductId = i.ProductId,
                                FileName = i.FileName,
                                ContentType = i.ContentType,
                                FileSize = i.FileSize,
                                SortOrder = i.SortOrder,
                                IsMain = i.IsMain,
                                ObjectKey = i.ObjectKey
                            })
                            .ToList(),
                        TimesBoughtTogether = item.TimesBoughtTogether
                    });
                }
            }

            result = sortBy?.ToLower() switch
            {
                "price" => sortDirection?.ToLower() == "asc"
                    ? result.OrderBy(r => r.Price).ToList()
                    : result.OrderByDescending(r => r.Price).ToList(),
                _ => sortDirection?.ToLower() == "asc"
                    ? result.OrderBy(r => r.TimesBoughtTogether).ToList()
                    : result.OrderByDescending(r => r.TimesBoughtTogether).ToList()
            };

            return result;
        }

        public async Task<PagedResponseDto<ProductResponseDto>> GetSimilarProductsAsync(int productId, ProductQueryDto query)
        {
            var currentProduct = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (currentProduct == null)
                return new PagedResponseDto<ProductResponseDto>();

            var productsQuery = _context.Products
                .AsNoTracking()
                .Where(p => p.CategoryId == currentProduct.CategoryId && p.Id != productId);

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.Trim();
                productsQuery = productsQuery.Where(p =>
                    EF.Functions.ILike(p.Name, $"%{search}%") ||
                    EF.Functions.ILike(p.Description, $"%{search}%"));
            }

            if (query.MinPrice.HasValue)
                productsQuery = productsQuery.Where(p => p.Price >= query.MinPrice.Value);

            if (query.MaxPrice.HasValue)
                productsQuery = productsQuery.Where(p => p.Price <= query.MaxPrice.Value);

            if (query.ColorIds != null && query.ColorIds.Count > 0)
                productsQuery = productsQuery.Where(p => p.ProductColors.Any(c => query.ColorIds.Contains(c.Id)));

            if (query.Sizes != null && query.Sizes.Count > 0)
                productsQuery = productsQuery.Where(p => p.ProductSizes.Any(s => query.Sizes.Contains(s.Name)));

            if (query.Genders != null && query.Genders.Count > 0)
                productsQuery = productsQuery.Where(p => p.Gender.HasValue && query.Genders.Contains((int)p.Gender.Value));

            if (query.Seasons != null && query.Seasons.Count > 0)
                productsQuery = productsQuery.Where(p => p.Season.HasValue && query.Seasons.Contains((int)p.Season.Value));

            if (query.AgeGroups != null && query.AgeGroups.Count > 0)
                productsQuery = productsQuery.Where(p => p.AgeGroup.HasValue && query.AgeGroups.Contains((int)p.AgeGroup.Value));

            if (query.MaterialIds != null && query.MaterialIds.Count > 0)
                productsQuery = productsQuery.Where(p => p.MaterialId.HasValue && query.MaterialIds.Contains(p.MaterialId.Value));

            if (query.StyleIds != null && query.StyleIds.Count > 0)
                productsQuery = productsQuery.Where(p => p.StyleId.HasValue && query.StyleIds.Contains(p.StyleId.Value));

            if (query.OccasionIds != null && query.OccasionIds.Count > 0)
                productsQuery = productsQuery.Where(p => p.OccasionId.HasValue && query.OccasionIds.Contains(p.OccasionId.Value));

            if (query.PatternIds != null && query.PatternIds.Count > 0)
                productsQuery = productsQuery.Where(p => p.PatternId.HasValue && query.PatternIds.Contains(p.PatternId.Value));

            if (query.MinRating.HasValue)
            {
                var minRating = query.MinRating.Value;
                productsQuery = productsQuery.Where(p =>
                    _context.Reviews.Any(r => r.ProductId == p.Id) &&
                    _context.Reviews.Where(r => r.ProductId == p.Id).Average(r => (double)r.Rating) >= minRating);
            }

            var totalCount = await productsQuery.CountAsync();

            productsQuery = query.SortBy?.ToLower() switch
            {
                "price" => query.SortDirection?.ToLower() == "asc"
                    ? productsQuery.OrderBy(p => p.Price)
                    : productsQuery.OrderByDescending(p => p.Price),
                "name" => query.SortDirection?.ToLower() == "asc"
                    ? productsQuery.OrderBy(p => p.Name)
                    : productsQuery.OrderByDescending(p => p.Name),
                "rating" => query.SortDirection?.ToLower() == "asc"
                    ? productsQuery.OrderBy(p =>
                        _context.Reviews.Where(r => r.ProductId == p.Id).Average(r => (double?)r.Rating) ?? 0)
                    : productsQuery.OrderByDescending(p =>
                        _context.Reviews.Where(r => r.ProductId == p.Id).Average(r => (double?)r.Rating) ?? 0),
                _ => query.SortDirection?.ToLower() == "asc"
                    ? productsQuery.OrderBy(p => p.CreatedAt)
                    : productsQuery.OrderByDescending(p => p.CreatedAt)
            };

            var page = Math.Max(query.Page, 1);
            var pageSize = Math.Clamp(query.PageSize, 1, 100);

            var products = await productsQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(p => p.Category)
                .Include(p => p.Material)
                    .ThenInclude(m => m.Translations)
                .Include(p => p.Style)
                    .ThenInclude(s => s.Translations)
                .Include(p => p.Occasion)
                    .ThenInclude(o => o.Translations)
                .Include(p => p.Pattern)
                    .ThenInclude(pt => pt.Translations)
                .Include(p => p.ProductImages)
                .Include(p => p.Translations)
                .ToListAsync();

            var items = products.Select(p => MapToDto(p)).ToList();

            return new PagedResponseDto<ProductResponseDto>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };
        }
    }
}