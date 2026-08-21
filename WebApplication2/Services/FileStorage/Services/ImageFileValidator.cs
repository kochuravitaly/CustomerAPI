using WebApplication2.Services.FileStorage.Interfaces;

namespace WebApplication2.Services.FileStorage.Services
{
    public class ImageFileValidator : IImageFileValidator
    {
        private const long MaxFileSize = 5 * 1024 * 1024;

        private static readonly Dictionary<string, string> AllowedContentTypes = new()
        {
            ["image/jpeg"] = ".jpg",
            ["image/png"] = ".png",
            ["image/webp"] = ".webp"
        };

        public string? Validate(IFormFile? file)
        {
            if (file is null)
                return "File is required.";

            if (file.Length == 0)
                return "File cannot be empty.";

            if (file.Length > MaxFileSize)
                return "File size cannot exceed 5 MB.";

            if (!AllowedContentTypes.TryGetValue(
                    file.ContentType,
                    out var expectedExtension))
            {
                return "Only JPEG, PNG and WebP images are allowed.";
            }

            var actualExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (actualExtension != expectedExtension)
                return "File extension does not match its content type.";

            if (!HasValidSignature(file, file.ContentType))
                return "File contents do not match the declared image type.";

            return null;
        }

        private static bool HasValidSignature(
            IFormFile file,
            string contentType)
        {
            using var stream = file.OpenReadStream();

            var header = new byte[12];

            var bytesRead = stream.Read(header);

            return contentType switch
            {
                "image/jpeg" => bytesRead >= 3 &&
                                header[0] == 0xFF &&
                                header[1] == 0xD8 &&
                                header[2] == 0xFF,

                "image/png" => bytesRead >= 8 &&
                               header[0] == 0x89 &&
                               header[1] == 0x50 &&
                               header[2] == 0x4E &&
                               header[3] == 0x47 &&
                               header[4] == 0x0D &&
                               header[5] == 0x0A &&
                               header[6] == 0x1A &&
                               header[7] == 0x0A,

                "image/webp" => bytesRead >= 12 &&
                                header[0] == 0x52 &&
                                header[1] == 0x49 &&
                                header[2] == 0x46 &&
                                header[3] == 0x46 &&
                                header[8] == 0x57 &&
                                header[9] == 0x45 &&
                                header[10] == 0x42 &&
                                header[11] == 0x50,

                _ => false
            };
        }
    }
}