using FluentValidation;
using WebApplication2.DTOs.Profile;

namespace WebApplication2.Validators.Profile
{
    public class DeleteAccountValidator : AbstractValidator<DeleteAccountDto>
    {
        public DeleteAccountValidator()
        {
            RuleFor(x => x.Password)
                .NotEmpty()
                .WithMessage("Password is required to delete your account.");
        }
    }
}
