using WebApplication2.Services.Auth.Services;

namespace WebApplication2.Tests.Services.Auth
{
    public class SecureTokenGeneratorServiceTests
    {
        private readonly SecureTokenGeneratorService _secureTokenGenerator;

        public SecureTokenGeneratorServiceTests()
        {
            _secureTokenGenerator = new SecureTokenGeneratorService();
        }

        [Fact]
        public void CreateToken_Should_Return_NonEmpty_String()
        {
            var token = _secureTokenGenerator.CreateToken();

            Assert.False(string.IsNullOrEmpty(token));
        }

        [Fact]
        public void CreateToken_Should_Return_Different_Tokens_Each_Time()
        {
            var token1 = _secureTokenGenerator.CreateToken();
            var token2 = _secureTokenGenerator.CreateToken();

            Assert.NotEqual(token1, token2);
        }

        [Fact]
        public void CreateToken_Should_Return_Base64_String()
        {
            var token = _secureTokenGenerator.CreateToken();

            var isValidBase64 = Convert.TryFromBase64String(token, new byte[token.Length], out _);

            Assert.True(isValidBase64);
        }

        [Fact]
        public void HashToken_Should_Return_NonEmpty_String()
        {
            var hash = _secureTokenGenerator.HashToken("test-token");

            Assert.False(string.IsNullOrEmpty(hash));
        }

        [Fact]
        public void HashToken_Should_Return_Base64_String()
        {
            var hash = _secureTokenGenerator.HashToken("test-token");

            var isValidBase64 = Convert.TryFromBase64String(hash, new byte[hash.Length], out _);

            Assert.True(isValidBase64);
        }

        [Fact]
        public void HashToken_Should_Return_Same_Hash_For_Same_Input()
        {
            var input = "same-token";

            var hash1 = _secureTokenGenerator.HashToken(input);
            var hash2 = _secureTokenGenerator.HashToken(input);

            Assert.Equal(hash1, hash2);
        }

        [Fact]
        public void HashToken_Should_Return_Different_Hash_For_Different_Input()
        {
            var hash1 = _secureTokenGenerator.HashToken("token-1");
            var hash2 = _secureTokenGenerator.HashToken("token-2");

            Assert.NotEqual(hash1, hash2);
        }

        [Fact]
        public void HashToken_Should_Handle_Empty_String()
        {
            var hash = _secureTokenGenerator.HashToken("");

            Assert.False(string.IsNullOrEmpty(hash));
        }

        [Fact]
        public void HashToken_Should_Handle_Unicode_Characters()
        {
            var hash = _secureTokenGenerator.HashToken("токен-测试-🙂");

            Assert.False(string.IsNullOrEmpty(hash));
        }

        [Fact]
        public void CreateToken_Should_Return_88_Character_Base64_String()
        {
            var token = _secureTokenGenerator.CreateToken();

            Assert.Equal(88, token.Length);
        }

        [Fact]
        public void HashToken_Should_Return_44_Character_Base64_String()
        {
            var hash = _secureTokenGenerator.HashToken("test-token");

            Assert.Equal(44, hash.Length);
        }
    }
}