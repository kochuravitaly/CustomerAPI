using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WebApplication2.Migrations
{
    /// <inheritdoc />
    public partial class AddedAttributeTranslations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MaterialTranslations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MaterialId = table.Column<int>(type: "integer", nullable: false),
                    LanguageCode = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaterialTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaterialTranslations_ProductMaterials_MaterialId",
                        column: x => x.MaterialId,
                        principalTable: "ProductMaterials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OccasionTranslations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OccasionId = table.Column<int>(type: "integer", nullable: false),
                    LanguageCode = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OccasionTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OccasionTranslations_ProductOccasions_OccasionId",
                        column: x => x.OccasionId,
                        principalTable: "ProductOccasions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PatternTranslations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PatternId = table.Column<int>(type: "integer", nullable: false),
                    LanguageCode = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatternTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PatternTranslations_ProductPatterns_PatternId",
                        column: x => x.PatternId,
                        principalTable: "ProductPatterns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StyleTranslations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StyleId = table.Column<int>(type: "integer", nullable: false),
                    LanguageCode = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StyleTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StyleTranslations_ProductStyles_StyleId",
                        column: x => x.StyleId,
                        principalTable: "ProductStyles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MaterialTranslations_MaterialId",
                table: "MaterialTranslations",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_OccasionTranslations_OccasionId",
                table: "OccasionTranslations",
                column: "OccasionId");

            migrationBuilder.CreateIndex(
                name: "IX_PatternTranslations_PatternId",
                table: "PatternTranslations",
                column: "PatternId");

            migrationBuilder.CreateIndex(
                name: "IX_StyleTranslations_StyleId",
                table: "StyleTranslations",
                column: "StyleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MaterialTranslations");

            migrationBuilder.DropTable(
                name: "OccasionTranslations");

            migrationBuilder.DropTable(
                name: "PatternTranslations");

            migrationBuilder.DropTable(
                name: "StyleTranslations");
        }
    }
}
