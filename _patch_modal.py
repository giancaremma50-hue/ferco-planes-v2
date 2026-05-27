path = r'C:\Users\giancarlo.lam\Downloads\Planes FERCO V3\index.html'
with open(path, 'rb') as f:
    content = f.read()

# Replace the entire dynamic form section inside the modal
# From after the Fila 2 close (after </div> of form-grid) to before </div> (outer flex container close)
# i.e., lines 2284-2314 (the direction/rol/cargo/rhglobal/reportaa block)

old_dynamic = (
    b'      <!-- Fila 3: Direcci\xc3\xb3n (nivel3) -->\r\n'
    b'      <div class="form-group" id="uDireccionWrap" style="display:none">\r\n'
    b'        <label>Direcci\xc3\xb3n *</label>\r\n'
    b'        <select id="uDireccion" onchange="onDireccionChange()">\r\n'
    b'          <option value="">\xe2\x80\x94 Selecciona el \xc3\xa1rea primero \xe2\x80\x94</option>\r\n'
    b'        </select>\r\n'
    b'      </div>\r\n'
    b'      <!-- Fila 4: Rol/Puesto (lista plana de todos los roles bajo esa Direcci\xc3\xb3n) -->\r\n'
    b'      <div class="form-group" id="uRolWrap" style="display:none">\r\n'
    b'        <label>Rol / Puesto *</label>\r\n'
    b'        <select id="uRolPuesto" onchange="onRolPuestoChange()">\r\n'
    b'          <option value="">\xe2\x80\x94 Selecciona la direcci\xc3\xb3n primero \xe2\x80\x94</option>\r\n'
    b'        </select>\r\n'
    b'      </div>\r\n'
    b'      <!-- Cargo asignado (read-only, visible cuando hay rol seleccionado) -->\r\n'
    b'      <div class="form-group" id="uCargoWrap" style="display:none">\r\n'
    b'        <label>Cargo asignado</label>\r\n'
    b'        <input type="text" id="uCargo" readonly style="background:#f8fafc;font-weight:600;color:#0f172a">\r\n'
    b'      </div>\r\n'
    b'      <!-- RH Global (solo visible para usuarios rh/esRhGlobal) -->\r\n'
    b'      <div class="form-group" id="uRhGlobalWrap" style="display:none;background:#fdf4ff;border:1px solid #e9d5ff;border-radius:10px;padding:10px 14px">\r\n'
    b'        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin:0">\r\n'
    b'          <input type="checkbox" id="uEsRhGlobal" style="width:16px;height:16px;accent-color:#7c3aed">\r\n'
    b'          <span>Designar como <strong>RH Global</strong> \xe2\x80\x94 acceso transversal a todos los planes de todos los pa\xc3\xadses</span>\r\n'
    b'        </label>\r\n'
    b'      </div>\r\n'
    b'      <!-- Reporta a -->\r\n'
    b'      <div class="form-group">\r\n'
    b'        <label>Reporta a <span style="color:#94a3b8;font-size:12px">(opcional)</span></label>\r\n'
    b'        <select id="uReportaA"><option value="">\xe2\x80\x94 Sin asignaci\xc3\xb3n \xe2\x80\x94</option></select>\r\n'
    b'      </div>\r\n'
)

new_dynamic = (
    b'      <!-- Puesto / Rol (texto libre) -->\r\n'
    b'      <div class="form-group">\r\n'
    b'        <label>Puesto / Rol *</label>\r\n'
    b'        <input type="text" id="uCargo" placeholder="Ej: Regional Freddy, Zona Diego, Analista de Soporte\xe2\x80\xa6">\r\n'
    b'      </div>\r\n'
    b'      <!-- Reporta a (define la jerarqu\xc3\xada) -->\r\n'
    b'      <div class="form-group">\r\n'
    b'        <label>Reporta a <span style="color:#94a3b8;font-size:12px">(define la jerarqu\xc3\xada)</span></label>\r\n'
    b'        <select id="uReportaA"><option value="">\xe2\x80\x94 Sin asignaci\xc3\xb3n \xe2\x80\x94</option></select>\r\n'
    b'      </div>\r\n'
    b'      <!-- RH Global (solo visible para rh/esRhGlobal, al final) -->\r\n'
    b'      <div class="form-group" id="uRhGlobalWrap" style="display:none;background:#fdf4ff;border:1px solid #e9d5ff;border-radius:10px;padding:10px 14px">\r\n'
    b'        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin:0">\r\n'
    b'          <input type="checkbox" id="uEsRhGlobal" style="width:16px;height:16px;accent-color:#7c3aed">\r\n'
    b'          <span>Designar como <strong>RH Global</strong> \xe2\x80\x94 acceso transversal a todos los planes de todos los pa\xc3\xadses</span>\r\n'
    b'        </label>\r\n'
    b'      </div>\r\n'
)

# Also fix the uArea select - remove onchange="onAreaChange()"
old_area = b'          <select id="uArea" onchange="onAreaChange()" disabled>'
new_area = b'          <select id="uArea" disabled>'

print('Found modal dynamic block:', old_dynamic in content)
print('Found uArea onchange:', old_area in content)
content = content.replace(old_dynamic, new_dynamic)
content = content.replace(old_area, new_area)

with open(path, 'wb') as f:
    f.write(content)
print('Modal HTML done.')
