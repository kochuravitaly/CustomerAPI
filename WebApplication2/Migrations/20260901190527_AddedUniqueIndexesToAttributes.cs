using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebApplication2.Migrations
{
    /// <inheritdoc />
    public partial class AddedUniqueIndexesToAttributes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ProductStyles_Name",
                table: "ProductStyles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductPatterns_Name",
                table: "ProductPatterns",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductOccasions_Name",
                table: "ProductOccasions",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductMaterials_Name",
                table: "ProductMaterials",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ProductStyles_Name",
                table: "ProductStyles");

            migrationBuilder.DropIndex(
                name: "IX_ProductPatterns_Name",
                table: "ProductPatterns");

            migrationBuilder.DropIndex(
                name: "IX_ProductOccasions_Name",
                table: "ProductOccasions");

            migrationBuilder.DropIndex(
                name: "IX_ProductMaterials_Name",
                table: "ProductMaterials");
        }
    }
}
