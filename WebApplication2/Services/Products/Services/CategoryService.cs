using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Products;
using WebApplication2.Models.Products;
using WebApplication2.Services.Products.Interfaces;

namespace WebApplication2.Services.Products.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly AppDbContext _context;

        public CategoryService(AppDbContext context)
        {
            _context = context;
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

            return true;
        }

        public async Task<bool> DeleteCategoryAsync(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Products)
                .SingleOrDefaultAsync(c => c.Id == id);

            if (category == null)
                return false;

            if (category.Products.Any())
            {
                return false;
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}