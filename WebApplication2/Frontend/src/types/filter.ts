export interface ColorFilterDto {
    id: number;
    name: string;
    hexCode: string;
    nameTranslations: Record<string, string>;
}

export interface SizeFilterDto {
    name: string;
}

export interface AttributeFilterDto {
    id: number;
    name: string;
    nameTranslations: Record<string, string>;
}

export interface FilterOptionsDto {
    colors: ColorFilterDto[];
    sizes: SizeFilterDto[];
    genders: { value: number; name: string }[];
    seasons: { value: number; name: string }[];
    ageGroups: { value: number; name: string }[];
    materials: AttributeFilterDto[];
    styles: AttributeFilterDto[];
    occasions: AttributeFilterDto[];
    patterns: AttributeFilterDto[];
    minPrice: number;
    maxPrice: number;
    minRating: number;
    maxRating: number;
}

export interface FilterState {
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    minPrice?: number;
    maxPrice?: number;
    colorIds?: number[];
    sizes?: string[];
    genders?: number[];
    seasons?: number[];
    ageGroups?: number[];
    materialIds?: number[];
    styleIds?: number[];
    occasionIds?: number[];
    patternIds?: number[];
    minRating?: number;
}