import React, { useState, useEffect, useMemo, useRef } from 'react';
import { STOCK_CATEGORIES } from '../constants';

function StockView({ items, onItemClick, onOpenHistory }) {
    const scrollRef = useRef(null);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [showNotifications, setShowNotifications] = useState(false);
    const [readNotifications, setReadNotifications] = useState(() => {
        try {
            const saved = localStorage.getItem('delfinaReadNotifications');
            return saved ? JSON.parse(saved) : [];
        } catch(e) { return []; }
    });

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, []);

    useEffect(() => {
        // Remover notificaciones leídas si el producto ya no tiene bajo stock
        const currentLowStockIds = items.filter(item => {
            const total = (item.stock?.s || 0) + (item.stock?.m || 0) + (item.stock?.l || 0) + (item.stock?.xl || 0);
            return total <= 3;
        }).map(i => i.id);

        setReadNotifications(prev => {
            const valid = prev.filter(id => currentLowStockIds.includes(id));
            if (valid.length !== prev.length) {
                try { localStorage.setItem('delfinaReadNotifications', JSON.stringify(valid)); } catch(e){}
                return valid;
            }
            return prev;
        });
    }, [items]);

    const unreadNotifications = useMemo(() => {
        const lowStockList = [];
        items.forEach(item => {
            const itemTotal = (item.stock?.s || 0) + (item.stock?.m || 0) + (item.stock?.l || 0) + (item.stock?.xl || 0);
            if (itemTotal <= 3) {
                lowStockList.push({ ...item, totalStock: itemTotal });
            }
        });
        return lowStockList.filter(item => !readNotifications.includes(item.id));
    }, [items, readNotifications]);

    const handleNotificationClick = (item) => {
        const newRead = [...readNotifications, item.id];
        setReadNotifications(newRead);
        try { localStorage.setItem('delfinaReadNotifications', JSON.stringify(newRead)); } catch(e){}
        
        setShowNotifications(false);
        setActiveCategory(item.category || 'all');
        setSearch(item.name);
    };

    // Filtros de Stock por Color
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const itemTotal = (item.stock?.s || 0) + (item.stock?.m || 0) + (item.stock?.l || 0) + (item.stock?.xl || 0);
            const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
            
            if (activeCategory === 'low_stock') {
                return matchesSearch && itemTotal <= 3;
            }

            const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [items, search, activeCategory]);

    // Estadísticas Stock (Suma de talles)
    const stats = useMemo(() => {
        let totalItems = 0;
        let lowStockCount = 0;

        items.forEach(item => {
            const itemTotal = (item.stock?.s || 0) + (item.stock?.m || 0) + (item.stock?.l || 0) + (item.stock?.xl || 0);
            totalItems += itemTotal;
            if (itemTotal <= 3) lowStockCount++;
        });

        return { totalItems, lowStockCount };
    }, [items]);

    const exportToCSV = () => {
        if (filteredItems.length === 0) {
            alert('No hay items de stock para exportar.');
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
        csvContent += "Articulo,Categoría,Precio,Talle S,Talle M,Talle L,Talle XL,Total Unidades\r\n";
        
        filteredItems.forEach(item => {
            const nombre = (item.name || "").replace(/,/g, "-").replace(/\n/g, " ");
            const cat = STOCK_CATEGORIES.find(c => c.id === item.category)?.name || item.category || "";
            const precio = item.price || 0;
            const s = item.stock?.s || 0;
            const m = item.stock?.m || 0;
            const l = item.stock?.l || 0;
            const xl = item.stock?.xl || 0;
            const total = s + m + l + xl;
            
            csvContent += `${nombre},${cat},${precio},${s},${m},${l},${xl},${total}\r\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Stock_Delfina_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full bg-background-light">
            <header className="flex items-center justify-between px-8 pt-8 pb-4 bg-background-light/90 backdrop-blur-md sticky top-0 z-20">
                <div className="flex flex-col">
                    <span className="text-text-muted text-sm font-medium">Gestión de Inventario</span>
                    <h2 className="text-text-main text-2xl font-bold tracking-tight">Delfina Concept</h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportToCSV} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm border border-pink-100 text-text-main hover:text-primary hover:bg-pink-50 transition-all active:scale-95" title="Exportar Stock a CSV">
                        <span className="material-symbols-outlined !text-[24px]">download</span>
                    </button>
                    <button onClick={onOpenHistory} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm border border-pink-100 text-primary hover:bg-pink-50 transition-all active:scale-95">
                        <span className="material-symbols-outlined !text-[24px]">history</span>
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowNotifications(!showNotifications)} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm border border-pink-100 text-text-main transition-transform active:scale-95 hover:text-primary hover:bg-pink-50">
                            <span className="material-symbols-outlined !text-[24px]">notifications</span>
                            {unreadNotifications.length > 0 && (
                                <span className="absolute top-2.5 right-3 h-2 w-2 rounded-full bg-primary ring-2 ring-white animate-pulse"></span>
                            )}
                        </button>
                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                                <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-xl shadow-pink-500/10 border border-pink-100 p-0 overflow-hidden z-50 animate-slide-up origin-top-right">
                                    <div className="flex justify-between items-center p-4 border-b border-pink-50 bg-pink-50/30">
                                        <h4 className="font-bold text-text-main text-sm uppercase tracking-wider">Notificaciones</h4>
                                        <span className={`${unreadNotifications.length > 0 ? 'bg-primary text-white' : 'bg-pink-100 text-primary'} text-[10px] font-bold px-2 py-0.5 rounded-full`}>{unreadNotifications.length}</span>
                                    </div>
                                    
                                    {unreadNotifications.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                            <div className="h-12 w-12 rounded-full bg-pink-50 flex items-center justify-center mb-3">
                                                <span className="material-symbols-outlined text-primary !text-[24px]">notifications_paused</span>
                                            </div>
                                            <p className="text-text-main font-semibold text-sm">¡Todo al día!</p>
                                            <p className="text-text-muted text-xs mt-1 leading-relaxed">No tienes notificaciones<br/>nuevas en este momento.</p>
                                        </div>
                                    ) : (
                                        <div className="max-h-[60vh] overflow-y-auto">
                                            {unreadNotifications.map(item => {
                                                const catName = STOCK_CATEGORIES.find(c => c.id === item.category)?.name || item.category;
                                                return (
                                                    <div key={item.id} onClick={() => handleNotificationClick(item)} className="p-3 border-b border-pink-50 hover:bg-pink-50/50 cursor-pointer flex gap-3 transition-colors last:border-b-0 active:bg-pink-100">
                                                        <div className="h-10 w-10 shrink-0 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-sm">
                                                            <span className="material-symbols-outlined !text-[20px]">warning</span>
                                                        </div>
                                                        <div className="flex-1 flex flex-col justify-center">
                                                            <p className="text-sm font-bold text-text-main line-clamp-1">{item.name} <span className="text-text-muted text-xs font-normal">({catName})</span></p>
                                                            <p className="text-xs text-text-muted font-medium mt-0.5">Stock crítico: <span className="text-red-500 font-bold">{item.totalStock}</span> unidades</p>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <span className="material-symbols-outlined text-pink-300 !text-[16px]">chevron_right</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-2 space-y-6 pb-24 hide-scrollbar animate-fade-in">
                <section className="flex gap-3">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-300">search</span>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-none bg-white shadow-soft text-sm text-text-main focus:ring-2 focus:ring-primary/50 placeholder-pink-300/70"
                            placeholder="Buscar prendas..."
                            type="text"
                        />
                    </div>
                    <button onClick={() => setSearch('')} className="bg-white h-[52px] w-[52px] flex items-center justify-center rounded-2xl shadow-soft text-primary hover:bg-pink-50 transition-colors">
                        <span className="material-symbols-outlined">restart_alt</span>
                    </button>
                </section>

                <section className="grid grid-cols-2 gap-4">
                    <div className="bg-primary rounded-2xl p-5 shadow-glow text-white relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform"></div>
                        <span className="text-pink-100 text-xs font-medium uppercase tracking-wider">Total Unidades</span>
                        <p className="text-3xl font-bold mt-1">{stats.totalItems}</p>
                        <div className="flex items-center gap-1 mt-3 text-xs bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                            <span className="material-symbols-outlined !text-[14px]">check_circle</span>
                            <span>Inventario OK</span>
                        </div>
                    </div>
                    <div onClick={() => setActiveCategory(activeCategory === 'low_stock' ? 'all' : 'low_stock')} className={`rounded-2xl p-5 shadow-soft flex flex-col justify-center cursor-pointer transition-all ${activeCategory === 'low_stock' ? 'bg-pink-50 border border-primary text-primary scale-[1.02]' : 'bg-white border border-pink-100 hover:bg-pink-50'}`}>
                        <span className="text-text-muted text-xs font-medium uppercase tracking-wider">Stock Bajo</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <p className="text-3xl font-bold text-text-main">{stats.lowStockCount}</p>
                            <span className="text-xs text-orange-500 font-medium">alertas</span>
                        </div>
                        <p className="text-xs text-text-muted mt-2">Menos de 3 unid.</p>
                    </div>
                </section>

                <section className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === 'all' ? 'bg-primary text-white shadow-md' : 'bg-white text-text-muted border border-pink-100'}`}>
                        Todas
                    </button>
                    {STOCK_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat.id ? 'bg-primary text-white shadow-md' : 'bg-white text-text-muted border border-pink-100 hover:bg-pink-50'}`}>
                            {cat.name}
                        </button>
                    ))}
                </section>

                <section className="space-y-4 pb-20">
                    {filteredItems.length === 0 ? (
                        <p className="text-text-muted text-sm text-center py-10">No se encontraron prendas.</p>
                    ) : (
                        filteredItems.map(item => {
                            // Calcular total para la tarjeta
                            const totalStock = (item.stock?.s || 0) + (item.stock?.m || 0) + (item.stock?.l || 0) + (item.stock?.xl || 0);

                            // Etiqueta de color
                            const colorLabels = {
                                azul: 'Azul', blanco: 'Blanco', chocolate: 'Choco',
                                gris_petroleo: 'Gris', negro: 'Negro', verde: 'Verde'
                            };
                            const colorCodes = {
                                azul: '#3b82f6', blanco: '#f3f4f6', chocolate: '#7B3F00',
                                gris_petroleo: '#374151', negro: '#000000', verde: '#22c55e'
                            };

                            return (
                                <div key={item.id} onClick={() => onItemClick(item)} className="bg-white p-3 rounded-2xl shadow-soft border border-pink-50 flex items-center gap-4 transition-transform active:scale-[0.99] cursor-pointer">
                                    <div className="h-20 w-20 shrink-0 rounded-xl overflow-hidden relative bg-gray-100 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined !text-[32px]">checkroom</span>
                                        {item.category && (
                                            <div className="absolute bottom-1 right-1 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm" style={{
                                                backgroundColor: colorCodes[item.category],
                                                color: item.category === 'blanco' ? '#000' : '#fff',
                                                border: item.category === 'blanco' ? '1px solid #d1d5db' : 'none'
                                            }}>
                                                {colorLabels[item.category]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <h4 className="text-text-main font-bold text-base truncate pr-2">{item.name}</h4>
                                                    <p className="text-text-muted text-xs mt-0.5">{item.collection}</p>
                                                </div>
                                                {totalStock <= 3 && (
                                                    <span className="bg-orange-100 text-orange-600 border border-orange-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shadow-sm">
                                                        <span className="material-symbols-outlined !text-[12px] mr-0.5">warning</span>
                                                        BAJO
                                                    </span>
                                                )}
                                            </div>
                                            <button className="text-gray-300 hover:text-primary">
                                                <span className="material-symbols-outlined !text-[20px]">edit</span>
                                            </button>
                                        </div>
                                        <div className="flex items-end justify-between mt-3">
                                            {/* Desglose de talles */}
                                            <div className="flex gap-2 text-xs font-medium text-text-muted">
                                                <span>S: <span className="text-text-main font-bold">{item.stock?.s || 0}</span></span>
                                                <span className="text-pink-200">|</span>
                                                <span>M: <span className="text-text-main font-bold">{item.stock?.m || 0}</span></span>
                                                <span className="text-pink-200">|</span>
                                                <span>L: <span className="text-text-main font-bold">{item.stock?.l || 0}</span></span>
                                                <span className="text-pink-200">|</span>
                                                <span>XL: <span className="text-text-main font-bold">{item.stock?.xl || 0}</span></span>
                                            </div>

                                            {/* Badge de Total */}
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${totalStock <= 3 ? 'bg-orange-50' : 'bg-green-50'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${totalStock <= 3 ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                                                <span className={`text-xs font-bold ${totalStock <= 3 ? 'text-orange-600' : 'text-green-700'}`}>{totalStock}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>
            </main>
        </div>
    );
}

export default StockView;
