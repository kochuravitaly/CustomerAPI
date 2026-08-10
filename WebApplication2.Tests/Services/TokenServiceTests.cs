using Castle.Core.Resource;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WebApplication2.Data;
using WebApplication2.Models;
using WebApplication2.Services;

namespace WebApplication2.Tests.Services
{
    public class TokenServiceTests
    {
        private readonly TokenService _tokenService;

        public TokenServiceTests()
        {
            var configuration = CreateConfiguration();

            _tokenService = new TokenService(configuration);
        }

        private IConfiguration CreateConfiguration()
        {
            return new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Jwt:Key"] = "ASFJLNGSDLNG12415vnbckbodjperte396451294@_5",
                    ["Jwt:Issuer"] = "TestIssuer",
                    ["Jwt:Audience"] = "TestAudience"
                })
                .Build();
        }

        private Customer CreateCustomer(string role = "User")
        {
            return new Customer
            {
                Id = Guid.NewGuid(),
                Role = new Role
                {
                    Name = role
                }
            };
        }

        private JwtSecurityToken CreateJwtToken(Customer customer)
        {
            var token = _tokenService.CreateToken(customer);

            var handler = new JwtSecurityTokenHandler();

            return handler.ReadJwtToken(token);
        } 
        
        [Fact]
        public void CreateToken_Should_Return_Token()
        {
            var customer = CreateCustomer();
            
            var token = _tokenService.CreateToken(customer);

            var handler = new JwtSecurityTokenHandler();

            Assert.True(handler.CanReadToken(token));
        }

        [Fact]
        public void CreateToken_Should_Contain_Role_And_Id_Claims()
        {
            var customer = CreateCustomer();

            var jwtToken = CreateJwtToken(customer);

            Assert.Contains(
                jwtToken.Claims,
                claim => claim.Type == ClaimTypes.Role 
                    && claim.Value == customer.Role.Name);

            Assert.Contains(
                jwtToken.Claims,
                claim => claim.Type == ClaimTypes.NameIdentifier
                    && claim.Value == customer.Id.ToString());
        }

        [Fact]
        public void CreateToken_Should_Set_Expiration_Issuer_And_Audience()
        {
            var customer = CreateCustomer();

            var jwtToken = CreateJwtToken(customer);

            Assert.True(jwtToken.ValidTo > DateTime.UtcNow);
            Assert.Equal("TestIssuer", jwtToken.Issuer);
            Assert.Contains("TestAudience", jwtToken.Audiences);
        }
    }
}
