using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Moq;
using WebApplication2.Data;
using WebApplication2.DTOs.Auth;
using WebApplication2.Models.Auth;
using WebApplication2.Services.Auth.Interfaces;
using WebApplication2.Services.Auth.Services;

namespace WebApplication2.Tests.Services.Auth
{
    public class AuthServiceTests
    {
        private readonly Mock<ITokenService> _tokenServiceMock;
        private readonly Mock<IRefreshTokenService> _refreshTokenServiceMock;
        private readonly Mock<IPasswordHasher<Customer>> _passwordHasherMock;
        private readonly Mock<ISecureTokenGeneratorService> _secureTokenGeneratorMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly AppDbContext _context;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _passwordHasherMock = new Mock<IPasswordHasher<Customer>>();
            _tokenServiceMock = new Mock<ITokenService>();
            _refreshTokenServiceMock = new Mock<IRefreshTokenService>();
            _secureTokenGeneratorMock = new Mock<ISecureTokenGeneratorService>();
            _emailServiceMock = new Mock<IEmailService>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

            var httpContext = new DefaultHttpContext();
            httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");
            httpContext.Request.Headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(httpContext);

            _authService = new AuthService(
                _context,
                _passwordHasherMock.Object,
                _tokenServiceMock.Object,
                _refreshTokenServiceMock.Object,
                _secureTokenGeneratorMock.Object,
                _emailServiceMock.Object,
                _httpContextAccessorMock.Object
            );
        }

        private async Task<Customer> CreateCustomerAsync(
            string email = "test@test.com",
            bool isEmailConfirmed = true)
        {
            var customer = new Customer
            {
                Id = Guid.NewGuid(),
                Name = "Test",
                Email = email,
                PasswordHash = "hashed-password",
                IsEmailConfirmed = isEmailConfirmed,
                Role = new Role { Name = "User" }
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return customer;
        }

        private RegisterCustomerDto CreateRegisterDto(
            string email = "test@test.com") => new()
            {
                Name = "Test",
                Email = email,
                Password = "password",
                ConfirmPassword = "password"
            };

        private LoginDto CreateLoginDto(
            string email = "test@test.com",
            string password = "password") => new()
            {
                Email = email,
                Password = password
            };

        private VerifyEmailDto CreateVerifyEmailDto(
            string email = "test@test.com",
            string code = "123456") => new()
            {
                Email = email,
                Code = code
            };

        private RefreshTokenDto CreateRefreshTokenDto() => new()
        {
            RefreshToken = "refresh-token"
        };

        private async Task<PendingRegistration> CreatePendingRegistrationAsync(
            string email = "test@test.com",
            string codeHash = "code-hash",
            DateTime? expiresAt = null)
        {
            var pendingRegistration = new PendingRegistration
            {
                Name = "Test",
                Email = email,
                PasswordHash = "hashed-password",
                CodeHash = codeHash,
                ExpiresAt = expiresAt ?? DateTime.UtcNow.AddMinutes(15)
            };

            _context.PendingRegistrations.Add(pendingRegistration);
            await _context.SaveChangesAsync();

            return pendingRegistration;
        }

        private async Task<RefreshToken> CreateRefreshTokenAsync(
            Customer? customer = null,
            string tokenHash = "refresh-token-hash",
            DateTime? expiresAt = null,
            bool isRevoked = false,
            int? sessionId = null)
        {
            customer ??= await CreateCustomerAsync();

            var refreshToken = new RefreshToken
            {
                CustomerId = customer.Id,
                Customer = customer,
                TokenHash = tokenHash,
                ExpiresAt = expiresAt ?? DateTime.UtcNow.AddDays(30),
                IsRevoked = isRevoked,
                SessionId = sessionId
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            return refreshToken;
        }

        private async Task<PasswordResetToken> CreatePasswordResetTokenAsync(
            Guid customerId,
            DateTime? expiresAt = null,
            bool isUsed = false)
        {
            var resetToken = new PasswordResetToken
            {
                CustomerId = customerId,
                TokenHash = "reset-token-hash",
                ExpiresAt = expiresAt ?? DateTime.UtcNow.AddMinutes(15),
                IsUsed = isUsed
            };

            _context.PasswordResetTokens.Add(resetToken);
            await _context.SaveChangesAsync();

            return resetToken;
        }

        private async Task<Models.Profile.Session> CreateSessionAsync(
            Guid customerId,
            string deviceInfo = "Windows",
            string ipAddress = "127.0.0.1",
            bool isActive = true)
        {
            var session = new Models.Profile.Session
            {
                CustomerId = customerId,
                DeviceInfo = deviceInfo,
                IpAddress = ipAddress,
                IsActive = isActive,
                CreatedAt = DateTime.UtcNow,
                LastActiveAt = DateTime.UtcNow
            };

            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();

            return session;
        }

        private void SetupPasswordVerification(
            string password,
            PasswordVerificationResult result)
        {
            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>(),
                    password))
                .Returns(result);
        }

        private void SetupTokenCreation(
            string accessToken,
            string refreshToken)
        {
            _tokenServiceMock
                .Setup(x => x.CreateToken(It.IsAny<Customer>(), It.IsAny<int?>()))
                .Returns(accessToken);

            _secureTokenGeneratorMock
                .Setup(x => x.CreateToken())
                .Returns(refreshToken);
        }

        private void SetupHashToken(
            string input,
            string output)
        {
            _secureTokenGeneratorMock
                .Setup(x => x.HashToken(input))
                .Returns(output);
        }

        private void SetupPasswordHashing(
            string password,
            string hash)
        {
            _passwordHasherMock
                .Setup(x => x.HashPassword(It.IsAny<Customer>(), password))
                .Returns(hash);
        }

        private void VerifyLoginDependenciesNotCalled()
        {
            _tokenServiceMock.Verify(
                x => x.CreateToken(It.IsAny<Customer>(), It.IsAny<int?>()),
                Times.Never);

            _secureTokenGeneratorMock.Verify(
                x => x.CreateToken(),
                Times.Never);

            _refreshTokenServiceMock.Verify(
                x => x.SaveRefreshTokenAsync(
                    It.IsAny<string>(),
                    It.IsAny<Guid>(),
                    It.IsAny<int?>()),
                Times.Never);
        }

        [Fact]
        public async Task Register_Should_Create_Pending_Registration_When_Email_Is_Not_Taken()
        {
            _passwordHasherMock
                .Setup(x => x.HashPassword(It.IsAny<Customer>(), It.IsAny<string>()))
                .Returns("hashed-password");

            _secureTokenGeneratorMock
                .Setup(x => x.HashToken(It.IsAny<string>()))
                .Returns("hashed-code");

            var result = await _authService.RegisterAsync(CreateRegisterDto());

            Assert.True(result);

            var pendingRegistration = await _context.PendingRegistrations.SingleAsync();

            Assert.Equal("Test", pendingRegistration.Name);
            Assert.Equal("test@test.com", pendingRegistration.Email);

            _emailServiceMock.Verify(
                x => x.SendEmailVerificationCodeAsync(
                    "test@test.com",
                    It.IsAny<string>(),
                    It.IsAny<string>()),
                Times.Once);
        }

        [Fact]
        public async Task Register_Should_Return_False_When_Email_Is_Already_Taken()
        {
            await CreateCustomerAsync();

            var result = await _authService.RegisterAsync(CreateRegisterDto());

            Assert.False(result);

            _passwordHasherMock.Verify(
                x => x.HashPassword(It.IsAny<Customer>(), It.IsAny<string>()),
                Times.Never);

            _secureTokenGeneratorMock.Verify(
                x => x.HashToken(It.IsAny<string>()),
                Times.Never);

            _emailServiceMock.Verify(
                x => x.SendEmailVerificationCodeAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()),
                Times.Never);
        }

        [Fact]
        public async Task Register_Should_Update_Existing_Pending_Registration_When_It_Exists()
        {
            _passwordHasherMock
                .Setup(x => x.HashPassword(It.IsAny<Customer>(), It.IsAny<string>()))
                .Returns("hashed-password");

            _secureTokenGeneratorMock
                .Setup(x => x.HashToken(It.IsAny<string>()))
                .Returns("hashed-code");

            _context.PendingRegistrations.Add(new PendingRegistration
            {
                Name = "Old Name",
                Email = "test@test.com",
                PasswordHash = "old-hash",
                CodeHash = "old-code-hash",
                ExpiresAt = DateTime.UtcNow.AddMinutes(-1)
            });
            await _context.SaveChangesAsync();

            var result = await _authService.RegisterAsync(CreateRegisterDto());

            Assert.True(result);

            var updated = await _context.PendingRegistrations.SingleAsync();

            Assert.Equal("Test", updated.Name);
            Assert.Equal(1, await _context.PendingRegistrations.CountAsync());
        }

        [Fact]
        public async Task Login_Should_Return_Tokens_When_Credentials_Are_Correct_And_No_2FA()
        {
            var customer = await CreateCustomerAsync();

            SetupPasswordVerification("password", PasswordVerificationResult.Success);
            SetupTokenCreation("access-token", "refresh-token");

            var result = await _authService.LoginAsync(CreateLoginDto());

            Assert.NotNull(result);
            Assert.Equal("access-token", result.Token);
            Assert.Equal("refresh-token", result.RefreshToken);
            Assert.False(result.RequiresTwoFactor);
        }

        [Fact]
        public async Task Login_Should_Return_Null_When_Customer_Not_Found()
        {
            var result = await _authService.LoginAsync(
                CreateLoginDto(email: "notfound@test.com"));

            Assert.Null(result);
            VerifyLoginDependenciesNotCalled();
        }

        [Fact]
        public async Task Login_Should_Return_Null_When_Email_Not_Confirmed()
        {
            await CreateCustomerAsync(isEmailConfirmed: false);

            var result = await _authService.LoginAsync(CreateLoginDto());

            Assert.Null(result);
            VerifyLoginDependenciesNotCalled();
        }

        [Fact]
        public async Task Login_Should_Return_Null_When_Password_Is_Wrong()
        {
            await CreateCustomerAsync();

            SetupPasswordVerification("wrong-password", PasswordVerificationResult.Failed);

            var result = await _authService.LoginAsync(
                CreateLoginDto(password: "wrong-password"));

            Assert.Null(result);
            VerifyLoginDependenciesNotCalled();
        }

        [Fact]
        public async Task Login_Should_Return_RequiresTwoFactor_When_App_2FA_Enabled()
        {
            var customer = await CreateCustomerAsync();

            _context.TwoFactorAuths.Add(new Models.Profile.TwoFactorAuth
            {
                CustomerId = customer.Id,
                IsEnabled = true,
                IsEmailEnabled = false,
                SecretKey = "JBSWY3DPEHPK3PXP"
            });
            await _context.SaveChangesAsync();

            SetupPasswordVerification("password", PasswordVerificationResult.Success);

            var result = await _authService.LoginAsync(CreateLoginDto());

            Assert.NotNull(result);
            Assert.True(result.RequiresTwoFactor);
            Assert.Equal("app", result.TwoFactorMethod);
            Assert.Null(result.Token);
        }

        [Fact]
        public async Task Login_Should_Send_Email_And_Return_Email_Method_When_Email_2FA_Enabled()
        {
            var customer = await CreateCustomerAsync();

            _context.TwoFactorAuths.Add(new Models.Profile.TwoFactorAuth
            {
                CustomerId = customer.Id,
                IsEnabled = true,
                IsEmailEnabled = true,
                SecretKey = "hashed_secret"
            });
            await _context.SaveChangesAsync();

            SetupPasswordVerification("password", PasswordVerificationResult.Success);

            var result = await _authService.LoginAsync(CreateLoginDto());

            Assert.NotNull(result);
            Assert.True(result.RequiresTwoFactor);
            Assert.Equal("email", result.TwoFactorMethod);

            _emailServiceMock.Verify(
                x => x.SendEmailVerificationCodeAsync(
                    "test@test.com",
                    It.IsAny<string>(),
                    "en"),
                Times.Once);
        }

        [Fact]
        public async Task Login_Should_Not_Send_Notification_When_Known_Session_Exists()
        {
            var customer = await CreateCustomerAsync();
            await CreateSessionAsync(customer.Id, "Windows", "127.0.0.1");

            SetupPasswordVerification("password", PasswordVerificationResult.Success);
            SetupTokenCreation("access-token", "refresh-token");

            await _authService.LoginAsync(CreateLoginDto());

            _emailServiceMock.Verify(
                x => x.SendNewLoginNotificationAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()),
                Times.Never);
        }

        [Fact]
        public async Task Login_Should_Send_Notification_When_New_Device_Logs_In()
        {
            var customer = await CreateCustomerAsync();

            SetupPasswordVerification("password", PasswordVerificationResult.Success);
            SetupTokenCreation("access-token", "refresh-token");

            await _authService.LoginAsync(CreateLoginDto());

            _emailServiceMock.Verify(
                x => x.SendNewLoginNotificationAsync(
                    "test@test.com",
                    "Windows",
                    "127.0.0.1",
                    "en"),
                Times.Once);
        }

        [Fact]
        public async Task Login_Should_Deactivate_Old_Session_From_Same_Device_And_IP()
        {
            var customer = await CreateCustomerAsync();
            var oldSession = await CreateSessionAsync(customer.Id, "Windows", "127.0.0.1");
            var oldToken = await CreateRefreshTokenAsync(customer, sessionId: oldSession.Id);

            SetupPasswordVerification("password", PasswordVerificationResult.Success);
            SetupTokenCreation("access-token", "refresh-token");

            await _authService.LoginAsync(CreateLoginDto());

            var updatedOldSession = await _context.Sessions.SingleAsync(s => s.Id == oldSession.Id);
            Assert.False(updatedOldSession.IsActive);

            var updatedOldToken = await _context.RefreshTokens.SingleAsync(r => r.Id == oldToken.Id);
            Assert.True(updatedOldToken.IsRevoked);
        }

        [Fact]
        public async Task VerifyEmail_Should_Create_Customer_When_Code_Is_Valid_And_Not_Expired()
        {
            await CreatePendingRegistrationAsync();

            SetupHashToken("123456", "code-hash");

            var result = await _authService.VerifyEmailAsync(CreateVerifyEmailDto());

            Assert.True(result);

            var customer = await _context.Customers.SingleAsync();

            Assert.Equal("Test", customer.Name);
            Assert.True(customer.IsEmailConfirmed);
            Assert.Empty(await _context.PendingRegistrations.ToListAsync());
        }

        [Fact]
        public async Task VerifyEmail_Should_Return_False_When_Pending_Registration_Not_Found()
        {
            SetupHashToken("123456", "code-hash");

            var result = await _authService.VerifyEmailAsync(CreateVerifyEmailDto());

            Assert.False(result);
        }

        [Fact]
        public async Task VerifyEmail_Should_Return_False_When_Code_Hash_Does_Not_Match()
        {
            await CreatePendingRegistrationAsync();

            SetupHashToken("123456", "wrong-hash");

            var result = await _authService.VerifyEmailAsync(CreateVerifyEmailDto());

            Assert.False(result);
            Assert.Single(await _context.PendingRegistrations.ToListAsync());
        }

        [Fact]
        public async Task VerifyEmail_Should_Return_False_When_Code_Is_Expired()
        {
            await CreatePendingRegistrationAsync(expiresAt: DateTime.UtcNow.AddMinutes(-1));

            SetupHashToken("123456", "code-hash");

            var result = await _authService.VerifyEmailAsync(CreateVerifyEmailDto());

            Assert.False(result);
        }

        [Fact]
        public async Task RefreshToken_Should_Return_New_Tokens_When_Token_Is_Valid()
        {
            var storedToken = await CreateRefreshTokenAsync();

            SetupHashToken("refresh-token", "refresh-token-hash");
            SetupTokenCreation("new-access", "new-refresh");

            var result = await _authService.RefreshTokenAsync(CreateRefreshTokenDto());

            Assert.NotNull(result);
            Assert.Equal("new-access", result.Token);
            Assert.Equal("new-refresh", result.RefreshToken);

            var updated = await _context.RefreshTokens.SingleAsync(r => r.Id == storedToken.Id);
            Assert.True(updated.IsRevoked);
        }

        [Fact]
        public async Task RefreshToken_Should_Return_Null_When_Token_Not_Found()
        {
            SetupHashToken("refresh-token", "refresh-token-hash");

            var result = await _authService.RefreshTokenAsync(CreateRefreshTokenDto());

            Assert.Null(result);
        }

        [Fact]
        public async Task RefreshToken_Should_Return_Null_When_Token_Expired()
        {
            await CreateRefreshTokenAsync(expiresAt: DateTime.UtcNow.AddDays(-1));

            SetupHashToken("refresh-token", "refresh-token-hash");

            var result = await _authService.RefreshTokenAsync(CreateRefreshTokenDto());

            Assert.Null(result);
        }

        [Fact]
        public async Task RefreshToken_Should_Return_Null_When_Token_Revoked()
        {
            await CreateRefreshTokenAsync(isRevoked: true);

            SetupHashToken("refresh-token", "refresh-token-hash");

            var result = await _authService.RefreshTokenAsync(CreateRefreshTokenDto());

            Assert.Null(result);
        }

        [Fact]
        public async Task Logout_Should_Return_True_And_Revoke_Token_When_Valid()
        {
            var storedToken = await CreateRefreshTokenAsync();

            SetupHashToken("refresh-token", "refresh-token-hash");

            var result = await _authService.LogoutAsync(CreateRefreshTokenDto());

            Assert.True(result);

            var updated = await _context.RefreshTokens.SingleAsync(r => r.Id == storedToken.Id);
            Assert.True(updated.IsRevoked);
        }

        [Fact]
        public async Task Logout_Should_Return_False_When_Token_Not_Found()
        {
            SetupHashToken("refresh-token", "refresh-token-hash");

            var result = await _authService.LogoutAsync(CreateRefreshTokenDto());

            Assert.False(result);
        }

        [Fact]
        public async Task Logout_Should_Return_False_When_Token_Already_Revoked()
        {
            await CreateRefreshTokenAsync(isRevoked: true);

            SetupHashToken("refresh-token", "refresh-token-hash");

            var result = await _authService.LogoutAsync(CreateRefreshTokenDto());

            Assert.False(result);
        }

        [Fact]
        public async Task Logout_Should_Deactivate_Session_When_SessionId_Exists()
        {
            var customer = await CreateCustomerAsync();
            var session = await CreateSessionAsync(customer.Id);
            await CreateRefreshTokenAsync(customer, sessionId: session.Id);

            SetupHashToken("refresh-token", "refresh-token-hash");

            await _authService.LogoutAsync(CreateRefreshTokenDto());

            var updatedSession = await _context.Sessions.SingleAsync(s => s.Id == session.Id);
            Assert.False(updatedSession.IsActive);
        }

        [Fact]
        public async Task Logout_Should_Not_Fail_When_SessionId_Is_Null()
        {
            await CreateRefreshTokenAsync(sessionId: null);

            SetupHashToken("refresh-token", "refresh-token-hash");

            var result = await _authService.LogoutAsync(CreateRefreshTokenDto());

            Assert.True(result);
        }

        [Fact]
        public async Task ForgotPassword_Should_Create_Reset_Token_When_Customer_Exists()
        {
            var customer = await CreateCustomerAsync();

            _secureTokenGeneratorMock
                .Setup(x => x.CreateToken())
                .Returns("raw-token");

            SetupHashToken("raw-token", "reset-token-hash");

            var result = await _authService.ForgotPasswordAsync(
                new EmailDto { Email = "test@test.com" });

            Assert.Equal("raw-token", result);

            var resetToken = await _context.PasswordResetTokens.SingleAsync();
            Assert.Equal(customer.Id, resetToken.CustomerId);
            Assert.False(resetToken.IsUsed);

            _emailServiceMock.Verify(
                x => x.SendPasswordResetEmailAsync(
                    "test@test.com",
                    "raw-token",
                    It.IsAny<string>()),
                Times.Once);
        }

        [Fact]
        public async Task ForgotPassword_Should_Return_Null_When_Customer_Not_Found()
        {
            var result = await _authService.ForgotPasswordAsync(
                new EmailDto { Email = "notfound@test.com" });

            Assert.Null(result);
            Assert.Empty(await _context.PasswordResetTokens.ToListAsync());
        }

        [Fact]
        public async Task ResetPassword_Should_Update_Password_And_Revoke_Tokens_And_Deactivate_Sessions()
        {
            var customer = await CreateCustomerAsync();
            await CreatePasswordResetTokenAsync(customer.Id);

            var refreshToken = await CreateRefreshTokenAsync(customer);
            var session = await CreateSessionAsync(customer.Id);
            refreshToken.SessionId = session.Id;
            await _context.SaveChangesAsync();

            SetupHashToken("reset-token", "reset-token-hash");
            SetupPasswordHashing("new-password", "new-password-hash");

            var result = await _authService.ResetPasswordAsync(new ResetPasswordDto
            {
                Token = "reset-token",
                NewPassword = "new-password"
            });

            Assert.True(result);

            var updatedCustomer = await _context.Customers.SingleAsync(c => c.Id == customer.Id);
            Assert.Equal("new-password-hash", updatedCustomer.PasswordHash);

            var updatedToken = await _context.PasswordResetTokens.SingleAsync();
            Assert.True(updatedToken.IsUsed);

            var updatedRefresh = await _context.RefreshTokens.SingleAsync(r => r.Id == refreshToken.Id);
            Assert.True(updatedRefresh.IsRevoked);

            var updatedSession = await _context.Sessions.SingleAsync(s => s.Id == session.Id);
            Assert.False(updatedSession.IsActive);
        }

        [Fact]
        public async Task ResetPassword_Should_Return_False_When_Token_Not_Found()
        {
            SetupHashToken("reset-token", "reset-token-hash");

            var result = await _authService.ResetPasswordAsync(new ResetPasswordDto
            {
                Token = "reset-token",
                NewPassword = "new-password"
            });

            Assert.False(result);
        }

        [Fact]
        public async Task ResetPassword_Should_Return_False_When_Token_Already_Used()
        {
            var customer = await CreateCustomerAsync();
            await CreatePasswordResetTokenAsync(customer.Id, isUsed: true);

            SetupHashToken("reset-token", "reset-token-hash");

            var result = await _authService.ResetPasswordAsync(new ResetPasswordDto
            {
                Token = "reset-token",
                NewPassword = "new-password"
            });

            Assert.False(result);
        }

        [Fact]
        public async Task ResetPassword_Should_Return_False_When_Token_Expired()
        {
            var customer = await CreateCustomerAsync();
            await CreatePasswordResetTokenAsync(
                customer.Id,
                expiresAt: DateTime.UtcNow.AddMinutes(-1));

            SetupHashToken("reset-token", "reset-token-hash");

            var result = await _authService.ResetPasswordAsync(new ResetPasswordDto
            {
                Token = "reset-token",
                NewPassword = "new-password"
            });

            Assert.False(result);
        }

        [Fact]
        public async Task ResetPassword_Should_Return_False_When_Customer_Not_Found()
        {
            await CreatePasswordResetTokenAsync(Guid.NewGuid());

            SetupHashToken("reset-token", "reset-token-hash");

            var result = await _authService.ResetPasswordAsync(new ResetPasswordDto
            {
                Token = "reset-token",
                NewPassword = "new-password"
            });

            Assert.False(result);
        }

        [Fact]
        public async Task ResendVerificationCode_Should_Return_True_When_Pending_Exists()
        {
            await CreatePendingRegistrationAsync(
                expiresAt: DateTime.UtcNow.AddMinutes(-1));

            var result = await _authService.ResendVerificationCodeAsync(
                new EmailDto { Email = "test@test.com" });

            Assert.True(result);

            var updated = await _context.PendingRegistrations.SingleAsync();
            Assert.True(updated.ExpiresAt > DateTime.UtcNow);
        }

        [Fact]
        public async Task ResendVerificationCode_Should_Return_False_When_Pending_Not_Found()
        {
            var result = await _authService.ResendVerificationCodeAsync(
                new EmailDto { Email = "notfound@test.com" });

            Assert.False(result);
        }

        [Fact]
        public async Task Verify2FA_Should_Return_Tokens_When_Email_Code_Valid()
        {
            var customer = await CreateCustomerAsync();

            _context.TwoFactorAuths.Add(new Models.Profile.TwoFactorAuth
            {
                CustomerId = customer.Id,
                IsEnabled = true,
                IsEmailEnabled = true,
                SecretKey = "hashed_code"
            });
            await _context.SaveChangesAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    "hashed_code",
                    "123456"))
                .Returns(PasswordVerificationResult.Success);

            SetupTokenCreation("access-token", "refresh-token");

            var result = await _authService.Verify2FAAsync(new Verify2FADto
            {
                CustomerId = customer.Id,
                Code = "123456"
            });

            Assert.NotNull(result);
            Assert.Equal("access-token", result.Token);
        }

        [Fact]
        public async Task Verify2FA_Should_Return_Null_When_Email_Code_Invalid()
        {
            var customer = await CreateCustomerAsync();

            _context.TwoFactorAuths.Add(new Models.Profile.TwoFactorAuth
            {
                CustomerId = customer.Id,
                IsEnabled = true,
                IsEmailEnabled = true,
                SecretKey = "hashed_code"
            });
            await _context.SaveChangesAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    "hashed_code",
                    "000000"))
                .Returns(PasswordVerificationResult.Failed);

            var result = await _authService.Verify2FAAsync(new Verify2FADto
            {
                CustomerId = customer.Id,
                Code = "000000"
            });

            Assert.Null(result);
        }

        [Fact]
        public async Task Verify2FA_Should_Return_Null_When_Customer_Not_Found()
        {
            var result = await _authService.Verify2FAAsync(new Verify2FADto
            {
                CustomerId = Guid.NewGuid(),
                Code = "123456"
            });

            Assert.Null(result);
        }

        [Fact]
        public async Task Verify2FA_Should_Return_Null_When_2FA_Not_Enabled()
        {
            var customer = await CreateCustomerAsync();

            var result = await _authService.Verify2FAAsync(new Verify2FADto
            {
                CustomerId = customer.Id,
                Code = "123456"
            });

            Assert.Null(result);
        }
    }
}