namespace WebApplication2.Services
{
    public interface ISecureTokenGeneratorService
    {
        string CreateToken();
        string HashToken(string token);
    }
}
