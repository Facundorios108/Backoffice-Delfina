import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    TRANSACTION_CATEGORIES, 
    PAYMENT_METHODS, 
    PRODUCT_TYPES, 
    MUSCULOSA_DESIGNS, 
    MUSCULOSA_COLORS, 
    MUSCULOSA_SIZES, 
    STOCK_CATEGORIES 
} from './constants';
import { 
    auth, 
    db, 
    appId, 
    collection, 
    addDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDoc, 
    getDocs, 
    where, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp, 
    signInAnonymously, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    linkWithPopup, 
    signInWithPopup, 
    signOut, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from './firebase';

// Subcomponents
import NavButton from './components/NavButton';
import AccountAuthModal from './components/AccountAuthModal';
import BiometricLock from './components/BiometricLock';

// Screens
import LoginScreen from './screens/LoginScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import AddStockScreen from './screens/AddStockScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import StockHistoryView from './screens/StockHistoryView';
import ProductionTasksScreen from './screens/ProductionTasksScreen';

// Views
import DashboardView from './views/DashboardView';
import TransactionsView from './views/TransactionsView';
import StockView from './views/StockView';
import ProfileView from './views/ProfileView';

// --- Utils para fechas ---
const getLocalDateISO = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
};

const getMonthKey = (dateObj) => `${dateObj.getFullYear()}-${dateObj.getMonth()}`;

export default function App() {
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [stockItems, setStockItems] = useState([]);
    const [stockHistory, setStockHistory] = useState([]);
    const [productionTasks, setProductionTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [initialTxFilters, setInitialTxFilters] = useState({ type: 'all', date: 'all' });
    const [isLoading, setIsLoading] = useState(true);
    
    // Estados de loading para operaciones
    const [isSavingTransaction, setIsSavingTransaction] = useState(false);
    const [isSavingStock, setIsSavingStock] = useState(false);
    
    // Estados para el bloqueo biométrico
    const [isBiometricLocked, setIsBiometricLocked] = useState(false);
    const [biometricChecked, setBiometricChecked] = useState(false);

    // Modales separados
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [showStockHistoryModal, setShowStockHistoryModal] = useState(false);
    const [showProductionTasksModal, setShowProductionTasksModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [editingStock, setEditingStock] = useState(null);

    // Modal de inicio de sesión profesional
    const [showAuthModal, setShowAuthModal] = useState(false);

    const hasSeededRef = useRef(false);

    // Sistema de diálogos in-app premium
    const [dialog, setDialog] = useState(null); // { type, title, message, onConfirm, onCancel }

    const showCustomAlert = (title, message, onConfirm = null) => {
        setDialog({ type: 'alert', title, message, onConfirm });
    };

    const showCustomConfirm = (title, message, onConfirm, onCancel = null) => {
        setDialog({ type: 'confirm', title, message, onConfirm, onCancel });
    };

    const [customPhotoURL, setCustomPhotoURL] = useState('');
    const [customDisplayName, setCustomDisplayName] = useState('');

    useEffect(() => {
        if (!user) {
            setCustomPhotoURL('');
            setCustomDisplayName('');
            return;
        }
        
        const cachedPhoto = localStorage.getItem(`delfinaCustomPhoto_${user.uid}`);
        if (cachedPhoto) setCustomPhotoURL(cachedPhoto);

        const cachedName = localStorage.getItem(`delfinaCustomName_${user.uid}`);
        if (cachedName) setCustomDisplayName(cachedName);
        
        const loadProfile = async () => {
            try {
                const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
                const snap = await getDoc(profileRef);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.customPhotoURL) {
                        setCustomPhotoURL(data.customPhotoURL);
                        localStorage.setItem(`delfinaCustomPhoto_${user.uid}`, data.customPhotoURL);
                    }
                    if (data.customDisplayName) {
                        setCustomDisplayName(data.customDisplayName);
                        localStorage.setItem(`delfinaCustomName_${user.uid}`, data.customDisplayName);
                    }
                }
            } catch (e) {
                console.error('Error loading profile:', e);
            }
        };
        
        loadProfile();
    }, [user]);

    const [settings, setSettings] = useState(null);

    const updateGlobalArrays = (data) => {
        if (!data) return;
        
        if (data.transactionCategories) {
            TRANSACTION_CATEGORIES.length = 0;
            TRANSACTION_CATEGORIES.push(...data.transactionCategories.filter(c => c.enabled));
        }
        
        if (data.paymentMethods) {
            PAYMENT_METHODS.length = 0;
            PAYMENT_METHODS.push(...data.paymentMethods.filter(m => m.enabled));
        }
        
        if (data.productTypes) {
            PRODUCT_TYPES.length = 0;
            PRODUCT_TYPES.push(...data.productTypes.filter(p => p.enabled));
        }
        
        if (data.musculosaDesigns) {
            MUSCULOSA_DESIGNS.length = 0;
            MUSCULOSA_DESIGNS.push(...data.musculosaDesigns.filter(d => d.enabled));
        }
        
        if (data.musculosaColors) {
            MUSCULOSA_COLORS.length = 0;
            MUSCULOSA_COLORS.push(...data.musculosaColors.filter(c => c.enabled));
        }
        
        if (data.musculosaSizes) {
            MUSCULOSA_SIZES.length = 0;
            MUSCULOSA_SIZES.push(...data.musculosaSizes.filter(s => s.enabled));
        }
        
        if (data.stockCategories) {
            STOCK_CATEGORIES.length = 0;
            STOCK_CATEGORIES.push(...data.stockCategories.filter(sc => sc.enabled));
        }
        
        window.ONLINE_FIELDS = data.onlineFields || { productType: true, musculosaDesign: true, musculosaColor: true, musculosaSize: true };
    };

    useEffect(() => {
        if (!user) return;
        
        const loadSettings = async () => {
            try {
                const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'controlRoom');
                const snap = await getDoc(settingsRef);
                
                let data;
                if (snap.exists()) {
                    data = snap.data();
                } else {
                    data = {
                        transactionCategories: [
                            { id: 'musculosas', name: 'Musculosas', icon: 'checkroom', enabled: true },
                            { id: 'remeras', name: 'Boxy fit', icon: 'storefront', enabled: true },
                            { id: 'manga_corta', name: 'Manga corta', icon: 'checkroom', enabled: true },
                            { id: 'merceria', name: 'Mercería', icon: 'shopping_bag', enabled: true },
                            { id: 'online', name: 'Venta Online', icon: 'shopping_cart', enabled: true },
                            { id: 'logistica', name: 'Logística', icon: 'local_shipping', enabled: true },
                            { id: 'marketing', name: 'Marketing', icon: 'campaign', enabled: true }
                        ],
                        paymentMethods: [
                            { id: 'transferencia', name: 'Transferencia', icon: 'account_balance', enabled: true },
                            { id: 'efectivo', name: 'Efectivo', icon: 'payments', enabled: true },
                            { id: 'tarjeta', name: 'Tarjeta', icon: 'credit_card', enabled: true }
                        ],
                        productTypes: [
                            { id: 'musculosa', name: 'Musculosa', enabled: true },
                            { id: 'remera', name: 'Boxy fit', enabled: true },
                            { id: 'manga_corta', name: 'Manga corta', enabled: true }
                        ],
                        musculosaDesigns: [
                            { id: 'aceitunas', name: 'Aceitunas', enabled: true },
                            { id: 'concha_de_mar', name: 'Concha de mar', enabled: true },
                            { id: 'libelula', name: 'Libélula', enabled: true },
                            { id: 'limon', name: 'Limón', enabled: true },
                            { id: 'medusa', name: 'Medusa', enabled: true },
                            { id: 'ojo_negro', name: 'Ojo negro', enabled: true },
                            { id: 'pimiento', name: 'Pimiento', enabled: true },
                            { id: 'saturno_azul', name: 'Saturno azul', enabled: true },
                            { id: 'saturno_dorado', name: 'Saturno dorado', enabled: true },
                            { id: 'otro', name: 'Otro', enabled: true }
                        ],
                        musculosaColors: [
                            { id: 'azul', name: 'Azul', enabled: true },
                            { id: 'blanco', name: 'Blanco', enabled: true },
                            { id: 'chocolate', name: 'Chocolate', enabled: true },
                            { id: 'gris_petroleo', name: 'Gris Petróleo', enabled: true },
                            { id: 'negro', name: 'Negro', enabled: true },
                            { id: 'verde', name: 'Verde', enabled: true }
                        ],
                        musculosaSizes: [
                            { id: 's', name: 'S', enabled: true },
                            { id: 'm', name: 'M', enabled: true },
                            { id: 'l', name: 'L', enabled: true },
                            { id: 'xl', name: 'XL', enabled: true }
                        ],
                        stockCategories: [
                            { id: 'azul', name: 'Azul', colorCode: 'bg-blue-500', enabled: true },
                            { id: 'blanco', name: 'Blanco', colorCode: 'bg-white border border-gray-200', enabled: true },
                            { id: 'chocolate', name: 'Chocolate', colorCode: 'bg-[#7B3F00]', enabled: true },
                            { id: 'gris_petroleo', name: 'Gris Petróleo', colorCode: 'bg-gray-700', enabled: true },
                            { id: 'negro', name: 'Negro', colorCode: 'bg-black', enabled: true },
                            { id: 'verde', name: 'Verde', colorCode: 'bg-green-600', enabled: true }
                        ],
                        onlineFields: {
                            productType: true,
                            musculosaDesign: true,
                            musculosaColor: true,
                            musculosaSize: true
                        }
                    };
                    await setDoc(settingsRef, data);
                }
                
                setSettings(data);
                updateGlobalArrays(data);
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        };
        
        loadSettings();
    }, [user]);

    // Sobrescribir alert del navegador con nuestro diálogo premium
    useEffect(() => {
        window.alert = (msg) => showCustomAlert('Notificación', msg);
    }, []);

    // --- MANEJADORES DE AUTENTICACIÓN GOOGLE & EMAIL ---
    const handleLinkGoogle = async () => {
        if (!user) return;
        const provider = new GoogleAuthProvider();
        
        try {
            console.log('🔄 Vinculando cuenta con Google...');
            const result = await linkWithPopup(auth.currentUser, provider);
            console.log('✅ Vinculación exitosa:', result.user.uid);
            setUser(result.user);
            showCustomAlert('¡Cuenta Vinculada!', 'Tu cuenta se ha enlazado con éxito a Google. Ahora puedes acceder desde cualquier dispositivo.');
            setShowAuthModal(false);
        } catch (error) {
            console.error('❌ Error al vincular cuenta:', error);
            if (error.code === 'auth/credential-already-in-use') {
                showCustomConfirm(
                    'Cuenta en Uso',
                    'Esta cuenta de Google ya está vinculada a otro perfil con datos guardados.\n\n¿Deseas cerrar sesión en este perfil temporal para entrar al perfil guardado de Google? (Se perderán los cambios locales no guardados en este navegador)',
                    async () => { await handleLoginGoogle(); }
                );
            } else {
                showCustomAlert('Error al Vincular', error.message);
            }
        }
    };

    const handleLoginGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            console.log('🔄 Iniciando sesión con Google...');
            const result = await signInWithPopup(auth, provider);
            console.log('✅ Inicio de sesión exitoso:', result.user.uid);
            setUser(result.user);
            setShowAuthModal(false);
        } catch (error) {
            console.error('❌ Error al iniciar sesión:', error);
            showCustomAlert('Error de Inicio', error.message);
        }
    };

    const handleLoginEmail = async (email, password) => {
        console.log('🔄 Iniciando sesión por correo...');
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Login por email exitoso:', result.user.uid);
        setUser(result.user);
    };

    const handleRegisterEmail = async (email, password) => {
        console.log('🔄 Registrando cuenta por correo...');
        const result = await createUserWithEmailAndPassword(auth, email, password);
        console.log('✅ Registro por email exitoso:', result.user.uid);
        setUser(result.user);
    };

    const handleLoginGuest = async () => {
        try {
            setIsLoading(true);
            console.log('👤 Ingresando como Invitado...');
            const result = await signInAnonymously(auth);
            console.log('✅ Sesión de invitado iniciada:', result.user.uid);
            setUser(result.user);
        } catch (error) {
            console.error('❌ Error al entrar como invitado:', error);
            showCustomAlert('Error de Acceso', error.message);
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            console.log('🔄 Cerrando sesión...');
            setIsLoading(true);
            await signOut(auth);
            console.log('✅ Sesión cerrada.');
            setShowAuthModal(false);
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
            showCustomAlert('Error de Sesión', error.message);
            setIsLoading(false);
        }
    };

    // 1. Efecto de Autenticación
    useEffect(() => {
        console.log('🔐 Iniciando proceso de autenticación...');
        const unsubAuth = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setIsLoading(false);
            if (u) {
                console.log('👤 Usuario autenticado:', u.uid, u.isAnonymous ? '(Anónimo)' : '(Google/Email)');
            } else {
                console.log('⚠️ Sin usuario autenticado. Mostrando Login...');
                setTransactions([]);
                setStockItems([]);
            }
        });
        return () => unsubAuth();
    }, []);

    // 1.5. Efecto de Verificación Biométrica
    useEffect(() => {
        // Solo verificar cuando el usuario esté autenticado y hayamos terminado de cargar
        if (!user || isLoading || biometricChecked) return;
        
        // Verificar si el usuario tiene habilitada la biometría
        const biometricEnabled = localStorage.getItem('delfina_biometric_enabled') === 'true';
        
        if (biometricEnabled) {
            console.log('🔒 Biometría habilitada, mostrando pantalla de bloqueo...');
            setIsBiometricLocked(true);
        }
        
        setBiometricChecked(true);
    }, [user, isLoading, biometricChecked]);

    // Resetear estado biométrico cuando el usuario cierra sesión
    useEffect(() => {
        if (!user) {
            setBiometricChecked(false);
            setIsBiometricLocked(false);
        }
    }, [user]);

    // Detectar cuando el usuario vuelve a la app (después de minimizar o cambiar de pestaña)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user && !isLoading) {
                const biometricEnabled = localStorage.getItem('delfina_biometric_enabled') === 'true';
                if (biometricEnabled) {
                    console.log('🔒 App visible nuevamente, solicitando biometría...');
                    setIsBiometricLocked(true);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [user, isLoading]);

    // Función para desbloquear la app después de autenticación biométrica exitosa
    const handleBiometricUnlock = () => {
        console.log('✅ App desbloqueada con biometría');
        setIsBiometricLocked(false);
    };

    // 2. Efecto de Base de Datos
    useEffect(() => {
        if (!user) return;

        const qTx = query(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), orderBy('createdAt', 'desc'));
        const unsubTx = onSnapshot(qTx, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            txs.sort((a, b) => {
                const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.fullDate);
                const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.fullDate);
                return dateB - dateA;
            });
            setTransactions(txs);
        }, (e) => console.error("Error txs:", e));

        const qStock = query(collection(db, 'artifacts', appId, 'users', user.uid, 'stock'), orderBy('name', 'asc'));
        const unsubStock = onSnapshot(qStock, async (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (items.length === 0 && !hasSeededRef.current) {
                hasSeededRef.current = true;
                setStockItems([]); // Inicia vacío en producción para no ensuciar
            } else {
                setStockItems(items);
            }
            setIsLoading(false);
        }, (e) => console.error("Error stock:", e));

        // Suscripción al historial de stock
        const qHistory = query(collection(db, 'artifacts', appId, 'users', user.uid, 'stockHistory'), orderBy('createdAt', 'desc'));
        const unsubHistory = onSnapshot(qHistory, (snapshot) => {
            const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStockHistory(history);
        }, (e) => console.error("Error history:", e));

        // Suscripción a tareas de producción
        const qTasks = query(collection(db, 'artifacts', appId, 'users', user.uid, 'productionTasks'), orderBy('createdAt', 'desc'));
        const unsubTasks = onSnapshot(qTasks, (snapshot) => {
            const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProductionTasks(tasks);
        }, (e) => console.error("Error tasks:", e));

        return () => { unsubTx(); unsubStock(); unsubHistory(); unsubTasks(); };
    }, [user]);

    // --- CÁLCULOS FINANCIEROS ---
    const financialStats = useMemo(() => {
        const now = new Date();
        const currentMonthKey = getMonthKey(now);
        const prevMonthDate = new Date();
        prevMonthDate.setMonth(now.getMonth() - 1);
        const prevMonthKey = getMonthKey(prevMonthDate);

        let currentIncome = 0; let currentExpense = 0;
        let prevIncome = 0; let prevExpense = 0;
        let totalBalance = 0;

        transactions.forEach(tx => {
            const dateStr = tx.fullDate ? tx.fullDate : getLocalDateISO();
            const [year, month, day] = dateStr.split('-').map(Number);
            const txDate = new Date(year, month - 1, day);
            const txMonthKey = getMonthKey(txDate);
            const amount = parseFloat(tx.amount) || 0;

            if (tx.type === 'income') totalBalance += amount;
            else totalBalance -= amount;

            if (txMonthKey === currentMonthKey) {
                if (tx.type === 'income') currentIncome += amount; else currentExpense += amount;
            } else if (txMonthKey === prevMonthKey) {
                if (tx.type === 'income') prevIncome += amount; else prevExpense += amount;
            }
        });

        const calculateGrowth = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        const incomeGrowth = calculateGrowth(currentIncome, prevIncome);
        const expenseGrowth = calculateGrowth(currentExpense, prevExpense);
        const balanceGrowth = calculateGrowth(currentIncome - currentExpense, prevIncome - prevExpense);

        return {
            totalBalance, currentIncome, currentExpense,
            incomeGrowth: incomeGrowth.toFixed(1),
            expenseGrowth: expenseGrowth.toFixed(1),
            balanceGrowth: balanceGrowth.toFixed(1),
            isIncomeUp: incomeGrowth >= 0,
            isExpenseUp: expenseGrowth > 0,
            isBalanceUp: balanceGrowth >= 0
        };
    }, [transactions]);

    // Resetear scroll cuando cambia la sección activa
    useEffect(() => {
        // Usar requestAnimationFrame para asegurar que se ejecute después del render
        requestAnimationFrame(() => {
            // Scroll del window/body principal
            window.scrollTo(0, 0);
            // También forzar el scroll en el documento
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        });
    }, [activeTab]);

    // --- STOCK SYNC HELPERS ---
    const revertStockAndTasks = async (tx) => {
        if (tx.category !== 'online' || !tx.products) return null;
        
        console.log('🔄 Revirtiendo stock y tareas para la transacción:', tx.id);

        // 1. GUARDAR metadata de tareas antes de eliminarlas (para preservar al editar)
        const savedTasksMetadata = [];
        try {
            const tasksRef = collection(db, 'artifacts', appId, 'users', user.uid, 'productionTasks');
            const q = query(tasksRef, where('transactionId', '==', tx.id));
            const snapshot = await getDocs(q);
            
            for (const taskDoc of snapshot.docs) {
                const taskData = taskDoc.data();
                // Guardar metadata importante de cada tarea
                savedTasksMetadata.push({
                    id: taskDoc.id,
                    status: taskData.status,
                    createdAt: taskData.createdAt,
                    notes: taskData.notes || '',
                    // Identificadores para hacer match después
                    productType: taskData.productType,
                    color: taskData.color,
                    size: taskData.size,
                    design: taskData.design,
                    customDesign: taskData.customDesign
                });
                
                // Eliminar la tarea
                await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'productionTasks', taskDoc.id));
            }
            console.log(`✅ ${snapshot.size} tareas eliminadas (metadata guardada)`);
        } catch (err) {
            console.error('❌ Error al eliminar tareas:', err);
        }

        // 2. Devolver stock
        try {
            const stockRef = collection(db, 'artifacts', appId, 'users', user.uid, 'stock');
            const stockSnapshot = await getDocs(stockRef);
            
            for (const product of tx.products) {
                const productTypeData = PRODUCT_TYPES.find(p => p.id === product.productType);
                const matchingItem = stockSnapshot.docs.find(docSnap => {
                    const data = docSnap.data();
                    return data.name === productTypeData?.name && data.category === product.musculosaColor;
                });

                if (matchingItem) {
                    const itemData = matchingItem.data();
                    const sizeKey = product.musculosaSize.toLowerCase();
                    const currentStock = itemData.stock?.[sizeKey] || 0;
                    const newStock = currentStock + 1;

                    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'stock', matchingItem.id), {
                        [`stock.${sizeKey}`]: newStock
                    });

                    // Historial
                    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'stockHistory'), {
                        action: 'update',
                        itemName: itemData.name,
                        itemColor: product.musculosaColor,
                        changes: [{ size: product.musculosaSize.toUpperCase(), oldValue: currentStock, newValue: newStock, difference: 1 }],
                        description: `Reversión por edición/eliminación de venta online (${tx.id})`,
                        createdAt: serverTimestamp()
                    });
                }
            }
        } catch (err) {
            console.error('❌ Error al revertir stock:', err);
        }
        
        // Devolver la metadata guardada de las tareas para poder restaurarla después
        return savedTasksMetadata;
    };

    const applyStockAndTasks = async (tx, savedTasksMetadata = []) => {
        if (tx.category !== 'online' || !tx.products) return;
        
        console.log('🚀 Aplicando stock y tareas para la transacción:', tx.id);
        console.log('📦 Metadata de tareas guardadas para restaurar:', savedTasksMetadata.length);

        // 1. Crear tareas de producción (con metadata restaurada si existe)
        try {
            const tasksRef = collection(db, 'artifacts', appId, 'users', user.uid, 'productionTasks');
            for (const product of tx.products) {
                const designName = product.musculosaDesign === 'otro'
                    ? product.musculosaCustomDesign
                    : MUSCULOSA_DESIGNS.find(d => d.id === product.musculosaDesign)?.name;
                const productTypeData = PRODUCT_TYPES.find(p => p.id === product.productType);
                const productName = productTypeData?.name || product.productType;
                const colorName = MUSCULOSA_COLORS.find(c => c.id === product.musculosaColor)?.name || product.musculosaColor;
                const sizeName = product.musculosaSize.toUpperCase();

                // Intentar hacer match con tarea guardada anterior (para preservar status, fecha, notas al editar)
                const matchingTask = savedTasksMetadata.find(saved => 
                    saved.productType === product.productType &&
                    saved.color === product.musculosaColor &&
                    saved.size === product.musculosaSize &&
                    saved.design === product.musculosaDesign &&
                    (saved.customDesign || '') === (product.musculosaCustomDesign || '')
                );

                // Si hay match, restaurar metadata original; sino usar valores por defecto
                const taskData = {
                    status: matchingTask ? matchingTask.status : 'pendiente',
                    productType: product.productType,
                    productName: productName,
                    design: product.musculosaDesign,
                    designName: designName,
                    customDesign: product.musculosaCustomDesign || '',
                    color: product.musculosaColor,
                    colorName: colorName,
                    size: product.musculosaSize,
                    sizeName: sizeName,
                    title: `${productName} ${colorName} - ${designName}`,
                    description: tx.description || 'Sin descripción',
                    notes: matchingTask ? matchingTask.notes : '',
                    transactionId: tx.id,
                    priority: 'media',
                    createdAt: matchingTask ? matchingTask.createdAt : serverTimestamp()
                };

                await addDoc(tasksRef, taskData);
                
                if (matchingTask) {
                    console.log(`✅ Tarea restaurada con status "${matchingTask.status}" y fecha original`);
                } else {
                    console.log(`➕ Nueva tarea creada con status "pendiente"`);
                }
            }
        } catch (err) {
            console.error('❌ Error al crear tareas de producción:', err);
        }

        // 2. Descontar stock
        try {
            const stockRef = collection(db, 'artifacts', appId, 'users', user.uid, 'stock');
            const stockSnapshot = await getDocs(stockRef);
            
            for (const product of tx.products) {
                const productTypeData = PRODUCT_TYPES.find(p => p.id === product.productType);
                const matchingItem = stockSnapshot.docs.find(docSnap => {
                    const data = docSnap.data();
                    return data.name === productTypeData?.name && data.category === product.musculosaColor;
                });

                if (matchingItem) {
                    const itemData = matchingItem.data();
                    const sizeKey = product.musculosaSize.toLowerCase();
                    const currentStock = itemData.stock?.[sizeKey] || 0;
                    const newStock = Math.max(0, currentStock - 1);

                    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'stock', matchingItem.id), {
                        [`stock.${sizeKey}`]: newStock
                    });

                    // Registrar en el historial
                    const designName = product.musculosaDesign === 'otro'
                        ? product.musculosaCustomDesign
                        : MUSCULOSA_DESIGNS.find(d => d.id === product.musculosaDesign)?.name;

                    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'stockHistory'), {
                        action: 'sale',
                        itemName: itemData.name,
                        itemColor: product.musculosaColor,
                        changes: [{
                            size: product.musculosaSize.toUpperCase(),
                            oldValue: currentStock,
                            newValue: newStock,
                            difference: -1
                        }],
                        description: `Venta online - ${designName}`,
                        createdAt: serverTimestamp()
                    });
                }
            }
        } catch (err) {
            console.error('❌ Error al actualizar stock:', err);
        }
    };

    // --- HANDLERS ---
    const handleSaveTransaction = async (txData) => {
        console.log('💾 handleSaveTransaction llamado con:', txData);
        if (!user) {
            console.error('❌ No hay usuario autenticado');
            alert('Error: No hay usuario autenticado. Recarga la página.');
            return;
        }

        setIsSavingTransaction(true); // Activar loading

        const collectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'transactions');

        // Limpiar campos undefined
        const cleanData = { ...txData, amount: parseFloat(txData.amount) };
        Object.keys(cleanData).forEach(key => {
            if (cleanData[key] === undefined) {
                delete cleanData[key];
            }
        });

        try {
            if (editingTransaction) {
                console.log('📝 Editando transacción:', txData.id);
                const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', txData.id);
                
                // 1. Revertir estado anterior (si era online) y guardar metadata de tareas
                const oldSnap = await getDoc(docRef);
                let savedTasksMetadata = [];
                if (oldSnap.exists()) {
                    savedTasksMetadata = await revertStockAndTasks({ id: oldSnap.id, ...oldSnap.data() }) || [];
                }

                // 2. Actualizar transacción (sin tocar createdAt ni fullDate)
                const { id, createdAt, ...dataToUpdate } = cleanData;
                await updateDoc(docRef, dataToUpdate);
                
                // 3. Aplicar nuevo estado (si es online), restaurando metadata de tareas guardadas
                await applyStockAndTasks({ id: txData.id, ...dataToUpdate }, savedTasksMetadata);
                
                console.log('✅ Transacción actualizada y sincronizada (tareas preservadas con su estado original)');
            } else {
                console.log('➕ Creando nueva transacción');
                const { id, ...newTxData } = cleanData;
                const docRef = await addDoc(collectionRef, { ...newTxData, createdAt: serverTimestamp() });
                
                // Aplicar stock y tareas para la nueva transacción (sin metadata previa)
                await applyStockAndTasks({ id: docRef.id, ...newTxData }, []);
                
                console.log('✅ Transacción creada y sincronizada');
            }
        } catch (e) {
            console.error('❌ Error al guardar transacción:', e);
            alert(`Error al guardar: ${e.message}`);
            setIsSavingTransaction(false); // Desactivar loading
            return;
        }
        setIsSavingTransaction(false); // Desactivar loading
        setShowTransactionModal(false); setEditingTransaction(null);
    };

    const handleDeleteTransaction = async (id) => {
        console.log('🗑️ handleDeleteTransaction llamado con id:', id);
        if (!user) {
            console.error('❌ No hay usuario autenticado');
            alert('Error: No hay usuario autenticado.');
            return;
        }
        setIsSavingTransaction(true); // Activar loading
        try {
            const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', id);
            
            // 1. Revertir stock y tareas antes de eliminar
            const oldSnap = await getDoc(docRef);
            if (oldSnap.exists()) {
                await revertStockAndTasks({ id: oldSnap.id, ...oldSnap.data() });
            }

            // 2. Eliminar transacción
            await deleteDoc(docRef);
            console.log('✅ Transacción eliminada y stock revertido');
        } catch (e) {
            console.error('❌ Error al eliminar:', e);
            alert(`Error al eliminar: ${e.message}`);
            setIsSavingTransaction(false); // Desactivar loading
            return;
        }
        setIsSavingTransaction(false); // Desactivar loading
        setShowTransactionModal(false); setEditingTransaction(null);
    };

    const handleSaveStock = async (itemData) => {
        if (!user) return;
        setIsSavingStock(true); // Activar loading
        const collectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'stock');
        const historyRef = collection(db, 'artifacts', appId, 'users', user.uid, 'stockHistory');
        const cleanData = { ...itemData };
        const historyDescription = itemData.historyDescription || '';

        try {
            if (editingStock) {
                const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'stock', itemData.id);
                const { id, createdAt, historyDescription, ...dataToUpdate } = cleanData;

                // Obtener datos anteriores para el historial
                const stockQuery = query(collectionRef);
                const stockSnapshot = await new Promise((resolve, reject) => {
                    const unsubscribe = onSnapshot(stockQuery, (snapshot) => {
                        unsubscribe();
                        resolve(snapshot);
                    }, reject);
                });

                const oldDoc = stockSnapshot.docs.find(d => d.id === itemData.id);
                const oldData = oldDoc?.data();

                await updateDoc(docRef, dataToUpdate);

                // Registrar cambios en el historial
                if (oldData) {
                    const changes = [];
                    ['s', 'm', 'l', 'xl'].forEach(size => {
                        const oldStock = oldData.stock?.[size] || 0;
                        const newStock = itemData.stock?.[size] || 0;
                        if (oldStock !== newStock) {
                            changes.push({
                                size: size.toUpperCase(),
                                oldValue: oldStock,
                                newValue: newStock,
                                difference: newStock - oldStock
                            });
                        }
                    });

                    if (changes.length > 0) {
                        await addDoc(historyRef, {
                            action: 'update',
                            itemName: itemData.name,
                            itemColor: itemData.category,
                            changes: changes,
                            description: historyDescription || 'Actualización manual de stock',
                            createdAt: serverTimestamp()
                        });
                    }
                }
            } else {
                const { id, historyDescription, ...newItemData } = cleanData;
                await addDoc(collectionRef, { ...newItemData, createdAt: serverTimestamp() });

                // Registrar creación en el historial
                await addDoc(historyRef, {
                    action: 'create',
                    itemName: newItemData.name,
                    itemColor: newItemData.category,
                    stock: newItemData.stock,
                    description: historyDescription || 'Producto creado',
                    createdAt: serverTimestamp()
                });
            }
        } catch (e) { 
            console.error(e); 
            alert("Error al guardar stock."); 
            setIsSavingStock(false); // Desactivar loading
            return;
        }
        setIsSavingStock(false); // Desactivar loading
        setShowStockModal(false); setEditingStock(null);
    };

    const handleDeleteStock = async (id) => {
        if (!user) return;
        setIsSavingStock(true); // Activar loading

        try {
            // Obtener datos del item antes de eliminarlo
            const stockRef = collection(db, 'artifacts', appId, 'users', user.uid, 'stock');
            const stockQuery = query(stockRef);
            const stockSnapshot = await new Promise((resolve, reject) => {
                const unsubscribe = onSnapshot(stockQuery, (snapshot) => {
                    unsubscribe();
                    resolve(snapshot);
                }, reject);
            });

            const itemDoc = stockSnapshot.docs.find(d => d.id === id);
            const itemData = itemDoc?.data();

            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'stock', id));

            // Registrar eliminación en el historial
            if (itemData) {
                const historyRef = collection(db, 'artifacts', appId, 'users', user.uid, 'stockHistory');
                await addDoc(historyRef, {
                    action: 'delete',
                    itemName: itemData.name,
                    itemColor: itemData.category,
                    stock: itemData.stock,
                    description: 'Producto eliminado',
                    createdAt: serverTimestamp()
                });
            }
        } catch (e) { 
            console.error(e); 
            setIsSavingStock(false); // Desactivar loading
        }
        setIsSavingStock(false); // Desactivar loading
        setShowStockModal(false); setEditingStock(null);
    };

    // --- FAB Logic ---
    const handleFabClick = () => {
        console.log('🎯 FAB clickeado, tab activo:', activeTab);
        console.log('👤 Usuario actual:', user ? user.uid : 'NO AUTENTICADO');

        if (!user) {
            alert('Esperando autenticación... Por favor, espera unos segundos y vuelve a intentar.');
            return;
        }

        if (activeTab === 'stock') {
            console.log('📦 Abriendo modal de stock');
            setEditingStock(null);
            setShowStockModal(true);
        } else {
            console.log('💰 Abriendo modal de transacción');
            setEditingTransaction(null);
            setShowTransactionModal(true);
        }
    };

    const openEditTransaction = (tx) => { setEditingTransaction(tx); setShowTransactionModal(true); };
    const openEditStock = (item) => { setEditingStock(item); setShowStockModal(true); };

    // --- HANDLERS TAREAS DE PRODUCCIÓN ---
    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        if (!user) return;
        try {
            const taskRef = doc(db, 'artifacts', appId, 'users', user.uid, 'productionTasks', taskId);
            await updateDoc(taskRef, { status: newStatus });
            console.log('✅ Estado de tarea actualizado:', taskId, newStatus);
        } catch (e) {
            console.error('❌ Error al actualizar tarea:', e);
            alert('Error al actualizar la tarea');
        }
    };

    const handleUpdateTaskNotes = async (taskId, notes) => {
        if (!user) return;
        try {
            const taskRef = doc(db, 'artifacts', appId, 'users', user.uid, 'productionTasks', taskId);
            await updateDoc(taskRef, { notes: notes });
            console.log('✅ Notas de tarea actualizadas:', taskId);
        } catch (e) {
            console.error('❌ Error al actualizar notas:', e);
            alert('Error al actualizar las notas');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'productionTasks', taskId));
            console.log('✅ Tarea eliminada:', taskId);
        } catch (e) {
            console.error('❌ Error al eliminar tarea:', e);
            alert('Error al eliminar la tarea');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background-light text-primary">
                <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
                    <span className="text-sm font-medium">Cargando Delfina Concept...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <>
                <LoginScreen
                    onLoginGoogle={handleLoginGoogle}
                    onLoginGuest={handleLoginGuest}
                    onLoginEmail={handleLoginEmail}
                    onRegisterEmail={handleRegisterEmail}
                />
                {dialog && (
                    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-pink-100/50 animate-slide-up">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dialog.type === 'confirm' ? 'bg-pink-50 text-primary' : 'bg-green-50 text-green-600'}`}>
                                    <span className="material-symbols-outlined !text-[24px]">
                                        {dialog.type === 'confirm' ? 'help_outline' : 'info'}
                                    </span>
                                </div>
                                <h4 className="text-base font-bold text-text-main">{dialog.title}</h4>
                            </div>
                            <p className="text-sm text-text-muted leading-relaxed mb-6">{dialog.message}</p>
                            <div className="flex gap-3 justify-end">
                                {dialog.type === 'confirm' && (
                                    <button 
                                        onClick={() => { dialog.onCancel?.(); setDialog(null); }}
                                        className="px-4 py-2 text-xs font-bold text-text-muted hover:bg-gray-100 rounded-xl border border-gray-100 transition-colors focus:outline-none"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button 
                                    onClick={() => { dialog.onConfirm?.(); setDialog(null); }}
                                    className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md transition-colors focus:outline-none"
                                >
                                    Aceptar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // Si está bloqueado por biometría, mostrar pantalla de bloqueo
    if (isBiometricLocked) {
        const userName = customDisplayName || (user && !user.isAnonymous ? (user.displayName || user.email?.split('@')[0] || 'Usuario') : 'Usuario');
        return <BiometricLock onUnlock={handleBiometricUnlock} userName={userName} />;
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden pb-24 bg-background-light">
            <div key={activeTab} className="flex-1 w-full h-full flex flex-col animate-[fade-in-up_0.3s_ease-out_forwards]">
                {activeTab === 'stock' ? (
                    <StockView items={stockItems} onItemClick={openEditStock} onOpenHistory={() => setShowStockHistoryModal(true)} />
                ) : activeTab === 'movimientos' ? (
                    <TransactionsView transactions={transactions} totals={financialStats} onTransactionClick={openEditTransaction} initialFilterType={initialTxFilters.type} initialFilterDate={initialTxFilters.date} />
                ) : activeTab === 'perfil' ? (
                    <ProfileView user={user} onOpenAuthModal={() => setShowAuthModal(true)} onLogout={handleLogout} transactions={transactions} stockItems={stockItems} showCustomAlert={showCustomAlert} showCustomConfirm={showCustomConfirm} settings={settings} onUpdateSettings={(newSettings) => { setSettings(newSettings); updateGlobalArrays(newSettings); }} customPhotoURL={customPhotoURL} onUpdateCustomPhoto={setCustomPhotoURL} customDisplayName={customDisplayName} onUpdateCustomDisplayName={setCustomDisplayName} />
                ) : (
                    <DashboardView stats={financialStats} transactions={transactions} onTransactionClick={openEditTransaction} onViewAll={() => { setInitialTxFilters({ type: 'all', date: 'all' }); setActiveTab('movimientos'); }} onOpenAnalytics={() => setShowAnalyticsModal(true)} onOpenProductionTasks={() => setShowProductionTasksModal(true)} productionTasks={productionTasks} onNavigateToTransactions={(filters) => { setInitialTxFilters(filters); setActiveTab('movimientos'); }} user={user} onOpenAuthModal={() => setShowAuthModal(true)} onLogout={handleLogout} />
                )}
            </div>

            {activeTab !== 'perfil' && (
                <button onClick={handleFabClick} className="fixed bottom-24 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-lg shadow-pink-500/40 flex items-center justify-center z-30 hover:bg-primary-dark transition-colors active:scale-95 group">
                    <span className="material-symbols-outlined !text-[32px] group-hover:rotate-90 transition-transform duration-200">add</span>
                </button>
            )}

            <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 pb-safe pt-2 px-6 z-40">
                <div className="flex justify-around items-end h-16 pb-2">
                    <NavButton icon="dashboard" label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <NavButton icon="receipt_long" label="Movimientos" isActive={activeTab === 'movimientos'} onClick={() => { setInitialTxFilters({ type: 'all', date: 'all' }); setActiveTab('movimientos'); }} />
                    <NavButton icon="inventory_2" label="Stock" isActive={activeTab === 'stock'} onClick={() => setActiveTab('stock')} />
                    <NavButton icon="person" label="Perfil" isActive={activeTab === 'perfil'} onClick={() => setActiveTab('perfil')} />
                </div>
            </nav>

            {showTransactionModal && (
                <AddTransactionScreen 
                    onClose={() => { setShowTransactionModal(false); setEditingTransaction(null); }} 
                    onSave={handleSaveTransaction} 
                    onDelete={handleDeleteTransaction} 
                    initialData={editingTransaction}
                    isSaving={isSavingTransaction}
                />
            )}

            {showStockModal && (
                <AddStockScreen 
                    onClose={() => { setShowStockModal(false); setEditingStock(null); }} 
                    onSave={handleSaveStock} 
                    onDelete={handleDeleteStock} 
                    initialData={editingStock}
                    isSaving={isSavingStock}
                />
            )}

            {showAnalyticsModal && (
                <AnalyticsScreen onClose={() => setShowAnalyticsModal(false)} transactions={transactions} stockItems={stockItems} />
            )}

            {showStockHistoryModal && (
                <StockHistoryView onClose={() => setShowStockHistoryModal(false)} history={stockHistory} />
            )}

            {showProductionTasksModal && (
                <ProductionTasksScreen
                    onClose={() => setShowProductionTasksModal(false)}
                    tasks={productionTasks}
                    onUpdateStatus={handleUpdateTaskStatus}
                    onUpdateNotes={handleUpdateTaskNotes}
                    onDeleteTask={handleDeleteTask}
                />
            )}

            {showAuthModal && (
                <AccountAuthModal
                    onClose={() => setShowAuthModal(false)}
                    onLink={handleLinkGoogle}
                    onLogin={handleLoginGoogle}
                    onLogout={handleLogout}
                    user={user}
                    customPhotoURL={customPhotoURL}
                    customDisplayName={customDisplayName}
                />
            )}

            {dialog && (
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-pink-100/50 animate-slide-up">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dialog.type === 'confirm' ? 'bg-pink-50 text-primary' : 'bg-green-50 text-green-600'}`}>
                                <span className="material-symbols-outlined !text-[24px]">
                                    {dialog.type === 'confirm' ? 'help_outline' : 'info'}
                                </span>
                            </div>
                            <h4 className="text-base font-bold text-text-main">{dialog.title}</h4>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed mb-6">{dialog.message}</p>
                        <div className="flex gap-3 justify-end">
                            {dialog.type === 'confirm' && (
                                <button 
                                    onClick={() => { dialog.onCancel?.(); setDialog(null); }}
                                    className="px-4 py-2 text-xs font-bold text-text-muted hover:bg-gray-100 rounded-xl border border-gray-100 transition-colors focus:outline-none"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button 
                                onClick={() => { dialog.onConfirm?.(); setDialog(null); }}
                                    className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md transition-colors focus:outline-none"
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
