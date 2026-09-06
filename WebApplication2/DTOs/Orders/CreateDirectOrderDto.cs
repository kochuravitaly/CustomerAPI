namespace WebApplication2.DTOs.Orders
{
    public class CreateDirectOrderDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public int? ColorId { get; set; }
        public string? SizeName { get; set; }
    }
}