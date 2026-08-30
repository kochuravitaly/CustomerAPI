namespace WebApplication2.Services.Translation.Interfaces
{
    public interface ITranslationService
    {
        Task<Dictionary<string, string>> TranslateAsync(string text, string[] targetLanguages);
        Task<string> TranslateSingleAsync(string text, string targetLanguage);
    }
}