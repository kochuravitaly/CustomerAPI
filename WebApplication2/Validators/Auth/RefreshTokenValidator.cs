using FluentValidation;
using WebApplication2.DTOs.Auth;

namespace WebApplication2.Validators.Auth
{
    public class RefreshTokenValidator : AbstractValidator<RefreshTokenDto>
    {
        public RefreshTokenValidator()
        {
            RuleFor(x => x.RefreshToken)
                .NotEmpty();
        }
    }
}
