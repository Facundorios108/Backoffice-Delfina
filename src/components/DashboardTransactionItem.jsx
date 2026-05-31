import React from 'react';

function DashboardTransactionItem({ data, onClick }) {
    const isIncome = data.type === 'income';
    return (
        <div onClick={onClick} className="flex items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-transparent cursor-pointer hover:border-pink-200 transition-all">
            <div className={`flex items-center justify-center rounded-xl shrink-0 h-14 w-14 ${isIncome ? 'bg-green-50 text-green-600' : 'bg-pink-50 text-primary'}`}><span className="material-symbols-outlined !text-[28px]">{data.icon}</span></div>
            <div className="flex flex-col flex-1 min-w-0"><p className="text-text-main text-base font-semibold leading-tight line-clamp-2">{data.title}</p><p className="text-text-muted text-sm leading-normal mt-0.5">{data.subtitle}</p></div>
            <div className="shrink-0 text-right"><p className={`text-base font-bold ${isIncome ? 'text-green-600' : 'text-text-main'}`}>{isIncome ? '+' : '-'}${data.amount.toLocaleString()}</p><p className="text-xs text-text-muted mt-0.5">{data.fullDate}</p></div>
        </div>
    );
}

export default DashboardTransactionItem;
