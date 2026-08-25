using FluentValidation;
using WebApplication2.DTOs.Profile;

namespace WebApplication2.Validators.Profile
{
    public class UpdateProfileValidator : AbstractValidator<UpdateProfileDto>
    {
        public UpdateProfileValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .MinimumLength(3)
                .MaximumLength(50);
        }

    }
}
