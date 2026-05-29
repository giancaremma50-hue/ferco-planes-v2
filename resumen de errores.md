# Resumen Histórico de Errores y Soluciones

A continuación, se documentan los errores más relevantes encontrados recientemente durante el desarrollo y paso a producción, junto con la forma en que fueron resueltos para referencia futura.

### 1. Desconexión de Sesión al Crear Usuarios
- **Error:** `Multiple GoTrueClient instances detected...` seguido de un cierre de sesión repentino para el administrador que intentaba dar de alta a un usuario nuevo.
- **Causa:** Supabase no soporta por defecto la creación de un usuario (SignUp) sin que este sobrescriba automáticamente la sesión activa en el navegador.
- **Solución:** Se implementó la creación de un cliente "fantasma" (`tempSupabase`) en `js/app.js` configurado con `persistSession: false` y funciones de almacenamiento (`storage`) en blanco. Esto permite registrar nuevos perfiles en la base de datos de autenticación sin afectar la cookie de sesión del administrador.

### 2. Error en Disparador de Correos (Tabla Mail)
- **Error:** `404 (Not Found)` y `Could not find the table 'public.mail' in the schema cache` al crear un usuario.
- **Causa:** El sistema intentaba escribir en una tabla `mail` de Supabase para disparar una función Edge de correos, pero dicha tabla fallaba o la configuración de pg_net estaba rota.
- **Solución:** Se eliminó la dependencia de la tabla `mail` y se migró a un acercamiento directo mediante llamadas REST desde `app.js` hacia una **Netlify Function** (`netlify/functions/send-email.js`), la cual utiliza la API de Resend para despachar el correo de forma síncrona.

### 3. Error 403 (Forbidden) al Enviar Correos (Resend)
- **Error:** Falla en la Netlify Function con código 403 devuelto por la API de Resend al intentar enviar correos a un colaborador.
- **Causa:** La cuenta de Resend se encontraba en la capa gratuita (Sandbox), la cual restringe el envío de correos únicamente a la misma dirección de correo del dueño de la cuenta. 
- **Solución:** Se instruyó al administrador para que verificara el dominio oficial de la empresa en el panel de Resend o, alternativamente, usara su propio correo para pruebas.

### 4. Roles y Puestos Duplicados en Selectores
- **Error:** En la vista de "Configuración General", al crear un rol y elegir "Reporta A", la lista desplegable mostraba roles como "Gerente de Sucursal" repetidos 7 veces o más.
- **Causa:** Existen múltiples nodos del mismo rol (ej. uno por cada región o jefe intermedio). El sistema los listaba todos individualmente.
- **Solución:** Se integró un algoritmo de **deduplicación** por nombre en las funciones `onAdmPuestoChange` y `onPuestoChange` de `app.js`, agrupando los puestos equivalentes bajo un solo elemento `<option>`.

### 5. CEO Invisible en la Jerarquía (Reporta A)
- **Error:** Al crear puestos de alto rango (ej. CHRO, CFO), el menú "Reporta a" mostraba el error `(No hay usuarios con el rol requerido)`.
- **Causa:** Al estar el organigrama dividido por Área y País (ej. `ceo_recursoshumanos_guatemala`), y el usuario CEO humano estar registrado en una sola área, sus identificadores no coincidían.
- **Solución:** Se programó una excepción global. Si el puesto superior requiere a un "CEO", la regla de área/país se ignora y permite que **cualquier usuario** del sistema con el prefijo o rol `ceo` sea válido como jefe.

### 6. Pestaña "Mis Reportes" Oculta
- **Error:** RH Global, CEO y puestos con subordinados directos dinámicos no lograban ver la pestaña "Mis reportes" en el dashboard.
- **Causa:** La lógica de visibilidad dependía de un arreglo rígido antiguo (`const hasReportes = ['director', 'regional', 'zona', 'rh'].includes(rol)`).
- **Solución:** Se reemplazó por completo por lógica dinámica y recursiva. Ahora verifica en tiempo real si el usuario tiene subordinados calculados (`getSubordinateUids().length > 0`). En caso afirmativo, se habilitan las pestañas automáticamente.
