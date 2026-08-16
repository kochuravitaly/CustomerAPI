using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs;
using WebApplication2.Models;

namespace WebApplication2.Services
{
    public class PasswordResetService : IPasswordResetService
    {
        private readonly AppDbContext _context;
        private readonly ISecureTokenGenerator _secureTokenGenerator;
        private readonly IEmailService _emailService;
        private readonly IPasswordHasher<Customer> _passwordHasher;
        public PasswordResetService(
            AppDbContext context, 
            ISecureTokenGenerator secureTokenGenerator,
            IEmailService emailService,
            IPasswordHasher<Customer> passwordHasher)
        {
            _context = context;
            _secureTokenGenerator = secureTokenGenerator;
            _emailService = emailService;
            _passwordHasher = passwordHasher;
        }

        public async Task<string?> ForgotPasswordAsync(ForgotPasswordDto dto)
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
    }
}
