import React, { useState, useEffect, useRef } from 'react';
import { 
    TRANSACTION_CATEGORIES, 
    PAYMENT_METHODS, 
    STOCK_CATEGORIES 
} from '../constants';
import { 
    db, 
    appId, 
    collection, 
    addDoc, 
    setDoc, 
    doc, 
    getDoc, 
    serverTimestamp 
} from '../firebase';

export default function ProfileView({ 
    user, 
    onOpenAuthModal, 
    onLogout, 
    transactions, 
    stockItems, 
    showCustomAlert, 
    showCustomConfirm, 
    settings, 
    onUpdateSettings, 
    customPhotoURL, 
    onUpdateCustomPhoto, 
    customDisplayName, 
    onUpdateCustomDisplayName 
}) {
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    
    // Estados para el formulario de soporte
    const [ticketTitle, setTicketTitle] = useState('');
    const [ticketMessage, setTicketMessage] = useState('');
    const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
    
    // Estado de la conexión Firebase
    const [isFirebaseOnline, setIsFirebaseOnline] = useState(true);
    
    // Detectar modo de visualización de la PWA
    const [pwaMode, setPwaMode] = useState('Navegador Web');
    
    // Estados temporales para la Sala de Control
    const [tempSettings, setTempSettings] = useState(null);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [selectedListKey, setSelectedListKey] = useState('transactionCategories');
    
    // Estados para el modal de PIN
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinModalMode, setPinModalMode] = useState('create'); // 'create' o 'change'
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [newItemIcon, setNewItemIcon] = useState('checkroom');
    const [newItemColorCode, setNewItemColorCode] = useState('bg-pink-500');
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingItemName, setEditingItemName] = useState('');

    // Estados para el editor de nombre personalizado
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');

    useEffect(() => {
        if (settings) {
            setTempSettings(JSON.parse(JSON.stringify(settings)));
        }
    }, [settings]);

    // Scroll al top cuando la vista se monta o se vuelve a mostrar
    useEffect(() => {
        // Usar requestAnimationFrame para asegurar que el DOM está listo
        requestAnimationFrame(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = 0;
            }
            window.scrollTo(0, 0);
        });
        
        // Verificar si estamos en modo PWA standalone
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
            || window.navigator.standalone 
            || document.referrer.includes('android-app://');
        if (isStandalone) {
            setPwaMode('PWA (Standalone)');
        }
        
        // Monitorear estado de red para simular conexión Firebase
        const handleOnline = () => setIsFirebaseOnline(true);
        const handleOffline = () => setIsFirebaseOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // --- MANEJADORES FOTO DE PERFIL ---
    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 1024 * 1024 * 1.5) {
            showCustomAlert('Imagen muy pesada', 'Por favor, selecciona una imagen de menos de 1.5 MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64data = reader.result;
            
            try {
                onUpdateCustomPhoto(base64data);
                localStorage.setItem(`delfinaCustomPhoto_${user.uid}`, base64data);
                
                const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
                const snap = await getDoc(profileRef);
                const currentData = snap.exists() ? snap.data() : {};
                await setDoc(profileRef, { ...currentData, customPhotoURL: base64data });
                
                showCustomAlert('Foto Actualizada', '¡Tu foto de perfil se ha guardado correctamente!');
            } catch (err) {
                console.error('Error saving profile photo:', err);
                showCustomAlert('Error', 'No se pudo guardar la imagen en la base de datos.');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveName = async () => {
        if (!tempName.trim()) {
            showCustomAlert('Nombre vacío', 'Por favor, introduce un nombre válido.');
            return;
        }
        try {
            onUpdateCustomDisplayName(tempName.trim());
            localStorage.setItem(`delfinaCustomName_${user.uid}`, tempName.trim());
            
            const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
            const snap = await getDoc(profileRef);
            const currentData = snap.exists() ? snap.data() : {};
            await setDoc(profileRef, { ...currentData, customDisplayName: tempName.trim() });
            
            setIsEditingName(false);
            showCustomAlert('Nombre Actualizado', '¡Tu nombre de perfil se ha guardado correctamente!');
        } catch (err) {
            console.error('Error saving profile name:', err);
            showCustomAlert('Error', 'No se pudo guardar el nombre en la base de datos.');
        }
    };

    // --- MANEJADORES CRUD SALA DE CONTROL ---
    const handleAddItem = () => {
        if (!newItemName.trim() || !tempSettings) return;
        
        const key = newItemName.trim().toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const newList = [...tempSettings[selectedListKey]];
        
        if (newList.some(item => item.id === key)) {
            showCustomAlert('Duplicado', 'Ya existe una opción con un nombre similar.');
            return;
        }
        
        const newItem = {
            id: key,
            name: newItemName.trim(),
            enabled: true
        };
        
        if (selectedListKey === 'transactionCategories') {
            newItem.icon = newItemIcon;
        } else if (selectedListKey === 'stockCategories') {
            newItem.colorCode = newItemColorCode;
        }
        
        setTempSettings({
            ...tempSettings,
            [selectedListKey]: [...tempSettings[selectedListKey], newItem]
        });
        setNewItemName('');
    };

    const handleToggleItem = (itemId) => {
        if (!tempSettings) return;
        const updatedList = tempSettings[selectedListKey].map(item => {
            if (item.id === itemId) {
                return { ...item, enabled: !item.enabled };
            }
            return item;
        });
        
        setTempSettings({
            ...tempSettings,
            [selectedListKey]: updatedList
        });
    };

    const handleDeleteItem = (itemId) => {
        if (!tempSettings) return;
        const remaining = tempSettings[selectedListKey].filter(item => item.id !== itemId);
        if (remaining.length === 0) {
            showCustomAlert('Error', 'Debe haber al menos una opción en la lista.');
            return;
        }
        
        showCustomConfirm(
            'Confirmar Eliminación',
            '¿Estás seguro de que deseas eliminar esta opción? Los movimientos o stock existentes con esta categoría seguirán registrados, pero no podrás seleccionarla para nuevos registros.',
            () => {
                setTempSettings({
                    ...tempSettings,
                    [selectedListKey]: remaining
                });
            }
        );
    };

    const handleSaveControlRoom = async () => {
        if (!tempSettings) return;
        setIsSavingSettings(true);
        try {
            const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'controlRoom');
            await setDoc(settingsRef, tempSettings);
            
            onUpdateSettings(tempSettings);
            showCustomAlert('Configuración Guardada', 'La Sala de Control se ha actualizado con éxito y los cambios ya están aplicados en toda la aplicación.');
        } catch (err) {
            console.error(err);
            showCustomAlert('Error', 'Hubo un error al guardar los ajustes.');
        } finally {
            setIsSavingSettings(false);
        }
    };
    
    // --- MANEJADORES DE EXPORTACIÓN A CSV ---
    const handleExportTransactions = () => {
        if (!transactions || transactions.length === 0) {
            showCustomAlert('Error', 'No hay transacciones financieras para exportar.');
            return;
        }
        
        try {
            let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
            csvContent += "Fecha,Tipo,Categoría,Metodo de Pago,Descripcion,Monto\r\n";
            
            const categories = typeof TRANSACTION_CATEGORIES !== 'undefined' ? TRANSACTION_CATEGORIES : [];
            const paymentMethods = typeof PAYMENT_METHODS !== 'undefined' ? PAYMENT_METHODS : [];
            
            transactions.forEach(tx => {
                const fecha = tx.fullDate || "";
                const tipo = tx.type === 'income' ? 'Ingreso' : 'Egreso';
                const categoria = (categories.find(c => c.id === tx.category)?.name || tx.category || "");
                const pago = (paymentMethods.find(m => m.id === tx.paymentMethod)?.name || tx.paymentMethod || "Efectivo");
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
            showCustomAlert('Copia de Seguridad', 'Se ha exportado correctamente todo el historial financiero a CSV.');
        } catch (err) {
            console.error(err);
            showCustomAlert('Error', 'Hubo un error al generar la copia de seguridad.');
        }
    };
    
    const handleExportStock = () => {
        if (!stockItems || stockItems.length === 0) {
            showCustomAlert('Error', 'No hay items en el stock para exportar.');
            return;
        }
        
        try {
            let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
            csvContent += "Articulo,Categoría,Precio,Talle S,Talle M,Talle L,Talle XL,Total Unidades\r\n";
            
            const categories = typeof STOCK_CATEGORIES !== 'undefined' ? STOCK_CATEGORIES : [];
            
            stockItems.forEach(item => {
                const nombre = (item.name || "").replace(/,/g, "-").replace(/\n/g, " ");
                const cat = categories.find(c => c.id === item.category)?.name || item.category || "";
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
            showCustomAlert('Copia de Seguridad', 'Se ha exportado correctamente todo el catálogo de stock a CSV.');
        } catch (err) {
            console.error(err);
            showCustomAlert('Error', 'Hubo un error al generar la copia de seguridad.');
        }
    };
    
    // --- MANEJADORES DEL MODAL DE PIN ---
    const handleOpenPinModal = (mode) => {
        setPinModalMode(mode);
        setPinInput('');
        setPinError('');
        setShowPinModal(true);
    };
    
    const handleClosePinModal = () => {
        setShowPinModal(false);
        setPinInput('');
        setPinError('');
    };
    
    const handlePinInputChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Solo dígitos
        if (value.length <= 6) {
            setPinInput(value);
            setPinError('');
        }
    };
    
    const handleSavePin = () => {
        if (pinInput.length < 4 || pinInput.length > 6) {
            setPinError('El PIN debe tener entre 4 y 6 dígitos');
            return;
        }
        
        localStorage.setItem('delfina_backup_pin', pinInput);
        showCustomAlert(
            pinModalMode === 'create' ? 'PIN Configurado' : 'PIN Actualizado',
            'Tu PIN de respaldo ha sido guardado correctamente.'
        );
        handleClosePinModal();
    };
    
    // --- MANEJADOR DE ENVIAR TICKET SOPORTE ---
    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        if (!ticketTitle.trim() || !ticketMessage.trim()) {
            showCustomAlert('Campos Incompletos', 'Por favor, completa el título y el mensaje del ticket.');
            return;
        }
        
        setIsSubmittingTicket(true);
        
        try {
            // 1. Guardar ticket en Firebase Firestore
            const supportTicketsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'supportTickets');
            await addDoc(supportTicketsRef, {
                type: 'soporte',
                title: ticketTitle,
                message: ticketMessage,
                createdAt: serverTimestamp(),
                status: 'abierto'
            });
            
            // 2. Enviar el correo directamente usando FormSubmit AJAX API
            const emailDest = 'facundomatiasrios108@gmail.com';
            const emailSubject = `[Soporte Delfina] Nuevo Ticket: ${ticketTitle}`;
            const userName = customDisplayName || user.displayName || user.email?.split('@')[0] || 'Usuario Registrado';
            const userEmail = user.email || 'No proporcionado (Invitado)';
            const clientIdentifier = `${userName} (${userEmail})`;

            const response = await fetch(`https://formsubmit.co/ajax/${emailDest}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    _subject: emailSubject,
                    name: clientIdentifier,
                    email: userEmail,
                    "Cliente Emisor": clientIdentifier,
                    "Usuario ID (Firebase)": user.uid,
                    "Asunto del Ticket": ticketTitle,
                    "Mensaje o Reclamo": ticketMessage,
                    "Fecha de Creación": new Date().toLocaleString('es-AR'),
                    "Origen": "Backoffice Delfina App"
                })
            });
            
            if (response.ok) {
                setTicketTitle('');
                setTicketMessage('');
                showCustomAlert('Mensaje Enviado', '¡Tu ticket de soporte ha sido enviado directamente a Facundo con éxito! Nos comunicaremos a la brevedad.');
            } else {
                throw new Error('Formsubmit rejection');
            }
            
        } catch (err) {
            console.error('Error al registrar ticket:', err);
            showCustomAlert('Error al Enviar', 'Hubo un inconveniente al enviar tu ticket directamente. Intentaremos registrarlo nuevamente.');
        } finally {
            setIsSubmittingTicket(false);
        }
    };
    
    return (
        <div className="flex-1 w-full h-full flex flex-col bg-background-light">
            {/* Header Premium */}
            <header className="sticky top-0 bg-background-light z-20 px-6 py-4 border-b border-pink-100/30 flex justify-between items-center backdrop-blur-md bg-background-light/95">
                <div>
                    <h2 className="text-xl font-black text-text-main tracking-tight">Perfil</h2>
                    <p className="text-xs text-text-muted mt-0.5">Administración y soporte de la app</p>
                </div>
            </header>
            
            <main ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-6 hide-scrollbar">
                
                {/* 1. Tarjeta de Usuario Premium */}
                <div className="bg-white rounded-3xl border border-pink-100/50 p-6 shadow-soft space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarClick} title="Cambiar foto de perfil">
                            {customPhotoURL ? (
                                <img src={customPhotoURL} alt="Avatar" className="w-16 h-16 rounded-3xl border-2 border-primary/20 shadow-md object-cover group-hover:opacity-75 transition-opacity" />
                            ) : user && !user.isAnonymous && user.photoURL ? (
                                <img src={user.photoURL} alt="Avatar" className="w-16 h-16 rounded-3xl border-2 border-primary/20 shadow-md object-cover group-hover:opacity-75 transition-opacity" />
                            ) : (
                                <div className="w-16 h-16 rounded-3xl bg-pink-50 flex items-center justify-center text-primary border border-pink-100 shadow-inner group-hover:opacity-75 transition-opacity">
                                    <span className="material-symbols-outlined !text-[36px]">account_circle</span>
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined !text-[20px]">photo_camera</span>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                accept="image/*" 
                                className="hidden" 
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-text-main flex items-center gap-1.5 group select-none">
                                {isEditingName ? (
                                    <div className="flex items-center gap-1.5 w-full">
                                        <input 
                                            type="text" 
                                            value={tempName} 
                                            onChange={(e) => setTempName(e.target.value)}
                                            className="px-2.5 py-1 text-sm border border-pink-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary w-full"
                                            placeholder="Tu nombre..."
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveName();
                                                if (e.key === 'Escape') setIsEditingName(false);
                                            }}
                                        />
                                        <button onClick={handleSaveName} className="p-1 text-green-500 hover:text-green-600 transition-colors shrink-0 active:scale-90" title="Guardar">
                                            <span className="material-symbols-outlined !text-[18px]">check</span>
                                        </button>
                                        <button onClick={() => setIsEditingName(false)} className="p-1 text-red-500 hover:text-red-600 transition-colors shrink-0 active:scale-90" title="Cancelar">
                                            <span className="material-symbols-outlined !text-[18px]">close</span>
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="truncate">{customDisplayName || (user && !user.isAnonymous ? (user.displayName || user.email?.split('@')[0] || 'Usuario Registrado') : 'Perfil Temporal (Invitado)')}</span>
                                        {user && (
                                            <button 
                                                onClick={() => { 
                                                    setTempName(customDisplayName || (user && !user.isAnonymous ? (user.displayName || user.email?.split('@')[0] || '') : '')); 
                                                    setIsEditingName(true); 
                                                }} 
                                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-0.5 hover:bg-pink-50 rounded text-text-muted hover:text-primary shrink-0 active:scale-90" 
                                                title="Editar nombre"
                                            >
                                                <span className="material-symbols-outlined !text-[16px]">edit</span>
                                            </button>
                                        )}
                                    </>
                                )}
                            </h3>
                            <p className="text-xs text-text-muted truncate mt-0.5">
                                {user && !user.isAnonymous ? user.email : 'Tus datos están guardados solo de manera local'}
                            </p>
                            
                            {/* Estado / Badge de Cuenta */}
                            <div className="flex items-center mt-2.5">
                                {user && user.isAnonymous ? (
                                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-50 border border-pink-100 text-primary text-[10px] font-bold">
                                        <span className="material-symbols-outlined !text-[12px]">cloud_upload</span>
                                        <span>Datos No Asegurados</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-100 text-green-600 text-[10px] font-bold">
                                        <span className="material-symbols-outlined !text-[12px]">cloud_done</span>
                                        <span>Cuenta Sincronizada con Google</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <hr className="border-pink-50" />
                    
                    <div className="flex gap-3">
                        {user && user.isAnonymous ? (
                            <>
                                <button 
                                    onClick={onOpenAuthModal} 
                                    className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
                                >
                                    <span className="material-symbols-outlined !text-[16px]">cloud_upload</span>
                                    <span>Asegurar mis Datos</span>
                                </button>
                                <button 
                                    onClick={() => showCustomConfirm('Cerrar Sesión', '¿Estás seguro de que deseas salir? Los datos no asegurados se perderán si no los has vinculado.', onLogout)} 
                                    className="flex items-center justify-center h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 text-text-muted transition-colors active:scale-95 shadow-sm"
                                    title="Cerrar Sesión"
                                >
                                    <span className="material-symbols-outlined !text-[20px]">logout</span>
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => showCustomConfirm('Cerrar Sesión', '¿Estás seguro de que deseas salir de tu cuenta?', onLogout)} 
                                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-text-main bg-gray-50 hover:bg-red-50 hover:text-red-500 hover:border-red-100 border border-gray-100 py-3.5 px-4 rounded-xl transition-all active:scale-[0.98] shadow-sm"
                            >
                                <span className="material-symbols-outlined !text-[18px]">logout</span>
                                <span>Cerrar Sesión</span>
                            </button>
                        )}
                    </div>
                </div>
                
                {/* 2. Seguridad & Autenticación Biométrica */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider pl-1">Seguridad</h3>
                    <div className="bg-white rounded-3xl border border-pink-100/50 p-5 shadow-soft space-y-4">
                        {/* Face ID / Touch ID */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-white !text-[26px]">fingerprint</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-text-main">Face ID / Touch ID</h4>
                                    <p className="text-xs text-text-muted mt-0.5">
                                        Desbloquear al abrir la app
                                    </p>
                                </div>
                            </div>
                            
                            {/* Toggle Switch */}
                            <label className="relative inline-block w-14 h-7 shrink-0 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={localStorage.getItem('delfina_biometric_enabled') === 'true'}
                                    onChange={(e) => {
                                        const enabled = e.target.checked;
                                        localStorage.setItem('delfina_biometric_enabled', String(enabled));
                                        
                                        if (!enabled) {
                                            localStorage.removeItem('delfina_biometric_credential');
                                            showCustomAlert('Biometría Desactivada', 'La autenticación biométrica ha sido desactivada.');
                                        } else {
                                            showCustomAlert('Biometría Activada', 'La próxima vez que abras la app, se te pedirá usar Face ID, Touch ID o huella digital.');
                                        }
                                    }}
                                    className="peer sr-only" 
                                />
                                <div className="w-14 h-7 bg-gray-200 rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/20 transition-all duration-300"></div>
                                <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 peer-checked:translate-x-7"></div>
                            </label>
                        </div>

                        {window.PublicKeyCredential === undefined && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-2">
                                <span className="material-symbols-outlined text-yellow-600 !text-[18px] shrink-0 mt-0.5">warning</span>
                                <p className="text-xs text-yellow-800 leading-relaxed">
                                    Tu navegador no soporta autenticación biométrica. Usa Safari (iOS) o Chrome (Android).
                                </p>
                            </div>
                        )}

                        <hr className="border-pink-50" />

                        {/* PIN de Respaldo */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-white !text-[26px]">pin</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-text-main">PIN de Respaldo</h4>
                                    <p className="text-xs text-text-muted mt-0.5">
                                        {localStorage.getItem('delfina_backup_pin') ? 'PIN configurado' : 'Método alternativo (4-6 dígitos)'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                                {localStorage.getItem('delfina_backup_pin') ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                showCustomConfirm(
                                                    'Cambiar PIN',
                                                    '¿Deseas cambiar tu PIN de respaldo?',
                                                    () => handleOpenPinModal('change')
                                                );
                                            }}
                                            className="px-3 py-1.5 bg-purple-50 text-purple-600 text-xs font-semibold rounded-lg hover:bg-purple-100 transition-colors active:scale-95"
                                        >
                                            Cambiar
                                        </button>
                                        <button
                                            onClick={() => {
                                                showCustomConfirm(
                                                    'Eliminar PIN',
                                                    '¿Estás seguro? Solo podrás usar biometría para desbloquear.',
                                                    () => {
                                                        localStorage.removeItem('delfina_backup_pin');
                                                        showCustomAlert('PIN Eliminado', 'Tu PIN de respaldo ha sido eliminado.');
                                                    }
                                                );
                                            }}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                                            title="Eliminar PIN"
                                        >
                                            <span className="material-symbols-outlined !text-[18px]">delete</span>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleOpenPinModal('create')}
                                        className="px-4 py-2 bg-purple-50 text-purple-600 text-xs font-semibold rounded-xl hover:bg-purple-100 transition-colors active:scale-95"
                                    >
                                        Configurar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 3. Centro de Datos / Backup Center */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider pl-1">Centro de Backup & Descarga</h3>
                    <div className="bg-white rounded-3xl border border-pink-100/50 p-5 shadow-soft space-y-4">
                        <p className="text-xs text-text-muted leading-relaxed">
                            Descarga copias de seguridad locales en formato de hoja de cálculo (CSV) para auditar o almacenar en tu equipo.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={handleExportTransactions} 
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-50/70 border border-gray-100 hover:bg-pink-50/40 hover:border-primary/20 text-text-main transition-all group active:scale-[0.97]"
                            >
                                <span className="material-symbols-outlined !text-[26px] text-green-500 group-hover:scale-110 transition-transform">receipt_long</span>
                                <span className="text-[11px] font-bold text-center">Exportar Finanzas</span>
                            </button>
                            
                            <button 
                                onClick={handleExportStock} 
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-50/70 border border-gray-100 hover:bg-pink-50/40 hover:border-primary/20 text-text-main transition-all group active:scale-[0.97]"
                            >
                                <span className="material-symbols-outlined !text-[26px] text-primary group-hover:scale-110 transition-transform">inventory_2</span>
                                <span className="text-[11px] font-bold text-center">Exportar Stock</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Sala de Control (Personalización) */}
                {tempSettings && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider pl-1">Sala de Control</h3>
                        <div className="bg-white rounded-3xl border border-pink-100/50 p-6 shadow-soft space-y-5">
                            <p className="text-xs text-text-muted leading-relaxed">
                                Personalizá los campos de tus formularios (categorías, opciones de prendas, diseños, colores, y campos de Venta Online) sin tocar código.
                            </p>
                            
                            {/* Subsección: Campos de Venta Online */}
                            <div className="space-y-2.5">
                                <h4 className="text-xs font-bold text-text-main">1. Mostrar/Ocultar Campos en Venta Online</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'productType', label: 'Tipo Prenda' },
                                        { key: 'musculosaDesign', label: 'Diseño Estampado' },
                                        { key: 'musculosaColor', label: 'Color Prenda' },
                                        { key: 'musculosaSize', label: 'Talle Prenda' }
                                    ].map((f) => (
                                        <label key={f.key} className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-50 bg-gray-50/30 cursor-pointer hover:bg-pink-50/20 transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={tempSettings.onlineFields[f.key]} 
                                                onChange={(e) => {
                                                    const updated = {
                                                        ...tempSettings,
                                                        onlineFields: {
                                                            ...tempSettings.onlineFields,
                                                            [f.key]: e.target.checked
                                                        }
                                                    };
                                                    setTempSettings(updated);
                                                }}
                                                className="rounded border-pink-200 text-primary focus:ring-primary h-4.5 w-4.5" 
                                            />
                                            <span className="text-xs font-semibold text-text-main">{f.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <hr className="border-pink-50" />
                            
                            {/* Subsección: Gestor de Listas y Dropdowns */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-text-main">2. Personalizar Opciones de Listas y Selectores</h4>
                                
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block ml-0.5">Selecciona el selector a editar</label>
                                    <select 
                                        value={selectedListKey} 
                                        onChange={(e) => {
                                            setSelectedListKey(e.target.value);
                                            setEditingItemId(null);
                                            setNewItemName('');
                                        }}
                                        className="w-full px-4 py-3 rounded-xl border border-pink-100 bg-gray-50/30 text-xs font-bold text-text-main focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                    >
                                        <option value="transactionCategories">Categorías de Finanzas (Ingreso/Egreso)</option>
                                        <option value="stockCategories">Categorías de Stock (Prendas)</option>
                                        <option value="paymentMethods">Métodos de Pago</option>
                                        <option value="productTypes">Tipos de Prenda</option>
                                        <option value="musculosaDesigns">Diseños de Estampado</option>
                                        <option value="musculosaColors">Colores de Prenda</option>
                                        <option value="musculosaSizes">Talles de Prenda</option>
                                    </select>
                                </div>
                                
                                {/* Caja de Agregar Elemento */}
                                <div className="p-4 rounded-2xl border border-pink-50 bg-pink-50/20 space-y-3">
                                    <span className="text-xs font-bold text-primary block">
                                        {editingItemId ? '✏️ Editar Opción' : '➕ Agregar Nueva Opción'}
                                    </span>
                                    
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={editingItemId ? editingItemName : newItemName} 
                                            onChange={(e) => editingItemId ? setEditingItemName(e.target.value) : setNewItemName(e.target.value)}
                                            placeholder="Ej: Boxer, Crop top, Rayado..." 
                                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-100 text-xs text-text-main placeholder-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                        />
                                        
                                        {editingItemId ? (
                                            <div className="flex gap-1.5">
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        if (!editingItemName.trim()) return;
                                                        const updatedList = tempSettings[selectedListKey].map(item => {
                                                            if (item.id === editingItemId) {
                                                                return { ...item, name: editingItemName.trim() };
                                                            }
                                                            return item;
                                                        });
                                                        setTempSettings({ ...tempSettings, [selectedListKey]: updatedList });
                                                        setEditingItemId(null);
                                                        setEditingItemName('');
                                                    }}
                                                    className="px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-xs shadow-sm active:scale-95"
                                                >
                                                    Ok
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingItemId(null);
                                                        setEditingItemName('');
                                                    }}
                                                    className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-text-muted font-bold text-xs active:scale-95"
                                                >
                                                    Esc
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                type="button"
                                                onClick={handleAddItem}
                                                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md active:scale-95 flex items-center justify-center shrink-0"
                                            >
                                                Agregar
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* Campos Extra de Categorías */}
                                    {!editingItemId && selectedListKey === 'transactionCategories' && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Seleccionar Ícono</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {[
                                                    { id: 'checkroom', label: '👕 Percha' },
                                                    { id: 'storefront', label: '🏪 Negocio' },
                                                    { id: 'shopping_cart', label: '🛒 Carrito' },
                                                    { id: 'shopping_bag', label: '🛍️ Bolsa' },
                                                    { id: 'local_shipping', label: '🚚 Camión' },
                                                    { id: 'campaign', label: '📢 Megáfono' },
                                                    { id: 'payments', label: '💵 Dinero' },
                                                    { id: 'credit_card', label: '💳 Tarjeta' },
                                                    { id: 'account_balance', label: '🏦 Banco' },
                                                    { id: 'category', label: '📦 Paquete' }
                                                ].map(iconOpt => (
                                                    <button 
                                                        key={iconOpt.id} 
                                                        type="button" 
                                                        onClick={() => setNewItemIcon(iconOpt.id)}
                                                        className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                                                            newItemIcon === iconOpt.id 
                                                            ? 'bg-primary-soft border-primary text-primary shadow-sm scale-102' 
                                                            : 'bg-white border-gray-100 hover:border-pink-100 text-text-muted'
                                                        }`}
                                                    >
                                                        {iconOpt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {!editingItemId && selectedListKey === 'stockCategories' && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Seleccionar Color del Item</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {[
                                                    { code: 'bg-blue-500', name: 'Azul' },
                                                    { code: 'bg-white border border-gray-200', name: 'Blanco' },
                                                    { code: 'bg-[#7B3F00]', name: 'Marrón' },
                                                    { code: 'bg-gray-700', name: 'Gris' },
                                                    { code: 'bg-black', name: 'Negro' },
                                                    { code: 'bg-green-600', name: 'Verde' },
                                                    { code: 'bg-red-500', name: 'Rojo' },
                                                    { code: 'bg-yellow-500', name: 'Amarillo' },
                                                    { code: 'bg-purple-600', name: 'Púrpura' },
                                                    { code: 'bg-pink-500', name: 'Rosa' }
                                                ].map(colorOpt => (
                                                    <button 
                                                        key={colorOpt.code} 
                                                        type="button" 
                                                        onClick={() => setNewItemColorCode(colorOpt.code)}
                                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                                                            newItemColorCode === colorOpt.code 
                                                            ? 'bg-primary-soft border-primary text-primary shadow-sm scale-102' 
                                                            : 'bg-white border-gray-100 hover:border-pink-100 text-text-muted'
                                                        }`}
                                                    >
                                                        <span className={`w-2.5 h-2.5 rounded-full ${colorOpt.code}`}></span>
                                                        <span>{colorOpt.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Lista de Elementos Existentes */}
                                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                                    {tempSettings[selectedListKey].map((item) => (
                                        <div key={item.id} className="flex justify-between items-center px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {selectedListKey === 'transactionCategories' && (
                                                    <span className="material-symbols-outlined !text-[16px] text-primary bg-pink-50 p-1.5 rounded-lg shrink-0">
                                                        {item.icon || 'category'}
                                                    </span>
                                                )}
                                                {selectedListKey === 'stockCategories' && (
                                                    <span className={`w-3.5 h-3.5 rounded-full ${item.colorCode || 'bg-gray-400'} shrink-0 shadow-sm border border-black/10`}></span>
                                                )}
                                                <span className="font-bold text-text-main truncate">{item.name}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 shrink-0">
                                                {/* Toggle Enabled */}
                                                <button 
                                                    type="button"
                                                    onClick={() => handleToggleItem(item.id)}
                                                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none focus:outline-none ${item.enabled ? 'bg-primary flex justify-end' : 'bg-gray-200 flex justify-start'}`}
                                                >
                                                    <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                                                </button>
                                                
                                                {/* Edit Button */}
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingItemId(item.id);
                                                        setEditingItemName(item.name);
                                                    }}
                                                    className="text-text-muted hover:text-primary p-1 active:scale-95"
                                                >
                                                    <span className="material-symbols-outlined !text-[16px]">edit</span>
                                                </button>
                                                
                                                {/* Delete Button */}
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="text-text-muted hover:text-red-500 p-1 active:scale-95"
                                                >
                                                    <span className="material-symbols-outlined !text-[16px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <hr className="border-pink-50" />
                            
                            <button 
                                onClick={handleSaveControlRoom}
                                disabled={isSavingSettings}
                                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white shadow-glow transition-all active:scale-[0.98] ${
                                    isSavingSettings ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'
                                }`}
                            >
                                <span className="material-symbols-outlined !text-[16px]">save</span>
                                <span>{isSavingSettings ? 'Guardando Ajustes...' : 'Guardar Ajustes de Sala de Control'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 4. Formulario de Soporte y Sugerencias */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider pl-1">Soporte y Reclamos</h3>
                    <form onSubmit={handleSubmitTicket} className="bg-white rounded-3xl border border-pink-100/50 p-6 shadow-soft space-y-4">
                        <p className="text-xs text-text-muted leading-relaxed">
                            ¿Tenés alguna duda, queja o propuesta de mejora? Completá el formulario para enviarle un ticket directamente a Facundo sin intermediarios.
                        </p>
                        
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">Asunto / Título</label>
                            <input 
                                type="text" 
                                value={ticketTitle} 
                                onChange={(e) => setTicketTitle(e.target.value)}
                                placeholder="Ej: Modificar catálogo de invierno" 
                                className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm text-text-main placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">Detalle del Mensaje</label>
                            <textarea 
                                rows="4" 
                                value={ticketMessage} 
                                onChange={(e) => setTicketMessage(e.target.value)}
                                placeholder="Escribí detalladamente tu sugerencia o el reclamo técnico aquí..." 
                                className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm text-text-main placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                            ></textarea>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isSubmittingTicket}
                            className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold text-white shadow-glow transition-all active:scale-[0.98] ${
                                isSubmittingTicket ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'
                            }`}
                        >
                            <span className="material-symbols-outlined !text-[16px]">mail</span>
                            <span>{isSubmittingTicket ? 'Enviando...' : 'Enviar Ticket & Contactar'}</span>
                        </button>
                    </form>
                </div>
                
                {/* 5. Ficha Técnica / Acerca de la App */}
                <div className="bg-gray-50/70 border border-gray-100 rounded-3xl p-5 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted font-medium">Versión del Sistema</span>
                        <span className="font-bold text-text-main">v1.3.0</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted font-medium">Servidor de Datos</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isFirebaseOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                            <span className="font-bold text-text-main">{isFirebaseOnline ? 'Firestore Conectado' : 'Sin Conexión'}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted font-medium">Sincronización Offline</span>
                        <span className="font-bold text-green-600 flex items-center gap-1">
                            <span className="material-symbols-outlined !text-[14px]">save</span>
                            <span>Local + Nube Activa</span>
                        </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted font-medium">Modo de Pantalla</span>
                        <span className="font-bold text-text-main">{pwaMode}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted font-medium">Seguridad de Canal</span>
                        <span className="font-bold text-green-600">SSL Activo (HTTPS)</span>
                    </div>
                </div>
                
            </main>

            {/* Modal de Configuración de PIN */}
            {showPinModal && (
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-pink-100/50 animate-slide-up">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-purple-600 !text-[24px]">pin</span>
                            </div>
                            <h4 className="text-base font-bold text-text-main">
                                {pinModalMode === 'create' ? 'Configurar PIN' : 'Cambiar PIN'}
                            </h4>
                        </div>
                        
                        <p className="text-sm text-text-muted leading-relaxed mb-6">
                            {pinModalMode === 'create' 
                                ? 'Crea un PIN de 4-6 dígitos para desbloquear la app cuando la biometría no esté disponible.'
                                : 'Ingresa tu nuevo PIN de 4-6 dígitos.'}
                        </p>

                        <div className="space-y-4 mb-6">
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={pinInput}
                                onChange={handlePinInputChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && pinInput.length >= 4) {
                                        handleSavePin();
                                    }
                                }}
                                placeholder="Ingresa tu PIN"
                                className="w-full px-6 py-4 text-center text-2xl font-bold tracking-[0.5em] rounded-2xl border-2 border-pink-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                autoFocus
                            />
                            
                            {/* Indicador de longitud */}
                            <div className="flex justify-center gap-2">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-3 h-3 rounded-full transition-all ${
                                            i < pinInput.length
                                                ? 'bg-purple-600 scale-110'
                                                : 'bg-gray-200'
                                        }`}
                                    />
                                ))}
                            </div>
                            
                            {pinError && (
                                <p className="text-xs text-red-500 text-center font-medium animate-shake">
                                    {pinError}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button 
                                onClick={handleClosePinModal}
                                className="px-5 py-2.5 text-xs font-bold text-text-muted hover:bg-gray-100 rounded-xl border border-gray-100 transition-colors focus:outline-none"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSavePin}
                                disabled={pinInput.length < 4}
                                className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {pinModalMode === 'create' ? 'Guardar PIN' : 'Actualizar PIN'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
