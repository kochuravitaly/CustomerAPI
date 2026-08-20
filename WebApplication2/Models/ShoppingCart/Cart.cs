using WebApplication2.Models.Auth;

namespace WebApplication2.Models.ShoppingCart
{
    public class Cart
    {
        public int Id { get; set; }
        public Guid CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public ICollection<CartItem> CartItems { get; set; } = [];
    }
}
