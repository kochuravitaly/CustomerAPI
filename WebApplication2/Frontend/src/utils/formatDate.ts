export function formatDate(
    value: string | Date
): string {
    return new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}