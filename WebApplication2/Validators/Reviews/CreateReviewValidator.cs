using FluentValidation;
using WebApplication2.DTOs.Reviews;

namespace WebApplication2.Validators.Reviews
{
    public class CreateReviewValidator : AbstractValidator<CreateReviewDto>
    {
        public CreateReviewValidator()
        {
            RuleFor(x => x.ProductId)
                .GreaterThan(0);

            RuleFor(x => x.Rating)
                .InclusiveBetween(1, 5);

            RuleFor(x => x.Text)
                .MaximumLength(2000);
        }
    }
}
