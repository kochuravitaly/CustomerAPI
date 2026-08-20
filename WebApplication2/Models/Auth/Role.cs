using System.Text.Json.Serialization;

namespace WebApplication2.Models.Auth
{
    public class Role
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        [JsonIgnore]
        public ICollection<Customer> Customers { get; set; } = [];
    }
}
