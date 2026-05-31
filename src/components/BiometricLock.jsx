import React, { useState, useEffect } from 'react';

/**
 * BiometricLock - Componente que bloquea la app hasta que el usuario se autentique con Face ID/Touch ID
 * Usa la Web Authentication API (WebAuthn) para biometría
 */
export default function BiometricLock({ onUnlock, userName = 'Usuario' }) {
    const [error, setError] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

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
            } else if (err.name === 'InvalidStateError') {
                setError('Credencial inválida. Reiniciando...');
                localStorage.removeItem('delfina_biometric_credential');
                setTimeout(() => authenticate(), 500);
                return;
            } else {
                setError('Error al verificar identidad. Intenta nuevamente.');
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

    const handleSkip = () => {
        // Permitir omitir si hay error (modo degradado)
        if (error || !isSupported) {
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
                    {isSupported ? (
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
                                Puedes continuar sin autenticación biométrica.
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

                {/* Biometric Icon Animation */}
                {isSupported && !error && (
                    <div className="flex justify-center py-6">
                        <div className={`relative ${isAuthenticating ? 'animate-pulse' : ''}`}>
                            <span className="material-symbols-outlined text-primary !text-[80px]">
                                fingerprint
                            </span>
                        </div>
                    </div>
                )}

                {/* Botones */}
                <div className="space-y-3 pt-4">
                    {isSupported && !isAuthenticating && (
                        <button
                            onClick={authenticate}
                            className="w-full px-6 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-pink-500/30 hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">lock_open</span>
                            Desbloquear
                        </button>
                    )}

                    {(error || !isSupported) && (
                        <button
                            onClick={handleSkip}
                            className="w-full px-6 py-3 bg-gray-100 text-text-muted rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                        >
                            Continuar sin biometría
                        </button>
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
