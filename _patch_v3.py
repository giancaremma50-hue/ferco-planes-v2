import sys

path = r'C:\Users\giancarlo.lam\Downloads\Planes FERCO V3\index.html'
with open(path, 'rb') as f:
    content = f.read()

results = {}

# ─── 1. HTML: uArea → restaurar onAreaChange ────────────────────────────────
old = b'          <select id="uArea" disabled>'
new = b'          <select id="uArea" onchange="onAreaChange()" disabled>'
results['uArea onchange'] = old in content
content = content.replace(old, new, 1)

# ─── 2. HTML: uCargo → pasar de input a select ──────────────────────────────
old = (
    b'      <!-- Puesto / Rol (texto libre) -->\r\n'
    b'      <div class="form-group">\r\n'
    b'        <label>Puesto / Rol *</label>\r\n'
    b'        <input type="text" id="uCargo" placeholder="Ej: Regional Freddy, Zona Diego, Analista de Soporte\xe2\x80\xa6">\r\n'
    b'      </div>\r\n'
)
new = (
    b'      <!-- Puesto / Rol (dropdown din\xc3\xa1mico) -->\r\n'
    b'      <div class="form-group">\r\n'
    b'        <label>Puesto / Rol *</label>\r\n'
    b'        <select id="uCargo" onchange="onPuestoChange()" disabled>\r\n'
    b'          <option value="">\xe2\x80\x94 Selecciona el \xc3\xa1rea primero \xe2\x80\x94</option>\r\n'
    b'        </select>\r\n'
    b'      </div>\r\n'
)
results['uCargo html'] = old in content
content = content.replace(old, new, 1)

# ─── 3. JS: openUserModal → resetear uCargo como select ─────────────────────
old = (
    b"window.openUserModal=()=>{\r\n"
    b"  document.getElementById('userModalOverlay').classList.add('open');\r\n"
    b"  hideErr('userErrMsg');\r\n"
    b"  ['uNombre','uEmail','uCargo'].forEach(id=>{const el=document.getElementById(id);if(el) el.value='';}); \r\n"
    b"  document.getElementById('uPais').value='';\r\n"
    b"  const areaSel=document.getElementById('uArea');\r\n"
    b"  areaSel.value='';areaSel.disabled=true;\r\n"
    b"  areaSel.innerHTML='<option value=\"\">\xe2\x80\x94 Selecciona el pa\xc3\xads primero \xe2\x80\x94</option>';\r\n"
    b"  document.getElementById('uEsRhGlobal').checked=false;\r\n"
    b"  document.getElementById('uRhGlobalWrap').style.display=\r\n"
    b"    (userProfile?.rol==='rh'||userProfile?.esRhGlobal)?'':'none';\r\n"
    b"  populateReportaA();\r\n"
    b"};"
)
new = (
    b"window.openUserModal=()=>{\r\n"
    b"  document.getElementById('userModalOverlay').classList.add('open');\r\n"
    b"  hideErr('userErrMsg');\r\n"
    b"  ['uNombre','uEmail'].forEach(id=>{const el=document.getElementById(id);if(el) el.value='';});\r\n"
    b"  document.getElementById('uPais').value='';\r\n"
    b"  const areaSel=document.getElementById('uArea');\r\n"
    b"  areaSel.value='';areaSel.disabled=true;\r\n"
    b"  areaSel.innerHTML='<option value=\"\">\xe2\x80\x94 Selecciona el pa\xc3\xads primero \xe2\x80\x94</option>';\r\n"
    b"  const cargoSel=document.getElementById('uCargo');\r\n"
    b"  cargoSel.value='';cargoSel.disabled=true;\r\n"
    b"  cargoSel.innerHTML='<option value=\"\">\xe2\x80\x94 Selecciona el \xc3\xa1rea primero \xe2\x80\x94</option>';\r\n"
    b"  document.getElementById('uEsRhGlobal').checked=false;\r\n"
    b"  document.getElementById('uRhGlobalWrap').style.display=\r\n"
    b"    (userProfile?.rol==='rh'||userProfile?.esRhGlobal)?'':'none';\r\n"
    b"  populateReportaA();\r\n"
    b"};"
)
results['openUserModal'] = old in content
content = content.replace(old, new, 1)

# ─── 4. JS: onPaisChange → también resetear uCargo ──────────────────────────
old = (
    b"// Pa\xc3\xads cambia \xe2\x86\x92 habilitar \xc3\x81rea\r\n"
    b"window.onPaisChange=()=>{\r\n"
    b"  const pais=document.getElementById('uPais').value;\r\n"
    b"  const areaSel=document.getElementById('uArea');\r\n"
    b"  areaSel.innerHTML='<option value=\"\">\xe2\x80\x94 Selecciona el \xc3\xa1rea \xe2\x80\x94</option>';\r\n"
    b"  if(!pais){areaSel.disabled=true;return;}\r\n"
    b"  const areas=Object.keys(FERCO_HIERARCHY[pais]||{});\r\n"
    b"  areas.forEach(a=>{const o=document.createElement('option');o.value=a;o.textContent=a;areaSel.appendChild(o);});\r\n"
    b"  areaSel.disabled=false;\r\n"
    b"};"
)
new = (
    b"// Pa\xc3\xads cambia \xe2\x86\x92 habilitar \xc3\x81rea\r\n"
    b"window.onPaisChange=()=>{\r\n"
    b"  const pais=document.getElementById('uPais').value;\r\n"
    b"  const areaSel=document.getElementById('uArea');\r\n"
    b"  areaSel.innerHTML='<option value=\"\">\xe2\x80\x94 Selecciona el \xc3\xa1rea \xe2\x80\x94</option>';\r\n"
    b"  const cargoSel=document.getElementById('uCargo');\r\n"
    b"  cargoSel.innerHTML='<option value=\"\">\xe2\x80\x94 Selecciona el \xc3\xa1rea primero \xe2\x80\x94</option>';\r\n"
    b"  cargoSel.disabled=true;\r\n"
    b"  if(!pais){areaSel.disabled=true;populateReportaA();return;}\r\n"
    b"  const areas=Object.keys(FERCO_HIERARCHY[pais]||{});\r\n"
    b"  areas.forEach(a=>{const o=document.createElement('option');o.value=a;o.textContent=a;areaSel.appendChild(o);});\r\n"
    b"  areaSel.disabled=false;\r\n"
    b"  populateReportaA();\r\n"
    b"};"
)
results['onPaisChange'] = old in content
content = content.replace(old, new, 1)

# ─── 5. JS: populateReportaA → filtro + fallback + nuevas funciones ──────────
old = (
    b"// Poblar Reporta A con TODOS los usuarios\r\n"
    b"function populateReportaA(){\r\n"
    b"  const sel=document.getElementById('uReportaA');\r\n"
    b"  sel.innerHTML='<option value=\"\">\xe2\x80\x94 Sin asignaci\xc3\xb3n \xe2\x80\x94</option>';\r\n"
    b"  allUsers.forEach(function(u){\r\n"
    b"    const o=document.createElement('option');\r\n"
    b"    o.value=u.uid;\r\n"
    b"    o.textContent=u.nombre+' \xe2\x80\x94 '+(u.cargo||rolLabel(u.rol)||u.rol||'\xe2\x80\x94');\r\n"
    b"    sel.appendChild(o);\r\n"
    b"  });\r\n"
    b"}"
)
new = (
    b"// Extrae todos los nombres de cargo \xc3\xbanicos de un nodo de FERCO_HIERARCHY\r\n"
    b"function flattenPuestos(node){\r\n"
    b"  const result=new Set();\r\n"
    b"  function traverse(obj){\r\n"
    b"    if(!obj||typeof obj!=='object') return;\r\n"
    b"    const children=('sub' in obj)?obj.sub:obj;\r\n"
    b"    if(!children||typeof children!=='object') return;\r\n"
    b"    for(const[key,val] of Object.entries(children)){\r\n"
    b"      result.add(key);\r\n"
    b"      traverse(val);\r\n"
    b"    }\r\n"
    b"  }\r\n"
    b"  traverse(node);\r\n"
    b"  return[...result];\r\n"
    b"}\r\n"
    b"\r\n"
    b"// Poblar dropdown de Puesto seg\xc3\xban Pa\xc3\xads+\xc3\x81rea\r\n"
    b"function populatePuestos(){\r\n"
    b"  const pais=document.getElementById('uPais').value;\r\n"
    b"  const area=document.getElementById('uArea').value;\r\n"
    b"  const sel=document.getElementById('uCargo');\r\n"
    b"  sel.innerHTML='<option value=\"\">\xe2\x80\x94 Selecciona el puesto \xe2\x80\x94</option>';\r\n"
    b"  sel.disabled=true;\r\n"
    b"  if(!pais||!area) return;\r\n"
    b"  const areaNode=FERCO_HIERARCHY[pais]?.[area];\r\n"
    b"  if(!areaNode){sel.disabled=false;return;}\r\n"
    b"  flattenPuestos(areaNode).forEach(p=>{\r\n"
    b"    const o=document.createElement('option');\r\n"
    b"    o.value=p;o.textContent=p;\r\n"
    b"    sel.appendChild(o);\r\n"
    b"  });\r\n"
    b"  sel.disabled=false;\r\n"
    b"}\r\n"
    b"\r\n"
    b"// \xc3\x81rea cambia \xe2\x86\x92 poblar Puesto\r\n"
    b"window.onAreaChange=()=>{\r\n"
    b"  populatePuestos();\r\n"
    b"  document.getElementById('uCargo').value='';\r\n"
    b"  populateReportaA();\r\n"
    b"};\r\n"
    b"\r\n"
    b"// Puesto cambia \xe2\x86\x92 actualizar Reporta a\r\n"
    b"window.onPuestoChange=()=>{\r\n"
    b"  populateReportaA();\r\n"
    b"};\r\n"
    b"\r\n"
    b"// Poblar Reporta A: filtro jer\xc3\xa1rquico superior + fallback a todos\r\n"
    b"function populateReportaA(){\r\n"
    b"  const sel=document.getElementById('uReportaA');\r\n"
    b"  sel.innerHTML='<option value=\"\">\xe2\x80\x94 Sin asignaci\xc3\xb3n \xe2\x80\x94</option>';\r\n"
    b"  const pais=document.getElementById('uPais')?.value||'';\r\n"
    b"  const area=document.getElementById('uArea')?.value||'';\r\n"
    b"  const cargo=document.getElementById('uCargo')?.value||'';\r\n"
    b"  if(cargo&&pais&&area){\r\n"
    b"    const ROL_ORDER=['sucursal','zona','regional','director'];\r\n"
    b"    const cargoRol=deriveRolLegacy(cargo,area,'');\r\n"
    b"    const cargoLevel=ROL_ORDER.indexOf(cargoRol);\r\n"
    b"    const filtered=allUsers.filter(u=>{\r\n"
    b"      const uLevel=ROL_ORDER.indexOf(u.rol);\r\n"
    b"      const isRh=u.esRhGlobal||u.rol==='rh'||u.rol==='rh_global';\r\n"
    b"      const samePaisArea=(u.pais===pais&&(u.area===area||isRh));\r\n"
    b"      return samePaisArea&&(isRh||(cargoLevel>=0&&uLevel>cargoLevel));\r\n"
    b"    });\r\n"
    b"    const users=filtered.length>0?filtered:allUsers;\r\n"
    b"    users.forEach(function(u){\r\n"
    b"      const o=document.createElement('option');\r\n"
    b"      o.value=u.uid;\r\n"
    b"      o.textContent=u.nombre+' \xe2\x80\x94 '+(u.cargo||rolLabel(u.rol)||u.rol||'\xe2\x80\x94');\r\n"
    b"      sel.appendChild(o);\r\n"
    b"    });\r\n"
    b"    return;\r\n"
    b"  }\r\n"
    b"  allUsers.forEach(function(u){\r\n"
    b"    const o=document.createElement('option');\r\n"
    b"    o.value=u.uid;\r\n"
    b"    o.textContent=u.nombre+' \xe2\x80\x94 '+(u.cargo||rolLabel(u.rol)||u.rol||'\xe2\x80\x94');\r\n"
    b"    sel.appendChild(o);\r\n"
    b"  });\r\n"
    b"}"
)
results['populateReportaA'] = old in content
content = content.replace(old, new, 1)

# ─── 6. JS: saveUser → leer cargo sin .trim() problemático (select no lo necesita) ─
# El cargo ahora es un select, .value ya es correcto. Cambiar .value.trim() → .value
old = b"  const cargo=document.getElementById('uCargo')?.value.trim()||'';\r\n"
new = b"  const cargo=document.getElementById('uCargo')?.value||'';\r\n"
results['saveUser cargo'] = old in content
content = content.replace(old, new, 1)

# ─── Reporte ─────────────────────────────────────────────────────────────────
sys.stdout.buffer.write(b'Results:\r\n')
for k, v in results.items():
    status = b'OK' if v else b'NOT FOUND - PATCH FAILED'
    sys.stdout.buffer.write(f'  {k}: '.encode() + status + b'\r\n')

all_ok = all(results.values())
if all_ok:
    with open(path, 'wb') as f:
        f.write(content)
    sys.stdout.buffer.write(b'Written successfully.\r\n')
else:
    sys.stdout.buffer.write(b'ABORTED - one or more patterns not found.\r\n')
