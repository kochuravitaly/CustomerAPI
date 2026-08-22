import Badge from "../common/Badge";

interface OrderStatusBadgeProps {
    status: string;
}

export default function OrderStatusBadge({
    status
}: OrderStatusBadgeProps) {
    const normalizedStatus = status.toLowerCase();

    let variant:
        | "default"
        | "success"
        | "warning"
        | "danger" = "default";

    if (
        normalizedStatus === "paid" ||
        normalizedStatus === "completed"
    ) {
        variant = "success";
    } else if (
        normalizedStatus === "pending" ||
        normalizedStatus === "created"
    ) {
        variant = "warning";
    } else if (
        normalizedStatus === "canceled" ||
        normalizedStatus === "cancelled"
    ) {
        variant = "danger";
    }

    return (
        <Badge variant={variant}>
            {status}
        </Badge>
    );
}