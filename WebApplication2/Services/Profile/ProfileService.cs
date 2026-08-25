using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using WebApplication2.Data;
using WebApplication2.DTOs.Profile;
using WebApplication2.Models.Auth;
using WebApplication2.Models.Profile;
using WebApplication2.Services.Auth.Interfaces;

namespace WebApplication2.Services.Profile
{
    namespace WebApplication2.Services.Profile
    {
        public class ProfileService : IProfileService
        {
            private readonly AppDbContext _context;
            private readonly IPasswordHasher<Customer> _passwordHasher;
            private readonly IEmailService _emailService;
            private readonly ISecureTokenGeneratorService _secureTokenGeneratorService;

            public ProfileService(AppDbContext context,
                IPasswordHasher<Customer> passwordHasher,
                IEmailService emailService,
                ISecureTokenGeneratorService secureTokenGeneratorService)
            {
                _context = context;
                _passwordHasher = passwordHasher;
                _emailService = emailService;
                _secureTokenGeneratorService = secureTokenGeneratorService;
            }

            public async Task<ProfileDto?> GetProfileAsync(Guid customerId)
            {
                var customer = await _context.Customers
                    .Include(c => c.Role)
                    .FirstOrDefaultAsync(c => c.Id == customerId);

                if (customer == null)
                    return null;

                return new ProfileDto
                {
                    Id = customer.Id,
                    Name = customer.Name,
                    Email = customer.Email,
                    Role = customer.Role.Name,
                    IsEmailConfirmed = customer.IsEmailConfirmed,
                    CreatedAt = customer.CreatedAt
                };
            }

            public async Task<bool> UpdateNameAsync(Guid customerId, UpdateProfileDto dto)
            {
                var customer = await _context.Customers.FindAsync(customerId);

                if (customer == null)
                    return false;

                customer.Name = dto.Name;
                await _context.SaveChangesAsync();

                return true;
            }

            public async Task<string?> ChangePasswordAsync(Guid customerId, ChangePasswordDto dto)
            {
                var customer = await _context.Customers.FindAsync(customerId);

                if (customer == null)
                    return null;

                var result = _passwordHasher.VerifyHashedPassword(
                    customer,
                    customer.PasswordHash,
                    dto.CurrentPassword);

                if (result == PasswordVerificationResult.Failed)
                    return "Current password is incorrect.";

                customer.PasswordHash = _passwordHasher.HashPassword(
                    customer,
                    dto.NewPassword);

                await _context.SaveChangesAsync();

                return string.Empty;
            }

            public async Task<string?> DeleteAccountAsync(Guid customerId, DeleteAccountDto dto)
            {
                var customer = await _context.Customers
                    .Include(c => c.Cart)
                        .ThenInclude(cart => cart.CartItems)
                    .Include(c => c.RefreshTokens)
                    .FirstOrDefaultAsync(c => c.Id == customerId);

                if (customer == null)
                    return null;

                var verificationResult = _passwordHasher.VerifyHashedPassword(
                    customer,
                    customer.PasswordHash,
                    dto.Password);

                if (verificationResult == PasswordVerificationResult.Failed)
                    return "Password is incorrect.";

                foreach (var token in customer.RefreshTokens)
                {
                    token.IsRevoked = true;
                }

                if (customer.Cart != null)
                {
                    _context.CartItems.RemoveRange(customer.Cart.CartItems);
                    _context.Carts.Remove(customer.Cart);
                }

                _context.Customers.Remove(customer);
                await _context.SaveChangesAsync();

                return string.Empty;
            }

            public async Task<string?> ChangeEmailAsync(Guid customerId, ChangeEmailDto dto)
            {
                var customer = await _context.Customers.FindAsync(customerId);

                if (customer == null)
                    return null;

                var emailExists = await _context.Customers
                    .AnyAsync(c => c.Email == dto.NewEmail && c.Id != customerId);

                if (emailExists)
                    return "Email is already in use.";

                var code = RandomNumberGenerator
                    .GetInt32(100000, 1000000)
                    .ToString();

                var pendingEmailChange = new PendingEmailChange
                {
                    CustomerId = customerId,
                    NewEmail = dto.NewEmail,
                    CodeHash = _passwordHasher.HashPassword(new Customer(), code),
                    ExpiresAt = DateTime.UtcNow.AddMinutes(15)
                };

                _context.PendingEmailChanges.Add(pendingEmailChange);
                await _context.SaveChangesAsync();

                await _emailService.SendEmailVerificationCodeAsync(dto.NewEmail, code, dto.Language);

                return string.Empty;
            }

            public async Task<string?> VerifyEmailChangeAsync(Guid customerId, VerifyEmailChangeDto dto)
            {
                var pendingChange = await _context.PendingEmailChanges
                    .Where(p => p.CustomerId == customerId && p.NewEmail == dto.NewEmail)
                    .OrderByDescending(p => p.ExpiresAt)
                    .FirstOrDefaultAsync();

                if (pendingChange == null)
                    return "No pending email change found.";

                if (pendingChange.ExpiresAt < DateTime.UtcNow)
                    return "Verification code has expired.";

                var verificationResult = _passwordHasher.VerifyHashedPassword(
                    new Customer(),
                    pendingChange.CodeHash,
                    dto.Code);

                if (verificationResult == PasswordVerificationResult.Failed)
                    return "Invalid verification code.";

                var customer = await _context.Customers.FindAsync(customerId);

                if (customer == null)
                    return null;

                customer.Email = dto.NewEmail;
                customer.IsEmailConfirmed = true;

                _context.PendingEmailChanges.RemoveRange(
                    _context.PendingEmailChanges.Where(p => p.CustomerId == customerId));

                await _context.SaveChangesAsync();

                return string.Empty;
            }
        }
    }
}
