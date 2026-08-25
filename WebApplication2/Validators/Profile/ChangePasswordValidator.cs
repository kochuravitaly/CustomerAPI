using FluentValidation;
using WebApplication2.DTOs.Profile;

namespace WebApplication2.Validators.Profile
{
    public class ChangePasswordValidator : AbstractValidator<ChangePasswordDto>
    {
        public ChangePasswordValidator()
        {
            RuleFor(x => x.CurrentPassword)
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

            RuleFor(x => x.ConfirmNewPassword)
                .NotEmpty()
                .Equal(x => x.NewPassword)
                .WithMessage("Passwords do not match");
        }
    }
}
