using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Moq;
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
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
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
        private Customer CreateCustomer(string role = "User")
        {
            return new Customer
            {
                Id = Guid.NewGuid(),
                Email = "test@test.com",
                PasswordHash = "hashed-password",
                Role = new Role
                {
                    Name = role
                }
            };
        }

        private RegisterCustomerDto CreateRegisterDto()
        {
            return new RegisterCustomerDto
            {
                Name = "Test",
                Email = "test@test.com",
                Password = "password",
                ConfirmPassword = "password"
            };
        }

        private LoginDto CreateLoginDto(
            string email = "test@test.com",
            string password = "password")
        {
            return new LoginDto
            {
                Email = email,
                Password = password
            };
        }

        [Fact]
        public async Task Register_Should_Return_Customer_And_Save_Them_To_Database_When_Email_Is_Not_Already_Taken()
        {
            _passwordHasherMock
                .Setup(x => x.HashPassword(
                    It.IsAny<Customer>(),
                    "password"))
                .Returns("hashed-password");

            var result = await _customerService.RegisterAsync(CreateRegisterDto());  
            
            Assert.NotNull(result);

            var savedCustomer = await _context.Customers
                .SingleAsync(c => c.Email == result.Email);

            Assert.Equal("Test", savedCustomer.Name);
            Assert.Equal("test@test.com", savedCustomer.Email);
            Assert.Equal("hashed-password", savedCustomer.PasswordHash);

            _passwordHasherMock
                .Verify(x => x.HashPassword(
                    It.IsAny<Customer>(),
                    "password"),
                Times.Once);
        }

        [Fact]
        public async Task Register_Should_Return_Null_When_Email_Is_Already_Taken()
        {
            var existingCustomer = CreateCustomer();

            _context.Customers.Add(existingCustomer);
            await _context.SaveChangesAsync();

            var result = await _customerService.RegisterAsync(CreateRegisterDto());

            Assert.Null(result);

            var customerCount = await _context.Customers
                .CountAsync(c => c.Email == existingCustomer.Email);

            Assert.Equal(1, customerCount);

            _passwordHasherMock
                .Verify(x => x.HashPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>()),
                Times.Never);
        }

        [Fact]
        public async Task Login_Should_Return_Tokens_When_Credentials_Are_Correct()
        {
            var customer = CreateCustomer();

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    customer,
                    customer.PasswordHash,
                    "password"))
                .Returns(PasswordVerificationResult.Success);

            _tokenServiceMock
                .Setup(x => x.CreateToken(customer))
                .Returns("fake-access-token");

            _refreshTokenServiceMock
                .Setup(x => x.CreateRefreshToken())
                .Returns("fake-refresh-token");

            var result = await _customerService.LoginAsync(CreateLoginDto());

            Assert.NotNull(result);

            Assert.Equal(
                "fake-access-token",
                result.Token);

            Assert.Equal(
                "fake-refresh-token",
                result.RefreshToken);

            _passwordHasherMock
                .Verify(x => x.VerifyHashedPassword(
                    customer,
                    customer.PasswordHash,
                    "password"),
                Times.Once);

            _tokenServiceMock
                .Verify(x => x.CreateToken(customer),
                Times.Once);

            _refreshTokenServiceMock
                .Verify(x => x.CreateRefreshToken(),
                Times.Once);

            _refreshTokenServiceMock
                 .Verify(x => x.SaveRefreshTokenAsync("fake-refresh-token", customer.Id),
                 Times.Once);
        }

        [Fact]
        public async Task Login_Should_Return_Null_When_Customer_Not_Found()
        {
            var result = await _customerService.LoginAsync(CreateLoginDto(email:"notfound@gmail.com"));

            Assert.Null(result);

            _passwordHasherMock.Verify(
                x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()),
                Times.Never);

            _tokenServiceMock.Verify(
                x => x.CreateToken(It.IsAny<Customer>()),
                Times.Never);

            _refreshTokenServiceMock.Verify(
                x => x.CreateRefreshToken(),
                Times.Never);

            _refreshTokenServiceMock.Verify(
                x => x.SaveRefreshTokenAsync(
                    It.IsAny<string>(),
                    It.IsAny<Guid>()),
                Times.Never);
        }

        [Fact]
        public async Task Login_Should_Return_Null_When_Password_Is_Incorrect()
        {
            var customer = CreateCustomer();

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            _passwordHasherMock
            .Setup(x => x.VerifyHashedPassword(
                customer,
                customer.PasswordHash,
                "incorrect-password"))
            .Returns(PasswordVerificationResult.Failed);

            var result = await _customerService.LoginAsync(CreateLoginDto(password:"incorrect-password"));

            Assert.Null(result);

            _passwordHasherMock.Verify(
               x => x.VerifyHashedPassword(
                   It.IsAny<Customer>(),
                   customer.PasswordHash,
                   "incorrect-password"),
               Times.Once);

            _tokenServiceMock.Verify(
                x => x.CreateToken(It.IsAny<Customer>()),
                Times.Never);

            _refreshTokenServiceMock.Verify(
                x => x.CreateRefreshToken(),
                Times.Never);

            _refreshTokenServiceMock.Verify(
                x => x.SaveRefreshTokenAsync(
                    It.IsAny<string>(),
                    It.IsAny<Guid>()),
                Times.Never);
        }
    }
}
