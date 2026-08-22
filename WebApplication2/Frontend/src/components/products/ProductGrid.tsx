import type { Product } from "../../types/products";
import ProductCard from "./ProductCard";

interface ProductGridProps {
    products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                    No products found
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                    Try changing your search or filters.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map(product => (
                <ProductCard
                    key={product.id}
                    product={product}
                />
            ))}
        </div>
    );
}