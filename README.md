# FERCO Planes v3

Sistema de gestión de planes de desarrollo para colaboradores de FERCO, disponible en producción en **[ferco-planes-v2.netlify.app](https://ferco-planes-v2.netlify.app)**.

---

## Objetivo

Digitalizar y centralizar el seguimiento de planes de desarrollo del equipo comercial y administrativo de FERCO. Los líderes crean planes para sus colaboradores, registran seguimientos semanales, adjuntan evidencias y monitorean el avance en un tablero Kanban compartido por jerarquía.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + CSS3 + JavaScript vanilla (SPA, un solo archivo) |
| Autenticación | Firebase Authentication (email/password) |
| Base de datos | Firestore (NoSQL, tiempo real) |
| Almacenamiento | Firebase Storage (archivos adjuntos) |
| Hosting | Netlify (deploy automático desde GitHub) |
| Gráficas | Chart.js 4.4.0 |
| PDF / Impresión | `window.print()` + CSS `@media print` |
| Repositorio | GitHub → `giancaremma50-hue/ferco-planes-v2` |

> **Proyecto Firebase:** `ferco-planes-staging`

---

## Tipos de plan

### 1. Plan de Fortalecimiento
Para el área **Administrativa**. Documenta fortalezas, áreas de mejora y acuerdos SMART con fechas de seguimiento y cierre. Los seguimientos registran el avance por acuerdo y generan una línea de tiempo.

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
uid, nombre, email, rol, area, pais, region, zona, sucursal
```

### `notificaciones_{uid}` — Notificaciones por usuario
```
mensaje, tipo, planId, fecha, leida, ts
```

---

## Sistema de roles y jerarquía

### Área Comercial

| Rol | Acceso |
|-----|--------|
| `director` | Ve todos los planes de sus regionales (por país y región) |
| `regional` | Ve planes de sus zonas (misma región) |
| `zona` | Ve planes de sus sucursales (misma zona) |
| `sucursal` | Ve solo sus propios planes |

### Área Administración

| Rol | Etiqueta | Alcance |
|-----|----------|---------|
| `dir_admin` | Director | Ve todos los gerentes_admin del mismo país |
| `gerente_admin` | Gerente | Ve todos los jefes_admin del mismo país |
| `jefe_admin` | Jefe | Ve todos los supervisores_admin del mismo país |
| `supervisor_admin` | Supervisor | Ve todos los coordinadores_admin del mismo país |
| `coordinador_admin` | Coordinador | Solo sus propios planes |

### Rol especial

| Rol | Descripción |
|-----|-------------|
| `rh` | **RH Global** — Transversal, sin área. Ve todos los planes (Fortalecimiento + UAU) de todos los países. Puede crear usuarios de cualquier área y rol. |

---

## Funcionalidades activas

### Tablero Kanban
- Columnas: **En curso** · **En seguimiento** · **Cierre**
- Tarjetas diferenciadas por tipo: Fortalecimiento (borde negro) / UAU (borde dorado)
- Badges de tipo, nombre del asesor, líder, sucursal, semana, conteo de seguimientos
- Filtros: etapa, nombre del asesor, país, región, zona, sucursal (según rol)
- Sub-vistas: **Mis planes** / **Mis reportes** (planes de subordinados, jerarquía en cascada)
- Contadores dinámicos por columna y sub-vista

### Detalle del plan — Fortalecimiento
- **Resumen**: datos generales, estado, % avance, próximo seguimiento
- **Acuerdos SMART**: objetivo, acción, fechas, evidencia, soporte, archivos adjuntos; indicador visual de vencimiento (⚠)
- **Seguimientos**: línea de tiempo con avance, % logro, fecha
- **Archivos**: subida y descarga desde Firebase Storage
- **Comentarios**: hilo de mensajes entre usuarios con mención `@usuario`
- **Edición**: modificar datos generales, fortalezas, áreas, acuerdos SMART
- **Cierre**: registro de cierre con fecha y archivo de evidencia
- **PDF**: impresión completa con `window.print()` (portada + acuerdos + seguimientos)

### Detalle del plan — Uno a Uno (UAU)
- **Indicadores**: tabla de 11 campos con símbolo de moneda según país (Q / L / $)
- **Resumen**: causas, compromisos del asesor y del gerente
- **Seguimientos**: comparativa semana anterior vs actual con deltas (▲ verde / ▼ rojo) para los 13 indicadores (11 base + % PPT + Tasa de Conversión)
- **Gráficas históricas**: 13 gráficas de línea Chart.js (una por indicador) con histórico acumulado de todas las semanas
- **Archivos** y **Comentarios**: igual que Fortalecimiento
- **Anexo PDF**: impresión del seguimiento con tabla comparativa + datos del plan

### Creación de planes

**Fortalecimiento** (3 tabs):
1. Datos generales: nombre, puesto, país, región/zona/sucursal
2. Fortalezas identificadas (texto libre)
3. Áreas de mejora (texto libre)
4. Acuerdos SMART (dinámicos, con subida de archivos por acuerdo)

**Uno a Uno** (3 tabs):
1. Datos generales: nombre del asesor, semana ISO (auto-calculada), año, sucursal
2. Indicadores: 11 campos numéricos con % PPT y Tasa de Conversión calculados en tiempo real
3. Resumen y compromisos

### Notificaciones
- Sistema in-app con campana (🔔) y badge de no leídas
- Notificación automática cuando un acuerdo SMART vence
- Panel de notificaciones con marcado como leída
- Mención `@usuario` en comentarios genera notificación al mencionado

### Gestión de usuarios (rol `rh`)
- Crear usuarios sin cerrar sesión (segunda instancia Firebase temporal)
- Editar: nombre, rol, área, país, región, zona, sucursal
- Desactivar / reactivar usuario
- Enviar correo de restablecimiento de contraseña
- Tabla filtrable por país y rol

---

## Moneda por país

| País | Símbolo |
|------|---------|
| Guatemala | Q |
| Honduras | L |
| El Salvador | $ |
| México | $ |

---

## Geografía configurada

Los datos de regiones, zonas y sucursales están precargados en el código para:
- **Guatemala** (`GT_DATA`): estructura completa por regional → zonas → sucursales
- **Honduras** (`HN_DATA`)
- **El Salvador** (`SV_DATA`)
- **México** (`MX_DATA`)

---

## Estructura del repositorio

```
ferco-planes-v2/
├── index.html          # SPA completa (~3,600 líneas)
├── netlify.toml        # Config Netlify (publish, secrets scan)
└── README.md
```

---

## Variables de entorno (Netlify)

| Variable | Descripción |
|----------|-------------|
| `RESEND_API_KEY` | API key de Resend (reservada para futura integración de email) |

---

## Deploy

El sitio se despliega automáticamente en Netlify al hacer `git push` a la rama `main`.

```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

Netlify detecta el push, construye y publica en **[ferco-planes-v2.netlify.app](https://ferco-planes-v2.netlify.app)** en ~1–2 minutos.

---

## Pendiente / Roadmap

- [ ] **Notificaciones por correo** — Al crear/actualizar un plan, enviar email al colaborador con resumen ejecutivo y PDF adjunto. Requiere dominio verificado en Resend (SPF + DKIM en DNS de `ferco.com.gt`).
- [ ] **Dominio personalizado** — Configurar `planes.ferco.com.gt` en Netlify DNS
- [ ] **Roles por país adicionales** — Ampliar jerarquía a otros países con su propia estructura regional

---

## Créditos

Desarrollado para **FERCO** · Sistema interno de planes de desarrollo · v3 · 2026
