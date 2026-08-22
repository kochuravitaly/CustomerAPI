// Location: frontend/src/components/products/ProductDetails.tsx
// Template: Text File
// Name: ProductDetails.tsx

import { useState } from "react";
import type { Product } from "../../types/products";
import Button from "../common/Button";

interface ProductDetailsProps {
    product: Product;
    onAddToCart: (quantity: number) => Promise<void>;
}

export default function ProductDetails({
    product,
    onAddToCart
}: ProductDetailsProps) {
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);

    const images = product.images ?? [];

    const mainImage =
        images.find(image => image.isMain) ?? images[0];

    const handleAdd = async () => {
        try {
            setLoading(true);
            await onAddToCart(quantity);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
                <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
                    {mainImage ? (
                        <img
                            src={mainImage.objectKey}
                            alt={product.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                            No image
                        </div>
                    )}
                </div>

                {images.length > 1 && (
                    <div className="mt-4 grid grid-cols-5 gap-3">
                        {[...images]
                            .sort(
                                (a, b) =>
                                    a.sortOrder - b.sortOrder
                            )
                            .map(image => (
                                <img
                                    key={image.id}
                                    src={image.objectKey}
                                    alt={image.fileName}
                                    className="aspect-square rounded-lg object-cover"
                                />
                            ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col justify-center">
                <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                    {product.categoryName}
                </p>

                <h1 className="mt-2 text-4xl font-bold text-gray-900">
                    {product.name}
                </h1>

                <p className="mt-5 text-3xl font-bold text-gray-900">
                    ₽{product.price.toLocaleString("ru-RU")}
                </p>

                <p className="mt-6 leading-7 text-gray-600">
                    {product.description}
                </p>

                <div className="mt-6">
                    <p className="text-sm text-gray-500">
                        {product.stockQuantity > 0
                            ? `${product.stockQuantity} available`
                            : "Out of stock"}
                    </p>
                </div>

                {product.stockQuantity > 0 && (
                    <div className="mt-8 flex items-center gap-4">
                        <input
                            type="number"
                            min={1}
                            max={product.stockQuantity}
                            value={quantity}
                            onChange={event =>
                                setQuantity(
                                    Math.min(
                                        Math.max(
                                            Number(event.target.value),
                                            1
                                        ),
                                        product.stockQuantity
                                    )
                                )
                            }
                            className="w-24 rounded-lg border border-gray-300 px-4 py-2.5"
                        />

                        <Button
                            type="button"
                            onClick={handleAdd}
                            loading={loading}
                        >
                            Add to cart
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}