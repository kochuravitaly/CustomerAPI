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
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerId == customerId);

            if (order == null) return null;

            var timeZoneId = GetTimeZone(language);
            var localTime = TimeZoneInfo.ConvertTimeFromUtc(
                order.CreatedAt,
                TimeZoneInfo.FindSystemTimeZoneById(timeZoneId)
            );

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(40);
                    page.Size(PageSizes.A4);

                    page.Header().Column(header =>
                    {
                        header.Item().Row(row =>
                        {
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text("CheyenneShop")
                                    .FontSize(24)
                                    .Bold()
                                    .FontColor("#1a1a1a");
                                col.Item().Text($"{GetLabel("email", language)}: support@cheyenneshop.ru")
                                    .FontSize(9)
                                    .FontColor("#666666");
                            });

                            row.ConstantColumn(150).Column(col =>
                            {
                                col.Item().Text(GetLabel("invoice", language).ToUpper())
                                    .FontSize(20)
                                    .Bold()
                                    .FontColor("#333333");
                                col.Item().Text($"#{order.InvoiceNumber}")
                                    .FontSize(12)
                                    .FontColor("#666666");
                            });
                        });

                        header.Item().PaddingVertical(15).LineHorizontal(1).LineColor("#cccccc");
                    });

                    page.Content().Column(content =>
                    {
                        content.Item().Row(row =>
                        {
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text(GetLabel("billTo", language))
                                    .FontSize(10)
                                    .Bold()
                                    .FontColor("#666666");
                                col.Item().Text(order.Customer?.Name ?? "")
                                    .FontSize(12);
                                col.Item().Text(order.Customer?.Email ?? "")
                                    .FontSize(10)
                                    .FontColor("#666666");
                            });

                            row.ConstantColumn(200).Column(col =>
                            {
                                col.Item().Text($"{GetLabel("date", language)}: {localTime:dd.MM.yyyy HH:mm}")
                                    .FontSize(10);
                                col.Item().Text($"{GetLabel("orderId", language)}: {order.Id.ToString().Substring(0, 8).ToUpper()}")
                                    .FontSize(10);
                                col.Item().Text($"{GetLabel("status", language)}: {GetStatusLabel(order.Status, language)}")
                                    .FontSize(10);
                            });
                        });

                        content.Item().PaddingVertical(20);

                        content.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3);
                                columns.ConstantColumn(50);
                                columns.ConstantColumn(80);
                                columns.ConstantColumn(80);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background("#f5f5f5").Padding(8).Text(GetLabel("item", language)).FontSize(10).Bold();
                                header.Cell().Background("#f5f5f5").Padding(8).Text(GetLabel("quantity", language)).FontSize(10).Bold();
                                header.Cell().Background("#f5f5f5").Padding(8).Text(GetLabel("price", language)).FontSize(10).Bold();
                                header.Cell().Background("#f5f5f5").Padding(8).Text(GetLabel("total", language)).FontSize(10).Bold();
                            });

                            foreach (var item in order.OrderItems)
                            {
                                table.Cell().BorderBottom(1).BorderColor("#eeeeee").Padding(8).Text(item.ProductName).FontSize(10);
                                table.Cell().BorderBottom(1).BorderColor("#eeeeee").Padding(8).Text(item.Quantity.ToString()).FontSize(10);
                                table.Cell().BorderBottom(1).BorderColor("#eeeeee").Padding(8).Text($"${item.UnitPrice:F2}").FontSize(10);
                                table.Cell().BorderBottom(1).BorderColor("#eeeeee").Padding(8).Text($"${item.Total:F2}").FontSize(10);
                            }
                        });

                        content.Item().PaddingVertical(20);

                        content.Item().AlignRight().Column(col =>
                        {
                            col.Item().Text($"{GetLabel("subtotal", language)}: ${order.TotalAmount:F2}")
                                .FontSize(11);
                            col.Item().Text($"{GetLabel("shipping", language)}: $0.00")
                                .FontSize(11);
                            col.Item().PaddingTop(5).Text($"{GetLabel("total", language)}: ${order.TotalAmount:F2}")
                                .FontSize(16)
                                .Bold();
                        });
                    });

                    page.Footer().Column(footer =>
                    {
                        footer.Item().PaddingVertical(10).LineHorizontal(1).LineColor("#cccccc");
                        footer.Item().Text(GetThankYou(language))
                            .FontSize(10)
                            .FontColor("#666666")
                            .AlignCenter();
                        footer.Item().Text("CheyenneShop © " + DateTime.Now.Year)
                            .FontSize(8)
                            .FontColor("#999999")
                            .AlignCenter();
                    });
                });
            });

            return document.GeneratePdf();
        }

        private string GetTimeZone(string language)
        {
            return language switch
            {
                "ru" => "Europe/Moscow",
                "de" => "Europe/Berlin",
                _ => "Europe/London"
            };
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
                    "email" => "Эл. почта",
                    "billTo" => "Получатель",
                    "subtotal" => "Подытог",
                    "shipping" => "Доставка",
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
                    "email" => "E-Mail",
                    "billTo" => "Rechnungsadresse",
                    "subtotal" => "Zwischensumme",
                    "shipping" => "Versand",
                    _ => key
                },
                _ => key switch
                {
                    "invoice" => "Invoice",
                    "orderId" => "Order ID",
                    "date" => "Date",
                    "status" => "Status",
                    "items" => "Items",
                    "item" => "Item",
                    "quantity" => "Qty",
                    "price" => "Price",
                    "total" => "Total",
                    "email" => "Email",
                    "billTo" => "Bill To",
                    "subtotal" => "Subtotal",
                    "shipping" => "Shipping",
                    _ => key
                }
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