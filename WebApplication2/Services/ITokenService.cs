using WebApplication2.Data;

namespace WebApplication2.Services
{
    public interface ITokenService
    {
        string CreateToken(Customer customer);
    }
}
