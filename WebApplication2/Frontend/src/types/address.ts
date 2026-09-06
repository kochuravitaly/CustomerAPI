export interface AddressDto {
    id: number;
    fullName: string;
    street: string;
    apartment?: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    phone: string;
    isDefault: boolean;
}

export interface CreateAddressDto {
    fullName: string;
    street: string;
    apartment?: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    phone: string;
    isDefault: boolean;
}