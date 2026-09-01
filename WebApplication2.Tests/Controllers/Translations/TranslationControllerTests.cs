using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApplication2.Controllers.Translations;
using WebApplication2.Services.Translation.Interfaces;

namespace WebApplication2.Tests.Controllers.Translations
{
    public class TranslationControllerTests
    {
        private readonly Mock<ITranslationBackfillService> _backfillServiceMock;
        private readonly TranslationController _controller;

        public TranslationControllerTests()
        {
            _backfillServiceMock = new Mock<ITranslationBackfillService>();
            _controller = new TranslationController(_backfillServiceMock.Object);
        }

        [Fact]
        public async Task TranslateAll_Should_Return_Ok_With_Message()
        {
            _backfillServiceMock
                .Setup(x => x.TranslateAllAsync())
                .Returns(Task.CompletedTask);

            var result = await _controller.TranslateAll();

            var okResult = Assert.IsType<OkObjectResult>(result);

            _backfillServiceMock.Verify(x => x.TranslateAllAsync(), Times.Once);
        }

        [Fact]
        public async Task TranslateAll_Should_Call_Service_Once()
        {
            _backfillServiceMock
                .Setup(x => x.TranslateAllAsync())
                .Returns(Task.CompletedTask);

            await _controller.TranslateAll();

            _backfillServiceMock.Verify(x => x.TranslateAllAsync(), Times.Once);
        }
    }
}