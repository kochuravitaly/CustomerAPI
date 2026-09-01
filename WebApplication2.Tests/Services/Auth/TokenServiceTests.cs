using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Moq;
using WebApplication2.Models.Auth;
using WebApplication2.Services.Auth.Services;

namespace WebApplication2.Tests.Services.Auth
{
    public class TokenServiceTests
    {
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly TokenService _tokenService;

        public TokenServiceTests()
        {
            _configurationMock = new Mock<IConfiguration>();

            _configurationMock
                .Setup(x => x["Jwt:Key"])
                .Returns("this-is-a-test-secret-key-that-is-long-enough-for-testing");

            _configurationMock
                .Setup(x => x["Jwt:Issuer"])
                .Returns("TestIssuer");

            _configurationMock
                .Setup(x => x["Jwt:Audience"])
                .Returns("TestAudience");

            _tokenService = new TokenService(_configurationMock.Object);
        }

        private Customer CreateCustomer(string roleName = "Customer")
        {
            return new Customer
            {
                Id = Guid.NewGuid(),
                Role = new Role { Name = roleName }
            };
        }

        [Fact]
        public void CreateToken_Should_Return_NonEmpty_String()
        {
            var customer = CreateCustomer();

            var token = _tokenService.CreateToken(customer);

            Assert.False(string.IsNullOrEmpty(token));
        }

        [Fact]
        public void CreateToken_Should_Contain_NameIdentifier_Claim()
        {
            var customer = CreateCustomer();

            var token = _tokenService.CreateToken(customer);

            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(token);

            var nameIdClaim = jsonToken.Claims
                .FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);

            Assert.NotNull(nameIdClaim);
            Assert.Equal(customer.Id.ToString(), nameIdClaim.Value);
        }

        [Fact]
        public void CreateToken_Should_Contain_Role_Claim()
        {
            var customer = CreateCustomer("Admin");

            var token = _tokenService.CreateToken(customer);

            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(token);

            var roleClaim = jsonToken.Claims
                .FirstOrDefault(c => c.Type == ClaimTypes.Role);

            Assert.NotNull(roleClaim);
            Assert.Equal("Admin", roleClaim.Value);
        }

        [Fact]
        public void CreateToken_Should_Not_Contain_SessionId_When_Null()
        {
            var customer = CreateCustomer();

            var token = _tokenService.CreateToken(customer);

            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(token);

            var sessionIdClaim = jsonToken.Claims
                .FirstOrDefault(c => c.Type == "SessionId");

            Assert.Null(sessionIdClaim);
        }

        [Fact]
        public void CreateToken_Should_Contain_SessionId_When_Provided()
        {
            var customer = CreateCustomer();
            var sessionId = 12345;

            var token = _tokenService.CreateToken(customer, sessionId);

            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(token);

            var sessionIdClaim = jsonToken.Claims
                .FirstOrDefault(c => c.Type == "SessionId");

            Assert.NotNull(sessionIdClaim);
            Assert.Equal("12345", sessionIdClaim.Value);
        }

        [Fact]
        public void CreateToken_Should_Have_Correct_Issuer()
        {
            var customer = CreateCustomer();

            var token = _tokenService.CreateToken(customer);

            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(token);

            Assert.Equal("TestIssuer", jsonToken.Issuer);
        }

        [Fact]
        public void CreateToken_Should_Have_Correct_Audience()
        {
            var customer = CreateCustomer();

            var token = _tokenService.CreateToken(customer);

            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(token);

            Assert.Equal("TestAudience", jsonToken.Audiences.First());
        }

        [Fact]
        public void CreateToken_Should_Have_Expiry_Within_15_Minutes()
        {
            var customer = CreateCustomer();

            var token = _tokenService.CreateToken(customer);

            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(token);

            var expectedExpiry = DateTime.UtcNow.AddMinutes(15);
            var actualExpiry = jsonToken.ValidTo;

            var difference = Math.Abs((expectedExpiry - actualExpiry).TotalMinutes);

            Assert.True(difference < 2);
        }

        [Fact]
        public void CreateToken_Should_Produce_Different_Tokens_For_Different_Customers()
        {
            var customer1 = CreateCustomer();
            var customer2 = CreateCustomer();

            var token1 = _tokenService.CreateToken(customer1);
            var token2 = _tokenService.CreateToken(customer2);

            Assert.NotEqual(token1, token2);
        }

        [Fact]
        public void CreateToken_Should_Produce_Different_Tokens_For_Same_Customer_With_Different_SessionId()
        {
            var customer = CreateCustomer();

            var token1 = _tokenService.CreateToken(customer, 1);
            var token2 = _tokenService.CreateToken(customer, 2);

            Assert.NotEqual(token1, token2);
        }
    }
}