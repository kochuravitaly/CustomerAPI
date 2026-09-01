using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Moq;
using WebApplication2.Data;
using WebApplication2.DTOs.Auth;
using WebApplication2.DTOs.Profile;
using WebApplication2.Models.Auth;
using WebApplication2.Models.Profile;
using WebApplication2.Services.Auth.Interfaces;
using WebApplication2.Services.FileStorage.Interfaces;
using WebApplication2.Services.Profile.WebApplication2.Services.Profile;

namespace WebApplication2.Tests.Services.Profile
{
    public class ProfileServiceTests
    {
        private readonly Mock<IPasswordHasher<Customer>> _passwordHasherMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<ISecureTokenGeneratorService> _secureTokenGeneratorMock;
        private readonly Mock<IFileStorageService> _fileStorageMock;
        private readonly Mock<IImageFileValidator> _imageValidatorMock;
        private readonly Mock<ITokenService> _tokenServiceMock;
        private readonly Mock<IRefreshTokenService> _refreshTokenServiceMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly AppDbContext _context;
        private readonly ProfileService _profileService;

        public ProfileServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _passwordHasherMock = new Mock<IPasswordHasher<Customer>>();
            _emailServiceMock = new Mock<IEmailService>();
            _secureTokenGeneratorMock = new Mock<ISecureTokenGeneratorService>();
            _fileStorageMock = new Mock<IFileStorageService>();
            _imageValidatorMock = new Mock<IImageFileValidator>();
            _tokenServiceMock = new Mock<ITokenService>();
            _refreshTokenServiceMock = new Mock<IRefreshTokenService>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

            var httpContext = new DefaultHttpContext();
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(httpContext);

            _profileService = new ProfileService(
                _context,
                _passwordHasherMock.Object,
                _emailServiceMock.Object,
                _secureTokenGeneratorMock.Object,
                _fileStorageMock.Object,
                _imageValidatorMock.Object,
                _tokenServiceMock.Object,
                _refreshTokenServiceMock.Object,
                _httpContextAccessorMock.Object);

            _context.Roles.Add(new Role { Id = 1, Name = "Customer" });
            _context.SaveChanges();
        }

        private async Task<Customer> CreateCustomerAsync(
            string email = "test@test.com",
            string name = "Test User",
            bool isEmailConfirmed = true)
        {
            var customer = new Customer
            {
                Id = Guid.NewGuid(),
                Name = name,
                Email = email,
                PasswordHash = "hashed-password",
                IsEmailConfirmed = isEmailConfirmed,
                RoleId = 1
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            return customer;
        }

        private IFormFile CreateFormFile(string fileName = "test.jpg", string contentType = "image/jpeg", int length = 100)
        {
            var fileMock = new Mock<IFormFile>();
            var content = new byte[length];

            fileMock.Setup(x => x.FileName).Returns(fileName);
            fileMock.Setup(x => x.ContentType).Returns(contentType);
            fileMock.Setup(x => x.Length).Returns(length);
            fileMock.Setup(x => x.OpenReadStream()).Returns(new MemoryStream(content));

            return fileMock.Object;
        }

        [Fact]
        public async Task GetProfileAsync_Should_Return_Profile_When_Found()
        {
            var customer = await CreateCustomerAsync();

            var result = await _profileService.GetProfileAsync(customer.Id);

            Assert.NotNull(result);
            Assert.Equal("Test User", result.Name);
            Assert.Equal("test@test.com", result.Email);
            Assert.Equal("Customer", result.Role);
        }

        [Fact]
        public async Task GetProfileAsync_Should_Return_Null_When_Not_Found()
        {
            var result = await _profileService.GetProfileAsync(Guid.NewGuid());

            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateNameAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _profileService.UpdateNameAsync(
                Guid.NewGuid(),
                new UpdateProfileDto { Name = "New Name" });

            Assert.False(result);
        }

        [Fact]
        public async Task UpdateNameAsync_Should_Update_Name()
        {
            var customer = await CreateCustomerAsync();

            var result = await _profileService.UpdateNameAsync(
                customer.Id,
                new UpdateProfileDto { Name = "New Name" });

            Assert.True(result);
            var updated = await _context.Customers.FindAsync(customer.Id);
            Assert.Equal("New Name", updated.Name);
        }

        [Fact]
        public async Task ChangePasswordAsync_Should_Return_Null_When_Not_Found()
        {
            var result = await _profileService.ChangePasswordAsync(
                Guid.NewGuid(),
                new ChangePasswordDto
                {
                    CurrentPassword = "old",
                    NewPassword = "new",
                    ConfirmNewPassword = "new"
                });

            Assert.Null(result);
        }

        [Fact]
        public async Task ChangePasswordAsync_Should_Return_Error_When_Password_Wrong()
        {
            var customer = await CreateCustomerAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .Returns(Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed);

            var result = await _profileService.ChangePasswordAsync(
                customer.Id,
                new ChangePasswordDto
                {
                    CurrentPassword = "wrong",
                    NewPassword = "new",
                    ConfirmNewPassword = "new"
                });

            Assert.Equal("Current password is incorrect.", result);
        }

        [Fact]
        public async Task ChangePasswordAsync_Should_Update_Password()
        {
            var customer = await CreateCustomerAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .Returns(Microsoft.AspNetCore.Identity.PasswordVerificationResult.Success);

            _passwordHasherMock
                .Setup(x => x.HashPassword(It.IsAny<Customer>(), "new-password"))
                .Returns("new-hash");

            var result = await _profileService.ChangePasswordAsync(
                customer.Id,
                new ChangePasswordDto
                {
                    CurrentPassword = "old-password",
                    NewPassword = "new-password",
                    ConfirmNewPassword = "new-password"
                });

            Assert.Equal(string.Empty, result);
            var updated = await _context.Customers.FindAsync(customer.Id);
            Assert.Equal("new-hash", updated.PasswordHash);
        }

        [Fact]
        public async Task ChangeEmailAsync_Should_Return_Null_When_Not_Found()
        {
            var result = await _profileService.ChangeEmailAsync(
                Guid.NewGuid(),
                new ChangeEmailDto
                {
                    Password = "password",
                    NewEmail = "new@test.com"
                });

            Assert.Null(result);
        }

        [Fact]
        public async Task ChangeEmailAsync_Should_Return_Error_When_Password_Wrong()
        {
            var customer = await CreateCustomerAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .Returns(Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed);

            var result = await _profileService.ChangeEmailAsync(
                customer.Id,
                new ChangeEmailDto
                {
                    Password = "wrong",
                    NewEmail = "new@test.com"
                });

            Assert.Equal("Password is incorrect.", result);
        }

        [Fact]
        public async Task ChangeEmailAsync_Should_Return_Error_When_Email_Exists()
        {
            var customer = await CreateCustomerAsync("test@test.com");
            await CreateCustomerAsync("existing@test.com");

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .Returns(Microsoft.AspNetCore.Identity.PasswordVerificationResult.Success);

            var result = await _profileService.ChangeEmailAsync(
                customer.Id,
                new ChangeEmailDto
                {
                    Password = "password",
                    NewEmail = "existing@test.com"
                });

            Assert.Equal("Email is already in use.", result);
        }

        [Fact]
        public async Task ChangeEmailAsync_Should_Create_Pending_Change()
        {
            var customer = await CreateCustomerAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .Returns(Microsoft.AspNetCore.Identity.PasswordVerificationResult.Success);

            _passwordHasherMock
                .Setup(x => x.HashPassword(It.IsAny<Customer>(), It.IsAny<string>()))
                .Returns("code-hash");

            var result = await _profileService.ChangeEmailAsync(
                customer.Id,
                new ChangeEmailDto
                {
                    Password = "password",
                    NewEmail = "new@test.com"
                });

            Assert.Equal(string.Empty, result);
            Assert.Single(await _context.PendingEmailChanges.ToListAsync());
        }

        [Fact]
        public async Task VerifyEmailChangeAsync_Should_Return_Error_When_No_Pending()
        {
            var result = await _profileService.VerifyEmailChangeAsync(
                Guid.NewGuid(),
                new VerifyEmailChangeDto
                {
                    NewEmail = "new@test.com",
                    Code = "123456"
                });

            Assert.Equal("No pending email change found.", result);
        }

        [Fact]
        public async Task VerifyEmailChangeAsync_Should_Return_Error_When_Expired()
        {
            var customer = await CreateCustomerAsync();

            _context.PendingEmailChanges.Add(new PendingEmailChange
            {
                CustomerId = customer.Id,
                NewEmail = "new@test.com",
                CodeHash = "code-hash",
                ExpiresAt = DateTime.UtcNow.AddMinutes(-1)
            });
            await _context.SaveChangesAsync();

            var result = await _profileService.VerifyEmailChangeAsync(
                customer.Id,
                new VerifyEmailChangeDto
                {
                    NewEmail = "new@test.com",
                    Code = "123456"
                });

            Assert.Equal("Verification code has expired.", result);
        }

        [Fact]
        public async Task VerifyEmailChangeAsync_Should_Return_Error_When_Code_Invalid()
        {
            var customer = await CreateCustomerAsync();

            _context.PendingEmailChanges.Add(new PendingEmailChange
            {
                CustomerId = customer.Id,
                NewEmail = "new@test.com",
                CodeHash = "code-hash",
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            });
            await _context.SaveChangesAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    "code-hash",
                    "123456"))
                .Returns(Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed);

            var result = await _profileService.VerifyEmailChangeAsync(
                customer.Id,
                new VerifyEmailChangeDto
                {
                    NewEmail = "new@test.com",
                    Code = "123456"
                });

            Assert.Equal("Invalid verification code.", result);
        }

        [Fact]
        public async Task VerifyEmailChangeAsync_Should_Update_Email()
        {
            var customer = await CreateCustomerAsync();

            _context.PendingEmailChanges.Add(new PendingEmailChange
            {
                CustomerId = customer.Id,
                NewEmail = "new@test.com",
                CodeHash = "code-hash",
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            });
            await _context.SaveChangesAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    "code-hash",
                    "123456"))
                .Returns(Microsoft.AspNetCore.Identity.PasswordVerificationResult.Success);

            var result = await _profileService.VerifyEmailChangeAsync(
                customer.Id,
                new VerifyEmailChangeDto
                {
                    NewEmail = "new@test.com",
                    Code = "123456"
                });

            Assert.Equal(string.Empty, result);
            var updated = await _context.Customers.FindAsync(customer.Id);
            Assert.Equal("new@test.com", updated.Email);
            Assert.True(updated.IsEmailConfirmed);
            Assert.Empty(await _context.PendingEmailChanges.ToListAsync());
        }

        [Fact]
        public async Task AddAccountAsync_Should_Return_Error_When_Current_Customer_Not_Found()
        {
            var result = await _profileService.AddAccountAsync(
                Guid.NewGuid(),
                new AddAccountDto
                {
                    Email = "other@test.com",
                    Password = "password"
                });

            Assert.Equal("Current customer not found.", result);
        }

        [Fact]
        public async Task AddAccountAsync_Should_Return_Error_When_Account_Not_Found()
        {
            var customer = await CreateCustomerAsync();

            var result = await _profileService.AddAccountAsync(
                customer.Id,
                new AddAccountDto
                {
                    Email = "nonexistent@test.com",
                    Password = "password"
                });

            Assert.Equal("Invalid email or password.", result);
        }

        [Fact]
        public async Task AddAccountAsync_Should_Return_Error_When_Password_Wrong()
        {
            var customer = await CreateCustomerAsync();
            await CreateCustomerAsync("other@test.com", "Other User");

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .Returns(Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed);

            var result = await _profileService.AddAccountAsync(
                customer.Id,
                new AddAccountDto
                {
                    Email = "other@test.com",
                    Password = "wrong"
                });

            Assert.Equal("Invalid email or password.", result);
        }

        [Fact]
        public async Task AddAccountAsync_Should_Return_Error_When_Email_Not_Confirmed()
        {
            var customer = await CreateCustomerAsync();
            await CreateCustomerAsync("other@test.com", "Other User", false);

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .Returns(Microsoft.AspNetCore.Identity.PasswordVerificationResult.Success);

            var result = await _profileService.AddAccountAsync(
                customer.Id,
                new AddAccountDto
                {
                    Email = "other@test.com",
                    Password = "password"
                });

            Assert.Equal("Email is not confirmed.", result);
        }

        [Fact]
        public async Task AddAccountAsync_Should_Return_Error_When_Same_Account()
        {
            var customer = await CreateCustomerAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .Returns(Microsoft.AspNetCore.Identity.PasswordVerificationResult.Success);

            var result = await _profileService.AddAccountAsync(
                customer.Id,
                new AddAccountDto
                {
                    Email = "test@test.com",
                    Password = "password"
                });

            Assert.Equal("This account is already added.", result);
        }

        [Fact]
        public async Task AddAccountAsync_Should_Add_Account()
        {
            var customer = await CreateCustomerAsync();
            await CreateCustomerAsync("other@test.com", "Other User");

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .Returns(Microsoft.AspNetCore.Identity.PasswordVerificationResult.Success);

            var result = await _profileService.AddAccountAsync(
                customer.Id,
                new AddAccountDto
                {
                    Email = "other@test.com",
                    Password = "password"
                });

            Assert.Equal(string.Empty, result);
            Assert.Single(await _context.SavedAccounts.ToListAsync());
        }

        [Fact]
        public async Task RemoveAccountAsync_Should_Return_Error_When_Not_Found()
        {
            var result = await _profileService.RemoveAccountAsync(
                Guid.NewGuid(),
                Guid.NewGuid());

            Assert.Equal("Account not found.", result);
        }

        [Fact]
        public async Task RemoveAccountAsync_Should_Remove_Account()
        {
            var customer = await CreateCustomerAsync();
            var otherCustomer = await CreateCustomerAsync("other@test.com", "Other User");

            _context.SavedAccounts.Add(new SavedAccount
            {
                CustomerId = customer.Id,
                SavedCustomerId = otherCustomer.Id
            });
            await _context.SaveChangesAsync();

            var result = await _profileService.RemoveAccountAsync(
                customer.Id,
                otherCustomer.Id);

            Assert.Equal(string.Empty, result);
            Assert.Empty(await _context.SavedAccounts.ToListAsync());
        }

        [Fact]
        public async Task GetSessionsAsync_Should_Return_Active_Sessions()
        {
            var customer = await CreateCustomerAsync();

            _context.Sessions.Add(new Session
            {
                CustomerId = customer.Id,
                DeviceInfo = "Windows",
                IpAddress = "127.0.0.1",
                IsActive = true
            });
            _context.Sessions.Add(new Session
            {
                CustomerId = customer.Id,
                DeviceInfo = "Account Switch",
                IpAddress = "127.0.0.1",
                IsActive = true
            });
            await _context.SaveChangesAsync();

            var result = await _profileService.GetSessionsAsync(customer.Id);

            Assert.Single(result);
            Assert.Equal("Windows", result.First().DeviceInfo);
        }

        [Fact]
        public async Task RevokeSessionAsync_Should_Return_Error_When_Not_Found()
        {
            var result = await _profileService.RevokeSessionAsync(
                Guid.NewGuid(),
                999);

            Assert.Equal("Session not found.", result);
        }

        [Fact]
        public async Task RevokeSessionAsync_Should_Revoke_Session()
        {
            var customer = await CreateCustomerAsync();

            var session = new Session
            {
                CustomerId = customer.Id,
                DeviceInfo = "Windows",
                IpAddress = "127.0.0.1",
                IsActive = true
            };
            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();

            var result = await _profileService.RevokeSessionAsync(customer.Id, session.Id);

            Assert.Equal(string.Empty, result);
            var updated = await _context.Sessions.FindAsync(session.Id);
            Assert.False(updated.IsActive);
        }

        [Fact]
        public async Task Is2FAEnabledAsync_Should_Return_False_When_Not_Enabled()
        {
            var result = await _profileService.Is2FAEnabledAsync(Guid.NewGuid());

            Assert.False(result);
        }

        [Fact]
        public async Task Is2FAEnabledAsync_Should_Return_True_When_Enabled()
        {
            var customer = await CreateCustomerAsync();

            _context.TwoFactorAuths.Add(new TwoFactorAuth
            {
                CustomerId = customer.Id,
                IsEnabled = true,
                IsEmailEnabled = true,
                SecretKey = "hashed-secret"
            });
            await _context.SaveChangesAsync();

            var result = await _profileService.Is2FAEnabledAsync(customer.Id);

            Assert.True(result);
        }

        [Fact]
        public async Task Get2FAInfoAsync_Should_Return_Disabled_When_Not_Enabled()
        {
            var result = await _profileService.Get2FAInfoAsync(Guid.NewGuid());

            Assert.False(result.IsEnabled);
        }

        [Fact]
        public async Task Get2FAInfoAsync_Should_Return_Email_Method()
        {
            var customer = await CreateCustomerAsync();

            _context.TwoFactorAuths.Add(new TwoFactorAuth
            {
                CustomerId = customer.Id,
                IsEnabled = true,
                IsEmailEnabled = true,
                SecretKey = "hashed-secret"
            });
            await _context.SaveChangesAsync();

            var result = await _profileService.Get2FAInfoAsync(customer.Id);

            Assert.True(result.IsEnabled);
            Assert.Equal("email", result.Method);
        }

        [Fact]
        public async Task Get2FAInfoAsync_Should_Return_App_Method()
        {
            var customer = await CreateCustomerAsync();

            _context.TwoFactorAuths.Add(new TwoFactorAuth
            {
                CustomerId = customer.Id,
                IsEnabled = true,
                IsEmailEnabled = false,
                SecretKey = "base32-secret"
            });
            await _context.SaveChangesAsync();

            var result = await _profileService.Get2FAInfoAsync(customer.Id);

            Assert.True(result.IsEnabled);
            Assert.Equal("app", result.Method);
        }

        [Fact]
        public async Task SendDisable2FACodeAsync_Should_Return_Error_When_Customer_Not_Found()
        {
            var result = await _profileService.SendDisable2FACodeAsync(Guid.NewGuid());

            Assert.Equal("Customer not found.", result);
        }

        [Fact]
        public async Task SendDisable2FACodeAsync_Should_Return_Error_When_2FA_Not_Enabled()
        {
            var customer = await CreateCustomerAsync();

            var result = await _profileService.SendDisable2FACodeAsync(customer.Id);

            Assert.Equal("2FA is not enabled.", result);
        }

        [Fact]
        public async Task SendDisable2FACodeAsync_Should_Return_Error_When_Not_Email_Based()
        {
            var customer = await CreateCustomerAsync();

            _context.TwoFactorAuths.Add(new TwoFactorAuth
            {
                CustomerId = customer.Id,
                IsEnabled = true,
                IsEmailEnabled = false,
                SecretKey = "base32-secret"
            });
            await _context.SaveChangesAsync();

            var result = await _profileService.SendDisable2FACodeAsync(customer.Id);

            Assert.Equal("2FA is not email-based.", result);
        }

        [Fact]
        public async Task SendDisable2FACodeAsync_Should_Return_Error_When_Cooldown_Active()
        {
            var customer = await CreateCustomerAsync();

            _context.TwoFactorAuths.Add(new TwoFactorAuth
            {
                CustomerId = customer.Id,
                IsEnabled = true,
                IsEmailEnabled = true,
                SecretKey = "hashed-secret",
                LastCodeSentAt = DateTime.UtcNow.AddSeconds(-30)
            });
            await _context.SaveChangesAsync();

            var result = await _profileService.SendDisable2FACodeAsync(customer.Id);

            Assert.Contains("Please wait", result);
            Assert.Contains("seconds", result);
        }

        [Fact]
        public async Task SendDisable2FACodeAsync_Should_Send_Code()
        {
            var customer = await CreateCustomerAsync();

            _context.TwoFactorAuths.Add(new TwoFactorAuth
            {
                CustomerId = customer.Id,
                IsEnabled = true,
                IsEmailEnabled = true,
                SecretKey = "hashed-secret"
            });
            await _context.SaveChangesAsync();

            _passwordHasherMock
                .Setup(x => x.HashPassword(It.IsAny<Customer>(), It.IsAny<string>()))
                .Returns("new-code-hash");

            var result = await _profileService.SendDisable2FACodeAsync(customer.Id);

            Assert.Equal(string.Empty, result);
            _emailServiceMock.Verify(
                x => x.SendEmailVerificationCodeAsync(
                    "test@test.com",
                    It.IsAny<string>(),
                    "en"),
                Times.Once);
        }

        [Fact]
        public async Task SetupEmail2FAAsync_Should_Return_Error_When_Customer_Not_Found()
        {
            var result = await _profileService.SetupEmail2FAAsync(Guid.NewGuid());

            Assert.Equal("Customer not found.", result);
        }

        [Fact]
        public async Task SetupEmail2FAAsync_Should_Create_Email_2FA()
        {
            var customer = await CreateCustomerAsync();

            _passwordHasherMock
                .Setup(x => x.HashPassword(It.IsAny<Customer>(), It.IsAny<string>()))
                .Returns("code-hash");

            var result = await _profileService.SetupEmail2FAAsync(customer.Id);

            Assert.Equal(string.Empty, result);
            var twoFactorAuth = await _context.TwoFactorAuths.SingleAsync();
            Assert.True(twoFactorAuth.IsEmailEnabled);
            Assert.False(twoFactorAuth.IsEnabled);
        }

        [Fact]
        public async Task VerifyEmail2FAAsync_Should_Return_Error_When_No_Pending()
        {
            var result = await _profileService.VerifyEmail2FAAsync(
                Guid.NewGuid(),
                "123456");

            Assert.Equal("No pending email 2FA setup found.", result);
        }

        [Fact]
        public async Task VerifyEmail2FAAsync_Should_Return_Error_When_Code_Invalid()
        {
            var customer = await CreateCustomerAsync();

            _context.TwoFactorAuths.Add(new TwoFactorAuth
            {
                CustomerId = customer.Id,
                IsEnabled = false,
                IsEmailEnabled = true,
                SecretKey = "code-hash"
            });
            await _context.SaveChangesAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    "code-hash",
                    "123456"))
                .Returns(Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed);

            var result = await _profileService.VerifyEmail2FAAsync(customer.Id, "123456");

            Assert.Equal("Invalid code.", result);
        }

        [Fact]
        public async Task VerifyEmail2FAAsync_Should_Enable_2FA()
        {
            var customer = await CreateCustomerAsync();

            _context.TwoFactorAuths.Add(new TwoFactorAuth
            {
                CustomerId = customer.Id,
                IsEnabled = false,
                IsEmailEnabled = true,
                SecretKey = "code-hash"
            });
            await _context.SaveChangesAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    "code-hash",
                    "123456"))
                .Returns(Microsoft.AspNetCore.Identity.PasswordVerificationResult.Success);

            var result = await _profileService.VerifyEmail2FAAsync(customer.Id, "123456");

            Assert.Equal(string.Empty, result);
            var updated = await _context.TwoFactorAuths.SingleAsync();
            Assert.True(updated.IsEnabled);
            Assert.True(updated.IsEmailEnabled);
        }

        [Fact]
        public async Task UploadProfilePictureAsync_Should_Delete_Old_Picture_After_Upload()
        {
            var customer = await CreateCustomerAsync();
            customer.ProfilePictureObjectKey = "old-picture.jpg";
            await _context.SaveChangesAsync();

            var file = CreateFormFile("new.jpg", "image/jpeg", 100);

            _imageValidatorMock.Setup(x => x.Validate(It.IsAny<IFormFile>())).Returns((string)null);
            _fileStorageMock.Setup(x => x.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
            _fileStorageMock.Setup(x => x.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var result = await _profileService.UploadProfilePictureAsync(customer.Id, file, CancellationToken.None);

            Assert.Equal(string.Empty, result);
            _fileStorageMock.Verify(x => x.DeleteAsync("old-picture.jpg", It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task SwitchAccountAsync_Should_Return_RequiresTwoFactor_When_Target_Has_2FA()
        {
            var customer = await CreateCustomerAsync();
            var targetCustomer = await CreateCustomerAsync("target@test.com", "Target User");

            _context.SavedAccounts.Add(new SavedAccount
            {
                CustomerId = customer.Id,
                SavedCustomerId = targetCustomer.Id
            });
            _context.TwoFactorAuths.Add(new TwoFactorAuth
            {
                CustomerId = targetCustomer.Id,
                IsEnabled = true,
                IsEmailEnabled = true,
                SecretKey = "hashed-secret"
            });
            await _context.SaveChangesAsync();

            var result = await _profileService.SwitchAccountAsync(customer.Id, targetCustomer.Id);

            Assert.NotNull(result);
            Assert.True(result.RequiresTwoFactor);
            Assert.Equal(targetCustomer.Id, result.CustomerId);
            Assert.Equal("email", result.TwoFactorMethod);
        }

        [Fact]
        public async Task DeleteAccountAsync_Should_Delete_Profile_Picture_From_Storage()
        {
            var customer = await CreateCustomerAsync();
            customer.ProfilePictureObjectKey = "profile-picture.jpg";
            await _context.SaveChangesAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(It.IsAny<Customer>(), It.IsAny<string>(), It.IsAny<string>()))
                .Returns(Microsoft.AspNetCore.Identity.PasswordVerificationResult.Success);

            _fileStorageMock
                .Setup(x => x.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var result = await _profileService.DeleteAccountAsync(
                customer.Id,
                new DeleteAccountDto { Password = "password" });

            Assert.Equal(string.Empty, result);
            _fileStorageMock.Verify(
                x => x.DeleteAsync("profile-picture.jpg", It.IsAny<CancellationToken>()),
                Times.Once);
        }
    }
}