using FluentValidation;
using WebApplication2.DTOs.Products;

namespace WebApplication2.Validators.Products
{
    public class UpdateCategoryValidator : AbstractValidator<UpdateCategoryDto>
    {
        public UpdateCategoryValidator()
        {
            RuleFor(x => x.Name)
                .MaximumLength(100)
                .When(x => x.Name is not null);

            RuleFor(x => x.Description)
                .MaximumLength(500)
                .When(x => x.Description is not null);
        }
    }
}
