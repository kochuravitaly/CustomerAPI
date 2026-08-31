using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using WebApplication2.Data;
using WebApplication2.DTOs.Auth;
using WebApplication2.DTOs.Profile;
using WebApplication2.Models.Auth;
using WebApplication2.Models.Profile;
using WebApplication2.Services.Auth.Interfaces;
using WebApplication2.Services.Auth.Services;
using WebApplication2.Services.FileStorage.Interfaces;

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
            private readonly IFileStorageService _fileStorageService;
            private readonly IImageFileValidator _imageFileValidator;
            private readonly ITokenService _tokenService;
            private readonly IRefreshTokenService _refreshTokenService;

            public ProfileService(AppDbContext context,
                IPasswordHasher<Customer> passwordHasher,
                IEmailService emailService,
                ISecureTokenGeneratorService secureTokenGeneratorService,
                IFileStorageService fileStorageService,
                IImageFileValidator imageFileValidator,
                ITokenService tokenService,
                IRefreshTokenService refreshTokenService)
            {
                _context = context;
                _passwordHasher = passwordHasher;
                _emailService = emailService;
                _secureTokenGeneratorService = secureTokenGeneratorService;
                _fileStorageService = fileStorageService;
                _imageFileValidator = imageFileValidator; 
                _tokenService = tokenService;
                _refreshTokenService = refreshTokenService;
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
                    CreatedAt = customer.CreatedAt,
                    HasProfilePicture = customer.ProfilePictureObjectKey != null
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

            public async Task<string?> UploadProfilePictureAsync(Guid customerId, IFormFile file, CancellationToken cancellationToken)
            {
                var customer = await _context.Customers.FindAsync(customerId);
                if (customer == null) return "Customer not found.";

                var validationResult = _imageFileValidator.Validate(file);
                if (validationResult != null) return validationResult;

                if (!string.IsNullOrEmpty(customer.ProfilePictureObjectKey))
                {
                    try
                    {
                        await _fileStorageService.DeleteAsync(customer.ProfilePictureObjectKey, cancellationToken);
                    }
                    catch
                    {
                        // Ignore delete errors
                    }
                }

                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                var objectKey = $"profile-pictures/{customerId}/{Guid.NewGuid()}{extension}";

                using var stream = file.OpenReadStream();
                await _fileStorageService.UploadAsync(stream, objectKey, file.ContentType, cancellationToken);

                customer.ProfilePictureObjectKey = objectKey;
                await _context.SaveChangesAsync();

                return string.Empty;
            }

            public async Task<(Stream? stream, string? contentType)> GetProfilePictureAsync(Guid customerId, CancellationToken cancellationToken)
            {
                var customer = await _context.Customers.FindAsync(customerId);
                if (customer?.ProfilePictureObjectKey == null) return (null, null);

                var stream = await _fileStorageService.GetFileAsync(customer.ProfilePictureObjectKey, cancellationToken);

                var extension = Path.GetExtension(customer.ProfilePictureObjectKey).ToLowerInvariant();
                var contentType = extension switch
                {
                    ".png" => "image/png",
                    ".webp" => "image/webp",
                    _ => "image/jpeg"
                };

                return (stream, contentType);
            }

            public async Task<List<ProfileAccountDto>> GetAccountsAsync(Guid customerId)
            {
                var customer = await _context.Customers
                    .Include(c => c.SavedAccounts)
                        .ThenInclude(sa => sa.SavedCustomer)
                            .ThenInclude(sc => sc.Role)
                    .FirstOrDefaultAsync(c => c.Id == customerId);

                if (customer == null)
                    return new List<ProfileAccountDto>();

                var accounts = new List<ProfileAccountDto>();

                var currentCustomer = await _context.Customers
                    .Include(c => c.Role)
                    .FirstOrDefaultAsync(c => c.Id == customerId);

                if (currentCustomer != null)
                {
                    accounts.Add(new ProfileAccountDto
                    {
                        Id = currentCustomer.Id,
                        Name = currentCustomer.Name,
                        Email = currentCustomer.Email,
                        Role = currentCustomer.Role?.Name ?? "Customer",
                        HasProfilePicture = currentCustomer.ProfilePictureObjectKey != null
                    });
                }

                var savedAccounts = customer.SavedAccounts
                    .Where(sa => sa.SavedCustomer != null)
                    .OrderByDescending(sa => sa.LastUsedAt)
                    .Select(sa => new ProfileAccountDto
                    {
                        Id = sa.SavedCustomer!.Id,
                        Name = sa.SavedCustomer.Name,
                        Email = sa.SavedCustomer.Email,
                        Role = sa.SavedCustomer.Role?.Name ?? "Customer",
                        HasProfilePicture = sa.SavedCustomer.ProfilePictureObjectKey != null
                    });

                accounts.AddRange(savedAccounts);

                return accounts.DistinctBy(a => a.Id).ToList();
            }

            public async Task<string?> AddAccountAsync(Guid customerId, AddAccountDto dto)
            {
                var currentCustomer = await _context.Customers
                    .FirstOrDefaultAsync(c => c.Id == customerId);

                if (currentCustomer == null)
                    return "Current customer not found.";

                var accountToAdd = await _context.Customers
                    .Include(c => c.Role)
                    .FirstOrDefaultAsync(c => c.Email == dto.Email);

                if (accountToAdd == null)
                    return "Invalid email or password.";

                var passwordResult = _passwordHasher.VerifyHashedPassword(
                    accountToAdd,
                    accountToAdd.PasswordHash,
                    dto.Password);

                if (passwordResult == PasswordVerificationResult.Failed)
                    return "Invalid email or password.";

                if (!accountToAdd.IsEmailConfirmed)
                    return "Email is not confirmed.";

                if (accountToAdd.Id == customerId)
                    return "This account is already added.";

                var alreadyExists = await _context.SavedAccounts
                    .AnyAsync(sa => sa.CustomerId == customerId && sa.SavedCustomerId == accountToAdd.Id);

                if (alreadyExists)
                    return "This account is already added.";

                var savedAccount = new Models.Profile.SavedAccount
                {
                    CustomerId = customerId,
                    SavedCustomerId = accountToAdd.Id,
                    LastUsedAt = DateTime.UtcNow
                };

                _context.SavedAccounts.Add(savedAccount);
                await _context.SaveChangesAsync();

                return string.Empty;
            }

            public async Task<string?> RemoveAccountAsync(Guid customerId, Guid accountId)
            {
                var savedAccount = await _context.SavedAccounts
                    .FirstOrDefaultAsync(sa => sa.CustomerId == customerId && sa.SavedCustomerId == accountId);

                if (savedAccount == null)
                    return "Account not found.";

                _context.SavedAccounts.Remove(savedAccount);
                await _context.SaveChangesAsync();

                return string.Empty;
            }

            public async Task<TokenResponseDto?> SwitchAccountAsync(Guid customerId, Guid accountId)
            {
                var savedAccount = await _context.SavedAccounts
                    .FirstOrDefaultAsync(sa => sa.CustomerId == customerId && sa.SavedCustomerId == accountId);

                if (savedAccount == null)
                    return null;

                var targetCustomer = await _context.Customers
                    .Include(c => c.Role)
                    .FirstOrDefaultAsync(c => c.Id == accountId);

                if (targetCustomer == null)
                    return null;

                savedAccount.LastUsedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var accessToken = _tokenService.CreateToken(targetCustomer);
                var refreshToken = _secureTokenGeneratorService.CreateToken();
                await _refreshTokenService.SaveRefreshTokenAsync(refreshToken, targetCustomer.Id);

                return new TokenResponseDto
                {
                    Token = accessToken,
                    RefreshToken = refreshToken
                };
            }
        }
    }
}
