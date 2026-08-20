using FluentValidation;
using WebApplication2.DTOs.Auth;

namespace WebApplication2.Validators.Auth
{
    public class RegisterCustomerValidator : AbstractValidator<RegisterCustomerDto>
    {
        public RegisterCustomerValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .MinimumLength(3)
                .MaximumLength(50);

            RuleFor(x => x.Email)
                .NotEmpty()
                .EmailAddress();

            RuleFor(x => x.Password)
                .NotEmpty()
                .MinimumLength(8)
                .MaximumLength(100)
                .Matches(@"[a-z]")
                    .WithMessage("Password must contain a lowercase letter")
                .Matches(@"[A-Z]")
                    .WithMessage("Password must contain an uppercase letter")
                .Matches(@"\d")
                    .WithMessage("Password must contain a number")
                .Matches(@"[^a-zA-Z0-9]")
                    .WithMessage("Password must contain a special character");

            RuleFor(x => x.ConfirmPassword)
                .NotEmpty()
                .Equal(x => x.Password)
                .WithMessage("Passwords do not match");
        }
    }
}
