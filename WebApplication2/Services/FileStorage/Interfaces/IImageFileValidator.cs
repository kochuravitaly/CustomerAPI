namespace WebApplication2.Services.FileStorage.Interfaces
{
    public interface IImageFileValidator
    {
        string? Validate(IFormFile? file);
    }
}
