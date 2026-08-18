using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using WebApplication2.Data;
using WebApplication2.DTOs;
using WebApplication2.Models;

namespace WebApplication2.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<Customer> _passwordHasher;
        private readonly ITokenService _tokenService;
        private readonly IRefreshTokenService _refreshTokenService;
        private readonly ISecureTokenGeneratorService _secureTokenGenerator;
        private readonly IEmailService _emailService;

        public AuthService(AppDbContext context,
            IPasswordHasher<Customer> passwordHasher,
            ITokenService tokenService,
            IRefreshTokenService refreshTokenService,
            ISecureTokenGeneratorService secureTokenGenerator,
            IEmailService emailService)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _refreshTokenService = refreshTokenService;
            _secureTokenGenerator = secureTokenGenerator;
            _emailService = emailService;
        }

        public async Task<bool> RegisterAsync(RegisterCustomerDto dto)
        {
            bool customerExists = await _context.Customers
                .AnyAsync(c => c.Email == dto.Email);

            if (customerExists)
                return false;

            var code = RandomNumberGenerator
                .GetInt32(100000, 1000000)
                .ToString();

            var pendingRegistration = await _context.PendingRegistrations
                .SingleOrDefaultAsync(pr => pr.Email == dto.Email);

            if (pendingRegistration == null)
            {
                pendingRegistration = new PendingRegistration
                {
                    Name = dto.Name,
                    Email = dto.Email,
                    PasswordHash = _passwordHasher.HashPassword(
                        new Customer(),
                        dto.Password),
                    CodeHash = _secureTokenGenerator.HashToken(code),
                    ExpiresAt = DateTime.UtcNow.AddMinutes(15)
                };

                _context.PendingRegistrations.Add(pendingRegistration);
            }
            else
            {
                pendingRegistration.Name = dto.Name;

                pendingRegistration.PasswordHash =
                    _passwordHasher.HashPassword(
                        new Customer(),
                        dto.Password);

                pendingRegistration.CodeHash =
                    _secureTokenGenerator.HashToken(code);

                pendingRegistration.ExpiresAt =
                    DateTime.UtcNow.AddMinutes(15);
            }
            await _context.SaveChangesAsync();

            await _emailService.SendEmailVerificationCodeAsync(dto.Email, code);

            return true;
        }

        public async Task<TokenResponseDto?> LoginAsync(LoginDto dto)
        {
            var customer = await _context.Customers
                .Include(c => c.Role)
                .SingleOrDefaultAsync(c => c.Email == dto.Email);

            if (customer == null)
                return null;

            if (!customer.IsEmailConfirmed)
                return null;

            var result = _passwordHasher.VerifyHashedPassword(
                customer,
                customer.PasswordHash,
                dto.Password);

            if (result == PasswordVerificationResult.Failed)
            {
                return null;
            }

            var accessToken = _tokenService.CreateToken(customer);

            var refreshToken = _secureTokenGenerator.CreateToken();

            await _refreshTokenService.SaveRefreshTokenAsync(refreshToken, customer.Id);

            return new TokenResponseDto
            {
                Token = accessToken,
                RefreshToken = refreshToken
            };
        }

        public async Task<bool> VerifyEmailAsync(VerifyEmailDto dto)
        {
            var codeHash = _secureTokenGenerator.HashToken(dto.Code);

            var pendingRegistration = await _context.PendingRegistrations
                .SingleOrDefaultAsync(pr => pr.Email == dto.Email && pr.CodeHash == codeHash);

            if (pendingRegistration == null)
                return false;

            if (pendingRegistration.ExpiresAt <= DateTime.UtcNow)
                return false;

            var customer = new Customer
            {
                Name = pendingRegistration.Name,
                Email = pendingRegistration.Email,
                PasswordHash = pendingRegistration.PasswordHash,
                RoleId = 1,
                IsEmailConfirmed = true
            };

            _context.Customers.Add(customer);

            _context.PendingRegistrations.Remove(pendingRegistration);

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<TokenResponseDto?> RefreshTokenAsync(string refreshToken)
        {
            var storedToken = await _context.RefreshTokens
                .Include(r => r.Customer)
                .ThenInclude(c => c.Role)
                .SingleOrDefaultAsync(r => r.TokenHash == _secureTokenGenerator.HashToken(refreshToken));

            if (storedToken == null)
                return null;

            if (storedToken.ExpiresAt < DateTime.UtcNow)
                return null;

            if (storedToken.IsRevoked)
                return null;

            storedToken.IsRevoked = true;

            await _context.SaveChangesAsync();

            var newAccessToken = _tokenService.CreateToken(storedToken.Customer);

            var newRefreshToken = _secureTokenGenerator.CreateToken();

            await _refreshTokenService.SaveRefreshTokenAsync(newRefreshToken, storedToken.CustomerId);

            return new TokenResponseDto
            {
                Token = newAccessToken,
                RefreshToken = newRefreshToken
            };
        }

        public async Task<bool> LogoutAsync(string refreshToken)
        {
            var tokenHash = _secureTokenGenerator.HashToken(refreshToken);

            var storedRefreshToken = await _context.RefreshTokens
                .Include(srt => srt.Customer)
                .SingleOrDefaultAsync(srt => srt.TokenHash == tokenHash);

            if (storedRefreshToken == null)
                return false;

            if (storedRefreshToken.IsRevoked)
                return false;

            storedRefreshToken.IsRevoked = true;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<string?> ForgotPasswordAsync(EmailDto dto)
        {
            var customer = await _context.Customers
                .SingleOrDefaultAsync(c => c.Email == dto.Email);

            if (customer == null)
            {
                return null;
            }

            var rawToken = _secureTokenGenerator.CreateToken();

            var resetToken = new PasswordResetToken
            {
                CustomerId = customer.Id,
                TokenHash = _secureTokenGenerator.HashToken(rawToken),
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                IsUsed = false
            };

            _context.PasswordResetTokens.Add(resetToken);

            await _context.SaveChangesAsync();

            await _emailService.SendPasswordResetEmailAsync(customer.Email, rawToken);

            return rawToken;
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordDto dto)
        {
            var tokenHash = _secureTokenGenerator.HashToken(dto.Token);

            var resetToken = await _context.PasswordResetTokens
                .SingleOrDefaultAsync(t => t.TokenHash == tokenHash);

            if (resetToken == null)
                return false;

            if (resetToken.IsUsed)
                return false;

            if (resetToken.ExpiresAt <= DateTime.UtcNow)
                return false;

            var customer = await _context.Customers
                .SingleOrDefaultAsync(c => c.Id == resetToken.CustomerId);

            if (customer == null)
                return false;

            customer.PasswordHash = _passwordHasher.HashPassword(customer, dto.NewPassword);

            resetToken.IsUsed = true;

            var refreshTokens = await _context.RefreshTokens
                .Where(rt => rt.CustomerId == customer.Id && !rt.IsRevoked)
                .ToListAsync();

            foreach (var refreshToken in refreshTokens)
            {
                refreshToken.IsRevoked = true;
            }

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ResendVerificationCodeAsync(EmailDto dto)
        {
            var pendingRegistration = await _context.PendingRegistrations
                .SingleOrDefaultAsync(pr => pr.Email == dto.Email);

            if (pendingRegistration == null)
                return false;

            var code = RandomNumberGenerator
                .GetInt32(100000, 1000000)
                .ToString();

            pendingRegistration.CodeHash =
                _secureTokenGenerator.HashToken(code);

            pendingRegistration.ExpiresAt =
                DateTime.UtcNow.AddMinutes(15);

            await _context.SaveChangesAsync();

            await _emailService.SendEmailVerificationCodeAsync(dto.Email, code);

            return true;
        }
    }
}
