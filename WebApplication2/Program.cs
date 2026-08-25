using Amazon.S3;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using SharpGrip.FluentValidation.AutoValidation.Mvc.Extensions;
using System.Text;
using WebApplication2.Data;
using WebApplication2.Models.Auth;
using WebApplication2.Services.Auth.Interfaces;
using WebApplication2.Services.Auth.Services;
using WebApplication2.Services.FileStorage.Interfaces;
using WebApplication2.Services.FileStorage.Services;
using WebApplication2.Services.Home;
using WebApplication2.Services.Orders;
using WebApplication2.Services.Orders.Interfaces;
using WebApplication2.Services.Orders.Services;
using WebApplication2.Services.Payments;
using WebApplication2.Services.Payments.YooKassa;
using WebApplication2.Services.Products.Interfaces;
using WebApplication2.Services.Products.Services;
using WebApplication2.Services.Profile;
using WebApplication2.Services.Profile.WebApplication2.Services.Profile;
using WebApplication2.Services.Reviews;
using WebApplication2.Services.ShoppingCart;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

builder.Services.AddFluentValidationAutoValidation(config =>
{
    config.DisableBuiltInModelValidation = true;
});

builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"));
});

builder.Services.AddProblemDetails();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPasswordHasher<Customer>, PasswordHasher<Customer>>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IRefreshTokenService, RefreshTokenService>();
builder.Services.AddScoped<ISecureTokenGeneratorService, SecureTokenGeneratorService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddHostedService<TokenCleanupService>();

builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IProductImageService, ProductImageService>();

builder.Services.AddScoped<ICartService, CartService>();

builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<ICouponService, CouponService>();
builder.Services.AddScoped<IFlashSaleService, FlashSaleService>();

builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddHttpClient<IYooKassaClient, YooKassaClient>(client =>
{
    client.BaseAddress = new Uri("https://api.yookassa.ru/");
});

builder.Services.AddScoped<IImageFileValidator, ImageFileValidator>();
builder.Services.AddScoped<IFileStorageService, YandexObjectStorageService>();

builder.Services.AddScoped<IProfileService, ProfileService>();

builder.Services.AddScoped<IReviewService, ReviewService>();

builder.Services.AddScoped<IProductVariantService, ProductVariantService>();

builder.Services.AddScoped<IHomeSectionService, HomeSectionService>();

builder.Services.AddAuthentication()
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],

            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],

            ValidateLifetime = true,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddOpenApi();

var yandexStorage = builder.Configuration
    .GetSection("YandexStorage");

builder.Services.AddSingleton<IAmazonS3>(_ =>
{
    var config = new AmazonS3Config
    {
        ServiceURL = yandexStorage["Endpoint"],
        AuthenticationRegion = yandexStorage["Region"],
        ForcePathStyle = true
    };

    return new AmazonS3Client(
        yandexStorage["AccessKey"],
        yandexStorage["SecretKey"],
        config);
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    //app.MapScalarApiReference();
}

//app.UseHttpsRedirection();

app.UseExceptionHandler();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("index.html");

app.Run();
