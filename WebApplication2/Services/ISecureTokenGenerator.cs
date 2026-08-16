namespace WebApplication2.Services
{
    public interface ISecureTokenGenerator
    {
        string CreateToken();
        string HashToken(string token);
    }
}
