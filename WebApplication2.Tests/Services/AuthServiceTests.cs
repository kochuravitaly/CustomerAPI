using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Moq;
using WebApplication2.Data;
using WebApplication2.DTOs;
using WebApplication2.Models;
using WebApplication2.Services;

namespace WebApplication2.Tests.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<ITokenService> _tokenServiceMock;
        private readonly Mock<IRefreshTokenService> _refreshTokenServiceMock;
        private readonly Mock<IPasswordHasher<Customer>> _passwordHasherMock;
        private readonly Mock<ISecureTokenGeneratorService> _secureTokenGeneratorMock;
        private readonly Mock<IEmailService> _emailServiceMock;

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

            _authService = new AuthService(
                _context, 
                _passwordHasherMock.Object,
                _tokenServiceMock.Object,
                _refreshTokenServiceMock.Object,
                _secureTokenGeneratorMock.Object,
                _emailServiceMock.Object
            );
        }
        private async Task<Customer> CreateCustomerAsync(
            bool isEmailConfirmed = true)
        {
            var customer = new Customer
            {
                Id = Guid.NewGuid(),
                Name = "Test",
                Email = "test@test.com",
                PasswordHash = "hashed-password",
                IsEmailConfirmed = isEmailConfirmed,
                Role = new Role
                {
                    Name = "User"
                }
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return customer;
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

        private void SetupRegistrationMocks(
            string passwordHash,
            string codeHash)
        {
            _passwordHasherMock
                .Setup(x => x.HashPassword(
                    It.IsAny<Customer>(),
                    "password"))
                .Returns(passwordHash);

            _secureTokenGeneratorMock
                .Setup(x => x.HashToken(It.IsAny<string>()))
                .Returns(codeHash);

            _emailServiceMock
                .Setup(x => x.SendEmailVerificationCodeAsync(
                    "test@test.com",
                    It.IsAny<string>()))
                .Returns(Task.CompletedTask);
        }

        private void VerifyRegistrationDependencies()
        {
            _passwordHasherMock.Verify(
                x => x.HashPassword(
                    It.IsAny<Customer>(),
                    "password"),
                Times.Once);

            _secureTokenGeneratorMock.Verify(
                x => x.HashToken(It.Is<string>(code =>
                    code.Length == 6 &&
                    code.All(char.IsDigit))),
                Times.Once);

            _emailServiceMock.Verify(
                x => x.SendEmailVerificationCodeAsync(
                    "test@test.com",
                    It.IsAny<string>()),
                Times.Once);
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

        private void VerifyLoginDependenciesWereNotCalled()
        {
            _tokenServiceMock.Verify(
                x => x.CreateToken(It.IsAny<Customer>()),
                Times.Never);

            _secureTokenGeneratorMock.Verify(
                x => x.CreateToken(),
                Times.Never);

            _refreshTokenServiceMock.Verify(
                x => x.SaveRefreshTokenAsync(
                    It.IsAny<string>(),
                    It.IsAny<Guid>()),
                Times.Never);
        }

        private VerifyEmailDto CreateVerifyEmailDto(
            string email = "test@test.com",
            string code = "123456")
        {
            return new VerifyEmailDto
            {
                Email = email,
                Code = code
            };
        }

        private async Task<PendingRegistration> CreatePendingRegistrationAsync(
            string codeHash = "code-hash",
            DateTime? expiresAt = null)
        {
            var pendingRegistration = new PendingRegistration
            {
                Name = "Test",
                Email = "test@test.com",
                PasswordHash = "hashed-password",
                CodeHash = codeHash,
                ExpiresAt = expiresAt ?? DateTime.UtcNow.AddMinutes(15)
            };

            _context.PendingRegistrations.Add(pendingRegistration);
            await _context.SaveChangesAsync();

            return pendingRegistration;
        }

        private void SetupValidVerificationCode()
        {
            _secureTokenGeneratorMock
                .Setup(x => x.HashToken("123456"))
                .Returns("code-hash");
        }

        private void VerifyHashTokenWasCalledOnce()
        {
            _secureTokenGeneratorMock.Verify(
                x => x.HashToken("123456"),
                Times.Once);
        }

        private async Task<RefreshToken> CreateRefreshTokenAsync(
            Customer? customer = null,
            string tokenHash = "refresh-token-hash",
            DateTime? expiresAt = null,
            bool isRevoked = false)
        {
            customer ??= await CreateCustomerAsync();

            var refreshToken = new RefreshToken
            {
                CustomerId = customer.Id,
                Customer = customer,
                TokenHash = tokenHash,
                ExpiresAt = expiresAt ?? DateTime.UtcNow.AddDays(30),
                IsRevoked = isRevoked
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            return refreshToken;
        }

        private void SetupValidRefreshToken()
        {
            _secureTokenGeneratorMock
                .Setup(x => x.HashToken("refresh-token"))
                .Returns("refresh-token-hash");
        }

        private void VerifyRefreshTokenDependenciesWereNotCalled()
        {
            _tokenServiceMock.Verify(
                x => x.CreateToken(It.IsAny<Customer>()),
                Times.Never);

            _secureTokenGeneratorMock.Verify(
                x => x.CreateToken(),
                Times.Never);

            _refreshTokenServiceMock.Verify(
                x => x.SaveRefreshTokenAsync(
                    It.IsAny<string>(),
                    It.IsAny<Guid>()),
                Times.Never);
        }

        private void VerifyHashTokenCalledOnce()
        {
            _secureTokenGeneratorMock.Verify(
                x => x.HashToken("refresh-token"),
                Times.Once);
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

        private void SetupValidResetToken()
        {
            _secureTokenGeneratorMock
                .Setup(x => x.HashToken("reset-token"))
                .Returns("reset-token-hash");
        }

        private void VerifyPasswordWasNotHashed()
        {
            _passwordHasherMock.Verify(
                x => x.HashPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>()),
                Times.Never);
        }

        [Fact]
        public async Task Register_Should_Create_Pending_Registration_When_Email_Is_Not_Already_Taken()
        {
            SetupRegistrationMocks("hashed-password", "code-hash");

            var result = await _authService.RegisterAsync(CreateRegisterDto());

            Assert.True(result);

            var pendingRegistration = await _context.PendingRegistrations
                .SingleAsync(pr => pr.Email == "test@test.com");

            Assert.Equal("Test", pendingRegistration.Name);
            Assert.Equal("test@test.com", pendingRegistration.Email);
            Assert.Equal("hashed-password", pendingRegistration.PasswordHash);
            Assert.Equal("code-hash", pendingRegistration.CodeHash);

            VerifyRegistrationDependencies();

            Assert.Empty(await _context.Customers.ToListAsync());
        }

        [Fact]
        public async Task Register_Should_Return_False_When_Email_Is_Already_Taken()
        {
            var existingCustomer = await CreateCustomerAsync();

            var result = await _authService.RegisterAsync(CreateRegisterDto());

            Assert.False(result);

            var customerCount = await _context.Customers
                .CountAsync(c => c.Email == existingCustomer.Email);

            Assert.Equal(1, customerCount);

            _passwordHasherMock
                .Verify(x => x.HashPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>()),
                Times.Never);

            _secureTokenGeneratorMock.Verify(
                x => x.HashToken(It.IsAny<string>()),
                Times.Never);

            _emailServiceMock
                .Verify(x => x.SendEmailVerificationCodeAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>()),
                Times.Never);
        }

        [Fact]
        public async Task Register_Should_Update_Existing_Pending_Registration()
        {
            var pendingRegistration = new PendingRegistration
            {
                Name = "Old Name",
                Email = "test@test.com",
                PasswordHash = "old-hash",
                CodeHash = "old-code-hash",
                ExpiresAt = DateTime.UtcNow.AddMinutes(-1)
            };

            _context.PendingRegistrations.Add(pendingRegistration);

            await _context.SaveChangesAsync();

            SetupRegistrationMocks("new-hash", "new-code-hash");

            var result = await _authService.RegisterAsync(CreateRegisterDto());

            Assert.True(result);

            var updatedRegistration = await _context.PendingRegistrations
                .SingleAsync(pr => pr.Email == "test@test.com");

            Assert.Equal("Test", updatedRegistration.Name);
            Assert.Equal("new-hash", updatedRegistration.PasswordHash);
            Assert.Equal("new-code-hash", updatedRegistration.CodeHash);
            Assert.True(updatedRegistration.ExpiresAt > DateTime.UtcNow);

            Assert.Equal(1, await _context.PendingRegistrations.CountAsync());

            VerifyRegistrationDependencies();
        }

        [Fact]
        public async Task Login_Should_Return_Tokens_When_Credentials_Are_Correct()
        {
            var customer = await CreateCustomerAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    customer,
                    customer.PasswordHash,
                    "password"))
                .Returns(PasswordVerificationResult.Success);

            _tokenServiceMock
                .Setup(x => x.CreateToken(customer))
                .Returns("fake-access-token");

            _secureTokenGeneratorMock
                .Setup(x => x.CreateToken())
                .Returns("fake-refresh-token");

            var result = await _authService.LoginAsync(CreateLoginDto());

            Assert.NotNull(result);

            Assert.Equal("fake-access-token", result.Token);

            Assert.Equal("fake-refresh-token", result.RefreshToken);

            _passwordHasherMock
                .Verify(x => x.VerifyHashedPassword(
                    customer,
                    customer.PasswordHash,
                    "password"),
                Times.Once);

            _tokenServiceMock
                .Verify(x => x.CreateToken(customer),
                Times.Once);

            _secureTokenGeneratorMock
                .Verify(x => x.CreateToken(),
                Times.Once);

            _refreshTokenServiceMock
                 .Verify(x => x.SaveRefreshTokenAsync(
                     "fake-refresh-token",
                     customer.Id),
                 Times.Once);
        }

        [Fact]
        public async Task Login_Should_Return_Null_When_Customer_Not_Found()
        {
            var result = await _authService.LoginAsync(CreateLoginDto(email: "notfound@gmail.com"));

            Assert.Null(result);

            _passwordHasherMock.Verify(
                x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()),
                Times.Never);

            VerifyLoginDependenciesWereNotCalled();
        }

        [Fact]
        public async Task Login_Should_Return_Null_When_Email_Is_Not_Confirmed()
        {
            var customer = await CreateCustomerAsync(false);

            var result = await _authService.LoginAsync(CreateLoginDto());

            Assert.Null(result);

            _passwordHasherMock.Verify(
                x => x.VerifyHashedPassword(
                    It.IsAny<Customer>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()),
                Times.Never);

            VerifyLoginDependenciesWereNotCalled();
        }

        [Fact]
        public async Task Login_Should_Return_Null_When_Password_Is_Incorrect()
        {
            var customer = await CreateCustomerAsync();

            _passwordHasherMock
                .Setup(x => x.VerifyHashedPassword(
                    customer,
                    customer.PasswordHash,
                    "incorrect-password"))
                .Returns(PasswordVerificationResult.Failed);

            var result = await _authService.LoginAsync(CreateLoginDto(password: "incorrect-password"));

            Assert.Null(result);

            _passwordHasherMock.Verify(
               x => x.VerifyHashedPassword(
                   It.IsAny<Customer>(),
                   customer.PasswordHash,
                   "incorrect-password"),
               Times.Once);

            VerifyLoginDependenciesWereNotCalled();
        }

        [Fact]
        public async Task VerifyEmail_Should_Create_Customer_When_Code_Is_Valid()
        {
            await CreatePendingRegistrationAsync();

            SetupValidVerificationCode();

            var result = await _authService.VerifyEmailAsync(CreateVerifyEmailDto());

            Assert.True(result);

            var customer = await _context.Customers
                .SingleAsync(c => c.Email == "test@test.com");

            Assert.Equal("Test", customer.Name);
            Assert.Equal("test@test.com", customer.Email);
            Assert.Equal("hashed-password", customer.PasswordHash);
            Assert.Equal(1, customer.RoleId);
            Assert.True(customer.IsEmailConfirmed);

            Assert.Empty(await _context.PendingRegistrations.ToListAsync());

            VerifyHashTokenWasCalledOnce();
        }

        [Fact]
        public async Task VerifyEmail_Should_Return_False_When_Code_Is_Invalid()
        {
            await CreatePendingRegistrationAsync();

            _secureTokenGeneratorMock
                .Setup(x => x.HashToken("123456"))
                .Returns("wrong-code-hash");

            var result = await _authService.VerifyEmailAsync(
                CreateVerifyEmailDto());

            Assert.False(result);

            Assert.Empty(await _context.Customers.ToListAsync());

            Assert.Single(await _context.PendingRegistrations.ToListAsync());

            VerifyHashTokenWasCalledOnce();
        }

        [Fact]
        public async Task VerifyEmail_Should_Return_False_When_Email_Does_Not_Exist()
        {
            SetupValidVerificationCode();

            var result = await _authService.VerifyEmailAsync(
                CreateVerifyEmailDto(email: "notfound@gmail.com"));

            Assert.False(result);

            Assert.Empty(await _context.Customers.ToListAsync());

            Assert.Empty(await _context.PendingRegistrations.ToListAsync());

            VerifyHashTokenWasCalledOnce();
        }

        [Fact]
        public async Task VerifyEmail_Should_Return_False_When_Code_Is_Expired()
        {
            await CreatePendingRegistrationAsync(
                expiresAt: DateTime.UtcNow.AddMinutes(-1));

            SetupValidVerificationCode();

            var result = await _authService.VerifyEmailAsync(CreateVerifyEmailDto());

            Assert.False(result);

            Assert.Empty(await _context.Customers.ToListAsync());

            Assert.Single(await _context.PendingRegistrations.ToListAsync());

            VerifyHashTokenWasCalledOnce();
        }

        [Fact]
        public async Task RefreshToken_Should_Return_New_Tokens_When_Token_Is_Valid()
        {
            var storedToken = await CreateRefreshTokenAsync();

            SetupValidRefreshToken();

            _tokenServiceMock
                .Setup(x => x.CreateToken(storedToken.Customer))
                .Returns("new-access-token");

            _secureTokenGeneratorMock
                .Setup(x => x.CreateToken())
                .Returns("new-refresh-token");

            var result = await _authService.RefreshTokenAsync("refresh-token");

            Assert.NotNull(result);

            Assert.Equal("new-access-token", result.Token);

            Assert.Equal("new-refresh-token", result.RefreshToken);

            var updatedToken = await _context.RefreshTokens
                .SingleAsync(r => r.Id == storedToken.Id);

            Assert.True(updatedToken.IsRevoked);

            VerifyHashTokenCalledOnce();

            _tokenServiceMock.Verify(
                x => x.CreateToken(storedToken.Customer),
                Times.Once);

            _secureTokenGeneratorMock.Verify(
                x => x.CreateToken(),
                Times.Once);

            _refreshTokenServiceMock.Verify(
                x => x.SaveRefreshTokenAsync(
                    "new-refresh-token",
                    storedToken.CustomerId),
                Times.Once);
        }

        [Fact]
        public async Task RefreshToken_Should_Return_Null_When_Token_Does_Not_Exist()
        {
            SetupValidRefreshToken();

            var result = await _authService.RefreshTokenAsync("refresh-token");

            Assert.Null(result);

            Assert.Empty(await _context.RefreshTokens.ToListAsync());

            VerifyRefreshTokenDependenciesWereNotCalled();

            VerifyHashTokenCalledOnce();
        }

        [Theory]
        [InlineData(-1, false)]
        [InlineData(30, true)]
        public async Task RefreshToken_Should_Return_Null_When_Token_Is_Expired_Or_Revoked(
             int daysFromNow,
             bool isRevoked)
        {
            var storedToken = await CreateRefreshTokenAsync(
                expiresAt: DateTime.UtcNow.AddDays(daysFromNow),
                isRevoked: isRevoked);

            SetupValidRefreshToken();

            var result = await _authService.RefreshTokenAsync("refresh-token");

            Assert.Null(result);

            var token = await _context.RefreshTokens
                .SingleAsync(r => r.Id == storedToken.Id);

            Assert.Equal(isRevoked, token.IsRevoked);

            VerifyRefreshTokenDependenciesWereNotCalled();

            VerifyHashTokenCalledOnce();
        }

        [Fact]
        public async Task Logout_Should_Return_True_When_Token_Is_Valid()
        {
            var storedToken = await CreateRefreshTokenAsync();

            SetupValidRefreshToken();

            var result = await _authService.LogoutAsync("refresh-token");

            Assert.True(result);

            var token = await _context.RefreshTokens
                .SingleAsync(r => r.Id == storedToken.Id);

            Assert.True(token.IsRevoked);

            VerifyHashTokenCalledOnce();
        }

        [Fact]
        public async Task Logout_Should_Return_False_When_Token_Does_Not_Exist()
        {
            SetupValidRefreshToken();

            var result = await _authService.LogoutAsync("refresh-token");

            Assert.False(result);

            Assert.Empty(await _context.RefreshTokens.ToListAsync());

            VerifyHashTokenCalledOnce();
        }

        [Fact]
        public async Task Logout_Should_Return_False_When_Token_Is_Already_Revoked()
        {
            var storedToken = await CreateRefreshTokenAsync(isRevoked: true);

            SetupValidRefreshToken();

            var result = await _authService.LogoutAsync("refresh-token");

            Assert.False(result);

            var token = await _context.RefreshTokens
                .SingleAsync(r => r.Id == storedToken.Id);

            Assert.True(token.IsRevoked);

            VerifyHashTokenCalledOnce();
        }

        [Fact]
        public async Task ForgotPassword_Should_Create_Reset_Token_When_Customer_Exists()
        {
            var customer = await CreateCustomerAsync();

            _secureTokenGeneratorMock
                .Setup(x => x.CreateToken())
                .Returns("reset-token");

            _secureTokenGeneratorMock
                .Setup(x => x.HashToken("reset-token"))
                .Returns("reset-token-hash");

            _emailServiceMock
                .Setup(x => x.SendPasswordResetEmailAsync(
                    customer.Email,
                    "reset-token"))
                .Returns(Task.CompletedTask);

            var result = await _authService.ForgotPasswordAsync(
                new EmailDto
                {
                    Email = customer.Email
                });

            Assert.Equal("reset-token", result);

            var resetToken = await _context.PasswordResetTokens
                .SingleAsync();

            Assert.Equal(customer.Id, resetToken.CustomerId);
            Assert.Equal("reset-token-hash", resetToken.TokenHash);
            Assert.False(resetToken.IsUsed);
            Assert.True(resetToken.ExpiresAt > DateTime.UtcNow);

            _secureTokenGeneratorMock.Verify(
                x => x.CreateToken(),
                Times.Once);

            _secureTokenGeneratorMock.Verify(
                x => x.HashToken("reset-token"),
                Times.Once);

            _emailServiceMock.Verify(
                x => x.SendPasswordResetEmailAsync(
                    customer.Email,
                    "reset-token"),
                Times.Once);
        }

        [Fact]
        public async Task ForgotPassword_Should_Return_Null_When_Customer_Does_Not_Exist()
        {
            var result = await _authService.ForgotPasswordAsync(
                new EmailDto
                {
                    Email = "notfound@gmail.com"
                });

            Assert.Null(result);

            Assert.Empty(await _context.PasswordResetTokens.ToListAsync());

            _secureTokenGeneratorMock.Verify(
                x => x.CreateToken(),
                Times.Never);

            _secureTokenGeneratorMock.Verify(
                x => x.HashToken(It.IsAny<string>()),
                Times.Never);

            _emailServiceMock.Verify(
                x => x.SendPasswordResetEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>()),
                Times.Never);
        }

        [Fact]
        public async Task ResetPassword_Should_Update_Password_And_Revoke_Active_Refresh_Tokens_When_Token_Is_Valid()
        {
            var customer = await CreateCustomerAsync();

            var resetToken = await CreatePasswordResetTokenAsync(customer.Id);

            var activeRefreshToken = await CreateRefreshTokenAsync(
                customer: customer,
                tokenHash: "active-token-hash");

            var revokedRefreshToken = await CreateRefreshTokenAsync(
                customer: customer,
                tokenHash: "revoked-token-hash",
                isRevoked: true);

            SetupValidResetToken();

            _passwordHasherMock
                .Setup(x => x.HashPassword(
                    customer,
                    "new-password"))
                .Returns("new-password-hash");

            var result = await _authService.ResetPasswordAsync(
                new ResetPasswordDto
                {
                    Token = "reset-token",
                    NewPassword = "new-password"
                });

            Assert.True(result);

            var updatedCustomer = await _context.Customers
                .SingleAsync(c => c.Id == customer.Id);

            Assert.Equal(
                "new-password-hash",
                updatedCustomer.PasswordHash);

            var updatedResetToken = await _context.PasswordResetTokens
                .SingleAsync(t => t.Id == resetToken.Id);

            Assert.True(updatedResetToken.IsUsed);

            var updatedActiveRefreshToken = await _context.RefreshTokens
                .SingleAsync(t => t.Id == activeRefreshToken.Id);

            Assert.True(updatedActiveRefreshToken.IsRevoked);

            var updatedRevokedRefreshToken = await _context.RefreshTokens
                .SingleAsync(t => t.Id == revokedRefreshToken.Id);

            Assert.True(updatedRevokedRefreshToken.IsRevoked);

            _passwordHasherMock.Verify(
                x => x.HashPassword(
                    customer,
                    "new-password"),
                Times.Once);

            _secureTokenGeneratorMock.Verify(
                x => x.HashToken("reset-token"),
                Times.Once);
        }

        [Fact]
        public async Task ResetPassword_Should_Return_False_When_Token_Does_Not_Exist()
        {
            SetupValidResetToken();

            var result = await _authService.ResetPasswordAsync(
                new ResetPasswordDto
                {
                    Token = "reset-token",
                    NewPassword = "new-password"
                });

            Assert.False(result);

            Assert.Empty(await _context.PasswordResetTokens.ToListAsync());

            VerifyPasswordWasNotHashed();
        }

        [Fact]
        public async Task ResetPassword_Should_Return_False_When_Token_Is_Already_Used()
        {
            var customer = await CreateCustomerAsync();

            await CreatePasswordResetTokenAsync(
                customer.Id,
                isUsed: true);

            SetupValidResetToken();

            var result = await _authService.ResetPasswordAsync(
                new ResetPasswordDto
                {
                    Token = "reset-token",
                    NewPassword = "new-password"
                });

            Assert.False(result);

            VerifyPasswordWasNotHashed();
        }

        [Fact]
        public async Task ResetPassword_Should_Return_False_When_Token_Is_Expired()
        {
            var customer = await CreateCustomerAsync();

            await CreatePasswordResetTokenAsync(
                customer.Id,
                expiresAt: DateTime.UtcNow.AddMinutes(-1));

            SetupValidResetToken();

            var result = await _authService.ResetPasswordAsync(
                new ResetPasswordDto
                {
                    Token = "reset-token",
                    NewPassword = "new-password"
                });

            Assert.False(result);

            VerifyPasswordWasNotHashed();
        }

        [Fact]
        public async Task ResetPassword_Should_Return_False_When_Customer_Does_Not_Exist()
        {
            await CreatePasswordResetTokenAsync(Guid.NewGuid());

            SetupValidResetToken();

            var result = await _authService.ResetPasswordAsync(
                new ResetPasswordDto
                {
                    Token = "reset-token",
                    NewPassword = "new-password"
                });

            Assert.False(result);

            VerifyPasswordWasNotHashed();
        }

        [Fact]
        public async Task ResendVerificationCode_Should_Return_True_When_Pending_Registration_Exists()
        {
            var pendingRegistration = new PendingRegistration
            {
                Name = "Test",
                Email = "test@test.com",
                PasswordHash = "hashed-password",
                CodeHash = "old-code-hash",
                ExpiresAt = DateTime.UtcNow.AddMinutes(-1)
            };

            _context.PendingRegistrations.Add(pendingRegistration);
            await _context.SaveChangesAsync();

            _secureTokenGeneratorMock
                .Setup(x => x.HashToken(It.IsAny<string>()))
                .Returns("new-code-hash");

            _emailServiceMock
                .Setup(x => x.SendEmailVerificationCodeAsync(
                    "test@test.com",
                    It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            var result = await _authService.ResendVerificationCodeAsync(
                new EmailDto { Email = "test@test.com" });

            Assert.True(result);

            var updatedRegistration = await _context.PendingRegistrations
                .SingleAsync(pr => pr.Email == "test@test.com");

            Assert.Equal("new-code-hash", updatedRegistration.CodeHash);
            Assert.True(updatedRegistration.ExpiresAt > DateTime.UtcNow);

            _secureTokenGeneratorMock.Verify(
                x => x.HashToken(It.Is<string>(code =>
                    code.Length == 6 &&
                    code.All(char.IsDigit))),
                Times.Once);

            _emailServiceMock.Verify(
                x => x.SendEmailVerificationCodeAsync(
                    "test@test.com",
                    It.Is<string>(code =>
                        code.Length == 6 &&
                        code.All(char.IsDigit))),
                Times.Once);
        }

        [Fact]
        public async Task ResendVerificationCode_Should_Return_False_When_Pending_Registration_Does_Not_Exist()
        {
            var result = await _authService.ResendVerificationCodeAsync(
                new EmailDto { Email = "notfound@gmail.com" });

            Assert.False(result);

            Assert.Empty(await _context.PendingRegistrations.ToListAsync());

            _secureTokenGeneratorMock.Verify(
                x => x.HashToken(It.IsAny<string>()),
                Times.Never);

            _emailServiceMock.Verify(
                x => x.SendEmailVerificationCodeAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>()),
                Times.Never);
        }
    }
}
