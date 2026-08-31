using WebApplication2.Models.Auth;

namespace WebApplication2.Services.Auth.Interfaces
{
    public interface ITokenService
    {
        string CreateToken(Customer customer, int? sessionId = null);
    }
}