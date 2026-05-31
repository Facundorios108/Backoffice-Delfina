import React from 'react';

function NavButton({ icon, label, isActive, onClick }) {
    return (
        <button onClick={onClick} className={`flex flex-col items-center gap-1 w-20 group transition-colors ${isActive ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}>
            <span className={`material-symbols-outlined transition-transform group-hover:scale-110 ${isActive ? 'filled-icon' : ''}`}>{icon}</span>
            <span className="text-[11px] font-medium">{label}</span>
        </button>
    );
}

export default NavButton;
