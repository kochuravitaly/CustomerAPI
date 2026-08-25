using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WebApplication2.Migrations
{
    /// <inheritdoc />
    public partial class AddedProductAttributes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AgeGroup",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Gender",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaterialId",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OccasionId",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PatternId",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Season",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "StyleId",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProductMaterials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductMaterials", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProductOccasions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductOccasions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProductPatterns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductPatterns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProductStyles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductStyles", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Products_MaterialId",
                table: "Products",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_OccasionId",
                table: "Products",
                column: "OccasionId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_PatternId",
                table: "Products",
                column: "PatternId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_StyleId",
                table: "Products",
                column: "StyleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_ProductMaterials_MaterialId",
                table: "Products",
                column: "MaterialId",
                principalTable: "ProductMaterials",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_ProductOccasions_OccasionId",
                table: "Products",
                column: "OccasionId",
                principalTable: "ProductOccasions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_ProductPatterns_PatternId",
                table: "Products",
                column: "PatternId",
                principalTable: "ProductPatterns",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_ProductStyles_StyleId",
                table: "Products",
                column: "StyleId",
                principalTable: "ProductStyles",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_ProductMaterials_MaterialId",
                table: "Products");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_ProductOccasions_OccasionId",
                table: "Products");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_ProductPatterns_PatternId",
                table: "Products");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_ProductStyles_StyleId",
                table: "Products");

            migrationBuilder.DropTable(
                name: "ProductMaterials");

            migrationBuilder.DropTable(
                name: "ProductOccasions");

            migrationBuilder.DropTable(
                name: "ProductPatterns");

            migrationBuilder.DropTable(
                name: "ProductStyles");

            migrationBuilder.DropIndex(
                name: "IX_Products_MaterialId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_OccasionId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_PatternId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_StyleId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "AgeGroup",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "MaterialId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "OccasionId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PatternId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Season",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "StyleId",
                table: "Products");
        }
    }
}
