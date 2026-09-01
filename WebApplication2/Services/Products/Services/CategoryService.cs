using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Products;
using WebApplication2.Models.Products;
using WebApplication2.Models.Translations;
using WebApplication2.Services.Products.Interfaces;
using WebApplication2.Services.Translation.Interfaces;

namespace WebApplication2.Services.Products.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly AppDbContext _context;
        private readonly ITranslationService _translationService;

        public CategoryService(AppDbContext context, ITranslationService translationService)
        {
            _context = context;
            _translationService = translationService;
        }

        private async Task SaveTranslationsAsync(int categoryId, string name, string? description)
        {
            var languages = new[] { "en", "ru", "de" };

            var nameTranslations = await _translationService.TranslateAsync(name, languages);
            var descriptionTranslations = description != null
                ? await _translationService.TranslateAsync(description, languages)
                : null;

            foreach (var lang in languages)
            {
                _context.CategoryTranslations.Add(new CategoryTranslation
                {
                    CategoryId = categoryId,
                    LanguageCode = lang,
                    Name = nameTranslations[lang],
                    Description = descriptionTranslations?[lang]
                });
            }
        }

        public async Task<CategoryResponseDto> CreateCategoryAsync(CreateCategoryDto dto)
        {
            var category = new Category
            {
                Name = dto.Name,
                Description = dto.Description
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            var hasTranslations = await _context.CategoryTranslations
                .AnyAsync(t => t.CategoryId == category.Id);

            if (!hasTranslations)
            {
                await SaveTranslationsAsync(category.Id, category.Name, category.Description);
                await _context.SaveChangesAsync();
            }

            return new CategoryResponseDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                NameTranslations = new Dictionary<string, string>(),
                DescriptionTranslations = new Dictionary<string, string?>()
            };
        }

        public async Task<IEnumerable<CategoryResponseDto>> GetAllCategoriesAsync()
        {
            var categories = await _context.Categories
                .AsNoTracking()
                .Include(c => c.Translations)
                .ToListAsync();

            return categories.Select(c => new CategoryResponseDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                NameTranslations = c.Translations.ToDictionary(t => t.LanguageCode, t => t.Name),
                DescriptionTranslations = c.Translations.ToDictionary(t => t.LanguageCode, t => t.Description)
            });
        }

        public async Task<CategoryResponseDto?> GetCategoryByIdAsync(int id)
        {
            var category = await _context.Categories
                .AsNoTracking()
                .Include(c => c.Translations)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
                return null;

            return new CategoryResponseDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                NameTranslations = category.Translations.ToDictionary(t => t.LanguageCode, t => t.Name),
                DescriptionTranslations = category.Translations.ToDictionary(t => t.LanguageCode, t => t.Description)
            };
        }

        public async Task<bool> UpdateCategoryAsync(int id, UpdateCategoryDto dto)
        {
            var category = await _context.Categories
                .SingleOrDefaultAsync(c => c.Id == id);

            if (category == null)
                return false;

            if (dto.Name is not null)
                category.Name = dto.Name;

            if (dto.Description is not null)
                category.Description = dto.Description;

            await _context.SaveChangesAsync();

            if (dto.Name is not null || dto.Description is not null)
            {
                var hasTranslations = await _context.CategoryTranslations
                    .AnyAsync(t => t.CategoryId == id);

                if (!hasTranslations)
                {
                    await SaveTranslationsAsync(category.Id, category.Name, category.Description);
                    await _context.SaveChangesAsync();
                }
            }

            return true;
        }

        public async Task<string?> DeleteCategoryAsync(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Products)
                .SingleOrDefaultAsync(c => c.Id == id);

            if (category == null)
                return "Category not found.";

            if (category.Products.Any())
                return "Cannot delete this category because it has products. Remove products first.";

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return null;
        }
    }
}