import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/product.service';
import { ProductResponseDto } from '../../types/product';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Pagination } from '../../components/Pagination';

export const AdminProducts: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const { data: productsData, isLoading } = useQuery({
        queryKey: ['admin-products', page, search, sortBy, sortDirection],
        queryFn: async () => {
            const response = await productService.getAll({
                page,
                pageSize: 10,
                search: search || undefined,
                sortBy,
                sortDirection,
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
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← Back</button>

            <h2>Manage Products</h2>

            <div className="admin-search-row">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="search-input"
                />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                    <option value="id">ID</option>
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="stockQuantity">Stock</option>
                </select>
                <select value={sortDirection} onChange={(e) => setSortDirection(e.target.value)} className="sort-select">
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                </select>
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
                                                src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${mainImage.id}`}
                                                alt={product.name}
                                                className="admin-product-thumbnail"
                                            />
                                        ) : (
                                            <div className="admin-thumbnail-placeholder">🛍️</div>
                                        )}
                                    </td>
                                    <td>{product.name}</td>
                                    <td>{product.categoryName}</td>
                                    <td>${product.price.toFixed(2)}</td>
                                    <td>{product.stockQuantity}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <Link to={`/admin/products/${product.id}/edit`} className="btn btn-small btn-outline">Edit</Link>
                                            <button onClick={() => setDeleteConfirm(product.id)} className="btn btn-small btn-danger">Delete</button>
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

            {deleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Confirm Delete</h3>
                        <p>Are you sure?</p>
                        <div className="modal-actions">
                            <button onClick={() => deleteMutation.mutate(deleteConfirm)} className="btn btn-danger">Delete</button>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};