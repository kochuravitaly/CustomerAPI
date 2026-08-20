using FluentValidation;
using WebApplication2.DTOs.ShoppingCart;

namespace WebApplication2.Validators.ShoppingCart
{
    public class UpdateCartItemValidator : AbstractValidator<UpdateCartItemDto>
    {
        public UpdateCartItemValidator()
        {
            RuleFor(x => x.Quantity)
                .GreaterThan(0);
        }
    }
}
