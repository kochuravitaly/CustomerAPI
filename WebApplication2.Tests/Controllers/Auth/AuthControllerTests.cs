using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApplication2.Controllers.NewFolder;
using WebApplication2.DTOs.Auth;
using WebApplication2.Services.Auth.Interfaces;

namespace WebApplication2.Tests.Controllers.Auth
{
    public class AuthControllerTests
    {
        private readonly Mock<IAuthService> _authServiceMock;
        private readonly AuthController _authController;

        public AuthControllerTests()
        {
            _authServiceMock = new Mock<IAuthService>();
            _authController = new AuthController(_authServiceMock.Object);
        }

        [Fact]
        public async Task Register_Should_Return_Ok_When_Successful()
        {
            _authServiceMock
                .Setup(x => x.RegisterAsync(It.IsAny<RegisterCustomerDto>()))
                .ReturnsAsync(true);

            var result = await _authController.Register(new RegisterCustomerDto
            {
                Name = "Test",
                Email = "test@test.com",
                Password = "password",
                ConfirmPassword = "password"
            });

            Assert.IsType<OkResult>(result);
        }

        [Fact]
        public async Task Register_Should_Return_Conflict_When_Email_Taken()
        {
            _authServiceMock
                .Setup(x => x.RegisterAsync(It.IsAny<RegisterCustomerDto>()))
                .ReturnsAsync(false);

            var result = await _authController.Register(new RegisterCustomerDto
            {
                Name = "Test",
                Email = "test@test.com",
                Password = "password",
                ConfirmPassword = "password"
            });

            var conflictResult = Assert.IsType<ConflictObjectResult>(result);
            Assert.Equal("Email is already taken", conflictResult.Value);
        }

        [Fact]
        public async Task Login_Should_Return_Ok_With_Tokens_When_Successful()
        {
            var tokenResponse = new TokenResponseDto
            {
                Token = "access-token",
                RefreshToken = "refresh-token",
                RequiresTwoFactor = false
            };

            _authServiceMock
                .Setup(x => x.LoginAsync(It.IsAny<LoginDto>()))
                .ReturnsAsync(tokenResponse);

            var result = await _authController.Login(new LoginDto
            {
                Email = "test@test.com",
                Password = "password"
            });

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(tokenResponse, okResult.Value);
        }

        [Fact]
        public async Task Login_Should_Return_Unauthorized_When_Invalid()
        {
            _authServiceMock
                .Setup(x => x.LoginAsync(It.IsAny<LoginDto>()))
                .ReturnsAsync((TokenResponseDto)null);

            var result = await _authController.Login(new LoginDto
            {
                Email = "test@test.com",
                Password = "wrong"
            });

            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result.Result);
            Assert.Equal("Invalid email or password", unauthorizedResult.Value);
        }

        [Fact]
        public async Task Login_Should_Return_Ok_With_RequiresTwoFactor()
        {
            var tokenResponse = new TokenResponseDto
            {
                RequiresTwoFactor = true,
                CustomerId = Guid.NewGuid(),
                TwoFactorMethod = "email"
            };

            _authServiceMock
                .Setup(x => x.LoginAsync(It.IsAny<LoginDto>()))
                .ReturnsAsync(tokenResponse);

            var result = await _authController.Login(new LoginDto
            {
                Email = "test@test.com",
                Password = "password"
            });

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(tokenResponse, okResult.Value);
        }

        [Fact]
        public async Task ForgotPassword_Should_Return_Ok_With_Token_When_Found()
        {
            _authServiceMock
                .Setup(x => x.ForgotPasswordAsync(It.IsAny<EmailDto>()))
                .ReturnsAsync("reset-token");

            var result = await _authController.ForgotPassword(new EmailDto
            {
                Email = "test@test.com"
            });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task ForgotPassword_Should_Return_NotFound_When_Not_Found()
        {
            _authServiceMock
                .Setup(x => x.ForgotPasswordAsync(It.IsAny<EmailDto>()))
                .ReturnsAsync((string)null);

            var result = await _authController.ForgotPassword(new EmailDto
            {
                Email = "nonexistent@test.com"
            });

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task ResetPassword_Should_Return_Ok_When_Successful()
        {
            _authServiceMock
                .Setup(x => x.ResetPasswordAsync(It.IsAny<ResetPasswordDto>()))
                .ReturnsAsync(true);

            var result = await _authController.ResetPassword(new ResetPasswordDto
            {
                Token = "reset-token",
                NewPassword = "new-password"
            });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task ResetPassword_Should_Return_BadRequest_When_Invalid()
        {
            _authServiceMock
                .Setup(x => x.ResetPasswordAsync(It.IsAny<ResetPasswordDto>()))
                .ReturnsAsync(false);

            var result = await _authController.ResetPassword(new ResetPasswordDto
            {
                Token = "invalid-token",
                NewPassword = "new-password"
            });

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Invalid or expired reset token.", badRequestResult.Value);
        }

        [Fact]
        public async Task VerifyEmail_Should_Return_Ok_When_Successful()
        {
            _authServiceMock
                .Setup(x => x.VerifyEmailAsync(It.IsAny<VerifyEmailDto>()))
                .ReturnsAsync(true);

            var result = await _authController.VerifyEmail(new VerifyEmailDto
            {
                Email = "test@test.com",
                Code = "123456"
            });

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Email verified successfully.", okResult.Value);
        }

        [Fact]
        public async Task VerifyEmail_Should_Return_BadRequest_When_Invalid()
        {
            _authServiceMock
                .Setup(x => x.VerifyEmailAsync(It.IsAny<VerifyEmailDto>()))
                .ReturnsAsync(false);

            var result = await _authController.VerifyEmail(new VerifyEmailDto
            {
                Email = "test@test.com",
                Code = "000000"
            });

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Invalid or expired verification code.", badRequestResult.Value);
        }

        [Fact]
        public async Task ResendVerification_Should_Return_Ok_When_Successful()
        {
            _authServiceMock
                .Setup(x => x.ResendVerificationCodeAsync(It.IsAny<EmailDto>()))
                .ReturnsAsync(true);

            var result = await _authController.ResendVerification(new EmailDto
            {
                Email = "test@test.com"
            });

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Verification code sent.", okResult.Value);
        }

        [Fact]
        public async Task ResendVerification_Should_Return_BadRequest_When_Not_Found()
        {
            _authServiceMock
                .Setup(x => x.ResendVerificationCodeAsync(It.IsAny<EmailDto>()))
                .ReturnsAsync(false);

            var result = await _authController.ResendVerification(new EmailDto
            {
                Email = "nonexistent@test.com"
            });

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("No pending registration found.", badRequestResult.Value);
        }

        [Fact]
        public async Task Refresh_Should_Return_Ok_With_Tokens_When_Valid()
        {
            var tokenResponse = new TokenResponseDto
            {
                Token = "new-access-token",
                RefreshToken = "new-refresh-token"
            };

            _authServiceMock
                .Setup(x => x.RefreshTokenAsync(It.IsAny<RefreshTokenDto>()))
                .ReturnsAsync(tokenResponse);

            var result = await _authController.Refresh(new RefreshTokenDto
            {
                RefreshToken = "valid-refresh-token"
            });

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(tokenResponse, okResult.Value);
        }

        [Fact]
        public async Task Refresh_Should_Return_Unauthorized_When_Invalid()
        {
            _authServiceMock
                .Setup(x => x.RefreshTokenAsync(It.IsAny<RefreshTokenDto>()))
                .ReturnsAsync((TokenResponseDto)null);

            var result = await _authController.Refresh(new RefreshTokenDto
            {
                RefreshToken = "invalid-refresh-token"
            });

            Assert.IsType<UnauthorizedResult>(result.Result);
        }

        [Fact]
        public async Task Logout_Should_Return_NoContent_When_Successful()
        {
            _authServiceMock
                .Setup(x => x.LogoutAsync(It.IsAny<RefreshTokenDto>()))
                .ReturnsAsync(true);

            var result = await _authController.Logout(new RefreshTokenDto
            {
                RefreshToken = "valid-refresh-token"
            });

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task Logout_Should_Return_BadRequest_When_Invalid()
        {
            _authServiceMock
                .Setup(x => x.LogoutAsync(It.IsAny<RefreshTokenDto>()))
                .ReturnsAsync(false);

            var result = await _authController.Logout(new RefreshTokenDto
            {
                RefreshToken = "invalid-refresh-token"
            });

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Invalid or already revoked refresh token.", badRequestResult.Value);
        }

        [Fact]
        public async Task Verify2FA_Should_Return_Ok_With_Tokens_When_Valid()
        {
            var tokenResponse = new TokenResponseDto
            {
                Token = "access-token",
                RefreshToken = "refresh-token"
            };

            _authServiceMock
                .Setup(x => x.Verify2FAAsync(It.IsAny<Verify2FADto>()))
                .ReturnsAsync(tokenResponse);

            var result = await _authController.Verify2FA(new Verify2FADto
            {
                CustomerId = Guid.NewGuid(),
                Code = "123456"
            });

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(tokenResponse, okResult.Value);
        }

        [Fact]
        public async Task Verify2FA_Should_Return_Unauthorized_When_Invalid()
        {
            _authServiceMock
                .Setup(x => x.Verify2FAAsync(It.IsAny<Verify2FADto>()))
                .ReturnsAsync((TokenResponseDto)null);

            var result = await _authController.Verify2FA(new Verify2FADto
            {
                CustomerId = Guid.NewGuid(),
                Code = "000000"
            });

            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result.Result);
            Assert.Equal("Invalid code.", unauthorizedResult.Value);
        }
    }
}