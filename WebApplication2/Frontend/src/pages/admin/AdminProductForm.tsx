import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productService, categoryService, productImageService } from '../../services/product.service';
import { attributeService } from '../../services/attribute.service';
import { CreateProductDto, UpdateProductDto } from '../../types/product';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface ProductFormData {
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
    gender: number;
    season: number;
    ageGroup: number;
    materialId?: number;
    styleId?: number;
    occasionId?: number;
    patternId?: number;
}

export const AdminProductForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ProductFormData>();

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await categoryService.getAll()).data,
    });

    const { data: materials } = useQuery({
        queryKey: ['materials'],
        queryFn: async () => (await attributeService.getMaterials()).data,
    });

    const { data: styles } = useQuery({
        queryKey: ['styles'],
        queryFn: async () => (await attributeService.getStyles()).data,
    });

    const { data: occasions } = useQuery({
        queryKey: ['occasions'],
        queryFn: async () => (await attributeService.getOccasions()).data,
    });

    const { data: patterns } = useQuery({
        queryKey: ['patterns'],
        queryFn: async () => (await attributeService.getPatterns()).data,
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
                gender: product.gender,
                season: product.season,
                ageGroup: product.ageGroup,
                materialId: product.materialId,
                styleId: product.styleId,
                occasionId: product.occasionId,
                patternId: product.patternId,
            });
        }
    }, [product, reset]);

    const createMutation = useMutation({
        mutationFn: (data: CreateProductDto) => productService.create(data),
        onSuccess: async (response) => {
            for (const file of imageFiles) {
                await productImageService.upload(response.data.id, file);
            }
            queryClient.invalidateQueries({ queryKey: ['products'] });
            navigate('/admin/products');
        },
        onError: (err: any) => setError(err.response?.data || 'Failed to create'),
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateProductDto) => productService.update(Number(id), data),
        onSuccess: async () => {
            for (const file of imageFiles) {
                await productImageService.upload(Number(id), file);
            }
            queryClient.invalidateQueries({ queryKey: ['products'] });
            navigate('/admin/products');
        },
        onError: (err: any) => setError(err.response?.data || 'Failed to update'),
    });

    const onSubmit = async (data: ProductFormData) => {
        setError('');
        const formData = {
            ...data,
            price: Number(data.price),
            stockQuantity: Number(data.stockQuantity),
            categoryId: Number(data.categoryId),
            gender: Number(data.gender),
            season: Number(data.season),
            ageGroup: Number(data.ageGroup),
            materialId: data.materialId ? Number(data.materialId) : undefined,
            styleId: data.styleId ? Number(data.styleId) : undefined,
            occasionId: data.occasionId ? Number(data.occasionId) : undefined,
            patternId: data.patternId ? Number(data.patternId) : undefined,
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
            <button onClick={() => navigate('/admin/products')} className="btn btn-outline back-btn">← Back</button>

            <h1>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="admin-form">
                <div className="form-group">
                    <label>Product Name</label>
                    <input type="text" {...register('name', { required: true })} />
                    {errors.name && <span className="error-text">Required</span>}
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea rows={4} {...register('description')} />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Price</label>
                        <input type="number" step="0.01" {...register('price', { required: true })} />
                    </div>
                    <div className="form-group">
                        <label>Stock</label>
                        <input type="number" {...register('stockQuantity', { required: true })} />
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select {...register('categoryId', { required: true })}>
                            <option value="">Select</option>
                            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Gender</label>
                        <select {...register('gender')}>
                            <option value={0}>Unisex</option>
                            <option value={1}>Men</option>
                            <option value={2}>Women</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Season</label>
                        <select {...register('season')}>
                            <option value={0}>All Season</option>
                            <option value={1}>Summer</option>
                            <option value={2}>Winter</option>
                            <option value={3}>Autumn</option>
                            <option value={4}>Spring</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Age Group</label>
                        <select {...register('ageGroup')}>
                            <option value={0}>Adult</option>
                            <option value={1}>Baby</option>
                            <option value={2}>Kids</option>
                            <option value={3}>Teen</option>
                            <option value={4}>Senior</option>
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Material</label>
                        <select {...register('materialId')}>
                            <option value="">None</option>
                            {materials?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Style</label>
                        <select {...register('styleId')}>
                            <option value="">None</option>
                            {styles?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Occasion</label>
                        <select {...register('occasionId')}>
                            <option value="">None</option>
                            {occasions?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Pattern</label>
                        <select {...register('patternId')}>
                            <option value="">None</option>
                            {patterns?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Product Images</label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                        className="file-input"
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        {isEdit ? 'Update Product' : 'Create Product'}
                    </button>
                    <button type="button" onClick={() => navigate('/admin/products')} className="btn btn-outline">Cancel</button>
                </div>
            </form>
        </div>
    );
};