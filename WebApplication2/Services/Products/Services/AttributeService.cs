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

        private async Task SaveTranslationsAsync<TTranslation>(
            int entityId,
            string name,
            Action<TTranslation> configureTranslation) where TTranslation : class, new()
        {
            var languages = new[] { "ru", "de" };
            var translations = await _translationService.TranslateAsync(name, languages);

            foreach (var lang in languages)
            {
                var translation = new TTranslation();
                configureTranslation(translation);
                typeof(TTranslation).GetProperty("LanguageCode")?.SetValue(translation, lang);
                typeof(TTranslation).GetProperty("Name")?.SetValue(translation, translations[lang]);
                _context.Add(translation);
            }
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

            var languages = new[] { "ru", "de" };
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

            return new ProductAttributeDto { Id = material.Id, Name = material.Name };
        }

        public async Task<ProductAttributeDto?> CreateStyleAsync(CreateProductAttributeDto dto)
        {
            var style = new ProductStyle { Name = dto.Name };
            _context.ProductStyles.Add(style);
            await _context.SaveChangesAsync();

            var languages = new[] { "ru", "de" };
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

            return new ProductAttributeDto { Id = style.Id, Name = style.Name };
        }

        public async Task<ProductAttributeDto?> CreateOccasionAsync(CreateProductAttributeDto dto)
        {
            var occasion = new ProductOccasion { Name = dto.Name };
            _context.ProductOccasions.Add(occasion);
            await _context.SaveChangesAsync();

            var languages = new[] { "ru", "de" };
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

            return new ProductAttributeDto { Id = occasion.Id, Name = occasion.Name };
        }

        public async Task<ProductAttributeDto?> CreatePatternAsync(CreateProductAttributeDto dto)
        {
            var pattern = new ProductPattern { Name = dto.Name };
            _context.ProductPatterns.Add(pattern);
            await _context.SaveChangesAsync();

            var languages = new[] { "ru", "de" };
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

            return new ProductAttributeDto { Id = pattern.Id, Name = pattern.Name };
        }

        public async Task<bool> UpdateMaterialAsync(int id, CreateProductAttributeDto dto)
        {
            var material = await _context.ProductMaterials.FindAsync(id);
            if (material == null) return false;

            material.Name = dto.Name;
            await _context.SaveChangesAsync();

            var existingTranslations = await _context.MaterialTranslations
                .Where(t => t.MaterialId == id)
                .ToListAsync();
            _context.MaterialTranslations.RemoveRange(existingTranslations);

            var languages = new[] { "ru", "de" };
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
            return true;
        }

        public async Task<bool> UpdateStyleAsync(int id, CreateProductAttributeDto dto)
        {
            var style = await _context.ProductStyles.FindAsync(id);
            if (style == null) return false;

            style.Name = dto.Name;
            await _context.SaveChangesAsync();

            var existingTranslations = await _context.StyleTranslations
                .Where(t => t.StyleId == id)
                .ToListAsync();
            _context.StyleTranslations.RemoveRange(existingTranslations);

            var languages = new[] { "ru", "de" };
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
            return true;
        }

        public async Task<bool> UpdateOccasionAsync(int id, CreateProductAttributeDto dto)
        {
            var occasion = await _context.ProductOccasions.FindAsync(id);
            if (occasion == null) return false;

            occasion.Name = dto.Name;
            await _context.SaveChangesAsync();

            var existingTranslations = await _context.OccasionTranslations
                .Where(t => t.OccasionId == id)
                .ToListAsync();
            _context.OccasionTranslations.RemoveRange(existingTranslations);

            var languages = new[] { "ru", "de" };
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
            return true;
        }

        public async Task<bool> UpdatePatternAsync(int id, CreateProductAttributeDto dto)
        {
            var pattern = await _context.ProductPatterns.FindAsync(id);
            if (pattern == null) return false;

            pattern.Name = dto.Name;
            await _context.SaveChangesAsync();

            var existingTranslations = await _context.PatternTranslations
                .Where(t => t.PatternId == id)
                .ToListAsync();
            _context.PatternTranslations.RemoveRange(existingTranslations);

            var languages = new[] { "ru", "de" };
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
