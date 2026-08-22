interface Category {
    id: number;
    name: string;
}

interface CategorySidebarProps {
    categories: Category[];
    selectedCategoryId?: number;
    onSelect: (categoryId?: number) => void;
}

export default function CategorySidebar({
    categories,
    selectedCategoryId,
    onSelect
}: CategorySidebarProps) {
    return (
        <aside className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Categories
            </h2>

            <div className="space-y-1">
                <button
                    type="button"
                    onClick={() => onSelect(undefined)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${selectedCategoryId === undefined
                            ? "bg-gray-900 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                >
                    All products
                </button>

                {categories.map(category => (
                    <button
                        key={category.id}
                        type="button"
                        onClick={() => onSelect(category.id)}
                        className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${selectedCategoryId === category.id
                                ? "bg-gray-900 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
        </aside>
    );
}