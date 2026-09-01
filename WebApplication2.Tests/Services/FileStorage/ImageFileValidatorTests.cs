using Microsoft.AspNetCore.Http;
using Moq;
using WebApplication2.Services.FileStorage.Services;

namespace WebApplication2.Tests.Services.FileStorage
{
    public class ImageFileValidatorTests
    {
        private readonly ImageFileValidator _validator;

        public ImageFileValidatorTests()
        {
            _validator = new ImageFileValidator();
        }

        private IFormFile CreateFile(
            string fileName,
            string contentType,
            byte[] content)
        {
            var fileMock = new Mock<IFormFile>();

            fileMock.Setup(x => x.FileName).Returns(fileName);
            fileMock.Setup(x => x.ContentType).Returns(contentType);
            fileMock.Setup(x => x.Length).Returns(content.Length);
            fileMock.Setup(x => x.OpenReadStream()).Returns(new MemoryStream(content));

            return fileMock.Object;
        }

        [Fact]
        public void Validate_Should_Return_Error_When_File_Is_Null()
        {
            var result = _validator.Validate(null);

            Assert.Equal("File is required.", result);
        }

        [Fact]
        public void Validate_Should_Return_Error_When_File_Is_Empty()
        {
            var file = CreateFile("test.jpg", "image/jpeg", Array.Empty<byte>());

            var result = _validator.Validate(file);

            Assert.Equal("File cannot be empty.", result);
        }

        [Fact]
        public void Validate_Should_Return_Error_When_File_Is_Too_Large()
        {
            var largeContent = new byte[5 * 1024 * 1024 + 1];
            var file = CreateFile("test.jpg", "image/jpeg", largeContent);

            var result = _validator.Validate(file);

            Assert.Equal("File size cannot exceed 5 MB.", result);
        }

        [Fact]
        public void Validate_Should_Return_Error_When_Content_Type_Is_Not_Allowed()
        {
            var file = CreateFile("test.gif", "image/gif", new byte[] { 0x47, 0x49, 0x46 });

            var result = _validator.Validate(file);

            Assert.Equal("Only JPEG, PNG and WebP images are allowed.", result);
        }

        [Fact]
        public void Validate_Should_Return_Error_When_Extension_Does_Not_Match_Content_Type()
        {
            var jpegHeader = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 };
            var file = CreateFile("test.png", "image/jpeg", jpegHeader);

            var result = _validator.Validate(file);

            Assert.Equal("File extension does not match its content type.", result);
        }

        [Fact]
        public void Validate_Should_Return_Error_When_JPEG_Signature_Is_Invalid()
        {
            var invalidJpeg = new byte[] { 0x00, 0x00, 0x00 };
            var file = CreateFile("test.jpg", "image/jpeg", invalidJpeg);

            var result = _validator.Validate(file);

            Assert.Equal("File contents do not match the declared image type.", result);
        }

        [Fact]
        public void Validate_Should_Return_Null_For_Valid_JPEG()
        {
            var validJpeg = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46 };
            var file = CreateFile("test.jpg", "image/jpeg", validJpeg);

            var result = _validator.Validate(file);

            Assert.Null(result);
        }

        [Fact]
        public void Validate_Should_Return_Error_When_PNG_Signature_Is_Invalid()
        {
            var invalidPng = new byte[] { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
            var file = CreateFile("test.png", "image/png", invalidPng);

            var result = _validator.Validate(file);

            Assert.Equal("File contents do not match the declared image type.", result);
        }

        [Fact]
        public void Validate_Should_Return_Null_For_Valid_PNG()
        {
            var validPng = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
            var file = CreateFile("test.png", "image/png", validPng);

            var result = _validator.Validate(file);

            Assert.Null(result);
        }

        [Fact]
        public void Validate_Should_Return_Error_When_WebP_Signature_Is_Invalid()
        {
            var invalidWebP = new byte[] { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
            var file = CreateFile("test.webp", "image/webp", invalidWebP);

            var result = _validator.Validate(file);

            Assert.Equal("File contents do not match the declared image type.", result);
        }

        [Fact]
        public void Validate_Should_Return_Null_For_Valid_WebP()
        {
            var validWebP = new byte[] { 0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50 };
            var file = CreateFile("test.webp", "image/webp", validWebP);

            var result = _validator.Validate(file);

            Assert.Null(result);
        }

        [Fact]
        public void Validate_Should_Return_Error_When_JPEG_File_Is_Too_Short()
        {
            var shortJpeg = new byte[] { 0xFF, 0xD8 };
            var file = CreateFile("test.jpg", "image/jpeg", shortJpeg);

            var result = _validator.Validate(file);

            Assert.Equal("File contents do not match the declared image type.", result);
        }

        [Fact]
        public void Validate_Should_Return_Error_When_PNG_File_Is_Too_Short()
        {
            var shortPng = new byte[] { 0x89, 0x50, 0x4E, 0x47 };
            var file = CreateFile("test.png", "image/png", shortPng);

            var result = _validator.Validate(file);

            Assert.Equal("File contents do not match the declared image type.", result);
        }

        [Fact]
        public void Validate_Should_Return_Error_When_WebP_File_Is_Too_Short()
        {
            var shortWebP = new byte[] { 0x52, 0x49, 0x46, 0x46 };
            var file = CreateFile("test.webp", "image/webp", shortWebP);

            var result = _validator.Validate(file);

            Assert.Equal("File contents do not match the declared image type.", result);
        }

        [Fact]
        public void Validate_Should_Handle_Uppercase_Extension()
        {
            var validJpeg = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 };
            var file = CreateFile("test.JPG", "image/jpeg", validJpeg);

            var result = _validator.Validate(file);

            Assert.Null(result);
        }
    }
}