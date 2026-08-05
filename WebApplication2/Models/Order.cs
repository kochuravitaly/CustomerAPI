using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WebApplication2.Data;

namespace WebApplication2.Models
{
    public class Order
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public int ProductId{ get; set; }
        public Guid CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public Product? Product { get; set; } 
        public DateTime OrderDate { get; set; }      
        public int Quantity { get; set; }
        public DateTime WarrantyExpiration { get; set; }

    }
}
