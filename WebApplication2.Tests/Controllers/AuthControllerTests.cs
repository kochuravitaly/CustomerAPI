using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApplication2.Controllers.NewFolder;
using WebApplication2.DTOs.Auth;
using WebApplication2.Services.Auth.Interfaces;

namespace WebApplication2.Tests.Controllers
{
    public class AuthControllerTests
    {
        private readonly Mock<IAuthService> _authServiceMock;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            _authServiceMock = new Mock<IAuthService>();

            _controller = new AuthController(
                _authServiceMock.Object);
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

        private LoginDto CreateLoginDto()
        {
            return new LoginDto
            {
                Email = "test@test.com",
                Password = "password"
            };
        }

        private EmailDto CreateEmailDto()
        {
            return new EmailDto
            {
                Email = "test@test.com"
            };
        }

        private VerifyEmailDto CreateVerifyEmailDto()
        {
            return new VerifyEmailDto
            {
                Email = "test@test.com",
                Code = "123456"
            };
        }

        private ResetPasswordDto CreateResetPasswordDto()
        {
            return new ResetPasswordDto
            {
                Token = "reset-token",
                NewPassword = "new-password"
            };
        }

        private static RefreshTokenDto CreateRefreshTokenDto()
        {
            return new RefreshTokenDto
            {
                RefreshToken = "refresh-token"
            };
        }

        [Fact]
        public async Task Register_Should_Return_Ok_When_Registration_Succeeds()
        {
            _authServiceMock
                .Setup(x => x.RegisterAsync(It.IsAny<RegisterCustomerDto>()))
                .ReturnsAsync(true);

            var result = await _controller.Register(
                CreateRegisterDto());

            Assert.IsType<OkResult>(result);

            _authServiceMock.Verify(
                x => x.RegisterAsync(
                    It.IsAny<RegisterCustomerDto>()),
                Times.Once);
        }

        [Fact]
        public async Task Register_Should_Return_Conflict_When_Email_Is_Already_Taken()
        {
            _authServiceMock
                .Setup(x => x.RegisterAsync(It.IsAny<RegisterCustomerDto>()))
                .ReturnsAsync(false);

            var result = await _controller.Register(
                CreateRegisterDto());

            var conflict = Assert.IsType<ConflictObjectResult>(result);

            Assert.Equal(
                "Email is already taken",
                conflict.Value);
        }

        [Fact]
        public async Task Login_Should_Return_Ok_With_Tokens_When_Credentials_Are_Valid()
        {
            var response = new TokenResponseDto
            {
                Token = "access-token",
                RefreshToken = "refresh-token"
            };

            _authServiceMock
                .Setup(x => x.LoginAsync(It.IsAny<LoginDto>()))
                .ReturnsAsync(response);

            var result = await _controller.Login(
                CreateLoginDto());

            var ok = Assert.IsType<OkObjectResult>(result.Result);

            Assert.Same(response, ok.Value);

            _authServiceMock.Verify(
                x => x.LoginAsync(
                    It.IsAny<LoginDto>()),
                Times.Once);
        }

        [Fact]
        public async Task Login_Should_Return_Unauthorized_When_Credentials_Are_Invalid()
        {
            _authServiceMock
                .Setup(x => x.LoginAsync(It.IsAny<LoginDto>()))
                .ReturnsAsync((TokenResponseDto?)null);

            var result = await _controller.Login(
                CreateLoginDto());

            var unauthorized =
                Assert.IsType<UnauthorizedObjectResult>(result.Result);

            Assert.Equal(
                "Invalid email or password",
                unauthorized.Value);
        }

        [Fact]
        public async Task ForgotPassword_Should_Return_Ok_With_Token_When_Customer_Exists()
        {
            _authServiceMock
                .Setup(x => x.ForgotPasswordAsync(It.IsAny<EmailDto>()))
                .ReturnsAsync("reset-token");

            var result = await _controller.ForgotPassword(
                CreateEmailDto());

            var ok = Assert.IsType<OkObjectResult>(result);

            Assert.NotNull(ok.Value);

            _authServiceMock.Verify(
                x => x.ForgotPasswordAsync(
                    It.IsAny<EmailDto>()),
                Times.Once);
        }

        [Fact]
        public async Task ForgotPassword_Should_Return_NotFound_When_Customer_Does_Not_Exist()
        {
            _authServiceMock
                .Setup(x => x.ForgotPasswordAsync(It.IsAny<EmailDto>()))
                .ReturnsAsync((string?)null);

            var result = await _controller.ForgotPassword(
                CreateEmailDto());

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task ResetPassword_Should_Return_Ok_When_Reset_Succeeds()
        {
            _authServiceMock
                .Setup(x => x.ResetPasswordAsync(It.IsAny<ResetPasswordDto>()))
                .ReturnsAsync(true);

            var result = await _controller.ResetPassword(
                CreateResetPasswordDto());

            var ok = Assert.IsType<OkObjectResult>(result);

            Assert.NotNull(ok.Value);

            _authServiceMock.Verify(
                x => x.ResetPasswordAsync(
                    It.IsAny<ResetPasswordDto>()),
                Times.Once);
        }

        [Fact]
        public async Task ResetPassword_Should_Return_BadRequest_When_Token_Is_Invalid()
        {
            _authServiceMock
                .Setup(x => x.ResetPasswordAsync(It.IsAny<ResetPasswordDto>()))
                .ReturnsAsync(false);

            var result = await _controller.ResetPassword(
                CreateResetPasswordDto());

            var badRequest =
                Assert.IsType<BadRequestObjectResult>(result);

            Assert.Equal(
                "Invalid or expired reset token.",
                badRequest.Value);
        }

        [Fact]
        public async Task VerifyEmail_Should_Return_Ok_When_Verification_Succeeds()
        {
            _authServiceMock
                .Setup(x => x.VerifyEmailAsync(It.IsAny<VerifyEmailDto>()))
                .ReturnsAsync(true);

            var result = await _controller.VerifyEmail(
                CreateVerifyEmailDto());

            var ok = Assert.IsType<OkObjectResult>(result);

            Assert.Equal(
                "Email verified successfully.",
                ok.Value);

            _authServiceMock.Verify(
                x => x.VerifyEmailAsync(
                    It.IsAny<VerifyEmailDto>()),
                Times.Once);
        }

        [Fact]
        public async Task VerifyEmail_Should_Return_BadRequest_When_Code_Is_Invalid()
        {
            _authServiceMock
                .Setup(x => x.VerifyEmailAsync(It.IsAny<VerifyEmailDto>()))
                .ReturnsAsync(false);

            var result = await _controller.VerifyEmail(
                CreateVerifyEmailDto());

            var badRequest =
                Assert.IsType<BadRequestObjectResult>(result);

            Assert.Equal(
                "Invalid or expired verification code.",
                badRequest.Value);
        }

        [Fact]
        public async Task ResendVerification_Should_Return_Ok_When_Code_Is_Sent()
        {
            _authServiceMock
                .Setup(x => x.ResendVerificationCodeAsync(It.IsAny<EmailDto>()))
                .ReturnsAsync(true);

            var result = await _controller.ResendVerification(
                CreateEmailDto());

            var ok = Assert.IsType<OkObjectResult>(result);

            Assert.Equal(
                "Verification code sent.",
                ok.Value);

            _authServiceMock.Verify(
                x => x.ResendVerificationCodeAsync(
                    It.IsAny<EmailDto>()),
                Times.Once);
        }

        [Fact]
        public async Task ResendVerification_Should_Return_BadRequest_When_No_Pending_Registration_Exists()
        {
            _authServiceMock
                .Setup(x => x.ResendVerificationCodeAsync(It.IsAny<EmailDto>()))
                .ReturnsAsync(false);

            var result = await _controller.ResendVerification(
                CreateEmailDto());

            var badRequest =
                Assert.IsType<BadRequestObjectResult>(result);

            Assert.Equal(
                "No pending registration found.",
                badRequest.Value);
        }

        [Fact]
        public async Task Refresh_Should_Return_Ok_With_Tokens_When_Token_Is_Valid()
        {
            var dto = CreateRefreshTokenDto();

            var response = new TokenResponseDto
            {
                Token = "new-access-token",
                RefreshToken = "new-refresh-token"
            };

            _authServiceMock
                .Setup(x => x.RefreshTokenAsync(dto))
                .ReturnsAsync(response);

            var result = await _controller.Refresh(dto);

            var ok = Assert.IsType<OkObjectResult>(result.Result);

            Assert.Same(response, ok.Value);

            _authServiceMock.Verify(
                x => x.RefreshTokenAsync(dto),
                Times.Once);
        }

        [Fact]
        public async Task Refresh_Should_Return_Unauthorized_When_Token_Is_Invalid()
        {
            var dto = CreateRefreshTokenDto();

            _authServiceMock
                .Setup(x => x.RefreshTokenAsync(dto))
                .ReturnsAsync((TokenResponseDto?)null);

            var result = await _controller.Refresh(dto);

            Assert.IsType<UnauthorizedResult>(result.Result);
        }

        [Fact]
        public async Task Logout_Should_Return_NoContent_When_Logout_Succeeds()
        {
            var dto = CreateRefreshTokenDto();

            _authServiceMock
                .Setup(x => x.LogoutAsync(dto))
                .ReturnsAsync(true);

            var result = await _controller.Logout(dto);

            Assert.IsType<NoContentResult>(result);

            _authServiceMock.Verify(
                x => x.LogoutAsync(dto),
                Times.Once);
        }

        [Fact]
        public async Task Logout_Should_Return_BadRequest_When_Token_Is_Invalid()
        {
            var dto = CreateRefreshTokenDto();

            _authServiceMock
                .Setup(x => x.LogoutAsync(dto))
                .ReturnsAsync(false);

            var result = await _controller.Logout(dto);

            var badRequest =
                Assert.IsType<BadRequestObjectResult>(result);

            Assert.Equal(
                "Invalid or already revoked refresh token.",
                badRequest.Value);
        }
    }
}