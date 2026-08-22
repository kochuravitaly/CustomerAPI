import { useState } from "react";
import type { ProductImage } from "../../types/products";

interface ProductImageGalleryProps {
    images: ProductImage[];
    productName: string;
}

export default function ProductImageGallery({
    images,
    productName
}: ProductImageGalleryProps) {
    const sortedImages = [...images].sort(
        (a, b) => a.sortOrder - b.sortOrder
    );

    const [selectedIndex, setSelectedIndex] = useState(0);

    if (sortedImages.length === 0) {
        return (
            <div className="flex aspect-square items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                No image
            </div>
        );
    }

    const selectedImage =
        sortedImages[selectedIndex] ?? sortedImages[0];

    return (
        <div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
                <img
                    src={selectedImage.objectKey}
                    alt={productName}
                    className="h-full w-full object-cover"
                />
            </div>

            {sortedImages.length > 1 && (
                <div className="mt-4 grid grid-cols-5 gap-3">
                    {sortedImages.map((image, index) => (
                        <button
                            key={image.id}
                            type="button"
                            onClick={() => setSelectedIndex(index)}
                            className={`overflow-hidden rounded-lg border-2 ${index === selectedIndex
                                    ? "border-gray-900"
                                    : "border-transparent"
                                }`}
                        >
                            <img
                                src={image.objectKey}
                                alt={image.fileName}
                                className="aspect-square w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}