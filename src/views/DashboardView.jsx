import React, { useState, useEffect, useRef } from 'react';
import DashboardTransactionItem from '../components/DashboardTransactionItem';
import FinancialChart from '../components/FinancialChart';

function DashboardView({ stats, transactions, onTransactionClick, onViewAll, onOpenAnalytics, onOpenProductionTasks, productionTasks, onNavigateToTransactions, user, onOpenAuthModal, onLogout }) {
    const scrollRef = useRef(null);
    const [isBalanceHidden, setIsBalanceHidden] = useState(() => localStorage.getItem('delfinaHideBalance') === 'true');
    
    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, []);

    // Calcular cantidad de tareas en producción
    const tasksInProgress = productionTasks.filter(task => task.status === 'produccion').length;
    const tasksPending = productionTasks.filter(task => task.status === 'pendiente').length;

    const toggleBalanceVisibility = (e) => {
        e.stopPropagation();
        const newVal = !isBalanceHidden;
        setIsBalanceHidden(newVal);
        localStorage.setItem('delfinaHideBalance', String(newVal));
    };

    return (
        <>
            {/* Logo Centrado */}
            <div className="flex justify-center items-center px-4 py-3 bg-background-light">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white shadow-lg border-4 border-pink-50">
                    <img src="/logo-delfina-dashboard.png" alt="Delfina Logo" className="w-full h-full object-cover" />
                </div>
            </div>

            <main ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-3 space-y-4 hide-scrollbar">
                <section className="w-full flex flex-col gap-4">
                    <div onClick={onOpenAnalytics} className="w-full bg-primary rounded-2xl p-6 shadow-glow text-white relative overflow-hidden flex flex-col justify-center h-[200px] group cursor-pointer active:scale-[0.99] transition-transform">
                        <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <span className="text-pink-100 text-sm font-medium uppercase tracking-wider">Balance Total</span>
                                <span onClick={toggleBalanceVisibility} className="material-symbols-outlined text-pink-100 !text-[24px] cursor-pointer hover:text-white transition-colors">
                                    {isBalanceHidden ? 'visibility_off' : 'visibility'}
                                </span>
                            </div>
                            <p className="text-[42px] font-bold tracking-tight leading-none mt-2">
                                {isBalanceHidden ? '***' : `$${stats.totalBalance.toLocaleString()}`}
                            </p>
                            <div className={`flex items-center gap-1.5 mt-4 text-xs w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm ${stats.isBalanceUp ? 'bg-white/20' : 'bg-red-900/30'}`}>
                                <span className="material-symbols-outlined !text-[16px]">{stats.isBalanceUp ? 'trending_up' : 'trending_down'}</span>
                                <span className="font-medium">{stats.balanceGrowth > 0 ? '+' : ''}{stats.balanceGrowth}% vs mes anterior</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div onClick={() => onNavigateToTransactions && onNavigateToTransactions({ type: 'income', date: 'month' })} className="bg-white border border-pink-100 rounded-2xl p-5 shadow-soft flex flex-col justify-between h-[165px] cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]">
                            <div className="flex justify-between items-start">
                                <div className="bg-green-100 text-green-600 w-10 h-10 flex items-center justify-center rounded-full">
                                    <span className="material-symbols-outlined !text-[24px]">arrow_downward</span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${stats.isIncomeUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>{stats.isIncomeUp ? '+' : ''}{stats.incomeGrowth}%</span>
                            </div>
                            <div><span className="text-text-muted text-sm font-medium block mb-1">Ingresos (Mes)</span><p className="text-text-main text-2xl font-bold leading-tight">${stats.currentIncome.toLocaleString()}</p></div>
                        </div>
                        <div onClick={() => onNavigateToTransactions && onNavigateToTransactions({ type: 'expense', date: 'month' })} className="bg-white border border-pink-100 rounded-2xl p-5 shadow-soft flex flex-col justify-between h-[165px] cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]">
                            <div className="flex justify-between items-start">
                                <div className="bg-orange-100 text-orange-600 w-10 h-10 flex items-center justify-center rounded-full">
                                    <span className="material-symbols-outlined !text-[24px]">arrow_upward</span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${stats.isExpenseUp ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'}`}>{stats.isExpenseUp ? '+' : ''}{stats.expenseGrowth}%</span>
                            </div>
                            <div><span className="text-text-muted text-sm font-medium block mb-1">Gastos (Mes)</span><p className="text-text-main text-2xl font-bold leading-tight">${stats.currentExpense.toLocaleString()}</p></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div onClick={onOpenAnalytics} className="relative bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-[0.98] flex flex-col justify-between h-[120px] group overflow-hidden">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 pointer-events-none"></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <span className="text-white text-sm font-bold">Analytics</span>
                                <span className="material-symbols-outlined text-white !text-[28px]">analytics</span>
                            </div>
                            <div className="relative z-10 flex items-center gap-1 text-white/80 text-xs">
                                <span>Ver estadísticas</span>
                                <span className="material-symbols-outlined !text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </div>
                        </div>
                        <div onClick={onOpenProductionTasks} className="relative bg-gradient-to-br from-primary to-pink-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-[0.98] flex flex-col justify-between h-[120px] group overflow-hidden">
                            {(tasksInProgress > 0 || tasksPending > 0) && (
                                <div className="absolute top-3 right-3 bg-white text-primary w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-20">
                                    {tasksInProgress + tasksPending}
                                </div>
                            )}
                            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 pointer-events-none"></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <span className="text-white text-sm font-bold">To-Do List</span>
                                <span className="material-symbols-outlined text-white !text-[28px]">checklist</span>
                            </div>
                            <div className="relative z-10 flex items-center gap-1 text-white/80 text-xs">
                                <span>Ver producción</span>
                                <span className="material-symbols-outlined !text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="bg-white rounded-2xl p-6 shadow-soft border border-pink-50">
                    <div className="flex items-center justify-between mb-6">
                        <div><h3 className="text-text-main font-bold text-xl">Evolución</h3><p className="text-text-muted text-sm">Historial de balance</p></div>
                    </div>
                    <FinancialChart transactions={transactions} />
                </section>
                <section>
                    <div className="flex items-center justify-between mb-4"><h3 className="text-text-main font-bold text-xl">Movimientos Recientes</h3><button onClick={onViewAll} className="text-primary text-sm font-semibold hover:text-primary-dark transition-colors">Ver todos</button></div>
                    <div className="flex flex-col gap-4">
                        {transactions.length === 0 ? <p className="text-text-muted text-sm italic text-center py-4">No hay movimientos.</p> : transactions.slice(0, 3).map((tx) => <DashboardTransactionItem key={tx.id} data={tx} onClick={() => onTransactionClick(tx)} />)}
                    </div>
                </section>
            </main>
        </>
    );
}

export default DashboardView;
