import React from 'react';

function AccountAuthModal({ onClose, onLink, onLogin, onLogout, user, customPhotoURL, customDisplayName }) {
    const isAnonymous = user?.isAnonymous;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 border border-pink-100/50 animate-slide-up overflow-hidden">
                {/* Decoración superior */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-pink-400 to-primary"></div>

                <header className="flex justify-between items-center mb-5 mt-2">
                    <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">security</span>
                        {isAnonymous ? 'Asegurar tu Cuenta' : 'Mi Perfil de Delfina'}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                {isAnonymous ? (
                    <div className="space-y-5">
                        <div className="bg-pink-50/50 rounded-xl p-4 border border-pink-100 flex gap-3">
                            <span className="material-symbols-outlined text-primary !text-[28px] shrink-0 mt-0.5">cloud_queue</span>
                            <div>
                                <h4 className="text-sm font-bold text-text-main">¿Por qué asegurar tu cuenta?</h4>
                                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                    Actualmente usas un perfil temporal. Si limpias el historial del navegador o entras desde otro dispositivo, **perderás tus datos**.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Opción A: Vincular */}
                            <div className="p-4 bg-white hover:bg-pink-50/20 border border-gray-100 hover:border-primary/30 rounded-2xl transition-all shadow-sm group">
                                <h5 className="text-sm font-bold text-text-main flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                                    Opción A: Guardar datos en mi Google
                                </h5>
                                <p className="text-xs text-text-muted mt-1 leading-relaxed pl-3.5">
                                    Enlaza tus movimientos y stock actuales directamente a tu correo. Úsalo si esta es la computadora principal donde cargaste los datos.
                                </p>
                                <button onClick={onLink} className="w-full mt-3 bg-primary text-white font-bold py-3 px-4 rounded-xl shadow-md hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 text-sm active:scale-[0.98]">
                                    <span className="material-symbols-outlined !text-[20px]">link</span>
                                    <span>Vincular datos con Google</span>
                                </button>
                            </div>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-100"></div>
                                <span className="flex-shrink mx-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">o también</span>
                                <div className="flex-grow border-t border-gray-100"></div>
                            </div>

                            {/* Opción B: Iniciar Sesión */}
                            <div className="p-4 bg-white hover:bg-pink-50/20 border border-gray-100 hover:border-primary/30 rounded-2xl transition-all shadow-sm group">
                                <h5 className="text-sm font-bold text-text-main flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                    Opción B: Cargar cuenta existente
                                </h5>
                                <p className="text-xs text-text-muted mt-1 leading-relaxed pl-3.5">
                                    Carga la información que ya vinculaste previamente en otro celular o navegador. *(Se descartará el perfil temporal actual)*.
                                </p>
                                <button onClick={onLogin} className="w-full mt-3 bg-white text-text-main border border-pink-200 hover:border-primary/30 hover:bg-pink-50/20 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm active:scale-[0.98]">
                                    <span className="material-symbols-outlined !text-[20px] text-primary">login</span>
                                    <span>Iniciar sesión con Google</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 text-center py-4">
                        <div className="flex flex-col items-center gap-3">
                            {customPhotoURL ? (
                                <img src={customPhotoURL} alt="Custom Avatar" className="w-20 h-20 rounded-full border-4 border-primary/20 shadow-md animate-fade-in object-cover" />
                            ) : user.photoURL ? (
                                <img src={user.photoURL} alt="Google Avatar" className="w-20 h-20 rounded-full border-4 border-primary/20 shadow-md animate-fade-in" />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-primary-soft flex items-center justify-center text-primary border-4 border-primary/20">
                                    <span className="material-symbols-outlined !text-[44px]">account_circle</span>
                                </div>
                            )}
                            <div>
                                <h4 className="text-lg font-bold text-text-main">{customDisplayName || user.displayName || 'Usuario de Delfina'}</h4>
                                <p className="text-xs text-text-muted font-medium mt-0.5">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-full border border-green-200 text-xs font-semibold shadow-sm mt-1">
                                <span className="material-symbols-outlined !text-[16px] text-green-500">cloud_done</span>
                                <span>Datos Asegurados y Sincronizados</span>
                            </div>
                        </div>

                        <div className="h-px bg-pink-100/50 my-2"></div>

                        <div className="space-y-3">
                            <p className="text-[11px] text-text-muted leading-relaxed px-4">
                                Has iniciado sesión de forma segura con tu cuenta de Google. Todos tus cambios en movimientos, stock y producción se guardan y sincronizan en la nube.
                            </p>
                            <button onClick={onLogout} className="w-full bg-red-50 hover:bg-red-100 text-red-500 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm border border-red-100 active:scale-[0.98]">
                                <span className="material-symbols-outlined !text-[20px]">logout</span>
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AccountAuthModal;
