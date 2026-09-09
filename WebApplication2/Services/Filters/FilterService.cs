using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Filters;
using WebApplication2.Models.Products;

namespace WebApplication2.Services.Filters
{
    public class FilterService : IFilterService
    {
        private readonly AppDbContext _context;

        public FilterService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<FilterOptionsDto> GetFilterOptionsAsync()
        {
            var colors = await _context.ProductColors
                .Include(c => c.Translations)
                .ToListAsync();

            var colorDtos = colors.Select(c => new ColorFilterDto
            {
                Id = c.Id,
                Name = c.Name,
                HexCode = c.HexCode,
                NameTranslations = c.Translations.ToDictionary(t => t.LanguageCode, t => t.Name)
            }).ToList();

            var sizes = await _context.ProductSizes
                .Select(s => s.Name)
                .Distinct()
                .ToListAsync();

            var sizeDtos = sizes.Select(s => new SizeFilterDto { Name = s }).ToList();

            var minPrice = await _context.Products.MinAsync(p => p.Price);
            var maxPrice = await _context.Products.MaxAsync(p => p.Price);

            var materials = await _context.ProductMaterials
                .Include(m => m.Translations)
                .ToListAsync();

            var materialDtos = materials.Select(m => new AttributeFilterDto
            {
                Id = m.Id,
                Name = m.Name,
                NameTranslations = m.Translations.ToDictionary(t => t.LanguageCode, t => t.Name)
            }).ToList();

            var styles = await _context.ProductStyles
                .Include(s => s.Translations)
                .ToListAsync();

            var styleDtos = styles.Select(s => new AttributeFilterDto
            {
                Id = s.Id,
                Name = s.Name,
                NameTranslations = s.Translations.ToDictionary(t => t.LanguageCode, t => t.Name)
            }).ToList();

            var occasions = await _context.ProductOccasions
                .Include(o => o.Translations)
                .ToListAsync();

            var occasionDtos = occasions.Select(o => new AttributeFilterDto
            {
                Id = o.Id,
                Name = o.Name,
                NameTranslations = o.Translations.ToDictionary(t => t.LanguageCode, t => t.Name)
            }).ToList();

            var patterns = await _context.ProductPatterns
                .Include(p => p.Translations)
                .ToListAsync();

            var patternDtos = patterns.Select(p => new AttributeFilterDto
            {
                Id = p.Id,
                Name = p.Name,
                NameTranslations = p.Translations.ToDictionary(t => t.LanguageCode, t => t.Name)
            }).ToList();

            return new FilterOptionsDto
            {
                Colors = colorDtos,
                Sizes = sizeDtos,
                Genders = Enum.GetValues<ProductGender>()
                    .Select(g => new GenderFilterDto { Value = (int)g, Name = g.ToString() })
                    .ToList(),
                Seasons = Enum.GetValues<ProductSeason>()
                    .Select(s => new SeasonFilterDto { Value = (int)s, Name = s.ToString() })
                    .ToList(),
                AgeGroups = Enum.GetValues<ProductAgeGroup>()
                    .Select(a => new AgeGroupFilterDto { Value = (int)a, Name = a.ToString() })
                    .ToList(),
                Materials = materialDtos,
                Styles = styleDtos,
                Occasions = occasionDtos,
                Patterns = patternDtos,
                MinPrice = minPrice,
                MaxPrice = maxPrice,
                MinRating = 1,
                MaxRating = 5
            };
        }
    }
}