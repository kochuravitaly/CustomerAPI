import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../../services/profile.service';
import { AddressDto, CreateAddressDto } from '../../types/address';
import { useLanguage } from '../../context/LanguageContext';
import { LoadingSpinner } from '../LoadingSpinner';
import { AddressAutocomplete } from '../address/AddressAutocomplete';

interface AddressSectionProps {
    autoOpenModal?: boolean;
}

export const AddressSection: React.FC<AddressSectionProps> = ({ autoOpenModal }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, language } = useLanguage();
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(autoOpenModal || false);
    const [editingAddress, setEditingAddress] = useState<AddressDto | null>(null);
    const [deleteConfirmAddress, setDeleteConfirmAddress] = useState<AddressDto | null>(null);
    const [showCountryCodes, setShowCountryCodes] = useState(false);
    const [phoneError, setPhoneError] = useState('');
    const [formData, setFormData] = useState<CreateAddressDto>({
        fullName: '',
        street: '',
        apartment: '',
        city: '',
        region: '',
        postalCode: '',
        country: '',
        phone: '',
        isDefault: false,
    });

    const returnToCheckout = location.state?.returnToCheckout;

    const countryCodes = [
        { code: '+7', country: 'Россия', flag: '🇷🇺' },
        { code: '+49', country: 'Deutschland', flag: '🇩🇪' },
        { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    ];

    const selectedCountryCode = countryCodes.find(cc => formData.phone.startsWith(cc.code)) || countryCodes[0];

    const { data: addresses, isLoading } = useQuery({
        queryKey: ['addresses'],
        queryFn: async () => (await profileService.getAddresses()).data,
    });

    useEffect(() => {
        if (autoOpenModal) {
            setShowModal(true);
        }
    }, [autoOpenModal]);

    const createMutation = useMutation({
        mutationFn: (data: CreateAddressDto) => profileService.createAddress(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
            setShowModal(false);
            resetForm();
            if (returnToCheckout) {
                navigate('/checkout');
            }
        },
        onError: (err: any) => {
            alert(err.response?.data?.error || t.common.error);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: CreateAddressDto }) =>
            profileService.updateAddress(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
            setShowModal(false);
            setEditingAddress(null);
            resetForm();
            if (returnToCheckout) {
                navigate('/checkout');
            }
        },
        onError: (err: any) => {
            alert(err.response?.data?.error || t.common.error);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => profileService.deleteAddress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
            setDeleteConfirmAddress(null);
        },
    });

    const resetForm = () => {
        setFormData({
            fullName: '',
            street: '',
            apartment: '',
            city: '',
            region: '',
            postalCode: '',
            country: '',
            phone: '',
            isDefault: false,
        });
        setPhoneError('');
        setShowCountryCodes(false);
    };

    const validatePhone = (phone: string): boolean => {
        const cleaned = phone.replace(/[\s\-\(\)]/g, '');
        return /^\+?\d{10,15}$/.test(cleaned);
    };

    const handlePhoneChange = (value: string) => {
        const cc = selectedCountryCode.code;
        let phoneNumber = value;

        if (phoneNumber.startsWith(cc)) {
            phoneNumber = phoneNumber.slice(cc.length);
        }

        phoneNumber = phoneNumber.replace(/[^\d\s\-\(\)]/g, '');

        const fullPhone = cc + phoneNumber;
        setFormData({ ...formData, phone: fullPhone });

        if (phoneNumber && !validatePhone(fullPhone)) {
            setPhoneError(t.profile.phoneError || 'Please enter a valid phone number');
        } else {
            setPhoneError('');
        }
    };

    const handleCountryCodeSelect = (code: string) => {
        const currentNumber = formData.phone.replace(selectedCountryCode.code, '');
        setFormData({ ...formData, phone: code + currentNumber });
        setShowCountryCodes(false);
        setPhoneError('');
    };

    const handleAutofillLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=${language}`;

                    fetch(url)
                        .then(response => response.json())
                        .then(data => {
                            const address = data?.address;
                            const road = address?.road || address?.pedestrian || address?.street || '';
                            const houseNumber = address?.house_number || '';
                            const street = houseNumber ? `${houseNumber}, ${road}` : road;
                            const city = address?.city || address?.town || address?.village || '';
                            const region = address?.state || address?.province || '';
                            const postalCode = address?.postcode || '';
                            const country = address?.country || '';

                            setFormData(prev => ({
                                ...prev,
                                street,
                                city,
                                region,
                                postalCode,
                                country,
                            }));
                        })
                        .catch(() => { });
                },
                () => {
                    alert(t.profile.locationError || 'Unable to get location');
                }
            );
        }
    };

    const handleEdit = (address: AddressDto) => {
        setEditingAddress(address);
        setFormData({
            fullName: address.fullName,
            street: address.street,
            apartment: address.apartment || '',
            city: address.city,
            region: address.region,
            postalCode: address.postalCode,
            country: address.country,
            phone: address.phone,
            isDefault: address.isDefault,
        });
        setShowModal(true);
    };

    const validateForm = (): boolean => {
        if (!formData.fullName || formData.fullName.trim().length < 2) {
            alert(t.profile.fullNameError || 'Please enter your full name');
            return false;
        }
        if (!formData.phone || !validatePhone(formData.phone)) {
            setPhoneError(t.profile.phoneError || 'Please enter a valid phone number');
            return false;
        }
        if (!formData.street || !formData.street.trim()) {
            alert(t.profile.streetError || 'Please enter your street address');
            return false;
        }
        if (!formData.city || !formData.city.trim()) {
            alert(t.profile.cityError || 'Please enter your city');
            return false;
        }
        if (!formData.region || !formData.region.trim()) {
            alert(t.profile.regionError || 'Please enter your state/region');
            return false;
        }
        if (!formData.postalCode || !formData.postalCode.trim()) {
            alert(t.profile.postalCodeError || 'Please enter your postal code');
            return false;
        }
        if (!formData.country || !formData.country.trim()) {
            alert(t.profile.countryError || 'Please enter your country');
            return false;
        }
        return true;
    };

    if (isLoading) return <LoadingSpinner />;

    const isFirstAddress = !addresses || addresses.length === 0;

    return (
        <div className="profile-section">
            <h3>{t.profile.addresses || 'Addresses'}</h3>

            {addresses && addresses.length > 0 ? (
                <div className="address-list">
                    {addresses.map((address) => (
                        <div key={address.id} className="address-card">
                            <div className="address-info">
                                <div className="address-name">
                                    {address.fullName}
                                    {address.isDefault && <span className="default-badge">{t.profile.default || 'Default'}</span>}
                                </div>
                                <div className="address-details">
                                    {address.street}
                                    {address.apartment ? `, ${address.apartment}` : ''}
                                </div>
                                <div className="address-details">
                                    {address.city}, {address.region} {address.postalCode}
                                </div>
                                <div className="address-details">{address.country}</div>
                                <div className="address-details" style={{ color: 'var(--text-secondary)' }}>
                                    {t.profile.phoneNumber || 'Phone:'} {address.phone}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-start' }}>
                                <button
                                    onClick={() => handleEdit(address)}
                                    className="btn btn-outline btn-small"
                                >
                                    {t.admin.edit || 'Edit'}
                                </button>
                                <button
                                    onClick={() => setDeleteConfirmAddress(address)}
                                    className="btn btn-danger btn-small"
                                >
                                    {t.admin.delete || 'Delete'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-addresses">{t.profile.noAddresses || 'No addresses added yet'}</p>
            )}

            <button
                onClick={() => {
                    setEditingAddress(null);
                    resetForm();
                    setFormData(prev => ({ ...prev, isDefault: isFirstAddress }));
                    setShowModal(true);
                }}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '10px' }}
            >
                + {t.profile.addAddress || 'Add Address'}
            </button>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'relative',
                            maxWidth: '500px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                color: 'var(--text-tertiary)',
                                zIndex: 10,
                            }}
                        >
                            ✕
                        </button>
                        <h3>{editingAddress ? (t.profile.editAddress || 'Edit Address') : (t.profile.addAddress || 'Add Address')}</h3>

                        <div className="address-form" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'left', margin: '0 0 4px 0' }}>
                                {t.profile.saveTime || 'Save time. Autofill your current location.'}
                            </p>

                            <button
                                type="button"
                                onClick={handleAutofillLocation}
                                className="btn btn-outline"
                                style={{ width: '100%', padding: '8px' }}
                            >
                                📍 {t.profile.autofillLocation || 'Autofill current location'}
                            </button>

                            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', margin: '2px 0' }}>
                                — {t.profile.or || 'or'} —
                            </div>

                            <AddressAutocomplete formData={formData} setFormData={setFormData} />

                            <div style={{ height: '6px' }} />

                            <input
                                type="text"
                                placeholder={t.profile.country || 'Country/Region'}
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            />

                            <input
                                type="text"
                                placeholder={t.profile.fullName || 'Full name (First and Last name)'}
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />

                            <div style={{ display: 'flex', gap: '4px', alignItems: 'stretch' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCountryCodes(true)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '10px 12px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'var(--bg-primary)',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        color: 'var(--text-primary)',
                                        fontFamily: 'inherit',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {selectedCountryCode.flag} {selectedCountryCode.code} ▾
                                </button>
                                <input
                                    type="tel"
                                    placeholder={t.profile.phone || 'Phone number'}
                                    value={formData.phone.replace(selectedCountryCode.code, '')}
                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                            </div>

                            {phoneError && (
                                <span style={{ color: 'var(--danger)', fontSize: '12px' }}>
                                    {phoneError}
                                </span>
                            )}

                            <div style={{ height: '6px' }} />

                            <input
                                type="text"
                                placeholder={t.profile.city || 'City'}
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />

                            <input
                                type="text"
                                placeholder={t.profile.region || 'State/Region'}
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                            />

                            <input
                                type="text"
                                placeholder={t.profile.postalCode || 'ZIP Code'}
                                value={formData.postalCode}
                                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            />

                            <input
                                type="text"
                                placeholder={t.profile.street || 'Street address'}
                                value={formData.street}
                                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                            />

                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px', textAlign: 'left' }}>
                                    {t.profile.optional || 'Optional'}
                                </span>
                                <input
                                    type="text"
                                    placeholder={t.profile.apartment || 'Apartment, suite, unit'}
                                    value={formData.apartment || ''}
                                    onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.isDefault || isFirstAddress}
                                    disabled={isFirstAddress}
                                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                />
                                {t.profile.makeDefault || 'Make this my default address'}
                            </label>

                            <div className="modal-actions">
                                <button
                                    onClick={() => {
                                        if (!validateForm()) return;
                                        const dataToSave = {
                                            ...formData,
                                            isDefault: formData.isDefault || isFirstAddress,
                                        };
                                        if (editingAddress) {
                                            updateMutation.mutate({ id: editingAddress.id, data: dataToSave });
                                        } else {
                                            createMutation.mutate(dataToSave);
                                        }
                                    }}
                                    className="btn btn-primary"
                                >
                                    {editingAddress ? (t.admin.update || 'Update') : (t.profile.save || 'Save')}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingAddress(null);
                                        resetForm();
                                    }}
                                    className="btn btn-outline"
                                >
                                    {t.admin.cancel || 'Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showCountryCodes && (
                <div className="modal-overlay" onClick={() => setShowCountryCodes(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '400px' }}>
                        <button
                            type="button"
                            onClick={() => setShowCountryCodes(false)}
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            ✕
                        </button>
                        <h3>{t.profile.selectCountry || 'Select Country'}</h3>
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {countryCodes.map((cc) => (
                                <button
                                    key={cc.code}
                                    type="button"
                                    onClick={() => handleCountryCodeSelect(cc.code)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        width: '100%',
                                        padding: '14px 16px',
                                        background: selectedCountryCode.code === cc.code ? 'var(--bg-tertiary)' : 'none',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        fontSize: '15px',
                                        textAlign: 'left',
                                        color: 'var(--text-primary)',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <span style={{ fontSize: '20px' }}>{cc.flag}</span>
                                    <span style={{ flex: 1 }}>{cc.country}</span>
                                    <span style={{ fontWeight: '600' }}>{cc.code}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirmAddress && (
                <div className="modal-overlay" onClick={() => setDeleteConfirmAddress(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '400px' }}>
                        <button
                            type="button"
                            onClick={() => setDeleteConfirmAddress(null)}
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            ✕
                        </button>
                        <h3>{t.profile.deleteAddressConfirm || 'Delete Address?'}</h3>
                        <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {t.profile.deleteAddressConfirmText || 'Are you sure you want to delete this address?'}
                        </p>
                        <div className="modal-actions" style={{ marginTop: '16px' }}>
                            <button
                                onClick={() => deleteMutation.mutate(deleteConfirmAddress.id)}
                                className="btn btn-danger"
                            >
                                {t.admin.delete || 'Delete'}
                            </button>
                            <button
                                onClick={() => setDeleteConfirmAddress(null)}
                                className="btn btn-outline"
                            >
                                {t.admin.cancel || 'Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};