using WebApplication2.Models.Orders;

namespace WebApplication2.DTOs.Orders
{
    public class OrderResponseDto
    {
        public Guid Id { get; set; }
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public IEnumerable<OrderItemResponseDto> Items { get; set; } = [];
    }
}
