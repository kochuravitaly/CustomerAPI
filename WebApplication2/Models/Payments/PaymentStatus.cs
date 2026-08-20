namespace WebApplication2.Models.Payments
{
    public enum PaymentStatus
    {
        Pending,
        WaitingForCapture,
        Succeeded,
        Canceled
    }
}
