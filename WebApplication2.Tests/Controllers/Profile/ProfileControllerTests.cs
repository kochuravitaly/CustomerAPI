using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using WebApplication2.Controllers.Profile;
using WebApplication2.DTOs.Auth;
using WebApplication2.DTOs.Profile;
using WebApplication2.Services.Profile;

namespace WebApplication2.Tests.Controllers.Profile
{
    public class ProfileControllerTests
    {
        private readonly Mock<IProfileService> _profileServiceMock;
        private readonly ProfileController _controller;

        public ProfileControllerTests()
        {
            _profileServiceMock = new Mock<IProfileService>();
            _controller = new ProfileController(_profileServiceMock.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
            }));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [Fact]
        public async Task GetProfile_Should_Return_Ok_When_Found()
        {
            var profile = new ProfileDto { Id = Guid.NewGuid(), Name = "Test" };
            _profileServiceMock.Setup(x => x.GetProfileAsync(It.IsAny<Guid>())).ReturnsAsync(profile);

            var result = await _controller.GetProfile();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(profile, okResult.Value);
        }

        [Fact]
        public async Task GetProfile_Should_Return_NotFound_When_Not_Found()
        {
            _profileServiceMock.Setup(x => x.GetProfileAsync(It.IsAny<Guid>())).ReturnsAsync((ProfileDto)null);

            var result = await _controller.GetProfile();

            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task UpdateName_Should_Return_NoContent_When_Success()
        {
            _profileServiceMock.Setup(x => x.UpdateNameAsync(It.IsAny<Guid>(), It.IsAny<UpdateProfileDto>())).ReturnsAsync(true);

            var result = await _controller.UpdateName(new UpdateProfileDto { Name = "New" });

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task UpdateName_Should_Return_NotFound_When_Failed()
        {
            _profileServiceMock.Setup(x => x.UpdateNameAsync(It.IsAny<Guid>(), It.IsAny<UpdateProfileDto>())).ReturnsAsync(false);

            var result = await _controller.UpdateName(new UpdateProfileDto { Name = "New" });

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task ChangePassword_Should_Return_NoContent_When_Success()
        {
            _profileServiceMock.Setup(x => x.ChangePasswordAsync(It.IsAny<Guid>(), It.IsAny<ChangePasswordDto>())).ReturnsAsync(string.Empty);

            var result = await _controller.ChangePassword(new ChangePasswordDto());

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task ChangePassword_Should_Return_NotFound_When_Customer_Not_Found()
        {
            _profileServiceMock.Setup(x => x.ChangePasswordAsync(It.IsAny<Guid>(), It.IsAny<ChangePasswordDto>())).ReturnsAsync((string)null);

            var result = await _controller.ChangePassword(new ChangePasswordDto());

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task ChangePassword_Should_Return_BadRequest_When_Error()
        {
            _profileServiceMock.Setup(x => x.ChangePasswordAsync(It.IsAny<Guid>(), It.IsAny<ChangePasswordDto>())).ReturnsAsync("Error");

            var result = await _controller.ChangePassword(new ChangePasswordDto());

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task ChangeEmail_Should_Return_Ok_When_Success()
        {
            _profileServiceMock.Setup(x => x.ChangeEmailAsync(It.IsAny<Guid>(), It.IsAny<ChangeEmailDto>())).ReturnsAsync(string.Empty);

            var result = await _controller.ChangeEmail(new ChangeEmailDto());

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task ChangeEmail_Should_Return_NotFound_When_Customer_Not_Found()
        {
            _profileServiceMock.Setup(x => x.ChangeEmailAsync(It.IsAny<Guid>(), It.IsAny<ChangeEmailDto>())).ReturnsAsync((string)null);

            var result = await _controller.ChangeEmail(new ChangeEmailDto());

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task ChangeEmail_Should_Return_BadRequest_When_Error()
        {
            _profileServiceMock.Setup(x => x.ChangeEmailAsync(It.IsAny<Guid>(), It.IsAny<ChangeEmailDto>())).ReturnsAsync("Error");

            var result = await _controller.ChangeEmail(new ChangeEmailDto());

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task VerifyEmailChange_Should_Return_NoContent_When_Success()
        {
            _profileServiceMock.Setup(x => x.VerifyEmailChangeAsync(It.IsAny<Guid>(), It.IsAny<VerifyEmailChangeDto>())).ReturnsAsync(string.Empty);

            var result = await _controller.VerifyEmailChange(new VerifyEmailChangeDto());

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task VerifyEmailChange_Should_Return_NotFound_When_Customer_Not_Found()
        {
            _profileServiceMock.Setup(x => x.VerifyEmailChangeAsync(It.IsAny<Guid>(), It.IsAny<VerifyEmailChangeDto>())).ReturnsAsync((string)null);

            var result = await _controller.VerifyEmailChange(new VerifyEmailChangeDto());

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task VerifyEmailChange_Should_Return_BadRequest_When_Error()
        {
            _profileServiceMock.Setup(x => x.VerifyEmailChangeAsync(It.IsAny<Guid>(), It.IsAny<VerifyEmailChangeDto>())).ReturnsAsync("Error");

            var result = await _controller.VerifyEmailChange(new VerifyEmailChangeDto());

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task DeleteAccount_Should_Return_NoContent_When_Success()
        {
            _profileServiceMock.Setup(x => x.DeleteAccountAsync(It.IsAny<Guid>(), It.IsAny<DeleteAccountDto>())).ReturnsAsync(string.Empty);

            var result = await _controller.DeleteAccount(new DeleteAccountDto());

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteAccount_Should_Return_NotFound_When_Customer_Not_Found()
        {
            _profileServiceMock.Setup(x => x.DeleteAccountAsync(It.IsAny<Guid>(), It.IsAny<DeleteAccountDto>())).ReturnsAsync((string)null);

            var result = await _controller.DeleteAccount(new DeleteAccountDto());

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeleteAccount_Should_Return_BadRequest_When_Error()
        {
            _profileServiceMock.Setup(x => x.DeleteAccountAsync(It.IsAny<Guid>(), It.IsAny<DeleteAccountDto>())).ReturnsAsync("Error");

            var result = await _controller.DeleteAccount(new DeleteAccountDto());

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task GetAccounts_Should_Return_Ok_With_Accounts()
        {
            var accounts = new List<ProfileAccountDto> { new ProfileAccountDto { Id = Guid.NewGuid() } };
            _profileServiceMock.Setup(x => x.GetAccountsAsync(It.IsAny<Guid>())).ReturnsAsync(accounts);

            var result = await _controller.GetAccounts();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(accounts, okResult.Value);
        }

        [Fact]
        public async Task AddAccount_Should_Return_NoContent_When_Success()
        {
            _profileServiceMock.Setup(x => x.AddAccountAsync(It.IsAny<Guid>(), It.IsAny<AddAccountDto>())).ReturnsAsync(string.Empty);

            var result = await _controller.AddAccount(new AddAccountDto());

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task AddAccount_Should_Return_NotFound_When_Customer_Not_Found()
        {
            _profileServiceMock.Setup(x => x.AddAccountAsync(It.IsAny<Guid>(), It.IsAny<AddAccountDto>())).ReturnsAsync((string)null);

            var result = await _controller.AddAccount(new AddAccountDto());

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task AddAccount_Should_Return_BadRequest_When_Error()
        {
            _profileServiceMock.Setup(x => x.AddAccountAsync(It.IsAny<Guid>(), It.IsAny<AddAccountDto>())).ReturnsAsync("Error");

            var result = await _controller.AddAccount(new AddAccountDto());

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task RemoveAccount_Should_Return_NoContent_When_Success()
        {
            _profileServiceMock.Setup(x => x.RemoveAccountAsync(It.IsAny<Guid>(), It.IsAny<Guid>())).ReturnsAsync(string.Empty);

            var result = await _controller.RemoveAccount(Guid.NewGuid());

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task RemoveAccount_Should_Return_NotFound_When_Customer_Not_Found()
        {
            _profileServiceMock.Setup(x => x.RemoveAccountAsync(It.IsAny<Guid>(), It.IsAny<Guid>())).ReturnsAsync((string)null);

            var result = await _controller.RemoveAccount(Guid.NewGuid());

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task SwitchAccount_Should_Return_Ok_When_Success()
        {
            var tokenResponse = new TokenResponseDto { Token = "token", RefreshToken = "refresh" };
            _profileServiceMock.Setup(x => x.SwitchAccountAsync(It.IsAny<Guid>(), It.IsAny<Guid>())).ReturnsAsync(tokenResponse);

            var result = await _controller.SwitchAccount(Guid.NewGuid());

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(tokenResponse, okResult.Value);
        }

        [Fact]
        public async Task SwitchAccount_Should_Return_BadRequest_When_Failed()
        {
            _profileServiceMock.Setup(x => x.SwitchAccountAsync(It.IsAny<Guid>(), It.IsAny<Guid>())).ReturnsAsync((TokenResponseDto)null);

            var result = await _controller.SwitchAccount(Guid.NewGuid());

            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetSessions_Should_Return_Ok_With_Sessions()
        {
            var sessions = new List<SessionDto> { new SessionDto { Id = 1 } };
            _profileServiceMock.Setup(x => x.GetSessionsAsync(It.IsAny<Guid>())).ReturnsAsync(sessions);

            var result = await _controller.GetSessions();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(sessions, okResult.Value);
        }

        [Fact]
        public async Task RevokeSession_Should_Return_NoContent_When_Success()
        {
            _profileServiceMock.Setup(x => x.RevokeSessionAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(string.Empty);

            var result = await _controller.RevokeSession(1);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task RevokeSession_Should_Return_NotFound_When_Not_Found()
        {
            _profileServiceMock.Setup(x => x.RevokeSessionAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync((string)null);

            var result = await _controller.RevokeSession(1);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Get2FASetup_Should_Return_Ok_When_Success()
        {
            var setup = new TwoFactorSetupDto { SecretKey = "secret", QrCodeUri = "qr" };
            _profileServiceMock.Setup(x => x.Get2FASetupAsync(It.IsAny<Guid>())).ReturnsAsync(setup);

            var result = await _controller.Get2FASetup();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(setup, okResult.Value);
        }

        [Fact]
        public async Task Get2FASetup_Should_Return_NotFound_When_Not_Found()
        {
            _profileServiceMock.Setup(x => x.Get2FASetupAsync(It.IsAny<Guid>())).ReturnsAsync((TwoFactorSetupDto)null);

            var result = await _controller.Get2FASetup();

            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task Enable2FA_Should_Return_Ok_When_Success()
        {
            _profileServiceMock.Setup(x => x.Enable2FAAsync(It.IsAny<Guid>(), It.IsAny<string>())).ReturnsAsync(string.Empty);

            var result = await _controller.Enable2FA(new TwoFactorVerifyDto { Code = "123456" });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task Enable2FA_Should_Return_NotFound_When_Not_Found()
        {
            _profileServiceMock.Setup(x => x.Enable2FAAsync(It.IsAny<Guid>(), It.IsAny<string>())).ReturnsAsync((string)null);

            var result = await _controller.Enable2FA(new TwoFactorVerifyDto { Code = "123456" });

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Enable2FA_Should_Return_BadRequest_When_Error()
        {
            _profileServiceMock.Setup(x => x.Enable2FAAsync(It.IsAny<Guid>(), It.IsAny<string>())).ReturnsAsync("Invalid code");

            var result = await _controller.Enable2FA(new TwoFactorVerifyDto { Code = "123456" });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task Disable2FA_Should_Return_Ok_When_Success()
        {
            _profileServiceMock.Setup(x => x.Disable2FAAsync(It.IsAny<Guid>(), It.IsAny<string>())).ReturnsAsync(string.Empty);

            var result = await _controller.Disable2FA(new TwoFactorVerifyDto { Code = "123456" });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task Disable2FA_Should_Return_NotFound_When_Not_Found()
        {
            _profileServiceMock.Setup(x => x.Disable2FAAsync(It.IsAny<Guid>(), It.IsAny<string>())).ReturnsAsync((string)null);

            var result = await _controller.Disable2FA(new TwoFactorVerifyDto { Code = "123456" });

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task SetupEmail2FA_Should_Return_Ok_When_Success()
        {
            _profileServiceMock.Setup(x => x.SetupEmail2FAAsync(It.IsAny<Guid>())).ReturnsAsync(string.Empty);

            var result = await _controller.SetupEmail2FA();

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task SetupEmail2FA_Should_Return_NotFound_When_Not_Found()
        {
            _profileServiceMock.Setup(x => x.SetupEmail2FAAsync(It.IsAny<Guid>())).ReturnsAsync((string)null);

            var result = await _controller.SetupEmail2FA();

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task VerifyEmail2FA_Should_Return_Ok_When_Success()
        {
            _profileServiceMock.Setup(x => x.VerifyEmail2FAAsync(It.IsAny<Guid>(), It.IsAny<string>())).ReturnsAsync(string.Empty);

            var result = await _controller.VerifyEmail2FA(new EmailTwoFactorVerifyDto { Code = "123456" });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task VerifyEmail2FA_Should_Return_NotFound_When_Not_Found()
        {
            _profileServiceMock.Setup(x => x.VerifyEmail2FAAsync(It.IsAny<Guid>(), It.IsAny<string>())).ReturnsAsync((string)null);

            var result = await _controller.VerifyEmail2FA(new EmailTwoFactorVerifyDto { Code = "123456" });

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Get2FAStatus_Should_Return_Ok_With_Status()
        {
            _profileServiceMock.Setup(x => x.Is2FAEnabledAsync(It.IsAny<Guid>())).ReturnsAsync(true);

            var result = await _controller.Get2FAStatus();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.True((bool)okResult.Value);
        }

        [Fact]
        public async Task Get2FAInfo_Should_Return_Ok_With_Info()
        {
            var info = new TwoFactorInfoDto { IsEnabled = true, Method = "email" };
            _profileServiceMock.Setup(x => x.Get2FAInfoAsync(It.IsAny<Guid>())).ReturnsAsync(info);

            var result = await _controller.Get2FAInfo();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(info, okResult.Value);
        }

        [Fact]
        public async Task SendDisableCode_Should_Return_Ok_When_Success()
        {
            _profileServiceMock.Setup(x => x.SendDisable2FACodeAsync(It.IsAny<Guid>())).ReturnsAsync(string.Empty);

            var result = await _controller.SendDisableCode();

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task SendDisableCode_Should_Return_NotFound_When_Not_Found()
        {
            _profileServiceMock.Setup(x => x.SendDisable2FACodeAsync(It.IsAny<Guid>())).ReturnsAsync((string)null);

            var result = await _controller.SendDisableCode();

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task SendDisableCode_Should_Return_BadRequest_When_Error()
        {
            _profileServiceMock.Setup(x => x.SendDisable2FACodeAsync(It.IsAny<Guid>())).ReturnsAsync("Please wait");

            var result = await _controller.SendDisableCode();

            Assert.IsType<BadRequestObjectResult>(result);
        }
    }
}