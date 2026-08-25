using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebApplication2.Migrations
{
    /// <inheritdoc />
    public partial class AddedColorToProductImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductColorProductSize");

            migrationBuilder.AddColumn<int>(
                name: "ProductColorId",
                table: "ProductImages",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProductSizeId",
                table: "ProductColors",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductImages_ProductColorId",
                table: "ProductImages",
                column: "ProductColorId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductColors_ProductSizeId",
                table: "ProductColors",
                column: "ProductSizeId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductColors_ProductSizes_ProductSizeId",
                table: "ProductColors",
                column: "ProductSizeId",
                principalTable: "ProductSizes",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductImages_ProductColors_ProductColorId",
                table: "ProductImages",
                column: "ProductColorId",
                principalTable: "ProductColors",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductColors_ProductSizes_ProductSizeId",
                table: "ProductColors");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductImages_ProductColors_ProductColorId",
                table: "ProductImages");

            migrationBuilder.DropIndex(
                name: "IX_ProductImages_ProductColorId",
                table: "ProductImages");

            migrationBuilder.DropIndex(
                name: "IX_ProductColors_ProductSizeId",
                table: "ProductColors");

            migrationBuilder.DropColumn(
                name: "ProductColorId",
                table: "ProductImages");

            migrationBuilder.DropColumn(
                name: "ProductSizeId",
                table: "ProductColors");

            migrationBuilder.CreateTable(
                name: "ProductColorProductSize",
                columns: table => new
                {
                    ColorsId = table.Column<int>(type: "integer", nullable: false),
                    SizesId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductColorProductSize", x => new { x.ColorsId, x.SizesId });
                    table.ForeignKey(
                        name: "FK_ProductColorProductSize_ProductColors_ColorsId",
                        column: x => x.ColorsId,
                        principalTable: "ProductColors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductColorProductSize_ProductSizes_SizesId",
                        column: x => x.SizesId,
                        principalTable: "ProductSizes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductColorProductSize_SizesId",
                table: "ProductColorProductSize",
                column: "SizesId");
        }
    }
}
