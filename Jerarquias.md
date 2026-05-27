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
      - **[Nivel 4]** KAM
    - **[Nivel 3]** Director Retail
      - **[Nivel 4]** Regional Marlon
        - **[Nivel 5]** Gerente de Sucursal
          - **[Nivel 6]** Asesor Comercial
      - **[Nivel 4]** Regional Sandra
        - **[Nivel 5]** Zona Eva
          - **[Nivel 6]** Gerente de Sucursal
            - **[Nivel 7]** Asesor Comercial
      - **[Nivel 4]** Regional Freddy
        - **[Nivel 5]** Zona Diego
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
    - **[Nivel 3]** Jefe de Desarrollo Organizacional
      - **[Nivel 4]** Coach Comercial
    - **[Nivel 3]** HRBP