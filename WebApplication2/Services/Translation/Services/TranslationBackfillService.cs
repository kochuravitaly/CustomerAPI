using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.Models.Translations;
using WebApplication2.Services.Translation.Interfaces;

namespace WebApplication2.Services.Translation.Services
{
    public class TranslationBackfillService : ITranslationBackfillService
    {
        private readonly AppDbContext _context;
        private readonly ITranslationService _translationService;

        private static readonly string[] TargetLanguages = { "en", "ru", "de" };

        public TranslationBackfillService(
            AppDbContext context,
            ITranslationService translationService)
        {
            _context = context;
            _translationService = translationService;
        }

        public async Task TranslateAllAsync()
        {
            await TranslateProductsAsync();
            await TranslateCategoriesAsync();
            await TranslateMaterialsAsync();
            await TranslateStylesAsync();
            await TranslateOccasionsAsync();
            await TranslatePatternsAsync();
            await TranslateColorsAsync();
            await TranslateHomeSectionsAsync();

            await _context.SaveChangesAsync();
        }

        private async Task TranslateProductsAsync()
        {
            var products = await _context.Products
                .AsNoTracking()
                .ToListAsync();

            foreach (var product in products)
            {
                foreach (var language in TargetLanguages)
                {
                    var existing = await _context.ProductTranslations
                        .FirstOrDefaultAsync(t =>
                            t.ProductId == product.Id &&
                            t.LanguageCode == language);

                    if (existing != null)
                        continue;

                    var nameTranslation =
                        await _translationService.TranslateSingleAsync(
                            product.Name,
                            language);

                    var descriptionTranslation =
                        string.IsNullOrWhiteSpace(product.Description)
                            ? product.Description
                            : await _translationService.TranslateSingleAsync(
                                product.Description,
                                language);

                    _context.ProductTranslations.Add(new ProductTranslation
                    {
                        ProductId = product.Id,
                        LanguageCode = language,
                        Name = nameTranslation,
                        Description = descriptionTranslation
                    });
                }
            }
        }

        private async Task TranslateCategoriesAsync()
        {
            var categories = await _context.Categories
                .AsNoTracking()
                .ToListAsync();

            foreach (var category in categories)
            {
                foreach (var language in TargetLanguages)
                {
                    var existing = await _context.CategoryTranslations
                        .FirstOrDefaultAsync(t =>
                            t.CategoryId == category.Id &&
                            t.LanguageCode == language);

                    if (existing != null)
                        continue;

                    var nameTranslation =
                        await _translationService.TranslateSingleAsync(
                            category.Name,
                            language);

                    var descriptionTranslation =
                        string.IsNullOrWhiteSpace(category.Description)
                            ? category.Description
                            : await _translationService.TranslateSingleAsync(
                                category.Description,
                                language);

                    _context.CategoryTranslations.Add(new CategoryTranslation
                    {
                        CategoryId = category.Id,
                        LanguageCode = language,
                        Name = nameTranslation,
                        Description = descriptionTranslation
                    });
                }
            }
        }

        private async Task TranslateMaterialsAsync()
        {
            var materials = await _context.ProductMaterials
                .AsNoTracking()
                .ToListAsync();

            foreach (var material in materials)
            {
                foreach (var language in TargetLanguages)
                {
                    var existing = await _context.MaterialTranslations
                        .FirstOrDefaultAsync(t =>
                            t.MaterialId == material.Id &&
                            t.LanguageCode == language);

                    if (existing != null)
                        continue;

                    var translation =
                        await _translationService.TranslateSingleAsync(
                            material.Name,
                            language);

                    _context.MaterialTranslations.Add(new MaterialTranslation
                    {
                        MaterialId = material.Id,
                        LanguageCode = language,
                        Name = translation
                    });
                }
            }
        }

        private async Task TranslateStylesAsync()
        {
            var styles = await _context.ProductStyles
                .AsNoTracking()
                .ToListAsync();

            foreach (var style in styles)
            {
                foreach (var language in TargetLanguages)
                {
                    var existing = await _context.StyleTranslations
                        .FirstOrDefaultAsync(t =>
                            t.StyleId == style.Id &&
                            t.LanguageCode == language);

                    if (existing != null)
                        continue;

                    var translation =
                        await _translationService.TranslateSingleAsync(
                            style.Name,
                            language);

                    _context.StyleTranslations.Add(new StyleTranslation
                    {
                        StyleId = style.Id,
                        LanguageCode = language,
                        Name = translation
                    });
                }
            }
        }

        private async Task TranslateOccasionsAsync()
        {
            var occasions = await _context.ProductOccasions
                .AsNoTracking()
                .ToListAsync();

            foreach (var occasion in occasions)
            {
                foreach (var language in TargetLanguages)
                {
                    var existing = await _context.OccasionTranslations
                        .FirstOrDefaultAsync(t =>
                            t.OccasionId == occasion.Id &&
                            t.LanguageCode == language);

                    if (existing != null)
                        continue;

                    var translation =
                        await _translationService.TranslateSingleAsync(
                            occasion.Name,
                            language);

                    _context.OccasionTranslations.Add(new OccasionTranslation
                    {
                        OccasionId = occasion.Id,
                        LanguageCode = language,
                        Name = translation
                    });
                }
            }
        }

        private async Task TranslatePatternsAsync()
        {
            var patterns = await _context.ProductPatterns
                .AsNoTracking()
                .ToListAsync();

            foreach (var pattern in patterns)
            {
                foreach (var language in TargetLanguages)
                {
                    var existing = await _context.PatternTranslations
                        .FirstOrDefaultAsync(t =>
                            t.PatternId == pattern.Id &&
                            t.LanguageCode == language);

                    if (existing != null)
                        continue;

                    var translation =
                        await _translationService.TranslateSingleAsync(
                            pattern.Name,
                            language);

                    _context.PatternTranslations.Add(new PatternTranslation
                    {
                        PatternId = pattern.Id,
                        LanguageCode = language,
                        Name = translation
                    });
                }
            }
        }

        private async Task TranslateColorsAsync()
        {
            var colors = await _context.ProductColors
                .AsNoTracking()
                .ToListAsync();

            foreach (var color in colors)
            {
                foreach (var language in TargetLanguages)
                {
                    var existing = await _context.ColorTranslations
                        .FirstOrDefaultAsync(t =>
                            t.ColorId == color.Id &&
                            t.LanguageCode == language);

                    if (existing != null)
                        continue;

                    var translation =
                        await _translationService.TranslateSingleAsync(
                            color.Name,
                            language);

                    _context.ColorTranslations.Add(new ColorTranslation
                    {
                        ColorId = color.Id,
                        LanguageCode = language,
                        Name = translation
                    });
                }
            }
        }

        private async Task TranslateHomeSectionsAsync()
        {
            var sections = await _context.HomeSections
                .AsNoTracking()
                .ToListAsync();

            foreach (var section in sections)
            {
                foreach (var language in TargetLanguages)
                {
                    var existing = await _context.HomeSectionTranslations
                        .FirstOrDefaultAsync(t =>
                            t.HomeSectionId == section.Id &&
                            t.LanguageCode == language);

                    if (existing != null)
                        continue;

                    var translation =
                        await _translationService.TranslateSingleAsync(
                            section.Title,
                            language);

                    _context.HomeSectionTranslations.Add(new HomeSectionTranslation
                    {
                        HomeSectionId = section.Id,
                        LanguageCode = language,
                        Title = translation
                    });
                }
            }
        }
    }
}