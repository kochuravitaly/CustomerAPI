using FluentValidation;
using WebApplication2.DTOs;

namespace WebApplication2.Validators
{
    public class VerifyEmailValidator : AbstractValidator<VerifyEmailDto>
    {
        public VerifyEmailValidator() 
        {
            RuleFor(x => x.Code)
                .NotEmpty()
                .WithMessage("Verification code is required.")
                .Matches(@"^\d{6}$")
                .WithMessage("Verification code must consist of exactly 6 digits.");
        }
    }
}
