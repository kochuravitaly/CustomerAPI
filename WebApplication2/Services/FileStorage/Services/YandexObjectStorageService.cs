using Amazon.S3;
using Amazon.S3.Model;
using WebApplication2.Services.FileStorage.Interfaces;

namespace WebApplication2.Services.FileStorage.Services
{
    public class YandexObjectStorageService : IFileStorageService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly IConfiguration _configuration;

        public YandexObjectStorageService(IAmazonS3 s3Client, IConfiguration configuration)
        {
            _s3Client = s3Client;
            _configuration = configuration;
        }

        public async Task UploadAsync(
            Stream stream,
            string objectKey,
            string contentType,
            CancellationToken cancellationToken)
        {
            var bucketName = _configuration["YandexStorage:BucketName"]
                ?? throw new InvalidOperationException(
                    "Yandex Storage bucket is not configured.");

            var request = new PutObjectRequest
            {
                BucketName = bucketName,
                Key = objectKey,
                InputStream = stream,
                ContentType = contentType
            };

            await _s3Client.PutObjectAsync(
                request,
                cancellationToken);
        }

        public async Task DeleteAsync(
            string objectKey,
            CancellationToken cancellationToken)
        {
            var bucketName = _configuration["YandexStorage:BucketName"]
                ?? throw new InvalidOperationException(
                    "Yandex Storage bucket is not configured.");

            var request = new DeleteObjectRequest
            {
                BucketName = bucketName,
                Key = objectKey
            };

            await _s3Client.DeleteObjectAsync(
                request,
                cancellationToken);
        }
    }
}
