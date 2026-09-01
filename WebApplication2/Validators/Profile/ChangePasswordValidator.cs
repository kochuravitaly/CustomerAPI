using FluentValidation;
using WebApplication2.DTOs.Profile;

namespace WebApplication2.Validators.Profile
{
    public class ChangePasswordValidator : AbstractValidator<ChangePasswordDto>
    {
        public ChangePasswordValidator()
        {
            RuleFor(x => x.CurrentPassword)
                .NotEmpty()
                .WithMessage("Current password is required.");

            RuleFor(x => x.NewPassword)
                .NotEmpty()
                .WithMessage("New password is required.")
                .MinimumLength(8)
                .WithMessage("New password must be at least 8 characters long.")
                .Matches(@"[a-z]")
                .WithMessage("New password must contain a lowercase letter.")
                .Matches(@"[A-Z]")
                .WithMessage("New password must contain an uppercase letter.")
                .Matches(@"\d")
                .WithMessage("New password must contain a number.")
                .Matches(@"[^a-zA-Z0-9]")
                .WithMessage("New password must contain a special character.");

            RuleFor(x => x.ConfirmNewPassword)
                .NotEmpty()
                .WithMessage("Please confirm your new password.")
                .Equal(x => x.NewPassword)
                .WithMessage("Passwords do not match.");
        }
    }
}
