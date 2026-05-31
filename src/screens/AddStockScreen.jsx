import React, { useState } from 'react';
import { PRODUCT_TYPES, STOCK_CATEGORIES } from '../constants';

function AddStockScreen({ onClose, onSave, onDelete, initialData, isSaving = false }) {
    const [name, setName] = useState(initialData?.name || '');
    const [collection, setCollection] = useState(initialData?.collection || '');
    const [category, setCategory] = useState(initialData?.category || '');
    const [historyDescription, setHistoryDescription] = useState('');

    // Estados individuales para talles
    const [stockS, setStockS] = useState(initialData?.stock?.s || '');
    const [stockM, setStockM] = useState(initialData?.stock?.m || '');
    const [stockL, setStockL] = useState(initialData?.stock?.l || '');
    const [stockXL, setStockXL] = useState(initialData?.stock?.xl || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !category) {
            alert('Por favor completa el nombre y color.');
            return;
        }

        const newItem = {
            id: initialData?.id || Date.now().toString(),
            name,
            collection: collection || 'Sin colección',
            category,
            stock: {
                s: parseInt(stockS) || 0,
                m: parseInt(stockM) || 0,
                l: parseInt(stockL) || 0,
                xl: parseInt(stockXL) || 0
            },
            historyDescription: historyDescription
        };
        onSave(newItem);
    };

    const isEditing = !!initialData;

    return (
        <div className="fixed inset-0 z-50 bg-background-light flex flex-col animate-slide-up">
            <header className="flex items-center justify-between px-6 pt-8 pb-4 bg-background-light/95 backdrop-blur-md sticky top-0 z-20">
                <button onClick={onClose} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-pink-50 text-text-main transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-text-main text-lg font-bold tracking-tight">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                <button className="w-10 h-10 opacity-0 pointer-events-none"><span className="material-symbols-outlined">more_vert</span></button>
            </header>
            <main className="flex-1 overflow-y-auto px-6 py-2 space-y-6 pb-32">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-soft p-6 space-y-5 border border-pink-50">
                        {/* Tipo de prenda */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text-main ml-1">Tipo de Prenda</label>
                            <select value={name} onChange={e => setName(e.target.value)} className="block w-full px-4 py-3 border-pink-100 rounded-xl bg-gray-50 text-text-main focus:ring-primary focus:border-primary sm:text-sm">
                                <option value="">Seleccionar tipo...</option>
                                {PRODUCT_TYPES.map(type => (
                                    <option key={type.id} value={type.name}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                        {/* Colección */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text-main ml-1">Colección / Detalle</label>
                            <input value={collection} onChange={e => setCollection(e.target.value)} className="block w-full px-4 py-3 border-pink-100 rounded-xl bg-gray-50 text-text-main focus:ring-primary focus:border-primary sm:text-sm placeholder-gray-400" placeholder="Ej: Verano '24" />
                        </div>

                        {/* Stock por Talle Row */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-main ml-1">Stock por Talle</label>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-xs text-text-muted mb-1 block text-center">S</label>
                                    <input type="number" value={stockS} onChange={e => setStockS(e.target.value)} className="block w-full px-2 py-3 text-center border-pink-100 rounded-xl bg-gray-50 text-text-main focus:ring-primary focus:border-primary sm:text-sm placeholder-gray-300" placeholder="0" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-text-muted mb-1 block text-center">M</label>
                                    <input type="number" value={stockM} onChange={e => setStockM(e.target.value)} className="block w-full px-2 py-3 text-center border-pink-100 rounded-xl bg-gray-50 text-text-main focus:ring-primary focus:border-primary sm:text-sm placeholder-gray-300" placeholder="0" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-text-muted mb-1 block text-center">L</label>
                                    <input type="number" value={stockL} onChange={e => setStockL(e.target.value)} className="block w-full px-2 py-3 text-center border-pink-100 rounded-xl bg-gray-50 text-text-main focus:ring-primary focus:border-primary sm:text-sm placeholder-gray-300" placeholder="0" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-text-muted mb-1 block text-center">XL</label>
                                    <input type="number" value={stockXL} onChange={e => setStockXL(e.target.value)} className="block w-full px-2 py-3 text-center border-pink-100 rounded-xl bg-gray-50 text-text-main focus:ring-primary focus:border-primary sm:text-sm placeholder-gray-300" placeholder="0" />
                                </div>
                            </div>
                        </div>

                        {/* Categorías (Color) */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text-main ml-1">Color</label>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                {STOCK_CATEGORIES.map((cat) => (
                                    <label key={cat.id} className="cursor-pointer relative group">
                                        <input type="radio" name="stock_category" className="peer sr-only" checked={category === cat.id} onChange={() => setCategory(cat.id)} />
                                        <div className={`flex items-center justify-center p-3 rounded-xl border border-pink-100 bg-gray-50 peer-checked:bg-pink-50 peer-checked:border-primary peer-checked:text-primary transition-all`}>
                                            <div className={`w-3 h-3 rounded-full mr-2 ${cat.colorCode}`}></div>
                                            <span className="text-xs font-medium">{cat.name}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Descripción para el historial (opcional) */}
                    <div className="bg-pink-50/50 rounded-2xl shadow-sm p-6 space-y-3 border border-pink-100">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary !text-[20px]">history</span>
                            <label className="text-sm font-medium text-text-main">Nota para el Historial (Opcional)</label>
                        </div>
                        <input
                            value={historyDescription}
                            onChange={e => setHistoryDescription(e.target.value)}
                            className="block w-full px-4 py-3 border-pink-100 rounded-xl bg-white text-text-main focus:ring-primary focus:border-primary sm:text-sm placeholder-gray-400"
                            placeholder="Ej: Reposición de stock, corrección de inventario, etc."
                        />
                        <p className="text-xs text-text-muted">Esta nota se guardará en el historial para recordar el motivo del cambio</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-pink-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <span>Guardando...</span>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                </>
                            ) : (
                                <>
                                    <span>{isEditing ? 'Guardar Cambios' : 'Crear Producto'}</span>
                                    <span className="material-symbols-outlined">check</span>
                                </>
                            )}
                        </button>
                        {isEditing && (
                            <button 
                                type="button" 
                                onClick={() => onDelete(initialData.id)} 
                                disabled={isSaving}
                                className="w-full bg-red-50 text-red-500 font-bold py-4 px-6 rounded-2xl border border-red-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>Eliminar Producto</span>
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        )}
                    </div>
                </form>
            </main>
        </div>
    );
}

export default AddStockScreen;
