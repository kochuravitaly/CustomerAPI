import { useState } from "react";
import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";
import { useProduct } from "../hooks/useProduct";
import { useCart } from "../hooks/useCart";
import { formatCurrency } from "../utils/formatCurrency";
import { getProductImageUrl } from "../utils/productImageUrl";

export default function ProductPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const productId = Number(id);

    const {
        product,
        isLoading,
        error,
    } = useProduct(
        Number.isInteger(productId)
            ? productId
            : undefined
    );

    const { addItem } = useCart();

    const [quantity, setQuantity] =
        useState(1);

    const [adding, setAdding] =
        useState(false);

    const [cartMessage, setCartMessage] =
        useState("");

    const [selectedImage, setSelectedImage] =
        useState(0);

    async function handleAddToCart() {
        if (!product) {
            return;
        }

        setAdding(true);
        setCartMessage("");

        try {
            await addItem({
                productId: product.id,
                quantity,
            });

            setCartMessage("Added to cart.");
        } catch (err) {
            setCartMessage(
                err instanceof Error
                    ? err.message
                    : "Unable to add product to cart."
            );
        } finally {
            setAdding(false);
        }
    }

    if (isLoading) {
        return (
            <main className="min-h-screen bg-slate-50 p-10">
                <div className="mx-auto h-96 max-w-6xl animate-pulse rounded-3xl bg-slate-200" />
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-16 text-center">
                <h1 className="text-3xl font-bold text-slate-900">
                    Product not found
                </h1>

                <p className="mt-2 text-slate-500">
                    {error ?? "The requested product does not exist."}
                </p>

                <Link
                    to="/products"
                    className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
                >
                    Back to products
                </Link>
            </main>
        );
    }

    const images = [...(product.images ?? [])].sort(
        (a, b) => {
            if (a.isMain && !b.isMain) {
                return -1;
            }

            if (!a.isMain && b.isMain) {
                return 1;
            }

            return a.sortOrder - b.sortOrder;
        }
    );

    const activeImage =
        images[selectedImage];

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <Link
                    to="/products"
                    className="mb-8 inline-block text-sm font-semibold text-slate-500 hover:text-slate-900"
                >
                    ← Back to products
                </Link>

                <div className="grid gap-10 lg:grid-cols-2">
                    <div>
                        <div className="aspect-square overflow-hidden rounded-3xl bg-white">
                            {activeImage ? (
                                <img
                                    src={getProductImageUrl(
                                        activeImage
                                    )}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-slate-400">
                                    No image available
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="mt-4 grid grid-cols-5 gap-3">
                                {images.map(
                                    (image, index) => (
                                        <button
                                            type="button"
                                            key={image.id}
                                            onClick={() =>
                                                setSelectedImage(
                                                    index
                                                )
                                            }
                                            className={`aspect-square overflow-hidden rounded-xl border-2 ${selectedImage ===
                                                    index
                                                    ? "border-slate-900"
                                                    : "border-transparent"
                                                }`}
                                        >
                                            <img
                                                src={getProductImageUrl(
                                                    image
                                                )}
                                                alt={`${product.name} ${index + 1}`}
                                                className="h-full w-full object-cover"
                                            />
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col justify-center">
                        <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                            {product.categoryName}
                        </p>

                        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                            {product.name}
                        </h1>

                        <p className="mt-6 text-3xl font-bold text-slate-900">
                            {formatCurrency(product.price)}
                        </p>

                        <p className="mt-6 leading-7 text-slate-600">
                            {product.description ??
                                "No description available."}
                        </p>

                        <div className="mt-8 rounded-2xl bg-white p-5">
                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    Availability
                                </span>

                                <span className="font-semibold text-slate-900">
                                    {product.stockQuantity > 0
                                        ? `${product.stockQuantity} available`
                                        : "Out of stock"}
                                </span>
                            </div>
                        </div>

                        {product.stockQuantity > 0 && (
                            <div className="mt-6 flex gap-3">
                                <div className="flex items-center rounded-xl border border-slate-300 bg-white">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setQuantity(
                                                Math.max(
                                                    1,
                                                    quantity - 1
                                                )
                                            )
                                        }
                                        className="px-4 py-3"
                                    >
                                        −
                                    </button>

                                    <span className="w-10 text-center font-semibold">
                                        {quantity}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setQuantity(
                                                Math.min(
                                                    product.stockQuantity,
                                                    quantity + 1
                                                )
                                            )
                                        }
                                        className="px-4 py-3"
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={adding}
                                    className="flex-1 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                                >
                                    {adding
                                        ? "Adding..."
                                        : "Add to cart"}
                                </button>
                            </div>
                        )}

                        {cartMessage && (
                            <p className="mt-4 text-sm font-medium text-slate-700">
                                {cartMessage}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/cart")
                            }
                            className="mt-4 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50"
                        >
                            View cart
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}