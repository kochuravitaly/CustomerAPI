using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Home;
using WebApplication2.DTOs.Products;
using WebApplication2.Models.Home;
using WebApplication2.Models.Products;
using WebApplication2.Models.Translations;
using WebApplication2.Services.Translation.Interfaces;

namespace WebApplication2.Services.Home
{
    public class HomeSectionService : IHomeSectionService
    {
        private readonly AppDbContext _context;
        private readonly ITranslationService _translationService;

        public HomeSectionService(AppDbContext context, ITranslationService translationService)
        {
            _context = context;
            _translationService = translationService;
        }

        private async Task SaveTranslationsAsync(int sectionId, string title)
        {
            var languages = new[] { "ru", "de" };
            var translations = await _translationService.TranslateAsync(title, languages);

            foreach (var lang in languages)
            {
                _context.HomeSectionTranslations.Add(new HomeSectionTranslation
                {
                    HomeSectionId = sectionId,
                    LanguageCode = lang,
                    Title = translations[lang]
                });
            }
        }

        public async Task<IEnumerable<HomeSectionResponseDto>> GetActiveSectionsAsync()
        {
            var sections = await _context.HomeSections
                .Where(s => s.IsActive)
                .OrderBy(s => s.DisplayOrder)
                .Include(s => s.Translations)
                .ToListAsync();

            return sections.Select(s => new HomeSectionResponseDto
            {
                Id = s.Id,
                Title = s.Title,
                DisplayOrder = s.DisplayOrder,
                ProductsToShow = s.ProductsToShow,
                IsActive = s.IsActive,
                FilterJson = s.FilterJson,
                TitleTranslations = s.Translations.ToDictionary(t => t.LanguageCode, t => t.Title)
            });
        }

        public async Task<IEnumerable<HomeSectionResponseDto>> GetAllSectionsAsync()
        {
            var sections = await _context.HomeSections
                .OrderBy(s => s.DisplayOrder)
                .Include(s => s.Translations)
                .ToListAsync();

            return sections.Select(s => new HomeSectionResponseDto
            {
                Id = s.Id,
                Title = s.Title,
                DisplayOrder = s.DisplayOrder,
                ProductsToShow = s.ProductsToShow,
                IsActive = s.IsActive,
                FilterJson = s.FilterJson,
                TitleTranslations = s.Translations.ToDictionary(t => t.LanguageCode, t => t.Title)
            });
        }

        public async Task<HomeSectionResponseDto?> CreateSectionAsync(CreateHomeSectionDto dto)
        {
            var maxOrder = await _context.HomeSections.MaxAsync(s => (int?)s.DisplayOrder) ?? 0;

            var section = new HomeSection
            {
                Title = dto.Title,
                DisplayOrder = maxOrder + 1,
                ProductsToShow = dto.ProductsToShow,
                FilterJson = dto.FilterJson,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.HomeSections.Add(section);
            await _context.SaveChangesAsync();

            await SaveTranslationsAsync(section.Id, section.Title);
            await _context.SaveChangesAsync();

            return new HomeSectionResponseDto
            {
                Id = section.Id,
                Title = section.Title,
                DisplayOrder = section.DisplayOrder,
                ProductsToShow = section.ProductsToShow,
                IsActive = section.IsActive,
                FilterJson = section.FilterJson
            };
        }

        public async Task<HomeSectionResponseDto?> UpdateSectionAsync(int id, CreateHomeSectionDto dto)
        {
            var section = await _context.HomeSections.FindAsync(id);
            if (section == null) return null;

            section.Title = dto.Title;
            section.ProductsToShow = dto.ProductsToShow;
            section.FilterJson = dto.FilterJson;

            await _context.SaveChangesAsync();

            var existingTranslations = await _context.HomeSectionTranslations
                .Where(t => t.HomeSectionId == id)
                .ToListAsync();
            _context.HomeSectionTranslations.RemoveRange(existingTranslations);

            await SaveTranslationsAsync(section.Id, section.Title);
            await _context.SaveChangesAsync();

            return new HomeSectionResponseDto
            {
                Id = section.Id,
                Title = section.Title,
                DisplayOrder = section.DisplayOrder,
                ProductsToShow = section.ProductsToShow,
                IsActive = section.IsActive,
                FilterJson = section.FilterJson
            };
        }

        public async Task<bool> DeleteSectionAsync(int id)
        {
            var section = await _context.HomeSections.FindAsync(id);
            if (section == null) return false;

            _context.HomeSections.Remove(section);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<PagedResponseDto<ProductResponseDto>> GetSectionProductsAsync(int sectionId, int page = 1, int pageSize = 4)
        {
            var section = await _context.HomeSections.FindAsync(sectionId);
            if (section == null) return new PagedResponseDto<ProductResponseDto>();

            IQueryable<Product> query;

            if (section.Title == "Best Sellers")
            {
                query = _context.Products
                    .AsNoTracking()
                    .Where(p => p.OrderItems.Any())
                    .OrderByDescending(p => p.OrderItems.Count);
            }
            else
            {
                query = _context.Products.AsNoTracking();

                var filters = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(section.FilterJson);

                if (filters != null)
                {
                    if (filters.TryGetValue("gender", out var gender) && gender.ValueKind == JsonValueKind.Number)
                    {
                        var genderValue = gender.GetInt32();
                        query = query.Where(p => p.Gender.HasValue && (int)p.Gender.Value == genderValue);
                    }

                    if (filters.TryGetValue("season", out var season) && season.ValueKind == JsonValueKind.Number)
                    {
                        var seasonValue = season.GetInt32();
                        query = query.Where(p => p.Season.HasValue && (int)p.Season.Value == seasonValue);
                    }

                    if (filters.TryGetValue("ageGroup", out var ageGroup) && ageGroup.ValueKind == JsonValueKind.Number)
                    {
                        var ageGroupValue = ageGroup.GetInt32();
                        query = query.Where(p => p.AgeGroup.HasValue && (int)p.AgeGroup.Value == ageGroupValue);
                    }

                    if (filters.TryGetValue("materialId", out var materialId) && materialId.ValueKind == JsonValueKind.Number)
                    {
                        var materialValue = materialId.GetInt32();
                        query = query.Where(p => p.MaterialId == materialValue);
                    }

                    if (filters.TryGetValue("styleId", out var styleId) && styleId.ValueKind == JsonValueKind.Number)
                    {
                        var styleValue = styleId.GetInt32();
                        query = query.Where(p => p.StyleId == styleValue);
                    }

                    if (filters.TryGetValue("occasionId", out var occasionId) && occasionId.ValueKind == JsonValueKind.Number)
                    {
                        var occasionValue = occasionId.GetInt32();
                        query = query.Where(p => p.OccasionId == occasionValue);
                    }

                    if (filters.TryGetValue("patternId", out var patternId) && patternId.ValueKind == JsonValueKind.Number)
                    {
                        var patternValue = patternId.GetInt32();
                        query = query.Where(p => p.PatternId == patternValue);
                    }
                }

                query = query.OrderByDescending(p => p.CreatedAt);
            }

            var totalCount = await query.CountAsync();

            var products = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(p => p.Category)
                .Include(p => p.ProductImages)
                .Include(p => p.Translations)
                .ToListAsync();

            var items = products.Select(p => new ProductResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                StockQuantity = p.StockQuantity,
                CategoryId = p.CategoryId,
                CategoryName = p.Category?.Name ?? "",
                Gender = p.Gender,
                Season = p.Season,
                AgeGroup = p.AgeGroup,
                MaterialId = p.MaterialId,
                StyleId = p.StyleId,
                OccasionId = p.OccasionId,
                PatternId = p.PatternId,
                SeasonsJson = p.SeasonsJson,
                AgeGroupsJson = p.AgeGroupsJson,
                MaterialCompositionJson = p.MaterialCompositionJson,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                Images = p.ProductImages.OrderBy(i => i.SortOrder).Select(i => new ProductImageResponseDto
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
                }).ToList(),
                NameTranslations = p.Translations.ToDictionary(t => t.LanguageCode, t => t.Name),
                DescriptionTranslations = p.Translations.ToDictionary(t => t.LanguageCode, t => t.Description)
            }).ToList();

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