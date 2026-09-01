using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using WebApplication2.Data;
using WebApplication2.DTOs.Auth;
using WebApplication2.Models.Auth;
using WebApplication2.Services.Auth.Interfaces;

namespace WebApplication2.Services.Auth.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<Customer> _passwordHasher;
        private readonly ITokenService _tokenService;
        private readonly IRefreshTokenService _refreshTokenService;
        private readonly ISecureTokenGeneratorService _secureTokenGenerator;
        private readonly IEmailService _emailService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(AppDbContext context,
            IPasswordHasher<Customer> passwordHasher,
            ITokenService tokenService,
            IRefreshTokenService refreshTokenService,
            ISecureTokenGeneratorService secureTokenGenerator,
            IEmailService emailService,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _refreshTokenService = refreshTokenService;
            _secureTokenGenerator = secureTokenGenerator;
            _emailService = emailService;
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetDeviceInfo()
        {
            var userAgent = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString();
            if (string.IsNullOrEmpty(userAgent)) return "Unknown device";

            if (userAgent.Contains("iPhone")) return "iPhone";
            if (userAgent.Contains("iPad")) return "iPad";
            if (userAgent.Contains("Android")) return "Android";
            if (userAgent.Contains("Windows")) return "Windows";
            if (userAgent.Contains("Mac")) return "Mac";
            if (userAgent.Contains("Linux")) return "Linux";

            return "Unknown device";
        }

        private string GetIpAddress()
        {
            var ip = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
            return ip ?? "Unknown IP";
        }

        private async Task<Models.Profile.Session> CreateSessionAsync(Guid customerId)
        {
            var deviceInfo = GetDeviceInfo();
            var ipAddress = GetIpAddress();

            var oldSessions = await _context.Sessions
                .Where(s => s.CustomerId == customerId
                    && s.IsActive
                    && s.DeviceInfo == deviceInfo
                    && s.IpAddress == ipAddress)
                .ToListAsync();

            foreach (var oldSession in oldSessions)
            {
                oldSession.IsActive = false;

                var oldTokens = await _context.RefreshTokens
                    .Where(rt => rt.SessionId == oldSession.Id && !rt.IsRevoked)
                    .ToListAsync();

                foreach (var token in oldTokens)
                {
                    token.IsRevoked = true;
                }
            }

            var session = new Models.Profile.Session
            {
                CustomerId = customerId,
                DeviceInfo = deviceInfo,
                IpAddress = ipAddress,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                LastActiveAt = DateTime.UtcNow
            };

            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();

            return session;
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

            await _emailService.SendEmailVerificationCodeAsync(dto.Email, code, dto.Language);

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

            var deviceInfo = GetDeviceInfo();
            var ipAddress = GetIpAddress();

            var twoFactorAuth = await _context.TwoFactorAuths
                .FirstOrDefaultAsync(t => t.CustomerId == customer.Id && t.IsEnabled);

            if (twoFactorAuth != null)
            {
                if (twoFactorAuth.IsEmailEnabled)
                {
                    var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
                    twoFactorAuth.SecretKey = _passwordHasher.HashPassword(new Customer(), code);
                    await _context.SaveChangesAsync();
                    await _emailService.SendEmailVerificationCodeAsync(customer.Email, code, "en");
                }

                return new TokenResponseDto
                {
                    RequiresTwoFactor = true,
                    CustomerId = customer.Id,
                    TwoFactorMethod = twoFactorAuth.IsEmailEnabled ? "email" : "app"
                };
            }

            var knownSession = await _context.Sessions
                .AnyAsync(s => s.CustomerId == customer.Id
                    && s.DeviceInfo == deviceInfo
                    && s.IpAddress == ipAddress);

            if (!knownSession)
            {
                await _emailService.SendNewLoginNotificationAsync(customer.Email, deviceInfo, ipAddress, dto.Language ?? "en");
            }

            var session = await CreateSessionAsync(customer.Id);

            var accessToken = _tokenService.CreateToken(customer, session.Id);
            var refreshToken = _secureTokenGenerator.CreateToken();
            await _refreshTokenService.SaveRefreshTokenAsync(refreshToken, customer.Id, session.Id);

            return new TokenResponseDto
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                RequiresTwoFactor = false
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

        public async Task<TokenResponseDto?> RefreshTokenAsync(RefreshTokenDto dto)
        {
            var storedToken = await _context.RefreshTokens
                .Include(r => r.Customer)
                .ThenInclude(c => c.Role)
                .SingleOrDefaultAsync(r => r.TokenHash == _secureTokenGenerator.HashToken(dto.RefreshToken));

            if (storedToken == null)
                return null;

            if (storedToken.ExpiresAt < DateTime.UtcNow)
                return null;

            if (storedToken.IsRevoked)
                return null;

            storedToken.IsRevoked = true;

            await _context.SaveChangesAsync();

            var session = await CreateSessionAsync(storedToken.CustomerId);

            var newAccessToken = _tokenService.CreateToken(storedToken.Customer, session.Id);

            var newRefreshToken = _secureTokenGenerator.CreateToken();

            await _refreshTokenService.SaveRefreshTokenAsync(newRefreshToken, storedToken.CustomerId, session.Id);

            return new TokenResponseDto
            {
                Token = newAccessToken,
                RefreshToken = newRefreshToken
            };
        }

        public async Task<bool> LogoutAsync(RefreshTokenDto dto)
        {
            var tokenHash = _secureTokenGenerator.HashToken(dto.RefreshToken);

            var storedRefreshToken = await _context.RefreshTokens
                .Include(srt => srt.Customer)
                .SingleOrDefaultAsync(srt => srt.TokenHash == tokenHash);

            if (storedRefreshToken == null)
                return false;

            if (storedRefreshToken.IsRevoked)
                return false;

            storedRefreshToken.IsRevoked = true;

            if (storedRefreshToken.SessionId.HasValue)
            {
                var session = await _context.Sessions
                    .FirstOrDefaultAsync(s => s.Id == storedRefreshToken.SessionId.Value);

                if (session != null)
                {
                    session.IsActive = false;
                }
            }

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

            await _emailService.SendPasswordResetEmailAsync(customer.Email, rawToken, dto.Language);

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

            var sessions = await _context.Sessions
                .Where(s => s.CustomerId == customer.Id && s.IsActive)
                .ToListAsync();

            foreach (var session in sessions)
            {
                session.IsActive = false;
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

            await _emailService.SendEmailVerificationCodeAsync(dto.Email, code, dto.Language);

            return true;
        }

        public async Task<TokenResponseDto?> Verify2FAAsync(Verify2FADto dto)
        {
            var customer = await _context.Customers
                .Include(c => c.Role)
                .FirstOrDefaultAsync(c => c.Id == dto.CustomerId);

            if (customer == null)
                return null;

            var twoFactorAuth = await _context.TwoFactorAuths
                .FirstOrDefaultAsync(t => t.CustomerId == customer.Id && t.IsEnabled);

            if (twoFactorAuth == null)
                return null;

            bool isValid = false;

            if (twoFactorAuth.IsEmailEnabled)
            {
                var result = _passwordHasher.VerifyHashedPassword(
                    new Customer(),
                    twoFactorAuth.SecretKey,
                    dto.Code);

                isValid = result != PasswordVerificationResult.Failed;
            }
            else
            {
                var totp = new OtpNet.Totp(OtpNet.Base32Encoding.ToBytes(twoFactorAuth.SecretKey));
                isValid = totp.VerifyTotp(dto.Code, out _);
            }

            if (!isValid)
                return null;

            var session = await CreateSessionAsync(customer.Id);

            var accessToken = _tokenService.CreateToken(customer, session.Id);
            var refreshToken = _secureTokenGenerator.CreateToken();
            await _refreshTokenService.SaveRefreshTokenAsync(refreshToken, customer.Id, session.Id);

            return new TokenResponseDto
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                RequiresTwoFactor = false
            };
        }
    }
}