import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/product.service';
import { ProductResponseDto } from '../../types/product';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Pagination } from '../../components/Pagination';

export const AdminProducts: React.FC = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const { data: productsData, isLoading } = useQuery({
        queryKey: ['admin-products', page, search],
        queryFn: async () => {
            const response = await productService.getAll({
                page,
                pageSize: 10,
                search: search || undefined,
                sortBy: 'createdAt',
                sortDirection: 'desc',
            });
            return response.data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => productService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            setDeleteConfirm(null);
        },
    });

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="admin-products">
            <div className="admin-header">
                <h1>Manage Products</h1>
                <Link to="/admin/products/new" className="btn btn-primary">
                    + Add Product
                </Link>
            </div>

            <div className="admin-search">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="search-input"
                />
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productsData?.items.map((product: ProductResponseDto) => {
                            const mainImage = product.images.find(img => img.isMain) || product.images[0];

                            return (
                                <tr key={product.id}>
                                    <td>{product.id}</td>
                                    <td>
                                        {mainImage ? (
                                            <img
                                                src={`${import.meta.env.VITE_API_URL}/api/products/${product.id}/images/${mainImage.id}`}
                                                alt={product.name}
                                                className="admin-product-thumbnail"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50x50?text=No+Image';
                                                }}
                                            />
                                        ) : (
                                            <div className="admin-thumbnail-placeholder">No Img</div>
                                        )}
                                    </td>
                                    <td>{product.name}</td>
                                    <td>{product.categoryName}</td>
                                    <td>${product.price.toFixed(2)}</td>
                                    <td>
                                        <span className={product.stockQuantity > 0 ? 'stock-in' : 'stock-out'}>
                                            {product.stockQuantity}
                                        </span>
                                    </td>
                                    <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <Link
                                                to={`/admin/products/${product.id}/edit`}
                                                className="btn btn-small btn-outline"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => setDeleteConfirm(product.id)}
                                                className="btn btn-small btn-danger"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {productsData && (
                <Pagination
                    currentPage={productsData.page}
                    totalPages={productsData.totalPages}
                    onPageChange={setPage}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Confirm Delete</h3>
                        <p>Are you sure you want to delete this product?</p>
                        <div className="modal-actions">
                            <button
                                onClick={() => deleteMutation.mutate(deleteConfirm)}
                                className="btn btn-danger"
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="btn btn-outline"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};