using FluentValidation;
using WebApplication2.DTOs;

namespace WebApplication2.Validators
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
                    .WithMessage("Password must containt a lowercase letter")
                .Matches(@"[A-Z]")
                    .WithMessage("Password must containt an uppercase letter")
                .Matches(@"\d")
                    .WithMessage("Password must containt a number")
                .Matches(@"[^a-zA-Z0-9]")
                    .WithMessage("Password must containt a special character");

            RuleFor(x => x.ConfirmPassword)
                .Equal(x => x.Password)
                .WithMessage("Passwords do not match");
        }
    }
}
