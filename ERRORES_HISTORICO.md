# Histórico de Errores — Planes FERCO

> Registro de bugs encontrados y sus correcciones, para evitar que vuelvan a ocurrir.

---

## [2026-05-26] Llaves extra en FERCO_HIERARCHY → login roto sin error visible

**Síntoma:**
- Botón de login no hace nada.
- Sin animación de carga en el botón.
- Sin mensaje de error en pantalla.
- La consola del navegador muestra un error de sintaxis JS (`SyntaxError: Unexpected token`).

**Causa raíz:**
Una llave `}` extra dentro del objeto `FERCO_HIERARCHY` rompe el parse del módulo JS completo.
Como el archivo usa `<script type="module">`, cualquier error de sintaxis previene que el módulo
se ejecute — lo que significa que `window.doLogin` nunca se registra y el botón no tiene listener.

**Commits que lo corrigieron:**
- `b3c1360` — Eliminó `}` extra en el path de "Director Retail"
- `21c3fd2` — Eliminó `}` extra en el path de "Gerente de Operaciones GT"

**Cómo detectarlo:**

Método rápido — copiar el bloque `FERCO_HIERARCHY` a un archivo `.mjs` temporal y ejecutar:
```bash
node --check _tmp_check.mjs
```

Método de balance de llaves — ejecutar en la raíz del proyecto:
```bash
node -e "
let d=0;
require('fs').readFileSync('check.mjs','utf8')
  .split('\n')
  .forEach((l,i) => {
    for(const c of l) {
      if(c==='{') d++;
      if(c==='}') d--;
    }
    if(d < 0) console.log('PROFUNDIDAD NEGATIVA en línea', i+1, l.trim());
  });
console.log('Profundidad final:', d, d===0 ? '✅ OK' : '❌ ERROR');
"
```

**Prevención:**
1. Antes de hacer push, siempre validar la sintaxis: `node --check index_extract.mjs`
2. Al editar `FERCO_HIERARCHY`, verificar el balance de llaves con el script anterior.
3. Usar un editor con highlight de llaves emparejadas (VS Code resalta la llave de cierre correspondiente).
4. Añadir las rutas nuevas de una sola vez y copiar el patrón exacto de las rutas existentes.

---

## [2026-05-26] `AREA_LABELS` eliminado pero referencias no limpiadas

**Síntoma:**
- Error `ReferenceError: AREA_LABELS is not defined` en consola al abrir el modal de usuarios.
- El modal de alta de colaboradores no carga.

**Causa raíz:**
Al reestructurar el sistema de colores de área, se eliminó la constante `AREA_LABELS` y se reemplazó
por `AREA_COLORS` + `AREA_LEGACY_MAP`, pero quedaron referencias a `AREA_LABELS` en `loadUsers`,
`saveUser` y el código antiguo de `onNivelChange`.

**Fix:** Reemplazar todas las referencias a `AREA_LABELS[x]` por la función `areaLabel(x)` que
usa `AREA_LEGACY_MAP` internamente.

**Prevención:**
1. Antes de eliminar una constante/variable, hacer `Ctrl+Shift+F` (búsqueda global) para encontrar
   todas las referencias.
2. Asegurarse de que la búsqueda incluya el archivo completo (index.html es ~5500 líneas).

---
