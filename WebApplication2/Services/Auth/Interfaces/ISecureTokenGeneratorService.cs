namespace WebApplication2.Services.Auth.Interfaces
{
    public interface ISecureTokenGeneratorService
    {
        string CreateToken();
        string HashToken(string token);
    }
}
