import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface FilterOption {
    label: string;
    value: string;
    count?: number;
}

export interface FilterSection {
    id: string;
    title: string;
    type: 'checkbox' | 'color' | 'size' | 'sort';
    options: FilterOption[];
    selectedValues: string[];
    onToggle: (value: string) => void;
}

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: () => void;
    onClear: () => void;
    sections: FilterSection[];
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    onSortChange: (sortBy: string) => void;
    onDirectionChange: (direction: 'asc' | 'desc') => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
    isOpen,
    onClose,
    onApply,
    onClear,
    sections,
    sortBy,
    sortDirection,
    onSortChange,
    onDirectionChange,
}) => {
    const { t } = useLanguage();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="filter-modal-overlay" onClick={onClose}>
            <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
                <div className="filter-modal-header">
                    <h2>{t.search.filters || 'Filters'}</h2>
                    <button className="filter-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="filter-modal-content">
                    <div className="filter-sort-section">
                        <h3>{t.search.sortBy || 'Sort By'}</h3>
                        <div className="filter-sort-options">
                            {sections
                                .filter(s => s.type === 'sort')
                                .map(section => (
                                    <div key={section.id}>
                                        {section.options.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => onSortChange(option.value)}
                                                className={`filter-sort-btn ${sortBy === option.value ? 'active' : ''}`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                        </div>
                        <div className="filter-direction">
                            <button
                                onClick={() => onDirectionChange('asc')}
                                className={sortDirection === 'asc' ? 'active' : ''}
                            >
                                ↑ Ascending
                            </button>
                            <button
                                onClick={() => onDirectionChange('desc')}
                                className={sortDirection === 'desc' ? 'active' : ''}
                            >
                                ↓ Descending
                            </button>
                        </div>
                    </div>

                    {sections
                        .filter(s => s.type === 'checkbox')
                        .map(section => (
                            <div key={section.id} className="filter-section">
                                <h3>{section.title}</h3>
                                <div className="filter-options">
                                    {section.options.map(option => (
                                        <label key={option.value} className="filter-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={section.selectedValues.includes(option.value)}
                                                onChange={() => section.onToggle(option.value)}
                                            />
                                            <span>{option.label}</span>
                                            {option.count !== undefined && (
                                                <span className="filter-count">({option.count})</span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}

                    {sections
                        .filter(s => s.type === 'size')
                        .map(section => (
                            <div key={section.id} className="filter-section">
                                <h3>{section.title}</h3>
                                <div className="filter-sizes">
                                    {section.options.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => section.onToggle(option.value)}
                                            className={`filter-size-btn ${section.selectedValues.includes(option.value) ? 'active' : ''}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                    {sections
                        .filter(s => s.type === 'color')
                        .map(section => (
                            <div key={section.id} className="filter-section">
                                <h3>{section.title}</h3>
                                <div className="filter-colors">
                                    {section.options.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => section.onToggle(option.value)}
                                            className={`filter-color-btn ${section.selectedValues.includes(option.value) ? 'active' : ''}`}
                                            title={option.label}
                                        >
                                            <span
                                                className="filter-color-dot"
                                                style={{ backgroundColor: option.value }}
                                            />
                                            <span className="filter-color-name">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>

                <div className="filter-modal-footer">
                    <button onClick={onClear} className="btn btn-outline">
                        {t.admin.clear || 'Clear'}
                    </button>
                    <button onClick={onApply} className="btn btn-primary">
                        {t.search.apply || 'Apply'}
                    </button>
                </div>
            </div>
        </div>
    );
};