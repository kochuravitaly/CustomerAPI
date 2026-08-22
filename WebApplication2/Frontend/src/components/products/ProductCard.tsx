import { Link } from "react-router-dom";
import type { Product } from "../../types/products";

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const mainImage = product.images?.find(image => image.isMain)
        ?? product.images?.[0];

    return (
        <Link
            to={`/products/${product.id}`}
            className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
        >
            <div className="aspect-square overflow-hidden bg-gray-100">
                {mainImage ? (
                    <img
                        src={mainImage.objectKey}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                        No image
                    </div>
                )}
            </div>

            <div className="p-5">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                    {product.categoryName}
                </p>

                <h3 className="truncate text-lg font-semibold text-gray-900">
                    {product.name}
                </h3>

                <p className="mt-3 text-xl font-bold text-gray-900">
                    ₽{product.price.toLocaleString("ru-RU")}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                    {product.stockQuantity > 0
                        ? `${product.stockQuantity} in stock`
                        : "Out of stock"}
                </p>
            </div>
        </Link>
    );
}