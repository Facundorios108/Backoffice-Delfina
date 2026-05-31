import React, { useState } from 'react';

function LoginScreen({ onLoginGoogle, onLoginGuest, onLoginEmail, onRegisterEmail }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) { setError('Completa todos los campos'); return; }
        setError('');
        setLoading(true);
        try {
            if (isRegister) {
                await onRegisterEmail(email, password);
            } else {
                await onLoginEmail(email, password);
            }
        } catch (err) {
            let friendlyMsg = err.message;
            if (err.code === 'auth/invalid-credential') friendlyMsg = 'Correo o contraseña incorrectos.';
            else if (err.code === 'auth/email-already-in-use') friendlyMsg = 'Este correo ya está registrado.';
            else if (err.code === 'auth/weak-password') friendlyMsg = 'La contraseña debe tener al menos 6 caracteres.';
            else if (err.code === 'auth/invalid-email') friendlyMsg = 'El formato del correo no es válido.';
            setError(friendlyMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background-light flex flex-col justify-center items-center p-6 overflow-y-auto">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-soft border border-pink-50 p-8 space-y-6 animate-fade-in relative overflow-hidden">
                {/* Decoración superior */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-pink-400 to-primary"></div>

                {/* Logo */}
                <div className="flex flex-col items-center gap-2 mt-2">
                    <img src="/logo-delfina.png" alt="Delfina Logo" className="w-16 h-16 object-contain" />
                    <h2 className="text-2xl font-bold text-text-main tracking-tight mt-2">Delfina Concept</h2>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Gestión Financiera & Stock</p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-500 rounded-xl text-xs font-semibold flex items-center gap-2">
                            <span className="material-symbols-outlined !text-[16px]">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-main ml-1 uppercase tracking-wide">Correo Electrónico</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 !text-[20px]">mail</span>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                className="block w-full pl-11 pr-4 py-3 border border-pink-100 rounded-xl bg-gray-50 text-sm focus:ring-primary focus:border-primary text-text-main focus:outline-none" 
                                placeholder="correo@ejemplo.com" 
                                required 
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-main ml-1 uppercase tracking-wide">Contraseña</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 !text-[20px]">lock</span>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="block w-full pl-11 pr-4 py-3 border border-pink-100 rounded-xl bg-gray-50 text-sm focus:ring-primary focus:border-primary text-text-main focus:outline-none" 
                                placeholder="••••••••" 
                                required 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm active:scale-[0.98] mt-2 disabled:opacity-55"
                    >
                        <span>{loading ? 'Procesando...' : isRegister ? 'Registrarse' : 'Ingresar'}</span>
                        <span className="material-symbols-outlined !text-[18px]">arrow_forward</span>
                    </button>
                </form>

                <div className="flex justify-center">
                    <button 
                        type="button"
                        onClick={() => { setIsRegister(!isRegister); setError(''); }}
                        className="text-xs text-primary font-bold hover:underline"
                    >
                        {isRegister ? '¿Ya tienes una cuenta? Iniciar Sesión' : '¿No tienes cuenta? Regístrate aquí'}
                    </button>
                </div>

                {/* Divisor */}
                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink mx-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">o ingresa con</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                </div>

                {/* Google Button */}
                <button 
                    type="button"
                    onClick={onLoginGoogle}
                    className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-text-main font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-3 text-sm active:scale-[0.98] shadow-sm"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="w-5 h-5 object-contain" />
                    <span>Iniciar Sesión con Google</span>
                </button>

                {/* Divisor */}
                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink mx-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">modo de prueba</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                </div>

                {/* Guest Mode Button */}
                <button 
                    type="button"
                    onClick={onLoginGuest}
                    className="w-full bg-pink-50/50 hover:bg-pink-100/50 border border-dashed border-pink-200 text-primary font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined !text-[20px] text-primary">cloud_queue</span>
                    <span>Entrar como Invitado (Modo Temporal)</span>
                </button>
            </div>
        </div>
    );
}

export default LoginScreen;
