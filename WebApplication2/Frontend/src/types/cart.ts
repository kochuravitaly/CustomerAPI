export interface CartItem {
    productId: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    total: number;
}

export interface Cart {
    cartItems: CartItem[];
    total: number;
}

export interface AddCartItemRequest {
    productId: number;
    quantity: number;
}

export interface UpdateCartItemRequest {
    quantity: number;
}