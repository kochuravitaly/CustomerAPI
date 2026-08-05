using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs;
using WebApplication2.Models;

namespace WebApplication2.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<Customer> _passwordHasher;
        private readonly ITokenService _tokenService;
        private readonly IRefreshTokenService _refreshTokenService;

        public CustomerService(AppDbContext context, IPasswordHasher<Customer> passwordHasher, ITokenService tokenService, IRefreshTokenService refreshTokenService)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _refreshTokenService = refreshTokenService;
        }

        public async Task<Customer?> RegisterAsync(RegisterCustomerDto dto)
        {
            bool exists = await _context.Customers
                .AnyAsync(c => c.Email == dto.Email);

            if (exists)
                return null;

            var customer = new Customer
            {
                Name = dto.Name,
                Email = dto.Email,
                RoleId = 1
            };

            customer.PasswordHash = _passwordHasher.HashPassword(customer, dto.Password);

            _context.Customers.Add(customer);
            
            await _context.SaveChangesAsync();

            return customer;
        }

        public async Task<TokenResponseDto?> LoginAsync(LoginDto dto)
        {
            var customer = await _context.Customers
                .Include(c => c.Role).SingleOrDefaultAsync(c => c.Email == dto.Email);

            if (customer == null)
                return null;

            var result = _passwordHasher.VerifyHashedPassword(customer, customer.PasswordHash, dto.Password);

            if (result == PasswordVerificationResult.Failed)
            {
                return null;
            }

            var accessToken = _tokenService.CreateToken(customer);

            var refreshToken = _refreshTokenService.CreateRefreshToken();

            await _refreshTokenService.SaveRefreshTokenAsync(refreshToken, customer.Id);

            return new TokenResponseDto
            {
                Token = accessToken,
                RefreshToken = refreshToken
            };
        }

        public async Task<GetCustomerByIdDto?> GetCustomerByIdAsync(Guid id)
        {
            return await _context.Customers
                .Include(c => c.Role)
                .Where(c => c.Id == id)
                .Select(c => new GetCustomerByIdDto
                             {
                                Name = c.Name,
                                Email = c.Email,
                                Role = c.Role.Name
                             })
                .SingleOrDefaultAsync();
        }

        public async Task<bool> DeleteCustomerByIdAsync(Guid id)
        {
            var customer = await _context.Customers.FindAsync(id);

            if (customer == null)
            { 
                return false;
            }

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
