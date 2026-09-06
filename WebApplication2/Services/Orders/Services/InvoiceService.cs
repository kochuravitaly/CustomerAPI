using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using WebApplication2.Data;
using WebApplication2.Models.Orders;
using WebApplication2.Services.Orders.Interfaces;

namespace WebApplication2.Services.Orders.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly AppDbContext _context;

        public InvoiceService(AppDbContext context)
        {
            _context = context;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<byte[]?> GenerateInvoiceAsync(Guid orderId, Guid customerId, string language = "en")
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerId == customerId);

            if (order == null) return null;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(50);
                    page.Size(PageSizes.A4);

                    page.Header().Text("CheyenneShop")
                        .FontSize(24)
                        .Bold()
                        .AlignCenter();

                    page.Content().Column(col =>
                    {
                        col.Item().Text(GetLabel("invoice", language))
                            .FontSize(18)
                            .Bold()
                            .AlignCenter();

                        col.Item().PaddingVertical(10).LineHorizontal(1);

                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(info =>
                            {
                                info.Item().Text($"{GetLabel("orderId", language)}: {order.Id.ToString().Substring(0, 8).ToUpper()}");
                                info.Item().Text($"{GetLabel("date", language)}: {order.CreatedAt:yyyy-MM-dd HH:mm}");
                                info.Item().Text($"{GetLabel("status", language)}: {GetStatusLabel(order.Status, language)}");
                            });
                        });

                        col.Item().PaddingVertical(10).LineHorizontal(1);

                        col.Item().Text(GetLabel("items", language))
                            .FontSize(14)
                            .Bold();

                        col.Item().PaddingVertical(5);

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn();
                                columns.ConstantColumn(50);
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text(GetLabel("item", language)).Bold();
                                header.Cell().Text(GetLabel("quantity", language)).Bold();
                                header.Cell().Text(GetLabel("price", language)).Bold();
                                header.Cell().Text(GetLabel("total", language)).Bold();
                            });

                            foreach (var item in order.OrderItems)
                            {
                                table.Cell().Text(item.ProductName);
                                table.Cell().Text(item.Quantity.ToString());
                                table.Cell().Text($"${item.UnitPrice:F2}");
                                table.Cell().Text($"${item.Total:F2}");
                            }
                        });

                        col.Item().PaddingVertical(20);

                        col.Item().AlignRight().Text($"{GetLabel("total", language)}: ${order.TotalAmount:F2}")
                            .FontSize(18)
                            .Bold();

                        col.Item().PaddingVertical(30);

                        col.Item().Text(GetThankYou(language))
                            .FontSize(12)
                            .FontColor("#666666")
                            .AlignCenter();
                    });
                });
            });

            return document.GeneratePdf();
        }

        private string GetLabel(string key, string language)
        {
            return language switch
            {
                "ru" => key switch
                {
                    "invoice" => "Счет",
                    "orderId" => "Номер заказа",
                    "date" => "Дата",
                    "status" => "Статус",
                    "items" => "Товары",
                    "item" => "Товар",
                    "quantity" => "Кол-во",
                    "price" => "Цена",
                    "total" => "Итого",
                    _ => key
                },
                "de" => key switch
                {
                    "invoice" => "Rechnung",
                    "orderId" => "Bestellnummer",
                    "date" => "Datum",
                    "status" => "Status",
                    "items" => "Artikel",
                    "item" => "Artikel",
                    "quantity" => "Menge",
                    "price" => "Preis",
                    "total" => "Gesamt",
                    _ => key
                },
                _ => key
            };
        }

        private string GetThankYou(string language)
        {
            return language switch
            {
                "ru" => "Спасибо за покупку в CheyenneShop!",
                "de" => "Danke für Ihren Einkauf bei CheyenneShop!",
                _ => "Thank you for shopping with CheyenneShop!"
            };
        }

        private string GetStatusLabel(OrderStatus status, string language)
        {
            return language switch
            {
                "ru" => status switch
                {
                    OrderStatus.Pending => "Ожидает",
                    OrderStatus.Paid => "Оплачен",
                    OrderStatus.Shipped => "Отправлен",
                    OrderStatus.Delivered => "Доставлен",
                    OrderStatus.Canceled => "Отменен",
                    _ => status.ToString()
                },
                "de" => status switch
                {
                    OrderStatus.Pending => "Ausstehend",
                    OrderStatus.Paid => "Bezahlt",
                    OrderStatus.Shipped => "Versendet",
                    OrderStatus.Delivered => "Geliefert",
                    OrderStatus.Canceled => "Storniert",
                    _ => status.ToString()
                },
                _ => status.ToString()
            };
        }
    }
}