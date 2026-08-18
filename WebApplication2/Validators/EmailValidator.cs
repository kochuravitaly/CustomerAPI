using FluentValidation;
using WebApplication2.DTOs;

namespace WebApplication2.Validators
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
