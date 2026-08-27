using WebApplication2.DTOs.Orders;

namespace WebApplication2.Services.Orders
{
    public interface IFlashSaleService
    {
        Task<IEnumerable<FlashSaleResponseDto>> GetActiveFlashSalesAsync();
        Task<IEnumerable<FlashSaleResponseDto>> GetAllFlashSalesAsync();
        Task<FlashSaleResponseDto?> CreateFlashSaleAsync(CreateFlashSaleDto dto);
        Task<FlashSaleResponseDto?> UpdateFlashSaleAsync(int id, CreateFlashSaleDto dto);
        Task<bool> DeleteFlashSaleAsync(int id);
    }
}