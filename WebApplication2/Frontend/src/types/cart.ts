export interface CartItemResponseDto {
    productId: number;
    productName: string;
    productNameTranslations?: Record<string, string>;
    unitPrice: number;
    quantity: number;
    total: number;
    mainImageId?: number;
    colorId?: number;
    colorName?: string;
    colorHexCode?: string;
    sizeName?: string;
}

export interface CartResponseDto {
    cartItems: CartItemResponseDto[];
    total: number;
}

export interface AddCartItemDto {
    productId: number;
    quantity: number;
    colorId?: number;
    sizeName?: string;
}

export interface UpdateCartItemDto {
    quantity: number;
}