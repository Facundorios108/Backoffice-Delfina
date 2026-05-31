import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TRANSACTION_CATEGORIES, PAYMENT_METHODS } from '../constants';
import DetailedTransactionItem from '../components/DetailedTransactionItem';

function TransactionsView({ transactions, totals, onTransactionClick, initialFilterType = 'all', initialFilterDate = 'all' }) {
    const scrollRef = useRef(null);

    // --- State para Filtros ---
    const [filterDate, setFilterDate] = useState(initialFilterDate);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterType, setFilterType] = useState(initialFilterType);
    const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showCustomDateModal, setShowCustomDateModal] = useState(false);

    useEffect(() => {
        const handleClick = () => setActiveDropdown(null);
        if (activeDropdown) window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [activeDropdown]);

    // Scroll al top cuando la vista se monta o se vuelve a mostrar
    useEffect(() => {
        // Usar requestAnimationFrame para asegurar que el DOM está listo
        requestAnimationFrame(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = 0;
            }
            window.scrollTo(0, 0);
        });
    }, []);

    // --- Lógica de Filtrado ---
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const dateStr = tx.fullDate || "2023-01-01";
            const [y, m, d] = dateStr.split('-').map(Number);
            const txDate = new Date(y, m - 1, d);
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            let dateMatch = true;
            if (filterDate === 'year') dateMatch = txDate.getFullYear() === now.getFullYear();
            else if (filterDate === 'month') dateMatch = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            else if (filterDate === 'week') {
                const day = now.getDay() || 7; if (day !== 1) now.setHours(-24 * (day - 1));
                const weekStart = now.getTime(); const weekEnd = weekStart + (7 * 24 * 60 * 60 * 1000);
                const txTime = txDate.getTime(); dateMatch = txTime >= weekStart && txTime < weekEnd;
            } else if (filterDate === 'custom') {
                if (customRange.start && customRange.end) {
                    const start = new Date(customRange.start + 'T00:00:00').getTime();
                    const end = new Date(customRange.end + 'T23:59:59').getTime();
                    const txTime = txDate.getTime(); dateMatch = txTime >= start && txTime <= end;
                }
            }

            let catMatch = filterCategory === 'all' || tx.category === filterCategory;
            let typeMatch = filterType === 'all' || tx.type === filterType;

            // Filtro de método de pago: si está activo, solo mostrar las que coincidan
            let paymentMatch = true;
            if (filterPaymentMethod !== 'all') {
                paymentMatch = tx.paymentMethod === filterPaymentMethod;
            }

            return dateMatch && catMatch && typeMatch && paymentMatch;
        }).sort((a, b) => {
            const dateA = a.fullDate || "2023-01-01";
            const dateB = b.fullDate || "2023-01-01";
            return dateB.localeCompare(dateA);
        });
    }, [transactions, filterDate, filterCategory, filterType, customRange, filterPaymentMethod]);

    const grouped = filteredTransactions.reduce((acc, tx) => {
        const [y, m, d] = (tx.fullDate || "").split('-');
        const dateObj = new Date(y, m - 1, d);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let label = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        if (dateObj.toDateString() === today.toDateString()) label = "Hoy";
        else if (dateObj.toDateString() === yesterday.toDateString()) label = "Ayer";

        if (!acc[label]) acc[label] = []; acc[label].push(tx); return acc;
    }, {});
    const sections = Object.keys(grouped);

    const getFilterLabel = () => {
        if (filterDate === 'all') return 'Todo';
        if (filterDate === 'year') return 'Este Año';
        if (filterDate === 'month') return 'Este Mes';
        if (filterDate === 'week') return 'Esta Semana';
        if (filterDate === 'custom') return 'Personalizado';
    };

    const exportToCSV = () => {
        if (filteredTransactions.length === 0) {
            alert('No hay movimientos para exportar con estos filtros.');
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
        csvContent += "Fecha,Tipo,Categoría,Metodo de Pago,Descripcion,Monto\r\n";
        
        filteredTransactions.forEach(tx => {
            const fecha = tx.fullDate || "";
            const tipo = tx.type === 'income' ? 'Ingreso' : 'Egreso';
            const categoria = (TRANSACTION_CATEGORIES.find(c => c.id === tx.category)?.name || tx.category || "");
            const pago = (PAYMENT_METHODS.find(m => m.id === tx.paymentMethod)?.name || tx.paymentMethod || "Efectivo");
            const desc = (tx.description || "").replace(/,/g, "-").replace(/\n/g, " "); 
            const monto = tx.amount || 0;
            
            csvContent += `${fecha},${tipo},${categoria},${pago},${desc},${monto}\r\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Movimientos_Delfina_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getCategoryLabel = () => {
        if (filterCategory === 'all') return 'Categoría';
        const cat = TRANSACTION_CATEGORIES.find(c => c.id === filterCategory);
        return cat ? cat.name : 'Categoría';
    };

    const getTypeLabel = () => {
        if (filterType === 'all') return 'Tipo';
        if (filterType === 'income') return 'Ingresos';
        if (filterType === 'expense') return 'Egresos';
    };

    const getPaymentMethodLabel = () => {
        if (filterPaymentMethod === 'all') return 'Pago';
        const method = PAYMENT_METHODS.find(m => m.id === filterPaymentMethod);
        return method ? method.name : 'Pago';
    };

    return (
        <div className="flex flex-col h-full bg-background-light">
            <div className="z-20 flex flex-col bg-background-light/95 backdrop-blur-md pt-4 sticky top-0">
                <div className="flex items-center justify-between px-6 pt-4 pb-2">
                    <div className="flex flex-col"><h1 className="text-3xl font-bold tracking-tight text-text-main">Mis Movimientos</h1><p className="text-sm text-text-sub font-medium mt-1">Control de caja</p></div>
                    <button onClick={exportToCSV} className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-white border border-gray-200 text-text-muted hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-95 shadow-sm" title="Exportar Movimientos a CSV">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                </div>
                <div className="flex w-full gap-3 flex-wrap px-6 py-4 relative">
                    {/* Fecha */}
                    <div className="relative shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'date' ? null : 'date'); }} className={`group flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full pl-4 pr-3 shadow-sm transition-all active:scale-95 ${filterDate !== 'all' ? 'bg-primary text-white shadow-primary/20' : 'bg-white border border-gray-200 text-text-muted'}`}><span className="text-sm font-semibold leading-normal capitalize">📅 {getFilterLabel()}</span><span className="material-symbols-outlined text-[18px]">expand_more</span></button>
                        {activeDropdown === 'date' && (
                            <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-48 animate-fade-in">
                                <button onClick={() => setFilterDate('all')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Todo</button>
                                <button onClick={() => setFilterDate('year')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Este Año</button>
                                <button onClick={() => setFilterDate('month')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Este Mes</button>
                                <button onClick={() => setFilterDate('week')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Esta Semana</button>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <button onClick={() => { setShowCustomDateModal(true); setFilterDate('custom'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Personalizado...</button>
                            </div>
                        )}
                    </div>

                    {/* Categoría */}
                    <div className="relative shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'category' ? null : 'category'); }} className={`group flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full pl-4 pr-3 border transition-all active:scale-95 ${filterCategory !== 'all' ? 'bg-primary text-white border-transparent' : 'bg-white border-gray-200 text-text-muted'}`}><span className="text-sm font-medium leading-normal">🏷️ {getCategoryLabel()}</span><span className="material-symbols-outlined text-[18px]">expand_more</span></button>
                        {activeDropdown === 'category' && (
                            <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-48 animate-fade-in max-h-60 overflow-y-auto">
                                <button onClick={() => setFilterCategory('all')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Todas</button>
                                {TRANSACTION_CATEGORIES.map(cat => (
                                    <button key={cat.id} onClick={() => setFilterCategory(cat.id)} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50">{cat.name}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tipo */}
                    <div className="relative shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'type' ? null : 'type'); }} className={`group flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full pl-4 pr-3 border transition-all active:scale-95 ${filterType !== 'all' ? 'bg-primary text-white border-transparent' : 'bg-white border-gray-200 text-text-muted'}`}><span className="text-sm font-medium leading-normal">💰 {getTypeLabel()}</span><span className="material-symbols-outlined text-[18px]">expand_more</span></button>
                        {activeDropdown === 'type' && (
                            <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-40 animate-fade-in">
                                <button onClick={() => setFilterType('all')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Todos</button>
                                <button onClick={() => setFilterType('income')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Ingresos</button>
                                <button onClick={() => setFilterType('expense')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Egresos</button>
                            </div>
                        )}
                    </div>

                    {/* Pago */}
                    <div className="relative shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'payment' ? null : 'payment'); }} className={`group flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full pl-4 pr-3 border transition-all active:scale-95 ${filterPaymentMethod !== 'all' ? 'bg-primary text-white border-transparent' : 'bg-white border-gray-200 text-text-muted'}`}><span className="text-sm font-medium leading-normal">💳 {getPaymentMethodLabel()}</span><span className="material-symbols-outlined text-[18px]">expand_more</span></button>
                        {activeDropdown === 'payment' && (
                            <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-48 animate-fade-in">
                                <button onClick={() => setFilterPaymentMethod('all')} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Todos</button>
                                {PAYMENT_METHODS.map(method => (
                                    <button key={method.id} onClick={() => setFilterPaymentMethod(method.id)} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50">{method.name}</button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto pb-24 scroll-smooth animate-fade-in">
                <div className="px-6 pt-6 pb-2">
                    <div className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-br from-primary-soft to-white border border-primary/10 p-4 shadow-sm">
                        <div className="flex flex-col gap-1"><span className="text-xs font-semibold uppercase tracking-wider text-text-sub">Balance Total</span><span className="text-2xl font-bold text-text-main">${totals.totalBalance.toLocaleString()}</span></div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm"><span className="material-symbols-outlined">account_balance_wallet</span></div>
                    </div>
                </div>
                {sections.length === 0 ? <div className="flex flex-col items-center justify-center py-20 opacity-50"><span className="material-symbols-outlined text-5xl mb-3 text-gray-300">filter_list_off</span><p className="font-medium text-gray-400">No se encontraron movimientos</p></div> : sections.map(sectionDate => (
                    <div key={sectionDate} className="flex flex-col mt-4 first:mt-2">
                        <div className="sticky top-0 z-10 bg-background-light/95 backdrop-blur-sm px-6 py-3"><h3 className="text-sm font-bold uppercase tracking-wider text-text-sub capitalize">{sectionDate}</h3></div>
                        <div className="flex flex-col px-4 gap-2">{grouped[sectionDate].map(tx => <DetailedTransactionItem key={tx.id} data={tx} onClick={() => onTransactionClick(tx)} />)}</div>
                    </div>
                ))}
                <div className="h-24"></div>
            </div>

            {showCustomDateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-slide-up">
                        <h3 className="text-lg font-bold text-text-main mb-4">Filtrar por Fecha</h3>
                        <div className="space-y-4">
                            <div><label className="text-xs font-semibold text-text-muted uppercase mb-1 block">Desde</label><input type="date" value={customRange.start} onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} className="w-full rounded-xl border-gray-200 bg-gray-50 text-sm focus:ring-primary focus:border-primary" /></div>
                            <div><label className="text-xs font-semibold text-text-muted uppercase mb-1 block">Hasta</label><input type="date" value={customRange.end} onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} className="w-full rounded-xl border-gray-200 bg-gray-50 text-sm focus:ring-primary focus:border-primary" /></div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => { setShowCustomDateModal(false); setFilterDate('all') }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-text-muted font-medium text-sm">Cancelar</button>
                                <button onClick={() => setShowCustomDateModal(false)} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30">Aplicar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TransactionsView;
