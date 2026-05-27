# HANDOFF — Planes FERCO v3
*Última actualización: 2026-05-26*

---

## 1. Descripción general del proyecto

**Planes de Fortalecimiento FERCO** es una aplicación web SPA (Single Page Application) que gestiona planes de desarrollo comercial para los equipos de FERCO en Guatemala, El Salvador, Honduras y México.

**URL de producción:** https://ferco-planes-v2.netlify.app  
**Repositorio:** https://github.com/giancaremma50-hue/ferco-planes-v2  
**Rama principal:** `main` (despliega automáticamente en Netlify)  
**Archivo único:** `C:\Users\giancarlo.lam\Downloads\Planes FERCO V3\index.html` (~5 600 líneas)

---

## 2. Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML + CSS + JavaScript ES Modules (vanilla, sin framework) |
| Auth | Firebase Authentication v10 (email/password) |
| Base de datos | Cloud Firestore (NoSQL) |
| Storage | Firebase Storage (fotos de perfil) |
| Hosting | Netlify (deploy automático desde GitHub `main`) |
| Firebase project | `ferco-planes-staging` |
| Firebase console | https://console.firebase.google.com/project/ferco-planes-staging |

---

## 3. Estructura del código (todo en `index.html`)

```
index.html
├── <style>          CSS completo (~1 800 líneas)
│   ├── Variables CSS (--card, --bg, --border, etc.)
│   ├── Temas: dark (default) / light
│   ├── Componentes: kanban, modales, tarjetas usuario, tabs
│   └── @keyframes: cascadeIn, spin
│
├── <body>           HTML de la SPA
│   ├── #loginSection   Pantalla de login
│   ├── #appSection     Aplicación principal
│   │   ├── Tabs: Mis Planes · Mis Reportes · Gestión de Usuarios
│   │   ├── #userModalOverlay  Modal de alta de usuario
│   │   └── #planModalOverlay  Modal de alta/edición de plan
│   └── Toasts, tooltips
│
└── <script type="module">  JS (~3 800 líneas)
    ├── Imports Firebase SDK v10
    ├── firebaseConfig + initializeApp
    ├── FERCO_HIERARCHY     Organigrama (País → Área → Cargos)
    ├── Helpers: rolLabel, areaLabel, ADMIN_HIERARCHY
    ├── Auth: onAuthStateChanged, login/logout
    ├── Kanban: loadPlanes, buildQuery, safeQuery, renderKanban
    ├── Reportes: getSubordinateUids, loadReportes
    ├── Usuarios: loadUsers, openUserModal, saveUser, resetUserPassword
    └── Utilidades: showToast, showErr, sendEmailNotification
```

---

## 4. Modelo de datos en Firestore

### Colección `users/{uid}`

```javascript
{
  nombre:     "Vilma Yojana Meletz Batz",
  email:      "yojana.meletz@ferco.com.gt",
  cargo:      "Gerente de Sucursal",       // texto libre seleccionado del dropdown
  area:       "Comercial",                  // o 'rh_global' si esRhGlobal
  pais:       "Guatemala",                  // o 'Global' si esRhGlobal
  rol:        "sucursal",                   // rol LEGACY para control de acceso
  reportaA:   "uid-del-jefe",              // uid del manager directo
  esRhGlobal: false,
}
```

**Roles legacy** (campo `rol`) — controlan qué ve cada usuario:

| rol | Descripción | Ver en Kanban |
|-----|-------------|---------------|
| `rh` / `rh_global` | RH Global | Todos los planes de todos los países |
| `director` | Director Comercial | Todos los planes de su país |
| `regional` | Regional, Dir. Retail, Gerentes de área | Planes de su equipo vía reportaA |
| `zona` | Zona | Planes de su equipo vía reportaA |
| `sucursal` | Ger. Sucursal, Asesor Comercial, KAM | Solo sus propios planes |
| `dir_admin` / `gerente_admin` / `jefe_admin` / etc. | Áreas no Comerciales | Planes de su área administrativa |

### Colección `planes/{planId}`

```javascript
{
  titulo, descripcion, semana, año,
  liderUid, liderNombre,
  estado: "pendiente" | "en_progreso" | "completado",
  pais, area,
  creadoEn: serverTimestamp(),
}
```

---

## 5. Jerarquía comercial — FERCO_HIERARCHY

La jerarquía está hardcodeada en JS y se usa para:
- Poblar el dropdown de **Área** (nivel 2 del árbol)
- Poblar el dropdown de **Puesto** (todos los cargos únicos bajo País+Área)

```
Guatemala → Comercial
  Director Comercial GT
  ├── Gerente Mayoreo → KAM
  ├── Gerente de Proyectos → KAM
  ├── Gerente de Canales Digitales → Líder de Mesa → Asesor Comercial
  └── Director Retail
      ├── Regional Marlon → Gerente de Sucursal → Asesor Comercial
      ├── Regional Sandra → Zona Eva → Gerente de Sucursal
      │                   → Gerente de Sucursal
      ├── Regional Carlos → Gerente de Sucursal → Asesor Comercial
      └── Regional Freddy → Gerente de Sucursal → Asesor Comercial
                          → Zona Diego → Gerente de Sucursal → Asesor Comercial
                          → Zona Selvin → ...
                          → Zona Jose → ...
                          → Zona Giovany → ...

El Salvador → Comercial
  Director Comercial SV
  ├── Regional → Gerente de Sucursal → Asesor Comercial
  ├── Gerente de Proyectos → KAM
  └── Gerente Mayoreo → KAM
```

*Honduras y México tienen estructura similar (ver FERCO_HIERARCHY en el código, líneas ~2514–2666)*

---

## 6. Formulario de alta de usuario — flujo actual

```
País → Área → Puesto (dropdown dinámico) → Reporta a (filtrado) → [RH Global opcional]
```

**Funciones JS relevantes:**
- `openUserModal()` — abre y resetea el modal
- `onPaisChange()` — puebla Área, resetea Puesto
- `onAreaChange()` — llama `populatePuestos()` + `populateReportaA()`
- `onPuestoChange()` — llama `populateReportaA()`
- `flattenPuestos(node)` — extrae cargos únicos del árbol FERCO_HIERARCHY
- `populatePuestos()` — puebla el `<select id="uCargo">`
- `populateReportaA()` — filtra usuarios superiores en mismo país/área; fallback a superiores en cualquier país; RH Global siempre visible
- `deriveRolLegacy(cargo, area, reportaA)` — mapea cargo → rol legacy via regex
- `saveUser()` — crea cuenta Auth + escribe perfil en Firestore

---

## 7. ⛔ BLOQUEANTE ACTIVO — `permission-denied` en Firestore

### Síntoma
Al intentar crear un nuevo usuario, el sistema:
1. Crea la cuenta exitosamente en **Firebase Auth** ✅
2. Falla al escribir el perfil en **Firestore** (`users/{uid}`) ❌
3. Error mostrado: `Error (permission-denied). Intenta de nuevo.`

### Lo que se ha intentado
| Intento | Resultado |
|---------|-----------|
| Escribir con db principal (sesión de Monica/RH) | `permission-denied` |
| Escribir con `getFirestore(secondaryApp)` (sesión del nuevo usuario) | `permission-denied` |
| Estrategia dual (primero primario, fallback secundario) | Ambos fallan |

### Causa raíz
Las **reglas de seguridad de Firestore** (`firestore.rules`) están configuradas de forma que ningún cliente puede escribir en `users/{uid}`, ni siquiera el propio usuario autenticado.

Las reglas actuales **NO se conocen** — no hay archivo `firestore.rules` local. Están configuradas directamente en Firebase Console.

### ✅ SOLUCIÓN REQUERIDA — Actualizar reglas en Firebase Console

**Pasos:**
1. Ir a https://console.firebase.google.com/project/ferco-planes-staging/firestore/rules
2. Reemplazar las reglas actuales con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Usuarios: cualquier usuario autenticado puede leer
    // Puede escribir su propio documento O si es rh/director
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.rol in ['rh', 'rh_global', 'director']
      );
      allow delete: if false;
    }

    // Planes: autenticados pueden leer/escribir
    match /planes/{planId} {
      allow read, write: if request.auth != null;
    }

    // Resto de colecciones
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Regla clave:** `allow create: if request.auth != null;`  
Permite que cualquier usuario autenticado (incluyendo el recién creado vía secondaryApp) escriba un nuevo documento de usuario.

### ⚠️ Efecto secundario conocido
Cada intento fallido de creación **SÍ crea la cuenta en Firebase Auth** aunque Firestore falle. Antes de continuar, verificar en Firebase Auth Console que no hayan quedado cuentas huérfanas (sin documento en Firestore) de los intentos previos.

**Verificar en:** https://console.firebase.google.com/project/ferco-planes-staging/authentication/users

Si hay cuentas duplicadas, eliminarlas manualmente antes de reintentar con el mismo correo.

---

## 8. Usuarios actuales en el sistema

Solo 2 usuarios registrados en Firestore:

| Nombre | Cargo | Rol | País/Área |
|--------|-------|-----|-----------|
| Monica Muralles | — | `rh` / RH Global | Global |
| Karla Mariela Fernandez Coro | Gerente de Sucursal | `sucursal` | Guatemala / Comercial |

**Orden recomendado para crear usuarios** (de arriba hacia abajo):
1. Director Comercial GT
2. Director Retail / Gerente Mayoreo / Gerentes de área
3. Regionales (Regional Freddy, Regional Sandra, etc.)
4. Zonas (Zona Diego, Zona Selvin, etc.)
5. Gerentes de Sucursal
6. Asesores Comerciales / KAM

---

## 9. Historial de cambios recientes (últimas sesiones)

| Commit | Descripción |
|--------|-------------|
| `47c734a` | Fix botón colgado: `finally` block + estrategia dual de escritura |
| `08ba9a4` | Intento fix permission-denied con secondaryApp Firestore |
| `0ca6933` | Mejor manejo de errores en saveUser, códigos de error visibles |
| `8dbf426` | Fix Reporta-a fallback: respeta nivel de rol cross-country |
| `f6050a0` | Form v3: Puesto como dropdown dinámico + Reporta-a con filtro jerárquico |
| `ca640bb` | Simplificación formulario: texto libre → ahora revertido a dropdown |
| `0070e41` | 5 mejoras: fix kanban, tarjetas en cascada, jerarquía País>Área |

---

## 10. Archivos de desarrollo / patching

Los archivos `.py` en la carpeta son scripts de parche que modifican `index.html` en modo binario (para preservar CRLF). Se usan porque el archivo es muy grande para edición manual segura.

| Archivo | Propósito |
|---------|-----------|
| `_patch_modal.py` | Parche HTML del modal de alta |
| `_patch_js2.py` | Parche funciones JS openUserModal, populateReportaA |
| `_patch_saveuser.py` | Parche función saveUser |
| `_patch_v3.py` / `_patch_v3b.py` | Parche v3: Puesto dropdown + Reporta-a filtrado |
| `ERRORES_HISTORICO.md` | Registro de bugs encontrados y resueltos |

---

## 11. Validación JS antes de cada commit

```bash
cd "C:\Users\giancarlo.lam\Downloads\Planes FERCO V3"

# Extraer el módulo JS y verificar sintaxis
python -c "
import re
with open('index.html','r',encoding='utf-8') as f: c=f.read()
m=re.search(r'<script type=\"module\">(.*?)</script>',c,re.DOTALL)
with open('_tmp_check.mjs','w',encoding='utf-8') as f: f.write(m.group(1))
"
node --check _tmp_check.mjs
```

Debe retornar **0 salida / sin output** = sintaxis válida.

---

## 12. Próximos pasos (en orden de prioridad)

1. **[URGENTE] Actualizar reglas Firestore** → desbloquea la creación de usuarios
2. **Crear usuarios en orden jerárquico** (Director → Regional → Zona → Sucursal)
3. **Verificar cuentas huérfanas** en Firebase Auth de intentos fallidos previos
4. **Verificar flujo completo**: crear usuario → recibe correo → configura contraseña → inicia sesión → ve sus planes
5. **Verificar Mis Reportes**: que el Director vea a sus Regionales, y así sucesivamente

---

## 13. Contactos / accesos

| Recurso | URL / info |
|---------|-----------|
| Firebase Console | https://console.firebase.google.com/project/ferco-planes-staging |
| Firestore Rules | /firestore/rules en la consola |
| Firebase Auth | /authentication/users en la consola |
| Netlify | https://app.netlify.com (buscar ferco-planes-v2) |
| GitHub | https://github.com/giancaremma50-hue/ferco-planes-v2 |
| Archivo principal | `C:\Users\giancarlo.lam\Downloads\Planes FERCO V3\index.html` |
