using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebApplication2.Migrations
{
    /// <inheritdoc />
    public partial class AddFlashSaleProductCategoryJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FlashSales_Products_ProductId",
                table: "FlashSales");

            migrationBuilder.DropIndex(
                name: "IX_FlashSales_ProductId",
                table: "FlashSales");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "FlashSales");

            migrationBuilder.AddColumn<string>(
                name: "CategoryIdsJson",
                table: "FlashSales",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "FlashSales",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "ProductIdsJson",
                table: "FlashSales",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CategoryIdsJson",
                table: "FlashSales");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "FlashSales");

            migrationBuilder.DropColumn(
                name: "ProductIdsJson",
                table: "FlashSales");

            migrationBuilder.AddColumn<int>(
                name: "ProductId",
                table: "FlashSales",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_FlashSales_ProductId",
                table: "FlashSales",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_FlashSales_Products_ProductId",
                table: "FlashSales",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
