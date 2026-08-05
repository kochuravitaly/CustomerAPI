using System.Text.Json.Serialization;
using WebApplication2.Data;

namespace WebApplication2.Models
{
    public class Role
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        [JsonIgnore]
        public ICollection<Customer> Customers { get; set; } = [];
    }
}
