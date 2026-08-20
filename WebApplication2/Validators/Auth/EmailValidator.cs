using FluentValidation;
using WebApplication2.DTOs.Auth;

namespace WebApplication2.Validators.Auth
{
    public class EmailValidator : AbstractValidator<EmailDto>
    {
        public EmailValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty()
                .EmailAddress();
        }
    }
}
