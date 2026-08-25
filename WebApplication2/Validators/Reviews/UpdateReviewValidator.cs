using FluentValidation;
using WebApplication2.DTOs.Reviews;

namespace WebApplication2.Validators.Reviews
{
    public class UpdateReviewValidator : AbstractValidator<UpdateReviewDto>
    {
        public UpdateReviewValidator()
        {
            RuleFor(x => x.Rating)
                .InclusiveBetween(1, 5);

            RuleFor(x => x.Text)
                .MaximumLength(2000);
        }
    }
}
