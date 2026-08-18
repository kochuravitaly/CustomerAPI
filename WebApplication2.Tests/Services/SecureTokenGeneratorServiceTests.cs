using WebApplication2.Services;

namespace WebApplication2.Tests.Services
{
    public class SecureTokenGeneratorServiceTests
    {
        private readonly SecureTokenGeneratorService _secureTokenGeneratorService;

        public SecureTokenGeneratorServiceTests()
        {
            _secureTokenGeneratorService = new SecureTokenGeneratorService();
        }

        [Fact]
        public void CreateToken_Should_Return_Token()
        {
            var token = _secureTokenGeneratorService.CreateToken();

            Assert.NotEmpty(token);
        }

        [Fact]
        public void CreateToken_Should_Return_64_Bytes()
        {
            var token = _secureTokenGeneratorService.CreateToken();

            var bytes = Convert.FromBase64String(token);

            Assert.Equal(64, bytes.Length);
        }

        [Fact]
        public void HashToken_Should_Return_Same_Hash_For_Same_Token()
        {
            var token = "refresh-token";

            var firstHash = _secureTokenGeneratorService.HashToken(token);
            var secondHash = _secureTokenGeneratorService.HashToken(token);

            Assert.Equal(firstHash, secondHash);
        }

        [Fact]
        public void HashToken_Should_Return_Different_Hashes_For_Different_Tokens()
        {
            var firstHash = _secureTokenGeneratorService.HashToken("refresh-token");
            var secondHash = _secureTokenGeneratorService.HashToken("different-token");

            Assert.NotEqual(firstHash, secondHash);
        }
    }
}

