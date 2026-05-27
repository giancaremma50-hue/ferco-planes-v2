# Arquitectura de Perfiles y Jerarquías

> **Propósito:** Directorio maestro para altas de usuarios, definición de roles (RBAC) y control de accesos.
> **Estructura Relacional Esperada (Supabase):** `pais` | `area` | `puesto` | `reporta_a` (Foreign Key recursiva) | `nivel_jerarquico`

## Reglas de Lectura para IA
1. Cada nivel de indentación representa una dependencia directa (reporte).
2. Los roles separados por `/` (ej. Diseñador / Fotógrafo) ocupan el mismo nivel jerárquico dentro de esa rama.
3. El Nivel 1 siempre es la cúspide estratégica (CEO).

---

## 🇬🇹 País: Guatemala

### Área: Comercial
- **[Nivel 1]** CEO
  - **[Nivel 2]** Director Comercial GT
    - **[Nivel 3]** Gerente Mayoreo
    - **[Nivel 3]** Director Retail
      - **[Nivel 4]** Regional Marlon
        - **[Nivel 5]** Gerente de Sucursal
          - **[Nivel 6]** Asesor Comercial
      - **[Nivel 4]** Regional Sandra
        - **[Nivel 5]** Zona Eva
          - **[Nivel 6]** Gerente de Sucursal
            - **[Nivel 7]** Asesor Comercial
      - **[Nivel 4]** Regional Carlos
        - **[Nivel 5]** Gerente de Sucursal
          - **[Nivel 6]** Asesor Comercial
      - **[Nivel 4]** Regional Freddy
        - **[Nivel 5]** Gerente de Sucursal
          - **[Nivel 6]** Gerente de Sucursal
            - **[Nivel 7]** Asesor Comercial
        - **[Nivel 5]** Zona Diego
          - **[Nivel 6]** Gerente de Sucursal
            - **[Nivel 7]** Asesor Comercial
        - **[Nivel 5]** Zona Selvin
          - **[Nivel 6]** Gerente de Sucursal
            - **[Nivel 7]** Asesor Comercial
        - **[Nivel 5]** Zona Jose
          - **[Nivel 6]** Gerente de Sucursal
            - **[Nivel 7]** Asesor Comercial
        - **[Nivel 5]** Zona Giovany
          - **[Nivel 6]** Gerente de Sucursal
            - **[Nivel 7]** Asesor Comercial
    - **[Nivel 3]** Gerente Proyectos
      - **[Nivel 4]** KAM
    - **[Nivel 3]** Gerente Canales Digitales
      - **[Nivel 4]** Líder de Mesa
        - **[Nivel 5]** Asesor Comercial

### Área: Operaciones
- **[Nivel 1]** CEO
  - **[Nivel 2]** COO
    - **[Nivel 3]** Gerente Operaciones GT
      - **[Nivel 4]** Gerente HUB
        - **[Nivel 5]** Jefe de CEDI
          - **[Nivel 6]** Encargado de Bodega
            - **[Nivel 7]** Supervisor
              - **[Nivel 8]** Auxiliar de Bodega
    - **[Nivel 3]** Coordinador de Servicio al Cliente
      - **[Nivel 4]** Servicio al Cliente

### Área: Recursos Humanos
- **[Nivel 1]** CEO
  - **[Nivel 2]** CHRO
    - **[Nivel 3]** Gerente de Atracción de Talento
      - **[Nivel 4]** Analista de Atracción de Talento
    - **[Nivel 3]** Gerente de Compensaciones
    - **[Nivel 3]** Jefe de Desarrollo Organizacional
      - **[Nivel 4]** Coach Comercial
    - **[Nivel 3]** Coordinador de Relaciones Laborales
      - **[Nivel 4]** Analista de Servicios al Colaborador
    - **[Nivel 3]** HRBP

### Área: Categorias
- **[Nivel 1]** CEO
  - **[Nivel 2]** CPO
    - **[Nivel 3]** Gerente de Categorías
      - **[Nivel 4]** Especialista / Administrador de Categorías
    - **[Nivel 3]** Gerente de Comercio Internacional
      - **[Nivel 4]** Analista de Importaciones y Exportaciones / Analista de Inventarios
    - **[Nivel 3]** Gerente de Mercadeo
      - **[Nivel 4]** Coordinador de Mercadeo / Coordinador de Diseño
        - **[Nivel 5]** Diseñador / Fotógrafo
    - **[Nivel 3]** Gerente de Cadena de Suministros
      - **[Nivel 4]** Especialista de Compras bajo pedido / Jefe de Resurtido / Jefe de Proyectos
        - **[Nivel 5]** Analista de Back Office Comercial / Analista de Resurtido / Analista de Proyectos

### Área: Finanzas
- **[Nivel 1]** CEO
  - **[Nivel 2]** Gerente Financiero
    - **[Nivel 3]** Contador Corporativo
      - **[Nivel 4]** Contador General GT
        - **[Nivel 5]** Analista de Costos / Asistente de contabilidad / Asistente de Cuentas por Pagar / Analista de Impuestos
      - **[Nivel 4]** Coordinador Administrativo
        - **[Nivel 5]** Asistente de contabilidad / Auxiliar Administrativo
      - **[Nivel 4]** Analista de Nómina
    - **[Nivel 3]** Jefe de Auditoría Interna
      - **[Nivel 4]** Coordinador de Auditoría Interna
        - **[Nivel 5]** Auditor Interno
    - **[Nivel 3]** Jefe de Créditos y Cobros
      - **[Nivel 4]** Asistente de Créditos / Mensajero – Cobrador
    - **[Nivel 3]** Jefe de Compras
      - **[Nivel 4]** Servicio al Cliente Administrativo / Técnico
    - **[Nivel 3]** Jefe de Tesorería Corporativo
      - **[Nivel 4]** Jefe de Cajas
        - **[Nivel 5]** Cajero Regional / Cajero
      - **[Nivel 4]** Analista de Cuentas por Pagar / Cajero Virtual
    - **[Nivel 3]** Analista de Planificación Financiera

### Área: Construcción y Desarrollo
- **[Nivel 1]** CEO
  - **[Nivel 2]** Gerente de Desarrollo y Construcción
    - **[Nivel 3]** PM Construcción / Arquitecto Diseñador / Coordinador de Cuantificaciones y Licitaciones / Supervisor de Instalaciones / Arquitecto Retail / Jefe de Mantenimiento
      - **[Nivel 4]** Auxiliar de Mantenimiento

### Área: IT
- **[Nivel 1]** CEO
  - **[Nivel 2]** Gerente de Transformación Digital
    - **[Nivel 3]** PMO Eficiencia de Negocios y Tecnología
      - **[Nivel 4]** Soporte Técnico Lisa, WMA & TMS
    - **[Nivel 3]** PMO Inteligencia de Procesos y Negocios
      - **[Nivel 4]** Product Owner SAP / Analista de Inteligencia de Negocios
        - **[Nivel 5]** Analista de Soporte
    - **[Nivel 3]** Gerente de Infraestructura y Soporte
      - **[Nivel 4]** Coordinador de Infraestructura / Coordinador de Soporte Técnico
        - **[Nivel 5]** Analista de Soporte Técnico
    - **[Nivel 3]** Project Manager / Analista de Datos Sr.

## 🇸🇻 País: El Salvador

### Área: Comercial
- **[Nivel 1]** CEO
  - **[Nivel 2]** Director Comercial SV
    - **[Nivel 3]** Regional
      - **[Nivel 4]** Gerente de Sucursal
        - **[Nivel 5]** Asesor Comercial
    - **[Nivel 3]** Gerente Proyectos
      - **[Nivel 4]** KAM
    - **[Nivel 3]** Gerente Mayoreo
      - **[Nivel 4]** KAM

### Área: Operaciones
- **[Nivel 1]** CEO
  - **[Nivel 2]** COO
    - **[Nivel 3]** Gerente Operaciones SV
      - **[Nivel 4]** Encargado de Bodega
        - **[Nivel 5]** Supervisor
          - **[Nivel 6]** Auxiliar de Bodega

## 🇭🇳 País: Honduras

### Área: Comercial
- **[Nivel 1]** CEO
  - **[Nivel 2]** Director Comercial HN
    - **[Nivel 3]** Sucursal
      - **[Nivel 4]** Asesor Comercial
    - **[Nivel 3]** Gerente Proyectos
      - **[Nivel 4]** KAM

### Área: Operaciones
- **[Nivel 1]** CEO
  - **[Nivel 2]** COO
    - **[Nivel 3]** Gerente Operaciones HN
      - **[Nivel 4]** Encargado de Bodega
        - **[Nivel 5]** Supervisor
          - **[Nivel 6]** Auxiliar de Bodega

## 🇲🇽 País: México

### Área: Comercial
- **[Nivel 1]** CEO
  - **[Nivel 2]** Director Comercial MX
    - **[Nivel 3]** Regional
      - **[Nivel 4]** Gerente de Sucursal
        - **[Nivel 5]** Asesor Comercial
    - **[Nivel 3]** Gerente Proyectos
      - **[Nivel 4]** KAM
    - **[Nivel 3]** Gerente Mayoreo
      - **[Nivel 4]** KAM

### Área: Operaciones
- **[Nivel 1]** CEO
  - **[Nivel 2]** COO
    - **[Nivel 3]** Gerente Operaciones MX
      - **[Nivel 4]** Encargado de Bodega
        - **[Nivel 5]** Supervisor
          - **[Nivel 6]** Auxiliar de Bodega
    - **[Nivel 3]** Gerente de Logística MX / Coordinador de Transporte
      - **[Nivel 4]** Planificador de Rutas / Chofer / Ayudante de Chofer

### Área: Finanzas
- **[Nivel 1]** CEO
  - **[Nivel 2]** Gerente Financiero
    - **[Nivel 3]** Gerente Administrativo y Financiero MX
      - **[Nivel 4]** Contador General / Jefe de Créditos y Cobros / Contador Nominista / Auxiliar de Limpieza / Guardia de Seguridad