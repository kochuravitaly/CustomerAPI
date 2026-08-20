using FluentValidation;
using WebApplication2.DTOs.Payments;

namespace WebApplication2.Validators.Payments
{
    public class CreatePaymentValidator : AbstractValidator<CreatePaymentDto>
    {
        public CreatePaymentValidator()
        {
            RuleFor(x => x.OrderId)
                .NotEmpty();
        }
    }
}
