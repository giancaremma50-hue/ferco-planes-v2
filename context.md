# Contexto del Proyecto: Planes FERCO V3

## Descripción General
Planes FERCO V3 es una aplicación web empresarial diseñada para gestionar "Planes de Fortalecimiento" y reuniones "Uno a Uno" entre los colaboradores y sus líderes directos. El objetivo de la plataforma es hacer un seguimiento estructurado del desempeño, objetivos y retroalimentación de los empleados a lo largo de varias regiones y áreas de la empresa.

## Arquitectura y Tecnologías
La aplicación tiene una arquitectura ágil y "serverless", compuesta por:
- **Frontend:** HTML5, Vanilla JavaScript (`js/app.js`), y CSS puro (`css/main.css`). No utiliza frameworks pesados como React o Angular para mantener la carga ligera y rápida. Utiliza librerías externas como *Chart.js* para la visualización de KPIs.
- **Backend / Base de Datos:** [Supabase](https://supabase.com/). Se encarga de la base de datos relacional (PostgreSQL), reglas de seguridad de nivel de fila (RLS), y la autenticación de usuarios (GoTrue Auth).
- **Hosting / Funciones Serverless:** Alojado en [Netlify](https://www.netlify.com/). Se hace uso de *Netlify Functions* (`netlify/functions/send-email.js`) para ejecutar código de backend seguro, específicamente para conectarse a la API de **Resend** y enviar correos electrónicos transaccionales sin exponer la API Key en el frontend.

## Modelo de Datos Principal (Supabase)
- **`perfiles`**: Tabla central que almacena la información de los usuarios (Nombre, Correo, País, Área, Puesto, Rol y `reportaA`). `reportaA` es la clave foránea que enlaza el UID de un empleado con el UID de su jefe directo.
- **`planes`**: Almacena los Planes de Fortalecimiento.
- **`uno_a_uno`**: Almacena las reuniones de seguimiento Uno a Uno.
- **`config`**: Documento JSON único que guarda la jerarquía oficial de la empresa (Países, Áreas y Puestos).

## Reglas de Negocio Clave
1. **Jerarquía Dinámica**: La visibilidad de los datos se rige estrictamente por la cadena de mando. Un jefe puede ver sus propios planes y los de todos los empleados que estén por debajo de él en el árbol organizacional (recursivamente).
2. **Roles Globales**: Puestos como **CEO** y **RH Global** tienen permisos de "Super Admin", lo que les permite visualizar todos los planes y reportes de la compañía sin importar el país o área.
3. **Control de Acceso (RBAC)**: Solo Recursos Humanos y Directores pueden realizar ciertas acciones como gestionar la configuración de la empresa y dar de alta a nuevos usuarios.
