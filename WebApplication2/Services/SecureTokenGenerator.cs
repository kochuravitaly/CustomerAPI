using System.Security.Cryptography;
using System.Text;

namespace WebApplication2.Services
{
    public class SecureTokenGenerator : ISecureTokenGenerator
    {
        public string CreateToken()
        {
            var randomBytes = new byte[64];

            using var rng = RandomNumberGenerator.Create();

            rng.GetBytes(randomBytes);

            return Convert.ToBase64String(randomBytes);
        }

        public string HashToken(string refreshToken)
        {
            using var sha256 = SHA256.Create();

            var bytes = Encoding.UTF8.GetBytes(refreshToken);

            var hash = sha256.ComputeHash(bytes);

            return Convert.ToBase64String(hash);
        }
    }
}
