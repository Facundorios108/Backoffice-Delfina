import React, { useState, useEffect } from 'react';

/**
 * BiometricLock - Componente que bloquea la app hasta que el usuario se autentique con Face ID/Touch ID
 * Usa la Web Authentication API (WebAuthn) para biometría + PIN de respaldo
 */
export default function BiometricLock({ onUnlock, userName = 'Usuario' }) {
    const [error, setError] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [showPinFallback, setShowPinFallback] = useState(false);
    const [pinValue, setPinValue] = useState('');
    const [isSettingUpPin, setIsSettingUpPin] = useState(false);
    const [pinError, setPinError] = useState('');

    useEffect(() => {
        // Verificar si el navegador soporta WebAuthn
        const checkSupport = () => {
            const supported = window.PublicKeyCredential !== undefined && 
                             navigator.credentials !== undefined;
            setIsSupported(supported);
            return supported;
        };

        if (checkSupport()) {
            // Auto-trigger autenticación al montar
            setTimeout(() => authenticate(), 300);
        } else {
            // Si no hay soporte de biometría, verificar si hay PIN configurado
            const hasPin = localStorage.getItem('delfina_backup_pin');
            if (hasPin) {
                setShowPinFallback(true);
            }
        }
    }, []);

    const authenticate = async () => {
        setError('');
        setIsAuthenticating(true);

        try {
            // Verificar disponibilidad de autenticación con plataforma (Face ID, Touch ID, etc.)
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            
            if (!available) {
                setError('Este dispositivo no tiene Face ID, Touch ID o huella digital configurados.');
                setIsAuthenticating(false);
                return;
            }

            // Obtener o crear credential ID para este usuario
            const credentialId = localStorage.getItem('delfina_biometric_credential');
            
            if (!credentialId) {
                // Primera vez: registrar nueva credencial
                await registerBiometric();
            } else {
                // Ya existe: autenticar
                await authenticateBiometric(credentialId);
            }
        } catch (err) {
            console.error('Error de autenticación biométrica:', err);
            
            if (err.name === 'NotAllowedError') {
                setError('Autenticación cancelada o denegada.');
                // Mostrar opción de PIN como respaldo
                const hasPin = localStorage.getItem('delfina_backup_pin');
                if (hasPin) {
                    setShowPinFallback(true);
                } else {
                    setIsSettingUpPin(true);
                }
            } else if (err.name === 'InvalidStateError') {
                setError('Credencial inválida. Reiniciando...');
                localStorage.removeItem('delfina_biometric_credential');
                setTimeout(() => authenticate(), 500);
                return;
            } else {
                setError('Error al verificar identidad. Intenta nuevamente.');
                // Mostrar opción de PIN como respaldo
                const hasPin = localStorage.getItem('delfina_backup_pin');
                if (hasPin) {
                    setShowPinFallback(true);
                }
            }
            setIsAuthenticating(false);
        }
    };

    const registerBiometric = async () => {
        // Generar un challenge aleatorio
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // Crear opciones de registro
        const publicKeyOptions = {
            challenge: challenge,
            rp: {
                name: "Delfina Concept",
                id: window.location.hostname
            },
            user: {
                id: new Uint8Array(16), // ID único del usuario
                name: userName,
                displayName: userName
            },
            pubKeyCredParams: [
                { type: "public-key", alg: -7 },  // ES256
                { type: "public-key", alg: -257 } // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform", // Face ID / Touch ID
                userVerification: "required",
                requireResidentKey: false
            },
            timeout: 60000,
            attestation: "none"
        };

        // Crear credencial
        const credential = await navigator.credentials.create({
            publicKey: publicKeyOptions
        });

        if (credential) {
            // Guardar el ID de la credencial
            const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
            localStorage.setItem('delfina_biometric_credential', credId);
            
            console.log('✅ Biometría registrada exitosamente');
            onUnlock();
        }
    };

    const authenticateBiometric = async (credentialId) => {
        // Generar un challenge aleatorio
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // Convertir credentialId de base64 a ArrayBuffer
        const credIdBuffer = Uint8Array.from(atob(credentialId), c => c.charCodeAt(0));

        // Opciones de autenticación
        const publicKeyOptions = {
            challenge: challenge,
            rpId: window.location.hostname,
            allowCredentials: [{
                type: "public-key",
                id: credIdBuffer.buffer,
                transports: ["internal"] // Face ID / Touch ID
            }],
            userVerification: "required",
            timeout: 60000
        };

        // Autenticar
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyOptions
        });

        if (assertion) {
            console.log('✅ Autenticación biométrica exitosa');
            onUnlock();
        }
    };

    const handlePinSubmit = () => {
        const storedPin = localStorage.getItem('delfina_backup_pin');
        
        if (isSettingUpPin) {
            // Configurar nuevo PIN
            if (pinValue.length < 4) {
                setPinError('El PIN debe tener al menos 4 dígitos');
                return;
            }
            if (pinValue.length > 6) {
                setPinError('El PIN no puede tener más de 6 dígitos');
                return;
            }
            // Guardar PIN (en producción deberías hashearlo)
            localStorage.setItem('delfina_backup_pin', pinValue);
            console.log('✅ PIN de respaldo configurado');
            onUnlock();
        } else {
            // Verificar PIN
            if (pinValue === storedPin) {
                console.log('✅ PIN correcto, desbloqueando...');
                onUnlock();
            } else {
                setPinError('PIN incorrecto. Intenta nuevamente.');
                setPinValue('');
            }
        }
    };

    const handlePinChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Solo números
        if (value.length <= 6) {
            setPinValue(value);
            setPinError('');
        }
    };

    const handleSkip = () => {
        // Solo permitir omitir si NO hay soporte de biometría y NO hay PIN configurado
        const hasPin = localStorage.getItem('delfina_backup_pin');
        if (!isSupported && !hasPin) {
            onUnlock();
        } else if (isSettingUpPin) {
            // Si está configurando PIN por primera vez, puede cancelar y desbloquear
            onUnlock();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-pink-50 via-white to-pink-50 flex items-center justify-center p-6">
            <div className="max-w-sm w-full space-y-8 text-center">
                {/* Logo/Icon */}
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                        <span className="material-symbols-outlined text-white !text-[48px]">
                            {isAuthenticating ? 'sync' : 'lock'}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-text-main">
                        Delfina Concept
                    </h1>
                </div>

                {/* Mensaje principal */}
                <div className="space-y-3">
                    {showPinFallback || isSettingUpPin ? (
                        <>
                            <h2 className="text-lg font-semibold text-text-main">
                                {isSettingUpPin ? 'Configura un PIN de respaldo' : 'Ingresa tu PIN'}
                            </h2>
                            <p className="text-sm text-text-muted">
                                {isSettingUpPin 
                                    ? 'Crea un PIN de 4-6 dígitos para desbloquear cuando la biometría no esté disponible' 
                                    : 'Ingresa tu PIN de respaldo para desbloquear la app'}
                            </p>
                        </>
                    ) : isSupported ? (
                        <>
                            <h2 className="text-lg font-semibold text-text-main">
                                {isAuthenticating ? 'Verificando identidad...' : 'Desbloquea la app'}
                            </h2>
                            <p className="text-sm text-text-muted">
                                {isAuthenticating 
                                    ? 'Usa Face ID, Touch ID o huella digital' 
                                    : 'Toca el botón para autenticarte'}
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-lg font-semibold text-text-main">
                                Biometría no disponible
                            </h2>
                            <p className="text-sm text-text-muted">
                                Tu dispositivo no soporta Face ID o Touch ID en el navegador.
                                {localStorage.getItem('delfina_backup_pin') ? ' Usa tu PIN para continuar.' : ' Puedes continuar sin autenticación.'}
                            </p>
                        </>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-red-700">
                            <span className="material-symbols-outlined !text-[20px]">error</span>
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* PIN Input o Biometric Icon */}
                {showPinFallback || isSettingUpPin ? (
                    <div className="py-6 space-y-4">
                        <div className="relative">
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={pinValue}
                                onChange={handlePinChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && pinValue.length >= 4) {
                                        handlePinSubmit();
                                    }
                                }}
                                placeholder="Ingresa tu PIN"
                                className="w-full px-6 py-4 text-center text-2xl font-bold tracking-[0.5em] rounded-2xl border-2 border-pink-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                autoFocus
                            />
                        </div>
                        
                        {/* Indicador de longitud */}
                        <div className="flex justify-center gap-2">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full transition-all ${
                                        i < pinValue.length
                                            ? 'bg-primary scale-110'
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
                ) : isSupported && !error ? (
                    <div className="flex justify-center py-6">
                        <div className={`relative ${isAuthenticating ? 'animate-pulse' : ''}`}>
                            <span className="material-symbols-outlined text-primary !text-[80px]">
                                fingerprint
                            </span>
                        </div>
                    </div>
                ) : null}

                {/* Botones */}
                <div className="space-y-3 pt-4">
                    {showPinFallback || isSettingUpPin ? (
                        <>
                            <button
                                onClick={handlePinSubmit}
                                disabled={pinValue.length < 4}
                                className="w-full px-6 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-pink-500/30 hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">check_circle</span>
                                {isSettingUpPin ? 'Guardar PIN' : 'Desbloquear'}
                            </button>
                            
                            {isSettingUpPin && (
                                <button
                                    onClick={handleSkip}
                                    className="w-full px-6 py-3 bg-gray-100 text-text-muted rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Omitir por ahora
                                </button>
                            )}
                            
                            {!isSettingUpPin && isSupported && (
                                <button
                                    onClick={() => {
                                        setShowPinFallback(false);
                                        setError('');
                                        setPinValue('');
                                        setPinError('');
                                        authenticate();
                                    }}
                                    className="w-full px-6 py-3 bg-gray-100 text-text-muted rounded-2xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined !text-[18px]">fingerprint</span>
                                    Usar biometría
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            {isSupported && !isAuthenticating && (
                                <button
                                    onClick={authenticate}
                                    className="w-full px-6 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-pink-500/30 hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">lock_open</span>
                                    Desbloquear
                                </button>
                            )}

                            {!isSupported && !localStorage.getItem('delfina_backup_pin') && (
                                <button
                                    onClick={handleSkip}
                                    className="w-full px-6 py-3 bg-gray-100 text-text-muted rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Continuar sin autenticación
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Info adicional */}
                <div className="pt-4">
                    <p className="text-xs text-text-muted">
                        🔒 Tu información está segura y nunca sale de tu dispositivo
                    </p>
                </div>
            </div>
        </div>
    );
}
