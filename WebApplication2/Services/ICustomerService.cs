using WebApplication2.Data;
using WebApplication2.DTOs;

namespace WebApplication2.Services
{
    public interface ICustomerService
    {
        Task<Customer?> RegisterAsync(RegisterCustomerDto dto);
        Task<TokenResponseDto?> LoginAsync(LoginDto dto);
        Task<GetCustomerByIdDto?> GetCustomerByIdAsync(Guid id);
        Task<bool> DeleteCustomerByIdAsync(Guid id);
    }
}
