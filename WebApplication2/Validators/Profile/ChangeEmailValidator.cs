using FluentValidation;
using WebApplication2.DTOs.Profile;

namespace WebApplication2.Validators.Profile
{
    public class ChangeEmailValidator : AbstractValidator<ChangeEmailDto>
    {
        public ChangeEmailValidator()
        {
            RuleFor(x => x.Password)
                .NotEmpty()
                .WithMessage("Password is required.");

            RuleFor(x => x.NewEmail)
                .NotEmpty()
                .WithMessage("New email is required.")
                .EmailAddress()
                .WithMessage("Please enter a valid email address.");
        }
    }
}
