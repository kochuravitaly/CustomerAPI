using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebApplication2.Migrations
{
    /// <inheritdoc />
    public partial class AddedProductAndCategoryToCoupon : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Coupons");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "Coupons");

            migrationBuilder.AddColumn<string>(
                name: "CategoryIdsJson",
                table: "Coupons",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProductIdsJson",
                table: "Coupons",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CategoryIdsJson",
                table: "Coupons");

            migrationBuilder.DropColumn(
                name: "ProductIdsJson",
                table: "Coupons");

            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "Coupons",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProductId",
                table: "Coupons",
                type: "integer",
                nullable: true);
        }
    }
}
