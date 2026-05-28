# HANDOFF — Planes FERCO v5
*Última actualización: May 28, 2026*

---

## 1. Descripción general del proyecto

**Planes de Fortalecimiento FERCO** es una aplicación web SPA (Single Page Application) que gestiona planes de desarrollo comercial y administrativo para los equipos de FERCO en Guatemala, El Salvador, Honduras y México.

* **URL de producción:** [https://ferco-planes-v2.netlify.app](https://ferco-planes-v2.netlify.app)
* **Repositorio:** [https://github.com/giancaremma50-hue/ferco-planes-v2](https://github.com/giancaremma50-hue/ferco-planes-v2)
* **Rama principal:** `main` (despliegue automático en Netlify)
* **Archivo central:** `js/app.js` e `index.html` en la raíz del proyecto.

---

## 2. Stack tecnológico actual (v5)

| Capa | Tecnología |
|------|-----------|
| **Frontend** | HTML5 + CSS3 + JavaScript vanilla (SPA sin frameworks) |
| **Autenticación** | Firebase Authentication (email/password) |
| **Base de Datos** | **Supabase (PostgreSQL)** alojando la base centralizada con conexión directa desde el cliente |
| **Almacenamiento** | **Supabase Storage** (evidencias, archivos adjuntos y PDFs generados) con políticas RLS activas |
| **Hosting** | Netlify (deploy automático desde la rama `main` en GitHub) |
| **Gráficos** | Chart.js 4.4.0 (visualizaciones de históricos en planes Uno a Uno) |

---

## 3. Estructura del repositorio

```
ferco-planes-v2/
├── index.html          # HTML principal y estructura base de la SPA
├── css/
│   └── main.css        # Estilos visuales de la aplicación, temas Dark/Light
├── js/
│   ├── app.js           # Lógica central del negocio (Controladores, Renderers, Auth)
│   └── supabase-client.js # Configuración del cliente Supabase y funciones DB
├── supabase_schema.sql # Estructura y tablas DDL de Supabase (PostgreSQL)
├── seed.sql            # Datos de inicialización y catálogo maestro de la base de datos
└── README.md           # Documentación general y arquitectura v5
```

---

## 4. Estado de la Base de Datos (Supabase)

El sistema ha sido migrado exitosamente de Firestore a **Supabase (PostgreSQL)**. 

### Colección de Configuración (`config` en Supabase)
El registro clave es `id = 'empresa'`. Contiene en formato JSON:
* `paises`: Lista de países autorizados.
* `areas`: Áreas de la empresa (Ej: Comercial, Administrativa, etc.).
* `puestos`: Diccionario completo de cargos en la jerarquía, relacionando a quién reportan y su respectivo nivel jerárquico.

### Control de Sucursales
Las sucursales se obtienen directamente de la base de datos mediante la tabla maestra, permitiendo consistencia a nivel internacional y formularios de alta de usuario con dropdowns dinámicos basados en el país y puesto seleccionado.

---

## 5. Próximos pasos pendientes y sugeridos

### 1. Módulo de Edición de Puestos en UI (Punto 3 - Revertido temporalmente)
* **Estado:** Actualmente, el panel administrativo permite **Agregar** y **Eliminar** puestos del diccionario maestro, pero la edición inline de un puesto existente fue revertida para conservar la versión estable mientras se redefine el flujo de actualización de IDs jerárquicos.
* **Pendiente:** Si en el futuro se requiere editar puestos visualmente, se debe planificar cómo manejar la cascada de IDs jerárquicos (por ejemplo, si un puesto cambia de nombre, actualizar dinámicamente a todos los colaboradores que reportan a su ID anterior).

### 2. Sincronización/Migración de Usuarios Firebase ➔ Supabase Auth (Punto 2 - Omitido)
* **Estado:** Se decidió omitir la migración masiva automática de usuarios de Firebase Auth a Supabase Auth para mantener el flujo de autenticación actual simple y sin interrupciones.
* **Pendiente:** Si se deseara unificar al 100% las cuentas en Supabase Auth en el futuro, se requerirá un script backend para exportar los hashes de contraseñas de Firebase e inyectarlos en la tabla `auth.users` de Supabase.

### 3. Pruebas de Despliegue en Producción
* **Estado:** Se ha hecho el rollback completo y limpio en la rama `main` de GitHub.
* **Acción:** Verificar en el panel de Netlify que el despliegue automático haya finalizado exitosamente y que la URL pública funcione correctamente sin errores de consola.

---

*Handoff preparado para FERCO · v5 · Mayo 2026*
