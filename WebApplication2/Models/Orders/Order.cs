using WebApplication2.Models.Auth;
using WebApplication2.Models.Payments;

namespace WebApplication2.Models.Orders
{
    public class Order
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.Pending;
        public DateTime CreatedAt { get; set; }
        public Payment? Payment { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public ICollection<OrderItem> OrderItems { get; set; } = [];
    }
}
