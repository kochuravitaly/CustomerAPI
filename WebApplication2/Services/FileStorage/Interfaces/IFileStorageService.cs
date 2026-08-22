namespace WebApplication2.Services.FileStorage.Interfaces
{
    public interface IFileStorageService
    {
        Task UploadAsync(
            Stream stream,
            string objectKey,
            string contentType,
            CancellationToken cancellationToken);

        Task DeleteAsync(
            string objectKey,
            CancellationToken cancellationToken);

        Task<Stream> GetFileAsync(
            string objectKey,
            CancellationToken cancellationToken);

    }
}
