# FERCO Planes v4

Sistema de gestión de planes de desarrollo para colaboradores de FERCO, disponible en producción en **[ferco-planes-v2.netlify.app](https://ferco-planes-v2.netlify.app)**.

---

## Objetivo

Digitalizar y centralizar el seguimiento de planes de desarrollo del equipo comercial y administrativo de FERCO. Los líderes crean planes para sus colaboradores, registran seguimientos semanales, adjuntan evidencias y monitorean el avance en un tablero Kanban compartido por jerarquía, con notificaciones automáticas y reportes automatizados en PDF por correo electrónico.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + CSS3 + JavaScript vanilla (SPA, un solo archivo) |
| Autenticación | Firebase Authentication (email/password) con persistencia de sesión por pestaña |
| Base de datos | Firestore (NoSQL, tiempo real) con reglas de seguridad de nivel de producción |
| Almacenamiento | Firebase Storage (archivos adjuntos y planes PDF firmados) con reglas de acceso seguro |
| Notificaciones | Extensión "Trigger Email" de Firebase (envío automático vía Firestore) |
| Hosting | Netlify (deploy automático desde GitHub) |
| Gráficas | Chart.js 4.4.0 |
| PDF / Impresión | `html2pdf.js` (generación y exportación de PDFs) + `window.print()` + CSS `@media print` |
| Repositorio | GitHub → `giancaremma50-hue/ferco-planes-v2` |

> **Proyecto Firebase:** `ferco-planes-staging`

---

## Tipos de plan

### 1. Plan de Fortalecimiento
Para el área **Administrativa y Corporativa**. Documenta fortalezas, áreas de mejora y acuerdos SMART con fechas de seguimiento y cierre. Los seguimientos registran el avance por acuerdo y generan una línea de tiempo interactiva.

### 2. Uno a Uno (UAU)
Para el área **Comercial**. Captura 11 indicadores numéricos semanales (utilidad, facturación, cotizaciones, oportunidades, etc.) con cálculos automáticos de % PPT y Tasa de Conversión. Genera gráficas históricas de línea por indicador.

---

## Colecciones Firestore

### `planes` — Planes de Fortalecimiento
```
asesor, puesto, lider, liderUid, creadoPor, fecha
pais, region, zona, sucursal
fortalezas, areas
smart: [{ obj, accion, fseg, fcierre, evidencia, soporte, archivos[] }]
estado: "En curso" | "En seguimiento" | "Cierre"
pct: número (0–100)
seguimientos: [{ avance, pct, acuerdo, soporte, fecha, autor, archivos[] }]
archivos: [], comentarios: []
creadoEn: timestamp
```

### `unoauno` — Planes Uno a Uno
```
asesor, lider, liderUid, creadoPor
semana, año, sucursal, pais, region, zona
indicadores: { metaUtilidad, utilidadGenerada, montoCotizado, facturacion,
               clientesAtendidos, cotizaciones, facturas,
               oport2_5K_mas, oport2_5K_menos, totalOportSF, oportunidadesPerdidas }
resumen, compromisosAsesor, compromisosGerente
estado: "En curso" | "En seguimiento"
seguimientos: [{ semana, año, indicadores{}, resumen, compromisosAsesor,
                 compromisosGerente, fecha, autor, archivos[] }]
archivos: [], comentarios: []
creadoEn: timestamp
```

### `users` — Perfiles de usuario
```
uid, nombre, email, rol, area, pais, region, zona, sucursal, reportaA
```

### `mail` — Correos salientes (Trigger Email Extension)
```
to: [emails],
message: { subject, html }
```

### `notificaciones_{uid}` — Notificaciones por usuario
```
mensaje, tipo, planId, fecha, leida, ts
```

---

## Sistema de roles y jerarquía híbrida recursiva

El sistema combina la estructura comercial geográfica con un modelo corporativo dinámico para dar soporte a cualquier dirección de la empresa sin límites de niveles.

### 1. Área Comercial (Cascada Geográfica)

| Rol | Acceso |
|-----|--------|
| `director` | Ve todos los planes de sus regionales (por país y región) |
| `regional` | Ve planes de sus zonas (misma región) |
| `zona` | Ve planes de sus sucursales (misma zona) |
| `sucursal` | Ve solo sus propios planes |

### 2. Puestos Corporativos y Administrativos (Jerarquía de Reporte Directo)
Para departamentos como Operaciones (COO), CPO, Finanzas, Transformación, CHRO, etc., la jerarquía se establece mediante el campo **"Reporta A"** en la creación del usuario.
- **Búsqueda Recursiva:** El sistema analiza en tiempo real y de forma infinita quién le reporta a quién. Un líder de cualquier nivel corporativo puede visualizar de inmediato los planes de todo su equipo (subordinados directos e indirectos) sin límites programáticos en el código.

### 3. Roles Especiales y Administración
- **`rh` / `rh_global`:** Administradores del sistema. Tienen visibilidad global ilimitada sobre todo el sistema, todos los países y todos los departamentos comerciales y corporativos. Tienen control total para la creación de usuarios.

---

## Funcionalidades y Mejoras Destacadas

### ✉️ Notificaciones e Integración de Correo
- **Alta Automática Segura:** Al dar de alta un usuario desde RH, el sistema genera automáticamente una contraseña aleatoria de 16 caracteres y dispara el correo oficial de Firebase para que el usuario configure su clave personal de forma confidencial.
- **Correo de Bienvenida:** Se encola un correo de bienvenida automático al colaborador con detalles sobre su rol y pasos iniciales.
- **Envío de Planes en PDF:** Los planes (Fortalecimiento y Uno a Uno) incluyen la opción de **"Enviar PDF"**. Al hacer clic:
  1. Se genera un documento PDF preciso usando `html2pdf.js`.
  2. Se sube el archivo de forma encriptada a Firebase Storage.
  3. Se envía un correo automático a todos los participantes con el enlace seguro de descarga.

### 🌎 Gestión de Usuarios en Cascada Interactiva
- **Organización Multinivel:** La interfaz plana de usuarios fue reemplazada por un árbol jerárquico colapsable agrupado en: **País ➔ Área/Departamento ➔ Colaboradores**.
- **Tarjetas Premium:** Se despliega un Grid responsivo de tarjetas elegantes que detallan el Nombre, Correo, Rol exacto, a quién reporta y jerarquía comercial.
- **Filtrado Inteligente de Líderes:** En el modal de creación de usuarios, la lista de selección "Reporta A" se reduce y filtra de manera dinámica de acuerdo al área seleccionada para encontrar al jefe directo en segundos.
- **Restablecimiento de Contraseñas Rápido:** Cada tarjeta de usuario posee un icono de candado/llave siempre activo que permite a RH o Administradores enviar el correo de recuperación al instante con confirmación flotante (*Toast*).

### 🛡️ Seguridad de Servidor y Hardening
- **Reglas de Seguridad Firestore (`firestore.rules`):** Reglas optimizadas para producción que validan en el servidor que los usuarios solo accedan a los datos permitidos de acuerdo a su ID, subordinación o asignación regional.
- **Reglas de Firebase Storage (`storage.rules`):** Bloqueo total para subida y descarga de archivos PDF y adjuntos a usuarios no autenticados en el sistema.
- **Sanamiento de Errores:** Eliminación del uso de `.message` crudos en el frontend para evitar fugas de información técnica o de bases de datos. Los errores reales se imprimen de forma protegida en consola y se muestran mensajes genéricos y amigables en la UI.
- **Protección de Sesión:** Persistencia de inicio de sesión por pestaña (`browserSessionPersistence`), cerrando sesiones automáticamente al cerrar la pestaña o ventana del navegador en ordenadores compartidos.

---

## Estructura del repositorio

```
ferco-planes-v2/
├── index.html          # SPA completa con toda la lógica interactiva
├── firestore.rules     # Reglas oficiales de seguridad para Firestore Database
├── storage.rules       # Reglas oficiales de seguridad para Firebase Storage
├── netlify.toml        # Config Netlify (publish, secrets scan)
└── README.md           # Esta guía de documentación y arquitectura
```

---

## Deploy

El sitio se despliega automáticamente en Netlify al hacer `git push` a la rama `main`.

```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

Netlify detecta el push, construye y publica la nueva versión en **[ferco-planes-v2.netlify.app](https://ferco-planes-v2.netlify.app)** de manera inmediata.

---

## Pendientes / Roadmap

- [ ] **Dominio personalizado** — Configurar `planes.ferco.com.gt` en Netlify DNS
- [ ] **Habilitar Firebase App Check** — Integración final con reCAPTCHA Enterprise en producción

---

## Créditos

Desarrollado para **FERCO** · Sistema corporativo interno de planes de desarrollo · v4 · 2026
