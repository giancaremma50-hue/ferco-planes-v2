# FERCO Planes v5

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
| Base de datos | **Supabase (PostgreSQL)** alojando la base centralizada con un proxy adaptador transparente desde Firebase |
| Almacenamiento | **Supabase Storage** (archivos adjuntos, evidencias y planes PDF firmados) con políticas RLS de acceso seguro |
| Notificaciones | Extensión "Trigger Email" (envío automático vía colección de correos salientes) |
| Hosting | Netlify (deploy automático desde GitHub) |
| Gráficas | Chart.js 4.4.0 |
| PDF / Impresión | `html2pdf.js` (generación y exportación de PDFs) + `window.print()` + CSS `@media print` |
| Repositorio | GitHub → `giancaremma50-hue/ferco-planes-v2` |

---

## Tipos de plan

### 1. Plan de Fortalecimiento
Para el área **Administrativa y Corporativa**. Documenta fortalezas, áreas de mejora y acuerdos SMART con fechas de seguimiento y cierre. Los seguimientos registran el avance por acuerdo y generan una línea de tiempo interactiva.

### 2. Uno a Uno (UAU)
Para el área **Comercial**. Captura 11 indicadores numéricos semanales (utilidad, facturación, cotizaciones, oportunidades, etc.) con cálculos automáticos de % PPT y Tasa de Conversión. Genera gráficas históricas de línea por indicador.

---

## Funcionalidades y Mejoras Destacadas (v5)

### 🗄️ Bóveda Maestra de Evidencias
- El contador de la pestaña **Archivos** es ahora dinámico, sumando de manera global todas las evidencias adjuntas al plan.
- Al acceder a la pestaña, se presenta la **Bóveda Maestra**, una lista consolidada que agrupa inteligentemente todos los archivos según su origen (Acuerdos SMART, Seguimientos Históricos, Archivos Generales y Firma de Cierre), con hipervínculos directos al bucket seguro de Supabase.

### 🏢 Red de Sucursales Dinámicas e Internacionales
- Integración completa de sucursales a nivel centroamericano (Guatemala, El Salvador, Honduras, México).
- Sistema de **Formularios Dinámicos Inteligentes**: Los campos de "Sucursal" permanecen ocultos por defecto y solo se despliegan para puestos de *Gerente de sucursal* o *Asesor*.
- **Auto-Sembrado en Base de Datos**: Las listas de sucursales se autoconfiguran en el documento de configuración de Supabase y filtran sus opciones en tiempo real dependiendo del *País* seleccionado por el usuario.

### ⚙️ Configuración Administrativa Premium (RH Global)
- Interfaz flotante renovada (Overlay) para el manejo rápido del diccionario maestro de la empresa.
- Motor de búsqueda inteligente de puestos, diseño minimalista y botones contextuales, limpiando la barra de navegación lateral y ubicando la configuración de jerarquías estratégicamente en el módulo de Usuarios.

### ✉️ Notificaciones e Integración de Correo
- **Alta Automática Segura:** Al dar de alta un usuario desde RH, el sistema dispara correos oficiales para la configuración de claves.
- **Envío de Planes en PDF:** Generación automática de documentos PDF vía `html2pdf.js`, almacenados de forma segura en Supabase Storage y despachados por correo con links encriptados.

### 🌎 Gestión de Usuarios en Cascada Interactiva
- Árbol jerárquico colapsable agrupado en: **País ➔ Área/Departamento ➔ Colaboradores**.
- Tarjetas Premium y Filtrado Inteligente de Líderes.

### 🛡️ Migración y Seguridad Backend a Supabase
- **Reglas RLS Postgre:** Implementación de políticas (Row Level Security) nativas en Supabase Storage bloqueando subidas anónimas y permitiendo manipulación protegida mediante autenticación.
- Base de datos relacional híbrida con adaptador de Firestore a consultas REST de Supabase, manteniendo la velocidad interactiva del frontend.

---

## Estructura del repositorio

```
ferco-planes-v2/
├── index.html          # SPA completa con toda la lógica interactiva
├── css/                # Hojas de estilo modulares
├── js/app.js           # Lógica central (UI, Supabase, Auth)
├── Listado_Sucursales_Unificado.md # Matriz de tiendas por país
├── supabase_schema.sql # Scripts de inyección PostgreSQL para Supabase
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

## Créditos

Desarrollado para **FERCO** · Sistema corporativo interno de planes de desarrollo · v5 · 2026
