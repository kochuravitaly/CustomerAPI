using FluentValidation;
using WebApplication2.DTOs.ShoppingCart;

namespace WebApplication2.Validators.ShoppingCart
{
    public class AddCartItemValidator : AbstractValidator<AddCartItemDto>
    {
        public AddCartItemValidator()
        {
            RuleFor(x => x.ProductId)
                .GreaterThan(0);

            RuleFor(x => x.Quantity)
                .GreaterThan(0);
        }
    }
}
