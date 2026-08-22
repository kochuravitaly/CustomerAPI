import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productService, categoryService, productImageService } from '../../services/product.service';
import { CreateProductDto, UpdateProductDto } from '../../types/product';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface ProductFormData {
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
}

export const AdminProductForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ProductFormData>();

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await categoryService.getAll();
            return response.data;
        },
    });

    const { data: product, isLoading: productLoading } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            const response = await productService.getById(Number(id));
            return response.data;
        },
        enabled: isEdit,
    });

    useEffect(() => {
        if (product) {
            reset({
                name: product.name,
                description: product.description || '',
                price: product.price,
                stockQuantity: product.stockQuantity,
                categoryId: product.categoryId,
            });
        }
    }, [product, reset]);

    const createMutation = useMutation({
        mutationFn: (data: CreateProductDto) => productService.create(data),
        onSuccess: async (response) => {
            if (imageFile) {
                await handleImageUpload(response.data.id);
            }
            queryClient.invalidateQueries({ queryKey: ['products'] });
            navigate('/admin/products');
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to create product');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateProductDto) =>
            productService.update(Number(id), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            navigate('/admin/products');
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to update product');
        },
    });

    const handleImageUpload = async (productId: number) => {
        if (imageFile) {
            try {
                await productImageService.upload(productId, imageFile);
            } catch (err) {
                console.error('Failed to upload image:', err);
            }
        }
    };

    const onSubmit = async (data: ProductFormData) => {
        setError('');
        const formData = {
            ...data,
            price: Number(data.price),
            stockQuantity: Number(data.stockQuantity),
            categoryId: Number(data.categoryId),
        };

        if (isEdit) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    if (productLoading && isEdit) return <LoadingSpinner />;

    return (
        <div className="admin-form-page">
            <h1>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="admin-form">
                <div className="form-group">
                    <label htmlFor="name">Product Name</label>
                    <input
                        id="name"
                        type="text"
                        {...register('name', {
                            required: 'Name is required',
                            maxLength: {
                                value: 200,
                                message: 'Name must be less than 200 characters',
                            },
                        })}
                        className={errors.name ? 'input-error' : ''}
                    />
                    {errors.name && <span className="error-text">{errors.name.message}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        rows={5}
                        {...register('description', {
                            maxLength: {
                                value: 2000,
                                message: 'Description must be less than 2000 characters',
                            },
                        })}
                        className={errors.description ? 'input-error' : ''}
                    />
                    {errors.description && (
                        <span className="error-text">{errors.description.message}</span>
                    )}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="price">Price</label>
                        <input
                            id="price"
                            type="number"
                            step="0.01"
                            {...register('price', {
                                required: 'Price is required',
                                min: {
                                    value: 0.01,
                                    message: 'Price must be greater than 0',
                                },
                            })}
                            className={errors.price ? 'input-error' : ''}
                        />
                        {errors.price && <span className="error-text">{errors.price.message}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="stockQuantity">Stock Quantity</label>
                        <input
                            id="stockQuantity"
                            type="number"
                            {...register('stockQuantity', {
                                required: 'Stock quantity is required',
                                min: {
                                    value: 0,
                                    message: 'Stock must be 0 or greater',
                                },
                            })}
                            className={errors.stockQuantity ? 'input-error' : ''}
                        />
                        {errors.stockQuantity && (
                            <span className="error-text">{errors.stockQuantity.message}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="categoryId">Category</label>
                        <select
                            id="categoryId"
                            {...register('categoryId', {
                                required: 'Category is required',
                            })}
                            className={errors.categoryId ? 'input-error' : ''}
                        >
                            <option value="">Select category</option>
                            {categories?.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        {errors.categoryId && (
                            <span className="error-text">{errors.categoryId.message}</span>
                        )}
                    </div>
                </div>

                {!isEdit && (
                    <div className="form-group">
                        <label htmlFor="image">Product Image</label>
                        <input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            className="file-input"
                        />
                    </div>
                )}

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={createMutation.isPending || updateMutation.isPending}
                    >
                        {createMutation.isPending || updateMutation.isPending
                            ? 'Saving...'
                            : isEdit
                                ? 'Update Product'
                                : 'Create Product'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/products')}
                        className="btn btn-outline"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};