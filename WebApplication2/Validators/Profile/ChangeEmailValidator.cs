using FluentValidation;
using WebApplication2.DTOs.Profile;

namespace WebApplication2.Validators.Profile
{
    public class ChangeEmailValidator : AbstractValidator<ChangeEmailDto>
    {
        public ChangeEmailValidator()
        {
            RuleFor(x => x.NewEmail)
                .NotEmpty()
                .EmailAddress();
        }
    }
}
