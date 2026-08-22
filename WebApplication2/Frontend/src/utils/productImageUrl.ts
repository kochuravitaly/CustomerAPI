import type { ProductImage } from "../types/products";

export function getProductImageUrl(
    image: ProductImage
): string {
    /*
     * ObjectKey is the storage key, not necessarily a browser URL.
     *
     * Your backend already returns the image URL through the
     * product-image functionality, so if ObjectKey is already
     * an absolute URL, use it directly.
     */
    if (
        image.objectKey.startsWith("http://") ||
        image.objectKey.startsWith("https://")
    ) {
        return image.objectKey;
    }

    /*
     * Current backend/frontend are served from the same host.
     * Keep this path-based fallback so we don't hard-code localhost.
     */
    return `/api/products/${image.productId}/images/${image.id}`;
}