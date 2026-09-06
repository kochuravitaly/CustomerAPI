import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { ProductSuggestionDto } from '../types/product';

interface SearchSuggestionsProps {
    searchInput: string;
    onSuggestionClick: (name: string) => void;
    focusTrigger?: number;
    enabled?: boolean;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
    searchInput,
    onSuggestionClick,
    focusTrigger = 0,
    enabled = true
}) => {
    const [suggestions, setSuggestions] = useState<ProductSuggestionDto[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchSuggestions = async () => {
        if (searchInput.trim().length < 1) return;

        try {
            const response = await apiService.get<ProductSuggestionDto[]>('/products/suggestions', {
                params: { search: searchInput }
            });
            setSuggestions(response.data.slice(0, 5));
            setShowSuggestions(true);
        } catch {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    useEffect(() => {
        if (searchInput.trim().length >= 1 && enabled) {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            debounceRef.current = setTimeout(() => {
                fetchSuggestions();
            }, 200);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchInput, enabled]);

    useEffect(() => {
        if (focusTrigger > 0 && searchInput.trim().length >= 1 && enabled) {
            fetchSuggestions();
        }
    }, [focusTrigger]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!showSuggestions || suggestions.length === 0) {
        return null;
    }

    const highlightMatch = (text: string, search: string) => {
        const index = text.toLowerCase().indexOf(search.toLowerCase());
        if (index === -1) return <span>{text}</span>;

        return (
            <>
                <span>{text.substring(0, index)}</span>
                <strong className="suggestion-highlight">
                    {text.substring(index, index + search.length)}
                </strong>
                <span>{text.substring(index + search.length)}</span>
            </>
        );
    };

    return (
        <div className="search-suggestions" ref={containerRef}>
            {suggestions.map((suggestion, index) => (
                <button
                    key={`${suggestion.id}-${index}`}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSuggestionClick(suggestion.matchedName);
                        setShowSuggestions(false);
                    }}
                    className="search-suggestion-item"
                >
                    <span className="suggestion-icon">🔍</span>
                    <span className="suggestion-text">
                        {highlightMatch(suggestion.matchedName, searchInput)}
                    </span>
                </button>
            ))}
        </div>
    );
};