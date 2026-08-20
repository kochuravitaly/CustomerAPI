using FluentValidation;
using WebApplication2.DTOs.Auth;

namespace WebApplication2.Validators.Auth
{
    public class ResetPasswordValidator : AbstractValidator<ResetPasswordDto>
    {
        public ResetPasswordValidator()
        {
            RuleFor(x => x.Token)
                .NotEmpty();

            RuleFor(x => x.NewPassword)
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
        }
    }
}
