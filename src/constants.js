// --- Mock Data para Seed ---
export const INITIAL_STOCK_DATA = [
    { name: 'Musculosa', collection: "Básicos", category: 'blanco', price: 15000, stock: { s: 12, m: 8, l: 5, xl: 2 } },
    { name: 'Musculosa', collection: "Básicos", category: 'negro', price: 15000, stock: { s: 15, m: 2, l: 0, xl: 0 } },
    { name: 'Musculosa', collection: "Temporada", category: 'chocolate', price: 16500, stock: { s: 5, m: 5, l: 5, xl: 5 } },
];

export const TRANSACTION_CATEGORIES = [
    { id: 'musculosas', name: 'Musculosas', icon: 'checkroom' },
    { id: 'remeras', name: 'Boxy fit', icon: 'storefront' },
    { id: 'manga_corta', name: 'Manga corta', icon: 'checkroom' },
    { id: 'merceria', name: 'Mercería', icon: 'shopping_bag' },
    { id: 'online', name: 'Venta Online', icon: 'shopping_cart' },
    { id: 'logistica', name: 'Logística', icon: 'local_shipping' },
    { id: 'marketing', name: 'Marketing', icon: 'campaign' },
];

export const PAYMENT_METHODS = [
    { id: 'transferencia', name: 'Transferencia', icon: 'account_balance' },
    { id: 'efectivo', name: 'Efectivo', icon: 'payments' },
    { id: 'tarjeta', name: 'Tarjeta', icon: 'credit_card' },
];

export const PRODUCT_TYPES = [
    { id: 'musculosa', name: 'Musculosa' },
    { id: 'remera', name: 'Boxy fit' },
    { id: 'manga_corta', name: 'Manga corta' },
];

export const MUSCULOSA_DESIGNS = [
    { id: 'aceitunas', name: 'Aceitunas' },
    { id: 'concha_de_mar', name: 'Concha de mar' },
    { id: 'libelula', name: 'Libélula' },
    { id: 'limon', name: 'Limón' },
    { id: 'medusa', name: 'Medusa' },
    { id: 'ojo_negro', name: 'Ojo negro' },
    { id: 'pimiento', name: 'Pimiento' },
    { id: 'saturno_azul', name: 'Saturno azul' },
    { id: 'saturno_dorado', name: 'Saturno dorado' },
    { id: 'otro', name: 'Otro' },
];

export const MUSCULOSA_COLORS = [
    { id: 'azul', name: 'Azul' },
    { id: 'blanco', name: 'Blanco' },
    { id: 'chocolate', name: 'Chocolate' },
    { id: 'gris_petroleo', name: 'Gris Petróleo' },
    { id: 'negro', name: 'Negro' },
    { id: 'verde', name: 'Verde' },
];

export const MUSCULOSA_SIZES = [
    { id: 's', name: 'S' },
    { id: 'm', name: 'M' },
    { id: 'l', name: 'L' },
    { id: 'xl', name: 'XL' },
];

export const STOCK_CATEGORIES = [
    { id: 'azul', name: 'Azul', colorCode: 'bg-blue-500' },
    { id: 'blanco', name: 'Blanco', colorCode: 'bg-white border border-gray-200' },
    { id: 'chocolate', name: 'Chocolate', colorCode: 'bg-[#7B3F00]' },
    { id: 'gris_petroleo', name: 'Gris Petróleo', colorCode: 'bg-gray-700' },
    { id: 'negro', name: 'Negro', colorCode: 'bg-black' },
    { id: 'verde', name: 'Verde', colorCode: 'bg-green-600' },
];
