export interface CartItemResponseDto {
    productId: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    total: number;
}

export interface CartResponseDto {
    cartItems: CartItemResponseDto[];
    total: number;
}

export interface AddCartItemDto {
    productId: number;
    quantity: number;
}

export interface UpdateCartItemDto {
    quantity: number;
}