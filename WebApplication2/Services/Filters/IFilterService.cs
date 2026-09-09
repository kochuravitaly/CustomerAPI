using WebApplication2.DTOs.Filters;

namespace WebApplication2.Services.Filters
{
    public interface IFilterService
    {
        Task<FilterOptionsDto> GetFilterOptionsAsync();
    }
}