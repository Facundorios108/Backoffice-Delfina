# Autenticación Biométrica - Face ID / Touch ID

## 🔐 Descripción

La app ahora soporta **autenticación biométrica** como capa adicional de seguridad. Esto significa que cada vez que un usuario abre la app, puede ser requerido a autenticarse usando **Face ID**, **Touch ID** o **huella digital** según lo que tenga disponible su dispositivo.

⚠️ **Importante:** Esta funcionalidad **NO reemplaza** el inicio de sesión de Firebase. Es una capa adicional de seguridad que se ejecuta **después** del login.

## 🚀 ¿Cómo funciona?

### 1. Tecnología Utilizada
- **Web Authentication API (WebAuthn)**: API nativa del navegador que permite autenticación biométrica
- Compatible con:
  - ✅ Safari en iOS (Face ID / Touch ID)
  - ✅ Chrome en Android (Huella digital)
  - ✅ Navegadores modernos con soporte biométrico

### 2. Flujo de Usuario

#### Primera vez que se habilita:
1. El usuario va a **Perfil** → Sección **Seguridad**
2. Activa el toggle "Requerir biometría al abrir"
3. La próxima vez que abra la app, se le pedirá **registrar** su biometría (Face ID/Touch ID)
4. Se crea una credencial y se guarda localmente en `localStorage`

#### Usos posteriores:
1. Usuario abre la app
2. Se completa el login de Firebase (automático si ya estaba logueado)
3. Si tiene biometría habilitada, aparece la pantalla de bloqueo
4. Usuario debe autenticarse con Face ID/Touch ID/Huella
5. Una vez autenticado, accede a la app normalmente

### 3. Eventos que disparan la autenticación

La autenticación biométrica se solicita en estos casos:
- ✅ Al abrir la app por primera vez (después del login de Firebase)
- ✅ Al volver a la app después de minimizarla o cambiar de pestaña
- ✅ Al recargar la página

## 🔧 Implementación Técnica

### Archivos creados/modificados:

1. **`src/components/BiometricLock.jsx`** (NUEVO)
   - Componente que muestra la pantalla de bloqueo
   - Maneja el registro y autenticación biométrica
   - Usa la Web Authentication API

2. **`src/App.jsx`** (MODIFICADO)
   - Agregado estado `isBiometricLocked` y `biometricChecked`
   - Efecto que verifica si debe mostrar el bloqueo biométrico
   - Efecto que detecta cuando el usuario vuelve a la app (`visibilitychange`)
   - Renderiza `BiometricLock` cuando corresponde

3. **`src/views/ProfileView.jsx`** (MODIFICADO)
   - Nueva sección "Seguridad" con toggle para habilitar/deshabilitar biometría
   - Guarda la preferencia en `localStorage`

### Datos almacenados en localStorage:

```javascript
// Indica si el usuario tiene habilitada la biometría
localStorage.setItem('delfina_biometric_enabled', 'true|false');

// ID de la credencial biométrica (generado por WebAuthn)
localStorage.setItem('delfina_biometric_credential', 'base64EncodedCredentialId');
```

## 🛡️ Seguridad

- ✅ **Las credenciales biométricas NUNCA salen del dispositivo**
- ✅ No se envía información biométrica al servidor
- ✅ Solo se valida que el usuario pueda autenticarse con el dispositivo
- ✅ Si el usuario desactiva la biometría, se elimina la credencial

## 📱 Compatibilidad

### ✅ Funciona en:
- Safari en iOS (iPhone/iPad) → Face ID / Touch ID
- Chrome/Edge en Android → Huella digital
- Navegadores modernos con soporte de WebAuthn

### ❌ NO funciona en:
- Navegadores antiguos sin soporte de WebAuthn
- Dispositivos sin capacidad biométrica configurada
- Modo incógnito/privado (algunas limitaciones)

### Modo degradado:
Si el navegador no soporta biometría o el usuario no tiene biometría configurada:
- Se muestra un mensaje informativo
- Se permite **"Continuar sin biometría"**
- La app funciona normalmente

## 🧪 Pruebas

Para probar la funcionalidad:

1. **Habilitar biometría:**
   - Abre la app en un dispositivo compatible (iPhone con Face ID o Android con huella)
   - Ve a Perfil → Seguridad
   - Activa "Requerir biometría al abrir"

2. **Probar autenticación:**
   - Cierra y vuelve a abrir la app
   - Debe aparecer la pantalla de bloqueo
   - Usa Face ID/Touch ID/Huella para desbloquear

3. **Probar detección de visibilidad:**
   - Con la app abierta, minimízala o cambia a otra app
   - Vuelve a la app
   - Debería pedir autenticación nuevamente

4. **Desactivar biometría:**
   - Ve a Perfil → Seguridad
   - Desactiva el toggle
   - Se eliminará la credencial y no se pedirá más

## ⚠️ Consideraciones

- La biometría es **opcional**, el usuario puede no activarla
- Si hay un error, se puede omitir para evitar bloqueos permanentes
- La credencial es local, si el usuario cambia de dispositivo, debe registrar nuevamente
- Safari en iOS tiene mejor soporte que otros navegadores móviles

## 🔄 Mejoras Futuras

Posibles mejoras a considerar:
- [ ] Agregar timeout de inactividad (bloquear después de X minutos sin uso)
- [ ] Opción para requerir biometría en acciones sensibles (eliminar transacciones, etc.)
- [ ] Sincronizar preferencia con Firebase para mantenerla entre dispositivos
- [ ] Agregar PIN como alternativa si falla la biometría
