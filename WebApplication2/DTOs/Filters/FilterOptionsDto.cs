namespace WebApplication2.DTOs.Filters
{
    public class FilterOptionsDto
    {
        public List<ColorFilterDto> Colors { get; set; } = new();
        public List<SizeFilterDto> Sizes { get; set; } = new();
        public List<GenderFilterDto> Genders { get; set; } = new();
        public List<SeasonFilterDto> Seasons { get; set; } = new();
        public List<AgeGroupFilterDto> AgeGroups { get; set; } = new();
        public List<AttributeFilterDto> Materials { get; set; } = new();
        public List<AttributeFilterDto> Styles { get; set; } = new();
        public List<AttributeFilterDto> Occasions { get; set; } = new();
        public List<AttributeFilterDto> Patterns { get; set; } = new();
        public decimal MinPrice { get; set; }
        public decimal MaxPrice { get; set; }
        public double MinRating { get; set; }
        public double MaxRating { get; set; }
    }

}
