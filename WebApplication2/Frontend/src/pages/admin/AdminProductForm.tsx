import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productService, categoryService, productImageService } from '../../services/product.service';
import { attributeService } from '../../services/attribute.service';
import { variantService } from '../../services/variant.service';
import { ProductImageResponseDto } from '../../types/product';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface ProductFormData {
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
    gender: string;
    styleId: string;
    occasionId: string;
    patternId: string;
}

interface ColorInput {
    name: string;
    hexCode: string;
    sizes: { name: string; stock: number }[];
}

interface MaterialComposition {
    materialId: string;
    percentage: number;
}

const FIXED_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SEASONS = ['All Season', 'Summer', 'Winter', 'Autumn', 'Spring'];
const AGE_GROUPS = ['Adult', 'Baby', 'Kids', 'Teen', 'Senior'];

export const AdminProductForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [colors, setColors] = useState<ColorInput[]>([]);
    const [newColorName, setNewColorName] = useState('');
    const [newColorHex, setNewColorHex] = useState('#000000');
    const [materialCompositions, setMaterialCompositions] = useState<MaterialComposition[]>([]);
    const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
    const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<ProductImageResponseDto[]>([]);
    const [deletedImages, setDeletedImages] = useState<number[]>([]);
    const [imageColorAssignments, setImageColorAssignments] = useState<Record<number, string>>({});
    const [newImageColorAssignments, setNewImageColorAssignments] = useState<Record<number, string>>({});
    const [showColorPickerFor, setShowColorPickerFor] = useState<number | null>(null);
    const [showNewColorPickerFor, setShowNewColorPickerFor] = useState<number | null>(null);
    const [expandedExistingImage, setExpandedExistingImage] = useState<number | null>(null);
    const [expandedNewImage, setExpandedNewImage] = useState<number | null>(null);

    const { register, handleSubmit, reset } = useForm<ProductFormData>();

    const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: async () => (await categoryService.getAll()).data });
    const { data: materials } = useQuery({ queryKey: ['materials'], queryFn: async () => (await attributeService.getMaterials()).data });
    const { data: styles } = useQuery({ queryKey: ['styles'], queryFn: async () => (await attributeService.getStyles()).data });
    const { data: occasions } = useQuery({ queryKey: ['occasions'], queryFn: async () => (await attributeService.getOccasions()).data });
    const { data: patterns } = useQuery({ queryKey: ['patterns'], queryFn: async () => (await attributeService.getPatterns()).data });
    const { data: product, isLoading: productLoading } = useQuery({ queryKey: ['product', id], queryFn: async () => (await productService.getById(Number(id))).data, enabled: isEdit });
    const { data: existingColors } = useQuery({ queryKey: ['product-colors', id], queryFn: async () => (await variantService.getColors(Number(id))).data, enabled: isEdit });
    const { data: existingVariants } = useQuery({ queryKey: ['product-variants', id], queryFn: async () => (await variantService.getVariants(Number(id))).data, enabled: isEdit });

    useEffect(() => {
        if (product) {
            reset({
                name: product.name,
                description: product.description || '',
                price: product.price,
                stockQuantity: product.stockQuantity,
                categoryId: product.categoryId,
                gender: product.gender !== undefined && product.gender !== null ? String(product.gender) : '',
                styleId: product.styleId ? String(product.styleId) : '',
                occasionId: product.occasionId ? String(product.occasionId) : '',
                patternId: product.patternId ? String(product.patternId) : '',
            });
            setExistingImages(product.images || []);

            if (product.seasonsJson) {
                try { const parsed = JSON.parse(product.seasonsJson); if (Array.isArray(parsed)) setSelectedSeasons(parsed); } catch { }
            }
            if (product.ageGroupsJson) {
                try { const parsed = JSON.parse(product.ageGroupsJson); if (Array.isArray(parsed)) setSelectedAgeGroups(parsed); } catch { }
            }
            if (product.materialCompositionJson) {
                try {
                    const parsed = JSON.parse(product.materialCompositionJson);
                    if (Array.isArray(parsed)) {
                        setMaterialCompositions(parsed.map((m: any) => ({ materialId: String(m.materialId), percentage: m.percentage || 0 })));
                    }
                } catch { }
            }
        }
    }, [product, reset]);

    useEffect(() => {
        if (existingColors) {
            const colorsWithSizes = existingColors.map(c => {
                const sizesForColor = existingVariants?.filter(v => v.colorId === c.id).map(v => ({ name: v.sizeName, stock: v.stockQuantity })) || [];
                return { name: c.name, hexCode: c.hexCode, sizes: sizesForColor };
            });
            setColors(colorsWithSizes);
        }
    }, [existingColors, existingVariants]);

    useEffect(() => {
        if (existingImages && existingColors) {
            const assignments: Record<number, string> = {};
            for (const image of existingImages) {
                if (image.colorId) {
                    const color = existingColors.find(c => c.id === image.colorId);
                    if (color) assignments[image.id] = color.hexCode;
                }
            }
            setImageColorAssignments(assignments);
        }
    }, [existingImages, existingColors]);

    const saveColorsAndVariants = async (productId: number) => {
        try {
            const currentColorsResponse = await variantService.getColors(productId);
            const currentColorHexes = new Set(colors.map(c => c.hexCode));
            for (const existingColor of currentColorsResponse.data) {
                if (!currentColorHexes.has(existingColor.hexCode)) await variantService.deleteColor(productId, existingColor.id);
            }
            const refreshedColorsResponse = await variantService.getColors(productId);
            for (const color of colors) {
                let colorId = refreshedColorsResponse.data.find(c => c.hexCode === color.hexCode)?.id;
                if (!colorId) { const created = await variantService.createColor(productId, { name: color.name, hexCode: color.hexCode }); colorId = created.data.id; }
                const currentVariantsResponse = await variantService.getVariants(productId);
                for (const variant of currentVariantsResponse.data.filter(v => v.colorId === colorId)) await variantService.deleteVariant(productId, variant.id);
                for (const sizeInfo of color.sizes) {
                    const sizesResponse = await variantService.getSizes(productId);
                    let sizeId = sizesResponse.data.find(s => s.name === sizeInfo.name)?.id;
                    if (!sizeId) { const createdSize = await variantService.createSize(productId, { name: sizeInfo.name }); sizeId = createdSize.data.id; }
                    if (sizeId && colorId) {
                        await variantService.createVariant(productId, { colorId, sizeId, stockQuantity: sizeInfo.stock || 0, sku: `${productId}-${colorId}-${sizeId}` });
                    }
                }
            }
        } catch (e) { console.log('Save colors failed:', e); }
    };

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await productService.create({ ...data, seasonsJson: JSON.stringify(selectedSeasons), ageGroupsJson: JSON.stringify(selectedAgeGroups), materialCompositionJson: JSON.stringify(materialCompositions.map(m => ({ materialId: Number(m.materialId), percentage: m.percentage }))) });
            const productId = response.data.id;
            await saveColorsAndVariants(productId);
            const refreshedColorsResponse = await variantService.getColors(productId);
            for (let i = 0; i < imageFiles.length; i++) {
                const uploadResponse = await productImageService.upload(productId, imageFiles[i]);
                const imageId = uploadResponse.data.id;
                const colorHex = newImageColorAssignments[i];
                if (colorHex) { const matchedColor = refreshedColorsResponse.data.find(c => c.hexCode === colorHex); if (matchedColor) await productImageService.updateColor(productId, imageId, matchedColor.id); }
            }
            return response;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); navigate('/admin/products'); },
        onError: (err: any) => { setError(err.response?.data?.error || err.message || 'Failed'); setShowErrorModal(true); },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            await productService.update(Number(id), { ...data, seasonsJson: JSON.stringify(selectedSeasons), ageGroupsJson: JSON.stringify(selectedAgeGroups), materialCompositionJson: JSON.stringify(materialCompositions.map(m => ({ materialId: Number(m.materialId), percentage: m.percentage }))) });
            await saveColorsAndVariants(Number(id));
            for (const imageId of deletedImages) await productImageService.delete(Number(id), imageId);
            const refreshedColorsResponse = await variantService.getColors(Number(id));
            for (const [imageIdStr, colorHex] of Object.entries(imageColorAssignments)) {
                const imageId = Number(imageIdStr);
                if (!deletedImages.includes(imageId) && colorHex) { const matchedColor = refreshedColorsResponse.data.find(c => c.hexCode === colorHex); if (matchedColor) await productImageService.updateColor(Number(id), imageId, matchedColor.id); }
            }
            for (let i = 0; i < imageFiles.length; i++) {
                const uploadResponse = await productImageService.upload(Number(id), imageFiles[i]);
                const imageId = uploadResponse.data.id;
                const colorHex = newImageColorAssignments[i];
                if (colorHex) { const matchedColor = refreshedColorsResponse.data.find(c => c.hexCode === colorHex); if (matchedColor) await productImageService.updateColor(Number(id), imageId, matchedColor.id); }
            }
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); queryClient.invalidateQueries({ queryKey: ['product', id] }); queryClient.invalidateQueries({ queryKey: ['product-colors', id] }); queryClient.invalidateQueries({ queryKey: ['product-variants', id] }); navigate('/admin/products'); },
        onError: (err: any) => { setError(err.response?.data?.error || err.message || 'Failed'); setShowErrorModal(true); },
    });

    const onSubmit = async (data: ProductFormData) => {
        const totalMaterialPercentage = materialCompositions.reduce((sum, m) => sum + (m.percentage || 0), 0);
        if (materialCompositions.length > 0 && totalMaterialPercentage !== 100) {
            setError('Material percentages must total 100%');
            setShowErrorModal(true);
            return;
        }

        for (const color of colors) {
            const hasImage = existingImages.some(img =>
                !deletedImages.includes(img.id) &&
                imageColorAssignments[img.id] === color.hexCode
            ) || imageFiles.some((_, index) =>
                newImageColorAssignments[index] === color.hexCode
            );

            if (!hasImage) {
                setError(`Color "${color.name}" must have at least 1 image assigned`);
                setShowErrorModal(true);
                return;
            }
        }

        const formData = {
            name: data.name, description: data.description, price: Number(data.price), stockQuantity: Number(data.stockQuantity),
            categoryId: Number(data.categoryId), gender: data.gender === '' ? null : Number(data.gender),
            styleId: data.styleId === '' ? null : Number(data.styleId), occasionId: data.occasionId === '' ? null : Number(data.occasionId),
            patternId: data.patternId === '' ? null : Number(data.patternId),
            season: selectedSeasons.length > 0 ? SEASONS.indexOf(selectedSeasons[0]) : null,
            ageGroup: selectedAgeGroups.length > 0 ? AGE_GROUPS.indexOf(selectedAgeGroups[0]) : null,
        };
        if (isEdit) updateMutation.mutate(formData); else createMutation.mutate(formData);
    };

    const addColor = () => { if (newColorName.trim() || newColorHex) { setColors([...colors, { name: newColorName || newColorHex, hexCode: newColorHex, sizes: [] }]); setNewColorName(''); setNewColorHex('#000000'); } };
    const removeColor = (index: number) => setColors(colors.filter((_, i) => i !== index));
    const toggleSizeForColor = (colorIndex: number, size: string) => {
        const updatedColors = [...colors];
        if (updatedColors[colorIndex].sizes.some(s => s.name === size)) updatedColors[colorIndex].sizes = updatedColors[colorIndex].sizes.filter(s => s.name !== size);
        else updatedColors[colorIndex].sizes = [...updatedColors[colorIndex].sizes, { name: size, stock: 0 }];
        setColors(updatedColors);
    };
    const updateSizeStock = (colorIndex: number, sizeName: string, stock: number) => {
        const updatedColors = [...colors];
        const sizeInfo = updatedColors[colorIndex].sizes.find(s => s.name === sizeName);
        if (sizeInfo) sizeInfo.stock = stock;
        setColors(updatedColors);
    };
    const addMaterialComposition = () => setMaterialCompositions([...materialCompositions, { materialId: '', percentage: 0 }]);
    const removeMaterialComposition = (index: number) => setMaterialCompositions(materialCompositions.filter((_, i) => i !== index));
    const updateMaterialComposition = (index: number, field: 'materialId' | 'percentage', value: string) => {
        const updated = [...materialCompositions];
        updated[index] = { ...updated[index], [field]: field === 'percentage' ? Number(value) : value };
        setMaterialCompositions(updated);
    };
    const toggleSeason = (season: string) => {
        if (season === 'All Season') { if (selectedSeasons.includes('All Season')) setSelectedSeasons([]); else setSelectedSeasons(['All Season']); return; }
        if (selectedSeasons.includes('All Season')) { setSelectedSeasons([season]); return; }
        if (selectedSeasons.includes(season)) setSelectedSeasons(selectedSeasons.filter(s => s !== season));
        else setSelectedSeasons([...selectedSeasons, season]);
    };
    const toggleAgeGroup = (ageGroup: string) => {
        if (selectedAgeGroups.includes(ageGroup)) setSelectedAgeGroups(selectedAgeGroups.filter(a => a !== ageGroup));
        else setSelectedAgeGroups([...selectedAgeGroups, ageGroup]);
    };

    const totalMaterialPercentage = materialCompositions.reduce((sum, m) => sum + (m.percentage || 0), 0);
    const availableMaterials = materials?.filter(m => !materialCompositions.some(mc => Number(mc.materialId) === m.id)) || [];

    if (productLoading && isEdit) return <LoadingSpinner />;

    return (
        <div className="admin-form-page">
            <button onClick={() => navigate('/admin/products')} className="btn btn-outline back-btn">← Back</button>
            <h1>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="admin-form">
                <div className="form-group"><label>Product Name</label><input type="text" {...register('name', { required: true })} /></div>
                <div className="form-group"><label>Description</label><textarea rows={4} {...register('description')} /></div>
                <div className="form-row">
                    <div className="form-group"><label>Price</label><input type="number" step="0.01" {...register('price', { required: true })} /></div>
                    <div className="form-group"><label>Total Stock</label><input type="number" {...register('stockQuantity', { required: true })} /></div>
                    <div className="form-group"><label>Category</label><select {...register('categoryId', { required: true })}><option value="">Select</option>{categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                </div>

                <div className="form-row">
                    <div className="form-group"><label>Gender (optional)</label><select {...register('gender')}><option value="">None</option><option value="0">Unisex</option><option value="1">Men</option><option value="2">Women</option></select></div>
                </div>

                <div className="form-group">
                    <label>Season (optional)</label>
                    <div className="multi-select-tags">{SEASONS.map((season) => <button key={season} type="button" onClick={() => toggleSeason(season)} className={`size-btn ${selectedSeasons.includes(season) ? 'active' : ''}`}>{season}</button>)}</div>
                </div>

                <div className="form-group">
                    <label>Age Group (optional)</label>
                    <div className="multi-select-tags">{AGE_GROUPS.map((age) => <button key={age} type="button" onClick={() => toggleAgeGroup(age)} className={`size-btn ${selectedAgeGroups.includes(age) ? 'active' : ''}`}>{age}</button>)}</div>
                </div>

                <div className="form-group">
                    <label>Material Composition (optional)</label>
                    {materialCompositions.map((mat, index) => (
                        <div key={index} className="material-composition-row">
                            <select value={mat.materialId} onChange={(e) => updateMaterialComposition(index, 'materialId', e.target.value)} className="sort-select">
                                <option value="">Select material</option>
                                {availableMaterials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                {mat.materialId && materials?.find(m => m.id === Number(mat.materialId)) && <option value={mat.materialId}>{materials.find(m => m.id === Number(mat.materialId))?.name}</option>}
                            </select>
                            <input type="number" min="0" max="100" value={mat.percentage || ''} onChange={(e) => updateMaterialComposition(index, 'percentage', e.target.value)} className="price-input" placeholder="%" />
                            <button type="button" onClick={() => removeMaterialComposition(index)} className="remove-color-btn">✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={addMaterialComposition} className="btn btn-outline btn-small">+ Add Material</button>
                    {materialCompositions.length > 0 && <p className={totalMaterialPercentage === 100 ? 'material-total-ok' : 'material-total-error'}>Total: {totalMaterialPercentage}% {totalMaterialPercentage !== 100 && '(must be 100%)'}</p>}
                </div>

                <div className="form-row">
                    <div className="form-group"><label>Style (optional)</label><select {...register('styleId')}><option value="">None</option>{styles?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    <div className="form-group"><label>Occasion (optional)</label><select {...register('occasionId')}><option value="">None</option>{occasions?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                    <div className="form-group"><label>Pattern (optional)</label><select {...register('patternId')}><option value="">None</option>{patterns?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                </div>

                <div className="form-group">
                    <label>Colors with Sizes and Stock</label>
                    {colors.map((color, colorIndex) => (
                        <div key={colorIndex} className="color-size-section">
                            <div className="color-tag-row"><span className="color-dot" style={{ backgroundColor: color.hexCode }} /><span>{color.name}</span><button type="button" onClick={() => removeColor(colorIndex)} className="remove-color-btn">✕</button></div>
                            <div className="color-size-stock-grid">
                                {FIXED_SIZES.map((size) => {
                                    const sizeInfo = color.sizes.find(s => s.name === size); return (
                                        <div key={size} className="size-stock-row">
                                            <button type="button" onClick={() => toggleSizeForColor(colorIndex, size)} className={`size-tag ${sizeInfo ? 'active' : ''}`}>{size}</button>
                                            {sizeInfo && <input type="number" min="0" placeholder="Stock" value={sizeInfo.stock || ''} onChange={(e) => updateSizeStock(colorIndex, size, Number(e.target.value))} className="stock-input-small" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    <div className="color-add-row">
                        <input type="text" placeholder="Color name" value={newColorName} onChange={(e) => setNewColorName(e.target.value)} className="search-input" />
                        <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} className="color-picker-input" />
                        <button type="button" onClick={addColor} className="btn btn-outline btn-small">Add Color</button>
                    </div>
                </div>

                {isEdit && existingImages.length > 0 && (
                    <div className="form-group">
                        <label>Existing Images</label>
                        <div className="existing-images-grid">
                            {existingImages.map((image) => {
                                const assignedHex = imageColorAssignments[image.id];
                                const assignedColor = assignedHex ? colors.find(c => c.hexCode === assignedHex) : null;
                                const isDeleted = deletedImages.includes(image.id);
                                return (
                                    <div key={image.id} className="existing-image-wrapper">
                                        <div className={`existing-image-item ${isDeleted ? 'marked-delete' : ''}`}>
                                            <img src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${id}/images/${image.id}`} alt={image.fileName} onClick={() => !isDeleted && setExpandedExistingImage(image.id)} style={{ cursor: 'pointer' }} />
                                            <button type="button" onClick={() => { if (deletedImages.includes(image.id)) setDeletedImages(deletedImages.filter(i => i !== image.id)); else setDeletedImages([...deletedImages, image.id]); }} className="delete-image-btn">{isDeleted ? '↩' : '🗑️'}</button>
                                        </div>
                                        <button type="button" onClick={() => !isDeleted && colors.length > 0 && setShowColorPickerFor(image.id)} className={`image-color-display ${colors.length === 0 || isDeleted ? 'disabled' : ''}`} disabled={colors.length === 0 || isDeleted}>
                                            {assignedColor ? <><span className="color-dot-small" style={{ backgroundColor: assignedColor.hexCode }} />{assignedColor.name}</> : 'Select Color'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label>Upload New Images</label>
                    <input type="file" accept="image/*" multiple onChange={(e) => { const files = Array.from(e.target.files || []); setImageFiles(files); setPreviewUrls(files.map(file => URL.createObjectURL(file))); }} className="file-input" />
                    {previewUrls.length > 0 && (
                        <div className="new-images-preview">
                            {previewUrls.map((url, index) => {
                                const assignedHex = newImageColorAssignments[index];
                                const assignedColor = assignedHex ? colors.find(c => c.hexCode === assignedHex) : null;
                                return (
                                    <div key={index} className="new-image-wrapper">
                                        <div className="new-image-item">
                                            <img src={url} alt={`Preview ${index + 1}`} onClick={() => setExpandedNewImage(index)} style={{ cursor: 'pointer' }} />
                                            <button type="button" onClick={() => { setImageFiles(imageFiles.filter((_, i) => i !== index)); setPreviewUrls(previewUrls.filter((_, i) => i !== index)); }} className="delete-image-btn">✕</button>
                                        </div>
                                        <button type="button" onClick={() => colors.length > 0 && setShowNewColorPickerFor(index)} className={`image-color-display ${colors.length === 0 ? 'disabled' : ''}`} disabled={colors.length === 0}>
                                            {assignedColor ? <><span className="color-dot-small" style={{ backgroundColor: assignedColor.hexCode }} />{assignedColor.name}</> : 'Select Color'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">{isEdit ? 'Update Product' : 'Create Product'}</button>
                    <button type="button" onClick={() => navigate('/admin/products')} className="btn btn-outline">Cancel</button>
                </div>
            </form>

            {showErrorModal && (
                <div className="modal-overlay" onClick={() => setShowErrorModal(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><h3>Error</h3><p>{error}</p><div className="modal-actions"><button onClick={() => setShowErrorModal(false)} className="btn btn-primary">OK</button></div></div></div>
            )}

            {showColorPickerFor !== null && colors.length > 0 && (
                <div className="modal-overlay" onClick={() => setShowColorPickerFor(null)}><div className="modal" onClick={(e) => e.stopPropagation()}><h3>Assign Color</h3><div className="color-list-options">{colors.map((color) => <button key={color.hexCode} onClick={() => { setImageColorAssignments(prev => ({ ...prev, [showColorPickerFor]: color.hexCode })); setShowColorPickerFor(null); }} className={`color-list-option ${imageColorAssignments[showColorPickerFor] === color.hexCode ? 'active' : ''}`}><span className="color-dot" style={{ backgroundColor: color.hexCode }} />{color.name}</button>)}</div></div></div>
            )}

            {showNewColorPickerFor !== null && colors.length > 0 && (
                <div className="modal-overlay" onClick={() => setShowNewColorPickerFor(null)}><div className="modal" onClick={(e) => e.stopPropagation()}><h3>Assign Color</h3><div className="color-list-options">{colors.map((color) => <button key={color.hexCode} onClick={() => { setNewImageColorAssignments(prev => ({ ...prev, [showNewColorPickerFor]: color.hexCode })); setShowNewColorPickerFor(null); }} className={`color-list-option ${newImageColorAssignments[showNewColorPickerFor] === color.hexCode ? 'active' : ''}`}><span className="color-dot" style={{ backgroundColor: color.hexCode }} />{color.name}</button>)}</div></div></div>
            )}

            {expandedExistingImage !== null && existingImages.length > 0 && (
                <div className="media-overlay" onClick={() => setExpandedExistingImage(null)}>
                    <div className="media-expanded" onClick={(e) => e.stopPropagation()}>
                        <button className="media-close" onClick={() => setExpandedExistingImage(null)}>✕</button>
                        <button className="media-nav prev" onClick={() => { const idx = existingImages.findIndex(img => img.id === expandedExistingImage); if (idx > 0) setExpandedExistingImage(existingImages[idx - 1].id); }}>‹</button>
                        <img src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${id}/images/${expandedExistingImage}`} alt="Product" className="media-image" />
                        <button className="media-nav next" onClick={() => { const idx = existingImages.findIndex(img => img.id === expandedExistingImage); if (idx < existingImages.length - 1) setExpandedExistingImage(existingImages[idx + 1].id); }}>›</button>
                    </div>
                </div>
            )}

            {expandedNewImage !== null && previewUrls.length > 0 && (
                <div className="media-overlay" onClick={() => setExpandedNewImage(null)}>
                    <div className="media-expanded" onClick={(e) => e.stopPropagation()}>
                        <button className="media-close" onClick={() => setExpandedNewImage(null)}>✕</button>
                        <button className="media-nav prev" onClick={() => { if (expandedNewImage > 0) setExpandedNewImage(expandedNewImage - 1); }}>‹</button>
                        <img src={previewUrls[expandedNewImage]} alt="Preview" className="media-image" />
                        <button className="media-nav next" onClick={() => { if (expandedNewImage < previewUrls.length - 1) setExpandedNewImage(expandedNewImage + 1); }}>›</button>
                    </div>
                </div>
            )}
        </div>
    );
};