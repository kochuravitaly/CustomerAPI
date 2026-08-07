using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Moq;
using System;
using System.Collections.Generic;
using System.Text;
using WebApplication2.Data;
using WebApplication2.DTOs;
using WebApplication2.Models;
using WebApplication2.Services;

namespace WebApplication2.Tests.Services
{
    public class CustomerServiceTests
    {
        private readonly Mock<ITokenService> _tokenServiceMock;
        private readonly Mock<IRefreshTokenService> _refreshTokenServiceMock;
        private readonly Mock<IPasswordHasher<Customer>> _passwordHasherMock;

        private readonly AppDbContext _context;
        private readonly CustomerService _customerService;

        public CustomerServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase("TestDatabase")
                .Options;

            _context = new AppDbContext(options);

            _passwordHasherMock = new Mock<IPasswordHasher<Customer>>();
            _tokenServiceMock = new Mock<ITokenService>();
            _refreshTokenServiceMock = new Mock<IRefreshTokenService>();
            
            _customerService = new CustomerService(
                _context, 
                _passwordHasherMock.Object,
                _tokenServiceMock.Object,
                _refreshTokenServiceMock.Object
            );
        }

        [Fact]
        public async Task Login_Should_Return_Tokens_When_Credentials_Are_Correct()
        {
            var customer = new Customer
            {
                Id = Guid.NewGuid(),
                Email = "test@test.com",
                PasswordHash = "hashed-password",
                Role = new Role
                {
                    Name = "User"
                }
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    customer,
                    "hashed-password",
                    "password"))
                .Returns(PasswordVerificationResult.Success);

            _tokenServiceMock
                .Setup(x => x.CreateToken(customer))
                .Returns("fake-access-token");

            _refreshTokenServiceMock
                .Setup(x => x.CreateRefreshToken())
                .Returns("fake-refresh-token");

            var result = await _customerService.LoginAsync(
                new LoginDto
                {
                    Email = "test@test.com",
                    Password = "password"
                });

            Assert.NotNull(result);

            Assert.Equal(
                "fake-access-token",
                result.Token);

            Assert.Equal(
                "fake-refresh-token",
                result.RefreshToken);
        }
    }
}
