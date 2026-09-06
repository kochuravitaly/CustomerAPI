using FluentValidation;
using PhoneNumbers;
using WebApplication2.DTOs.Profile;

namespace WebApplication2.Validators.Profile
{
    public class CreateAddressValidator : AbstractValidator<CreateAddressDto>
    {
        public CreateAddressValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty()
                .MinimumLength(2)
                .MaximumLength(100);

            RuleFor(x => x.Phone)
                .NotEmpty()
                .Must(BeValidPhoneNumber)
                .WithMessage("Invalid phone number");

            RuleFor(x => x.Street)
                .NotEmpty()
                .MaximumLength(500);

            RuleFor(x => x.City)
                .NotEmpty()
                .MaximumLength(100);

            RuleFor(x => x.Region)
                .NotEmpty()
                .MaximumLength(100);

            RuleFor(x => x.PostalCode)
                .NotEmpty()
                .MaximumLength(20);

            RuleFor(x => x.Country)
                .NotEmpty()
                .MaximumLength(100);

            RuleFor(x => x.Apartment)
                .MaximumLength(50);
        }

        private bool BeValidPhoneNumber(string phone)
        {
            try
            {
                var cleaned = System.Text.RegularExpressions.Regex.Replace(phone, @"[\s\-\(\)]", "");

                if (!System.Text.RegularExpressions.Regex.IsMatch(cleaned, @"^\+?\d{10,15}$"))
                {
                    return false;
                }

                var phoneUtil = PhoneNumberUtil.GetInstance();
                var number = phoneUtil.Parse(cleaned, null);
                return phoneUtil.IsValidNumber(number);
            }
            catch
            {
                return false;
            }
        }
    }
}