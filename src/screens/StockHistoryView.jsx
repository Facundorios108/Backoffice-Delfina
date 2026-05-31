import React from 'react';

function StockHistoryView({ onClose, history }) {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Fecha desconocida';
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'create': return 'add_circle';
            case 'update': return 'edit';
            case 'delete': return 'delete';
            case 'sale': return 'shopping_cart';
            default: return 'info';
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'create': return 'text-green-600 bg-green-50';
            case 'update': return 'text-blue-600 bg-blue-50';
            case 'delete': return 'text-red-600 bg-red-50';
            case 'sale': return 'text-primary bg-pink-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getActionLabel = (action) => {
        switch (action) {
            case 'create': return 'Creación';
            case 'update': return 'Actualización';
            case 'delete': return 'Eliminación';
            case 'sale': return 'Venta';
            default: return 'Movimiento';
        }
    };

    const colorNames = {
        azul: 'Azul', blanco: 'Blanco', chocolate: 'Chocolate',
        gris_petroleo: 'Gris Petróleo', negro: 'Negro', verde: 'Verde'
    };

    return (
        <div className="fixed inset-0 z-50 bg-background-light flex flex-col animate-slide-up">
            <header className="flex items-center justify-between px-6 pt-8 pb-4 bg-background-light/95 backdrop-blur-md sticky top-0 z-20">
                <button onClick={onClose} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-pink-50 text-text-main transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-text-main text-lg font-bold tracking-tight">Historial de Stock</h2>
                <button className="w-10 h-10 opacity-0 pointer-events-none"></button>
            </header>

            <main className="flex-1 overflow-y-auto px-6 py-2 space-y-4 pb-32">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">history</span>
                        <p className="text-text-muted text-sm">No hay movimientos registrados aún</p>
                    </div>
                ) : (
                    history.map((entry, index) => (
                        <div key={entry.id || index} className="bg-white rounded-2xl shadow-soft p-4 border border-pink-50">
                            <div className="flex items-start gap-3">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getActionColor(entry.action)}`}>
                                    <span className="material-symbols-outlined !text-[20px]">{getActionIcon(entry.action)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${getActionColor(entry.action)}`}>
                                            {getActionLabel(entry.action)}
                                        </span>
                                        <span className="text-xs text-text-muted">{formatDate(entry.createdAt)}</span>
                                    </div>

                                    <h4 className="text-text-main font-bold text-sm">{entry.itemName}</h4>
                                    <p className="text-text-muted text-xs">
                                        {colorNames[entry.itemColor] || entry.itemColor}
                                    </p>

                                    {entry.changes && entry.changes.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {entry.changes.map((change, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-xs">
                                                    <span className="font-medium text-text-main">Talle {change.size}:</span>
                                                    <span className="text-text-muted">{change.oldValue}</span>
                                                    <span className="material-symbols-outlined !text-[14px] text-primary">arrow_forward</span>
                                                    <span className={`font-bold ${change.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {change.newValue}
                                                    </span>
                                                    <span className={`text-xs ${change.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        ({change.difference > 0 ? '+' : ''}{change.difference})
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {entry.stock && !entry.changes && (
                                        <div className="mt-2 flex gap-2 text-xs text-text-muted">
                                            <span>S: {entry.stock.s || 0}</span>
                                            <span>M: {entry.stock.m || 0}</span>
                                            <span>L: {entry.stock.l || 0}</span>
                                            <span>XL: {entry.stock.xl || 0}</span>
                                        </div>
                                    )}

                                    {entry.description && (
                                        <p className="mt-2 text-xs text-text-muted italic bg-pink-50/50 rounded-lg px-2 py-1">
                                            "{entry.description}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}

export default StockHistoryView;
