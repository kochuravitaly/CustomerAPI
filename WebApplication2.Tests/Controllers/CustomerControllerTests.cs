using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApplication2.Controllers;
using WebApplication2.Data;
using WebApplication2.DTOs;
using WebApplication2.Services;

namespace WebApplication2.Tests.Controllers
{
    public class CustomerControllerTests
    {
        private readonly Mock<ICustomerService> _customerServiceMock;
        private readonly Mock<IPasswordResetService> _passwordResetServiceMock;
        private readonly CustomersController _customersController;

        public CustomerControllerTests()
        {
            _customerServiceMock = new Mock<ICustomerService>();
            _passwordResetServiceMock = new Mock<IPasswordResetService>();

            _customersController = new CustomersController(
                _customerServiceMock.Object,
                _passwordResetServiceMock.Object);
        }
        private RegisterCustomerDto CreateRegisterCustomerDto()
        {
            var dto = new RegisterCustomerDto
            {
                Name = "Test",
                Email = "test@test.com",
                Password = "TestPassword12344@$",
                ConfirmPassword = "TestPassword12344@$"
            };
            return dto;
        }

        private LoginDto CreateLoginDto()
        {
            var dto = new LoginDto
            {
                Email = "test@test.com",
                Password = "TestPassword12344@$"
            };
            return dto;
        }

        [Fact]
        public async Task Register_Should_Return_Ok_When_Registration_Succeeds()
        {
            var dto = CreateRegisterCustomerDto();

            _customerServiceMock
                .Setup(x => x.RegisterAsync(dto))
                .ReturnsAsync(new Customer());

            var result = await _customersController.Register(dto);

            Assert.IsType<OkResult>(result);
        }

        [Fact]
        public async Task Register_Should_Return_Conflict_When_Email_Is_Already_Taken()
        {
            var dto = CreateRegisterCustomerDto();

            _customerServiceMock
                .Setup(x => x.RegisterAsync(dto))
                .ReturnsAsync((Customer?)null);

            var result = await _customersController.Register(dto);

            var conflictResult = Assert.IsType<ConflictObjectResult>(result);

            Assert.Equal("Email is already taken", conflictResult.Value);
        }

        [Fact]
        public async Task Login_Should_Return_Ok_When_Credentials_Are_Valid()
        {
            var dto = CreateLoginDto();

            var tokenResponse = new TokenResponseDto
            {
                Token = "new-access-token",
                RefreshToken = "new-refresh-token"
            };

            _customerServiceMock
                .Setup(x => x.LoginAsync(dto))
                .ReturnsAsync(tokenResponse);

            var result = await _customersController.Login(dto);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);

            var response = Assert.IsType<TokenResponseDto>(okResult.Value);

            Assert.Equal("new-access-token", response.Token);
            Assert.Equal("new-refresh-token", response.RefreshToken);
        }

        [Fact]
        public async Task Login_Should_Return_Unauthorized_When_Credentials_Are_Invalid()
        {
            var dto = CreateLoginDto();

            _customerServiceMock
                .Setup(x => x.LoginAsync(dto))
                .ReturnsAsync((TokenResponseDto?)null);

            var result = await _customersController.Login(dto);

            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result.Result);

            Assert.Equal("Invalid email or password", unauthorizedResult.Value);
        }
    }
}
