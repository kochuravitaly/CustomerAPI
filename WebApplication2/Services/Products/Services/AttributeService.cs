using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Products;
using WebApplication2.Models.Products;
using WebApplication2.Models.Translations;
using WebApplication2.Services.Products.Interfaces;
using WebApplication2.Services.Translation.Interfaces;

namespace WebApplication2.Services.Products.Services
{
    public class AttributeService : IAttributeService
    {
        private readonly AppDbContext _context;
        private readonly ITranslationService _translationService;

        public AttributeService(AppDbContext context, ITranslationService translationService)
        {
            _context = context;
            _translationService = translationService;
        }

        public async Task<IEnumerable<ProductAttributeDto>> GetMaterialsAsync(string languageCode = "en")
        {
            var materials = await _context.ProductMaterials
                .AsNoTracking()
                .Include(m => m.Translations)
                .ToListAsync();

            return materials.Select(m => new ProductAttributeDto
            {
                Id = m.Id,
                Name = languageCode == "en"
                    ? m.Name
                    : m.Translations.FirstOrDefault(t => t.LanguageCode == languageCode)?.Name ?? m.Name
            });
        }

        public async Task<IEnumerable<ProductAttributeDto>> GetStylesAsync(string languageCode = "en")
        {
            var styles = await _context.ProductStyles
                .AsNoTracking()
                .Include(s => s.Translations)
                .ToListAsync();

            return styles.Select(s => new ProductAttributeDto
            {
                Id = s.Id,
                Name = languageCode == "en"
                    ? s.Name
                    : s.Translations.FirstOrDefault(t => t.LanguageCode == languageCode)?.Name ?? s.Name
            });
        }

        public async Task<IEnumerable<ProductAttributeDto>> GetOccasionsAsync(string languageCode = "en")
        {
            var occasions = await _context.ProductOccasions
                .AsNoTracking()
                .Include(o => o.Translations)
                .ToListAsync();

            return occasions.Select(o => new ProductAttributeDto
            {
                Id = o.Id,
                Name = languageCode == "en"
                    ? o.Name
                    : o.Translations.FirstOrDefault(t => t.LanguageCode == languageCode)?.Name ?? o.Name
            });
        }

        public async Task<IEnumerable<ProductAttributeDto>> GetPatternsAsync(string languageCode = "en")
        {
            var patterns = await _context.ProductPatterns
                .AsNoTracking()
                .Include(p => p.Translations)
                .ToListAsync();

            return patterns.Select(p => new ProductAttributeDto
            {
                Id = p.Id,
                Name = languageCode == "en"
                    ? p.Name
                    : p.Translations.FirstOrDefault(t => t.LanguageCode == languageCode)?.Name ?? p.Name
            });
        }

        public async Task<ProductAttributeDto?> CreateMaterialAsync(CreateProductAttributeDto dto)
        {
            var material = new ProductMaterial { Name = dto.Name };
            _context.ProductMaterials.Add(material);
            await _context.SaveChangesAsync();

            var hasTranslations = await _context.MaterialTranslations
                .AnyAsync(t => t.MaterialId == material.Id);

            if (!hasTranslations)
            {
                var languages = new[] { "en", "ru", "de" };
                var translations = await _translationService.TranslateAsync(dto.Name, languages);

                foreach (var lang in languages)
                {
                    _context.MaterialTranslations.Add(new MaterialTranslation
                    {
                        MaterialId = material.Id,
                        LanguageCode = lang,
                        Name = translations[lang]
                    });
                }

                await _context.SaveChangesAsync();
            }

            return new ProductAttributeDto { Id = material.Id, Name = material.Name };
        }

        public async Task<ProductAttributeDto?> CreateStyleAsync(CreateProductAttributeDto dto)
        {
            var style = new ProductStyle { Name = dto.Name };
            _context.ProductStyles.Add(style);
            await _context.SaveChangesAsync();

            var hasTranslations = await _context.StyleTranslations
                .AnyAsync(t => t.StyleId == style.Id);

            if (!hasTranslations)
            {
                var languages = new[] { "en", "ru", "de" };
                var translations = await _translationService.TranslateAsync(dto.Name, languages);

                foreach (var lang in languages)
                {
                    _context.StyleTranslations.Add(new StyleTranslation
                    {
                        StyleId = style.Id,
                        LanguageCode = lang,
                        Name = translations[lang]
                    });
                }

                await _context.SaveChangesAsync();
            }

            return new ProductAttributeDto { Id = style.Id, Name = style.Name };
        }

        public async Task<ProductAttributeDto?> CreateOccasionAsync(CreateProductAttributeDto dto)
        {
            var occasion = new ProductOccasion { Name = dto.Name };
            _context.ProductOccasions.Add(occasion);
            await _context.SaveChangesAsync();

            var hasTranslations = await _context.OccasionTranslations
                .AnyAsync(t => t.OccasionId == occasion.Id);

            if (!hasTranslations)
            {
                var languages = new[] { "en", "ru", "de" };
                var translations = await _translationService.TranslateAsync(dto.Name, languages);

                foreach (var lang in languages)
                {
                    _context.OccasionTranslations.Add(new OccasionTranslation
                    {
                        OccasionId = occasion.Id,
                        LanguageCode = lang,
                        Name = translations[lang]
                    });
                }

                await _context.SaveChangesAsync();
            }

            return new ProductAttributeDto { Id = occasion.Id, Name = occasion.Name };
        }

        public async Task<ProductAttributeDto?> CreatePatternAsync(CreateProductAttributeDto dto)
        {
            var pattern = new ProductPattern { Name = dto.Name };
            _context.ProductPatterns.Add(pattern);
            await _context.SaveChangesAsync();

            var hasTranslations = await _context.PatternTranslations
                .AnyAsync(t => t.PatternId == pattern.Id);

            if (!hasTranslations)
            {
                var languages = new[] { "en", "ru", "de" };
                var translations = await _translationService.TranslateAsync(dto.Name, languages);

                foreach (var lang in languages)
                {
                    _context.PatternTranslations.Add(new PatternTranslation
                    {
                        PatternId = pattern.Id,
                        LanguageCode = lang,
                        Name = translations[lang]
                    });
                }

                await _context.SaveChangesAsync();
            }

            return new ProductAttributeDto { Id = pattern.Id, Name = pattern.Name };
        }

        public async Task<bool> UpdateMaterialAsync(int id, CreateProductAttributeDto dto)
        {
            var material = await _context.ProductMaterials.FindAsync(id);
            if (material == null) return false;

            material.Name = dto.Name;
            await _context.SaveChangesAsync();

            var hasTranslations = await _context.MaterialTranslations
                .AnyAsync(t => t.MaterialId == id);

            if (!hasTranslations)
            {
                var languages = new[] { "en", "ru", "de" };
                var translations = await _translationService.TranslateAsync(dto.Name, languages);

                foreach (var lang in languages)
                {
                    _context.MaterialTranslations.Add(new MaterialTranslation
                    {
                        MaterialId = id,
                        LanguageCode = lang,
                        Name = translations[lang]
                    });
                }

                await _context.SaveChangesAsync();
            }

            return true;
        }

        public async Task<bool> UpdateStyleAsync(int id, CreateProductAttributeDto dto)
        {
            var style = await _context.ProductStyles.FindAsync(id);
            if (style == null) return false;

            style.Name = dto.Name;
            await _context.SaveChangesAsync();

            var hasTranslations = await _context.StyleTranslations
                .AnyAsync(t => t.StyleId == id);

            if (!hasTranslations)
            {
                var languages = new[] { "en", "ru", "de" };
                var translations = await _translationService.TranslateAsync(dto.Name, languages);

                foreach (var lang in languages)
                {
                    _context.StyleTranslations.Add(new StyleTranslation
                    {
                        StyleId = id,
                        LanguageCode = lang,
                        Name = translations[lang]
                    });
                }

                await _context.SaveChangesAsync();
            }

            return true;
        }

        public async Task<bool> UpdateOccasionAsync(int id, CreateProductAttributeDto dto)
        {
            var occasion = await _context.ProductOccasions.FindAsync(id);
            if (occasion == null) return false;

            occasion.Name = dto.Name;
            await _context.SaveChangesAsync();

            var hasTranslations = await _context.OccasionTranslations
                .AnyAsync(t => t.OccasionId == id);

            if (!hasTranslations)
            {
                var languages = new[] { "en", "ru", "de" };
                var translations = await _translationService.TranslateAsync(dto.Name, languages);

                foreach (var lang in languages)
                {
                    _context.OccasionTranslations.Add(new OccasionTranslation
                    {
                        OccasionId = id,
                        LanguageCode = lang,
                        Name = translations[lang]
                    });
                }

                await _context.SaveChangesAsync();
            }

            return true;
        }

        public async Task<bool> UpdatePatternAsync(int id, CreateProductAttributeDto dto)
        {
            var pattern = await _context.ProductPatterns.FindAsync(id);
            if (pattern == null) return false;

            pattern.Name = dto.Name;
            await _context.SaveChangesAsync();

            var hasTranslations = await _context.PatternTranslations
                .AnyAsync(t => t.PatternId == id);

            if (!hasTranslations)
            {
                var languages = new[] { "en", "ru", "de" };
                var translations = await _translationService.TranslateAsync(dto.Name, languages);

                foreach (var lang in languages)
                {
                    _context.PatternTranslations.Add(new PatternTranslation
                    {
                        PatternId = id,
                        LanguageCode = lang,
                        Name = translations[lang]
                    });
                }

                await _context.SaveChangesAsync();
            }

            return true;
        }

        public async Task<bool> DeleteMaterialAsync(int id)
        {
            var material = await _context.ProductMaterials.FindAsync(id);
            if (material == null) return false;

            _context.ProductMaterials.Remove(material);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteStyleAsync(int id)
        {
            var style = await _context.ProductStyles.FindAsync(id);
            if (style == null) return false;

            _context.ProductStyles.Remove(style);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteOccasionAsync(int id)
        {
            var occasion = await _context.ProductOccasions.FindAsync(id);
            if (occasion == null) return false;

            _context.ProductOccasions.Remove(occasion);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeletePatternAsync(int id)
        {
            var pattern = await _context.ProductPatterns.FindAsync(id);
            if (pattern == null) return false;

            _context.ProductPatterns.Remove(pattern);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}