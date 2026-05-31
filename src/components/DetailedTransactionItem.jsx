import React from 'react';

function DetailedTransactionItem({ data, onClick }) {
    const isIncome = data.type === 'income';
    return (
        <div onClick={onClick} className="group relative flex items-center justify-between gap-4 rounded-2xl bg-white p-3 transition-colors hover:bg-primary-soft cursor-pointer">
            <div className="flex items-center gap-4"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}><span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{data.icon}</span></div><div className="flex flex-col justify-center min-w-0 flex-1"><p className="text-base font-semibold text-text-main line-clamp-2">{data.title}</p><p className="text-sm text-gray-500 line-clamp-1">{data.subtitle}</p></div></div>
            <div className="shrink-0 flex flex-col items-end"><p className={`text-base font-bold ${isIncome ? 'text-primary' : 'text-gray-900'}`}>{isIncome ? '+' : '-'} ${data.amount.toLocaleString()}</p><span className="material-symbols-outlined text-gray-300 text-sm mt-1 group-hover:text-primary">edit</span></div>
        </div>
    );
}

export default DetailedTransactionItem;
