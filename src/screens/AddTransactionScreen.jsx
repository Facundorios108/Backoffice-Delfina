import React, { useState, useEffect } from 'react';
import { 
    TRANSACTION_CATEGORIES, 
    PAYMENT_METHODS, 
    PRODUCT_TYPES, 
    MUSCULOSA_DESIGNS, 
    MUSCULOSA_COLORS, 
    MUSCULOSA_SIZES 
} from '../constants';

const getLocalDateISO = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
};

function AddTransactionScreen({ onClose, onSave, onDelete, initialData, isSaving = false }) {
    const [type, setType] = useState(initialData?.type || 'income');
    const [amount, setAmount] = useState(initialData?.amount || '');
    const [category, setCategory] = useState(initialData?.category || '');
    const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || '');
    const [desc, setDesc] = useState(initialData?.title === 'Movimiento' ? '' : initialData?.title || '');
    const [date, setDate] = useState(initialData?.fullDate || getLocalDateISO());

    // Estados para venta online
    const [quantity, setQuantity] = useState(initialData?.quantity || 1);
    const [products, setProducts] = useState(
        initialData?.products || [{
            productType: '',
            musculosaDesign: '',
            musculosaCustomDesign: '',
            musculosaColor: '',
            musculosaSize: ''
        }]
    );

    // Actualizar cantidad de productos cuando cambia quantity
    useEffect(() => {
        if (category === 'online' && quantity && Number.isInteger(quantity)) {
            const newProducts = [...products];
            if (quantity > products.length) {
                // Agregar más productos
                for (let i = products.length; i < quantity; i++) {
                    newProducts.push({
                        productType: '',
                        musculosaDesign: '',
                        musculosaCustomDesign: '',
                        musculosaColor: '',
                        musculosaSize: ''
                    });
                }
            } else if (quantity < products.length) {
                // Remover productos
                newProducts.splice(quantity);
            }
            setProducts(newProducts);
        }
    }, [quantity, category]);

    // Función para actualizar un producto específico
    const updateProduct = (index, field, value) => {
        const newProducts = [...products];
        newProducts[index] = { ...newProducts[index], [field]: value };
        setProducts(newProducts);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || !category) { alert('Completa los campos requeridos'); return; }

        // Validar campos de venta online
        if (category === 'online') {
            if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
                alert('Por favor ingresa una cantidad válida (mínimo 1)');
                return;
            }

            const onlineFields = window.ONLINE_FIELDS || { productType: true, musculosaDesign: true, musculosaColor: true, musculosaSize: true };

            // Validar cada producto
            for (let i = 0; i < quantity; i++) {
                const product = products[i] || {};
                if (onlineFields.productType && !product.productType) {
                    alert(`Por favor selecciona el tipo de prenda para el artículo ${i + 1}`);
                    return;
                }
                if (onlineFields.musculosaDesign && !product.musculosaDesign) {
                    alert(`Por favor selecciona el diseño para el artículo ${i + 1}`);
                    return;
                }
                if (onlineFields.musculosaDesign && product.musculosaDesign === 'otro' && !product.musculosaCustomDesign) {
                    alert(`Por favor especifica el diseño personalizado para el artículo ${i + 1}`);
                    return;
                }
                if (onlineFields.musculosaColor && !product.musculosaColor) {
                    alert(`Por favor selecciona el color para el artículo ${i + 1}`);
                    return;
                }
                if (onlineFields.musculosaSize && !product.musculosaSize) {
                    alert(`Por favor selecciona el talle para el artículo ${i + 1}`);
                    return;
                }
            }
        }

        const selectedCat = TRANSACTION_CATEGORIES.find(c => c.id === category);

        // Construir título automático para venta online
        let finalTitle = desc || 'Movimiento';
        if (category === 'online' && quantity > 0) {
            if (quantity === 1) {
                const product = products[0];
                const colorName = MUSCULOSA_COLORS.find(c => c.id === product.musculosaColor)?.name || product.musculosaColor;
                const sizeName = product.musculosaSize.toUpperCase();
                const designName = product.musculosaDesign === 'otro' ? product.musculosaCustomDesign : MUSCULOSA_DESIGNS.find(d => d.id === product.musculosaDesign)?.name;
                const productName = PRODUCT_TYPES.find(p => p.id === product.productType)?.name || product.productType;
                finalTitle = `${productName} ${colorName} talle ${sizeName} - ${designName}`;
                if (desc) finalTitle += ` (${desc})`;
            } else {
                finalTitle = `Venta de ${quantity} prendas`;
                if (desc) finalTitle += ` - ${desc}`;
            }
        }

        const newTx = {
            id: initialData?.id || Date.now(),
            type,
            title: finalTitle,
            description: desc || '', // Guardar descripción por separado
            subtitle: selectedCat?.name,
            amount: parseFloat(amount),
            date: 'Hoy',
            fullDate: date,
            icon: selectedCat?.icon || 'star',
            category,
            paymentMethod: paymentMethod || 'transferencia'
        };

        // Agregar información de productos para venta online
        if (category === 'online') {
            newTx.quantity = quantity;
            newTx.products = products.slice(0, quantity);
        }

        onSave(newTx);
    };

    const isEditing = !!initialData;
    const isExpense = type === 'expense';

    return (
        <div className="fixed inset-0 z-50 bg-background-light flex flex-col animate-slide-up">
            <header className="flex items-center justify-between px-6 pt-8 pb-4 bg-background-light/95 backdrop-blur-md sticky top-0 z-20">
                <button onClick={onClose} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-pink-50 text-text-main transition-colors"><span className="material-symbols-outlined">arrow_back</span></button>
                <h2 className="text-text-main text-lg font-bold tracking-tight">{isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h2>
                <button className="w-10 h-10 opacity-0 pointer-events-none"></button>
            </header>
            <main className="flex-1 overflow-y-auto px-6 py-2 space-y-6 pb-32">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center mb-8">
                        <div className="relative bg-pink-100 p-1.5 rounded-full flex w-full max-w-[320px]">
                            <div className={`absolute w-[calc(50%-6px)] h-[calc(100%-12px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out top-1.5 left-1.5 ${isExpense ? 'translate-x-full' : 'translate-x-0'}`}></div>
                            <label className="flex-1 relative z-10 cursor-pointer" onClick={() => setType('income')}><div className={`w-full py-2.5 text-center text-sm font-semibold transition-colors ${!isExpense ? 'text-green-600' : 'text-text-muted'}`}>Ingreso</div></label>
                            <label className="flex-1 relative z-10 cursor-pointer" onClick={() => setType('expense')}><div className={`w-full py-2.5 text-center text-sm font-semibold transition-colors ${isExpense ? 'text-primary' : 'text-text-muted'}`}>Egreso</div></label>
                        </div>
                    </div>
                    <div className="flex items-center justify-center py-6">
                        <span className={`text-5xl font-bold mr-2 ${isExpense ? 'text-primary' : 'text-green-600'}`}>$</span>
                        <input
                            type="text"
                            value={amount ? Number(amount).toLocaleString('es-AR') : ''}
                            onChange={(e) => {
                                const cleanVal = e.target.value.replace(/\D/g, '');
                                setAmount(cleanVal);
                            }}
                            className={`w-auto max-w-[250px] bg-transparent text-center text-5xl font-bold placeholder-primary/30 focus:outline-none focus:ring-0 border-none outline-none focus-visible:ring-0 focus-visible:outline-none p-0 ${isExpense ? 'text-primary' : 'text-green-600'}`}
                            placeholder="0"
                            autoFocus
                        />
                    </div>
                    <div className="bg-white rounded-2xl shadow-soft p-6 space-y-5 border border-pink-50">
                        <div className="space-y-1.5"><label className="text-sm font-medium text-text-main ml-1">Fecha</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="block w-full pl-4 py-3 border-pink-100 rounded-xl bg-gray-50 text-text-main focus:ring-primary sm:text-sm" /></div>

                        {category === 'online' && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-text-main ml-1">Cantidad de Prendas <span className="text-primary">*</span></label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                setQuantity('');
                                            } else {
                                                const num = parseInt(val);
                                                if (!isNaN(num) && num >= 1) {
                                                    setQuantity(num);
                                                }
                                            }
                                        }}
                                        className="block w-full pl-4 py-3 border-pink-100 rounded-xl bg-gray-50 text-text-main focus:ring-primary sm:text-sm"
                                        placeholder="Ej: 2"
                                    />
                                    <p className="text-xs text-text-muted ml-1">Si vendes más de una prenda, completa los datos de cada una</p>
                                </div>

                                <div className="h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent my-2"></div>

                                {/* Renderizar campos para cada producto */}
                                {quantity && Number.isInteger(quantity) && quantity > 0 && Array.from({ length: quantity }).map((_, index) => {
                                    const product = products[index] || {};
                                    const onlineFields = window.ONLINE_FIELDS || { productType: true, musculosaDesign: true, musculosaColor: true, musculosaSize: true };
                                    
                                    return (
                                        <div key={index} className="space-y-4 p-4 bg-pink-50/50 rounded-xl border border-pink-100">
                                            <h3 className="text-sm font-bold text-primary">Prenda {index + 1}</h3>

                                            {onlineFields.productType && (
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium text-text-main ml-1">Tipo de Prenda <span className="text-primary">*</span></label>
                                                    <select
                                                        value={product.productType || ''}
                                                        onChange={(e) => updateProduct(index, 'productType', e.target.value)}
                                                        className="block w-full pl-4 py-3 border-pink-100 rounded-xl bg-white text-text-main focus:ring-primary focus:border-primary sm:text-sm">
                                                        <option value="">Seleccionar tipo...</option>
                                                        {PRODUCT_TYPES.map((type) => (
                                                            <option key={type.id} value={type.id}>{type.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {onlineFields.musculosaDesign && (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <label className="text-sm font-medium text-text-main ml-1">Diseño <span className="text-primary">*</span></label>
                                                        <select
                                                            value={product.musculosaDesign || ''}
                                                            onChange={(e) => updateProduct(index, 'musculosaDesign', e.target.value)}
                                                            className="block w-full pl-4 py-3 border-pink-100 rounded-xl bg-white text-text-main focus:ring-primary focus:border-primary sm:text-sm">
                                                            <option value="">Seleccionar diseño...</option>
                                                            {MUSCULOSA_DESIGNS.map((design) => (
                                                                <option key={design.id} value={design.id}>{design.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {product.musculosaDesign === 'otro' && (
                                                        <div className="space-y-1.5">
                                                            <label className="text-sm font-medium text-text-main ml-1">Especificar diseño <span className="text-primary">*</span></label>
                                                            <input
                                                                type="text"
                                                                value={product.musculosaCustomDesign || ''}
                                                                onChange={(e) => updateProduct(index, 'musculosaCustomDesign', e.target.value)}
                                                                className="block w-full pl-4 py-3 border-pink-100 rounded-xl bg-white text-text-main focus:ring-primary sm:text-sm"
                                                                placeholder="Ej: Pato, Estrella..."
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {onlineFields.musculosaColor && (
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium text-text-main ml-1">Color <span className="text-primary">*</span></label>
                                                    <select
                                                        value={product.musculosaColor || ''}
                                                        onChange={(e) => updateProduct(index, 'musculosaColor', e.target.value)}
                                                        className="block w-full pl-4 py-3 border-pink-100 rounded-xl bg-white text-text-main focus:ring-primary focus:border-primary sm:text-sm">
                                                        <option value="">Seleccionar color...</option>
                                                        {MUSCULOSA_COLORS.map((color) => (
                                                            <option key={color.id} value={color.id}>{color.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {onlineFields.musculosaSize && (
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium text-text-main ml-1">Talle <span className="text-primary">*</span></label>
                                                    <select
                                                        value={product.musculosaSize || ''}
                                                        onChange={(e) => updateProduct(index, 'musculosaSize', e.target.value)}
                                                        className="block w-full pl-4 py-3 border-pink-100 rounded-xl bg-white text-text-main focus:ring-primary focus:border-primary sm:text-sm">
                                                        <option value="">Seleccionar talle...</option>
                                                        {MUSCULOSA_SIZES.map((size) => (
                                                            <option key={size.id} value={size.id}>{size.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <div className="h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent my-2"></div>
                            </>
                        )}

                        <div className="space-y-1.5"><label className="text-sm font-medium text-text-main ml-1">Descripción {category !== 'online' && '(Opcional)'}</label><input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} className="block w-full pl-4 py-3 border-pink-100 rounded-xl bg-gray-50 text-text-main focus:ring-primary sm:text-sm" placeholder="Detalle adicional..." /></div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text-main ml-1">Método de Pago</label>
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="block w-full pl-4 py-3 border-pink-100 rounded-xl bg-gray-50 text-text-main focus:ring-primary focus:border-primary sm:text-sm">
                                <option value="">Seleccionar...</option>
                                {PAYMENT_METHODS.map((method) => (
                                    <option key={method.id} value={method.id}>{method.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text-main ml-1">Categoría</label>
                            <div className="grid grid-cols-2 gap-3 mt-2">{TRANSACTION_CATEGORIES.map((cat) => (<label key={cat.id} className="cursor-pointer relative group"><input type="radio" name="category" className="peer sr-only" checked={category === cat.id} onChange={() => setCategory(cat.id)} /><div className="flex flex-col items-center justify-center p-3 rounded-xl border border-pink-100 bg-gray-50 peer-checked:bg-pink-50 peer-checked:border-primary peer-checked:text-primary transition-all"><span className={`material-symbols-outlined mb-1 ${category === cat.id ? 'text-primary' : 'text-gray-400'}`}>{cat.icon}</span><span className="text-xs font-medium">{cat.name}</span></div></label>))}</div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="w-full bg-primary text-white font-bold py-4 px-6 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <span>Guardando...</span>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                </>
                            ) : (
                                <>
                                    <span>{isEditing ? 'Guardar Cambios' : 'Guardar'}</span>
                                    <span className="material-symbols-outlined">check</span>
                                </>
                            )}
                        </button>
                        {isEditing && (
                            <button 
                                type="button" 
                                onClick={() => onDelete(initialData.id)} 
                                disabled={isSaving}
                                className="w-full bg-red-50 text-red-500 font-bold py-4 rounded-2xl border border-red-100 active:scale-[0.98] hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Eliminar
                            </button>
                        )}
                    </div>
                </form>
            </main>
        </div>
    );
}

export default AddTransactionScreen;
