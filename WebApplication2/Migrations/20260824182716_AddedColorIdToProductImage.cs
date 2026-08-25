using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebApplication2.Migrations
{
    /// <inheritdoc />
    public partial class AddedColorIdToProductImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductImages_ProductColors_ProductColorId",
                table: "ProductImages");

            migrationBuilder.RenameColumn(
                name: "ProductColorId",
                table: "ProductImages",
                newName: "ColorId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductImages_ProductColorId",
                table: "ProductImages",
                newName: "IX_ProductImages_ColorId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductImages_ProductColors_ColorId",
                table: "ProductImages",
                column: "ColorId",
                principalTable: "ProductColors",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductImages_ProductColors_ColorId",
                table: "ProductImages");

            migrationBuilder.RenameColumn(
                name: "ColorId",
                table: "ProductImages",
                newName: "ProductColorId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductImages_ColorId",
                table: "ProductImages",
                newName: "IX_ProductImages_ProductColorId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductImages_ProductColors_ProductColorId",
                table: "ProductImages",
                column: "ProductColorId",
                principalTable: "ProductColors",
                principalColumn: "Id");
        }
    }
}
