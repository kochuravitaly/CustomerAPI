using Microsoft.AspNetCore.Mvc;
using WebApplication2.Data;
using WebApplication2.DTOs;
using WebApplication2.Services;
using Microsoft.AspNetCore.Authorization;

namespace WebApplication2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly ICustomerService _customerService;

        public CustomersController(ICustomerService customerService)
        {
            _customerService = customerService;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Customer>> GetCustomerById(Guid id)
        {
            var customer = await _customerService.GetCustomerByIdAsync(id);

            if (customer == null)
            {
                return NotFound();
            }

            return Ok(customer);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterCustomerDto dto)
        {
            var customer = await _customerService.RegisterAsync(dto);

            if (customer == null)
            {
                return Conflict("Email is already taken");
            }

            return Ok();
        }

        [HttpPost("login")]
        public async Task<ActionResult<TokenResponseDto>> Login(LoginDto dto)
        {
            var response = await _customerService.LoginAsync(dto);

            if (response == null)
            {
                return Unauthorized("Invalid email or password");
            }

            return Ok(response);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomerByIdAsync(Guid id)
        {
            var deleted = await _customerService.DeleteCustomerByIdAsync(id);

            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}
