# Documento de Transición (Handoff)

Este documento está diseñado para cualquier desarrollador, ingeniero o agente de IA que tome el control del proyecto "Planes FERCO V3" en el futuro.

## Estado Actual del Proyecto
El proyecto se encuentra **en producción y completamente funcional**. Recientemente se completó una refactorización mayor para migrar de una jerarquía estática a una jerarquía 100% dinámica, permitiendo que cualquier puesto en la empresa pueda tener subordinados y que la plataforma respete la cadena de mando de forma automática.

## Estructura de Archivos Clave
- `index.html`: Punto de entrada único (Single Page Application). Contiene la estructura de todas las vistas, modales y llamadas a scripts.
- `js/app.js`: Contiene toda la lógica del negocio. Aquí se manejan las llamadas a Supabase, validaciones de formularios, renderizado de tablas, gráficos y cálculo recursivo de jerarquías (`getSubordinateUids`).
- `css/main.css`: Estilos visuales. Se debe mantener el diseño moderno y limpio.
- `netlify/functions/send-email.js`: Función backend de Netlify que se conecta a la API de **Resend** para notificaciones por correo electrónico.

## Configuración de Entorno (Deploy / Local)
Para levantar el proyecto de forma local:
1. Clona el repositorio.
2. Puedes usar una extensión como *Live Server* en VSCode o correr `npx serve` en el directorio principal.
3. Asegúrate de configurar la variable de entorno `RESEND_API_KEY` y `FROM_EMAIL` en tu entorno local o en el panel de Netlify para que el envío de correos funcione.
4. Las llaves públicas de Supabase (`supabaseUrl` y `supabaseKey`) se encuentran en las primeras líneas de `app.js`.

## Notas Importantes para Futuros Desarrolladores
- **Caché en Producción:** Netlify suele cachear agresivamente los archivos `.js`. Si haces modificaciones en `js/app.js`, **debes incrementar el parámetro `?v=...`** en la etiqueta `<script>` dentro de `index.html` (ej. `?v=1780000018`) para romper la caché de los usuarios.
- **Creación de Usuarios:** La función `saveUser` en `app.js` utiliza un cliente de Supabase temporal (`tempSupabase`) con almacenamiento simulado para crear usuarios nuevos. Esto es intencional y evita que la sesión del administrador activo se cierre por accidente al crear la cuenta de un colaborador. ¡No remover esta lógica!
- **Jerarquías Cruzadas (CEO):** En la función `onPuestoChange` existe una excepción codificada explícitamente para el rol de **CEO**. Dado que el árbol divide los puestos por país y área, la excepción asegura que cualquier persona bajo el rol "CEO" pueda ser asignado como jefe, rompiendo la barrera de área/país.

## Siguientes Pasos (Opcionales)
- Considerar mover las credenciales públicas de Supabase de `app.js` hacia variables de entorno inyectadas durante el *build*, aunque no representan un riesgo crítico debido a las reglas RLS de Supabase.
- Posible refactorización a módulos ECMAScript (`import/export`) si `app.js` sigue creciendo (actualmente supera las 4000 líneas).
