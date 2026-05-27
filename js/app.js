import { db, auth, storage } from "./firebase-config.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, updatePassword, sendPasswordResetEmail,
  setPersistence, browserSessionPersistence }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, doc, addDoc, getDoc, getDocs, setDoc,
  updateDoc, deleteDoc, query, where, serverTimestamp, orderBy }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";


// ── CONFIG ────────────────────────────────────────────────────────────────────


// ── UTILIDADES DE CORREO ──────────────────────────────────────────────────────
async function sendEmailNotification(to, subject, html) {
  try {
    await addDoc(collection(db, 'mail'), {
      to: [to],
      message: {
        subject: subject,
        html: html
      }
    });
  } catch(e) {
    console.error('Error al enviar correo:', e);
  }
}

// ── DATOS GT ──────────────────────────────────────────────────────────────────
const GT_DATA = {
  Freddy:{
    Giovany:['Barillas','Camojá','Cuilco','Huehuetenango','MCP Huehuetenango'],
    Freddy:['Caes','Deco City','Majadas'],
    Diego:['Chimaltenango','Sololá'],
    Jose:['Joyabaj','Nebaj','Quiche'],
    Selvin:['Poptun','San Benito Peten']
  },
  Keny:{Keny:['CC','Dubai','Israel','Lisboa','Roma','Tokio']},
  Marlon:{Marlon:['Chiquimula','Cobán','Escuintla','Jalapa','Jutiapa','Morales','Puerto Barrios','Rey Roosevelt','Salama','Tactic','Villa Nueva','Zona 5']},
  Sandra:{Sandra:['Coatepeque','Malacatan','Mazatenango','Retalhuleu','San Marcos']},
  'Juan Manuel':{Eva:['Rey Xela','Totonicapan','Xela']},
  'Carlos Noriega':{'Carlos Noriega':['San Juan','Studio','Zona 10']}
};
const HN_SUCS=['Choluteca','Comayagua','Juticalpa','La Ceiba','Proyectos','Roatan','San Lorenzo','San Pedro Sula','Tegucigalpa'];
const SV_SUCS=['Chalatenango','Juan Pablo II','Nejapa','San Benito','San Miguel','Santa Ana','Sonsonate','Usulután'];
const MX_SUCS=['60 Norte','Cancún','Canek','Cedis','Dragones','Mayoreo','Mérida','Proyectos','Tizimin','Tuxtla','Villahermosa'];

// ── ESTADO GLOBAL ─────────────────────────────────────────────────────────────
const TODAY = new Date(); TODAY.setHours(0,0,0,0);
let currentUser=null, userProfile=null, allPlanes=[], allUsers=[];
window.EmpresaConfig={};
let activePlanId=null, activePlanData=null;
let currentTab=0, smartRows=0, formData={};
let pendingSegFiles=[];
let notifications=[];
let currentSubView='mis'; // 'mis' | 'reportes'
let storageAvailable=true;

// ── LUCIDE ICON HELPER ────────────────────────────────────────────────────────
function lIcon(name,size=14){
  const P={
    printer:`<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>`,
    pencil:`<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>`,
    x:`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
    save:`<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>`,
    plus:`<path d="M5 12h14"/><path d="M12 5v14"/>`,
    'message-circle':`<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>`,
    paperclip:`<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>`,
    clipboard:`<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>`,
    'check-circle':`<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>`,
    'rotate-cw':`<path d="M21 2v6h-6"/><path d="M21 13a9 9 0 1 1-3-7.7L21 8"/>`,
    'arrow-left':`<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>`,
    'arrow-right':`<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>`,
    'file-text':`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>`,
    'user-plus':`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>`,
    users:`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
    'bar-chart-2':`<line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>`,
    'trash-2':`<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>`,
    bell:`<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>`,
    'log-out':`<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>`,
    'plus-circle':`<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>`,
    calendar:`<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>`,
    'trending-up':`<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>`,
    filter:`<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`,
    search:`<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`,
    mail:`<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>`,
    'alert-triangle':`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>`,
    'eye':`<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`,
    'download':`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>`,
    'external-link':`<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>`,
    history:`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>`,
    'layers':`<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>`,
    'check':`<path d="M20 6 9 17l-5-5"/>`,
    'shield':`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>`,
  };
  const path=P[name]||'';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex-shrink:0;pointer-events:none">${path}</svg>`;
}

// ── UTILIDADES DE FECHA ───────────────────────────────────────────────────────
function fmtDate(d){ // YYYY-MM-DD o Date → DD/MM/YYYY
  if(!d) return '—';
  if(d instanceof Date){
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }
  if(typeof d==='string'&&d.includes('-')){
    const [y,m,dd]=d.split('-');
    return `${dd}/${m}/${y}`;
  }
  return d;
}
function parseDate(d){ // DD/MM/YYYY o YYYY-MM-DD → Date
  if(!d) return null;
  if(d instanceof Date) return d;
  if(d.includes('/')){const [dd,mm,yyyy]=d.split('/');return new Date(`${yyyy}-${mm}-${dd}`);}
  return new Date(d);
}
function nowStr(){
  const n=new Date();
  return `${String(n.getDate()).padStart(2,'0')}/${String(n.getMonth()+1).padStart(2,'0')}/${n.getFullYear()} · ${n.getHours()}:${String(n.getMinutes()).padStart(2,'0')}`;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const ADMIN_HIERARCHY=['dir_admin','gerente_admin','jefe_admin','supervisor_admin','coordinador_admin'];

// ── ORGANIGRAMA FERCO (jerarquía dinámica: País → Área → Nivel3+) ─────────────

// Colores por área (usa el nombre del área como clave directa)
const AREA_COLORS={
  'Comercial':               'background:#dcfce7;color:#166534',
  'Operaciones':             'background:#dbeafe;color:#1e40af',
  'Recursos Humanos':        'background:#fce7f3;color:#9d174d',
  'Categorías':              'background:#fef3c7;color:#92400e',
  'Finanzas':                'background:#e0e7ff;color:#3730a3',
  'Construcción y Desarrollo':'background:var(--background);color:#475569',
  'IT':                      'background:#f0fdf4;color:#166534',
  'rh_global':               'background:#fce7f3;color:#9d174d'
};

// Mapa de compatibilidad para usuarios creados con el formato anterior
const AREA_LEGACY_MAP={
  comercial:'Comercial', operaciones:'Operaciones', rrhh:'Recursos Humanos',
  producto:'Categorías', finanzas:'Finanzas', construccion:'Construcción y Desarrollo',
  tecnologia:'IT', chro:'Recursos Humanos', cpo:'Categorías', transformacion:'IT',
  ceo:'CEO', rh_global:'RH Global', administracion:'Administración'
};

function rolLabel(r){return {
  rh:'RH Global',director:'Director Comercial',regional:'Gerente Regional',zona:'Gerente de Zona',sucursal:'Gerente de Sucursal',
  dir_admin:'Director',gerente_admin:'Gerente',jefe_admin:'Jefe',supervisor_admin:'Supervisor',coordinador_admin:'Coordinador'
}[r]||r;}
function avatarBg(r){return {
  rh:'#dcfce7',director:'#ede9fe',regional:'#dbeafe',zona:'#fef3c7',sucursal:'var(--background)',
  dir_admin:'#fce7f3',gerente_admin:'#ede9fe',jefe_admin:'#dbeafe',supervisor_admin:'#dcfce7',coordinador_admin:'var(--background)'
}[r]||'#dbeafe';}
function avatarColor(r){return {
  rh:'#166534',director:'#5b21b6',regional:'#1e40af',zona:'#92400e',sucursal:'#64748b',
  dir_admin:'#9d174d',gerente_admin:'#5b21b6',jefe_admin:'#1e40af',supervisor_admin:'#166534',coordinador_admin:'#64748b'
}[r]||'#1e40af';}
function rolBg(r){return {
  rh:'#166534',director:'#5b21b6',regional:'#1e40af',zona:'#92400e',sucursal:'#64748b',
  dir_admin:'#9d174d',gerente_admin:'#5b21b6',jefe_admin:'#1e40af',supervisor_admin:'#166534',coordinador_admin:'#64748b'
}[r]||'var(--foreground)';}
function isAdminArea(profile){return ADMIN_HIERARCHY.includes(profile?.rol);}
function isComercialArea(profile){const r=profile?.rol;return r==='rh'||(!isAdminArea(profile)&&r!=='rh')||profile?.area==='comercial';}
function getISOWeek(date=new Date()){
  const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
  d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));
  const y=new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d-y)/86400000)+1)/7);
}
function fileIcon(n){
  const e=(n||'').split('.').pop().toLowerCase();
  const s=(p,c='#64748b')=>`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle">${p}</svg>`;
  if(['jpg','jpeg','png','gif','webp'].includes(e)) return s('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>','#3b82f6');
  if(e==='pdf') return s('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>','#ef4444');
  if(['xlsx','xls','csv'].includes(e)) return s('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>','#22c55e');
  return s('<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>');
}
function getCurrSymbol(pais){const p=(pais||'').toLowerCase();if(p.startsWith('guat')||p==='gt') return 'Q';if(p.startsWith('hon')||p==='hn') return 'L';return '$';}
function fmt$(n,pais){if(!n&&n!==0) return '—';const sym=pais?getCurrSymbol(pais):'$';return sym+Number(n).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});}
function getVal(id){const el=document.getElementById(id);return el?el.value:'';}
function showErr(id,msg){const el=document.getElementById(id);if(el){el.textContent=msg;el.style.display='block';}}
function hideErr(id){const el=document.getElementById(id);if(el)el.style.display='none';}
function escHtml(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// Resaltar menciones @nombre en texto
function renderMentions(txt){
  return (txt||'').replace(/@([\w\sáéíóúÁÉÍÓÚñÑ]+?)(?=\s|$|[^\wáéíóúÁÉÍÓÚñÑ])/g,
    '<span class="mention">@$1</span>');
}

// ── JERARQUÍA Y MENCIONABLES ──────────────────────────────────────────────────
function getSubordinateUids(){
  const myUid = currentUser.uid;
  const myRol = userProfile.rol;
  const subs = new Set();
  const rawCfg = window.EmpresaConfig || {};
  const cfg = {
    paises: rawCfg.paises || [],
    areas: rawCfg.areas || [],
    puestos: rawCfg.puestos || []
  };

  // 1. Dependencia Directa de Usuarios (El campo 'reportaA' en el documento del usuario)
  function findDirectUserSubordinates(uid) {
    allUsers.forEach(u => {
      if (u.reportaA === uid && !subs.has(u.uid)) {
        subs.add(u.uid);
        findDirectUserSubordinates(u.uid);
      }
    });
  }
  findDirectUserSubordinates(myUid);

  // 2. Jerarquía Global por Rol (Opción B: Roles reportan a Roles en Configuración)
  // SuperAdmin / CEO ve todo
  if (myRol === 'rh_global' || myRol === 'rh' || myRol === 'ceo') {
      allUsers.forEach(u => { if (u.uid !== myUid) subs.add(u.uid); });
      return Array.from(subs);
  }

  // Encontramos todos los roles subordinados a nuestro rol recursivamente
  const subordinateRoles = new Set();
  function findSubordinateRoles(rolId) {
      cfg.puestos.forEach(p => {
          if (p.reportaA === rolId && !subordinateRoles.has(p.id)) {
              subordinateRoles.add(p.id);
              findSubordinateRoles(p.id);
          }
      });
  }
  findSubordinateRoles(myRol);

  // Agregar a los usuarios que tienen un rol subordinado Y que están en la misma línea (país)
  allUsers.forEach(u => {
      if (u.uid === myUid) return;
      if (subordinateRoles.has(u.rol)) {
          // Si queremos que un Gerente de Guatemala no vea a los de México, filtramos por país:
          if (u.pais === userProfile.pais || !userProfile.pais) {
              subs.add(u.uid);
          }
      }
  });

  return Array.from(subs);
}

function getMentionableUsers(){
  const rol=userProfile.rol;
  const up=userProfile;
  const mySubs = getSubordinateUids();
  
  return allUsers.filter(u=>{
    if(u.uid===currentUser.uid) return false;
    if(['rh','rh_global','ceo'].includes(u.rol) || ['rh','rh_global','ceo'].includes(rol)) return true;
    if(up.reportaA === u.uid) return true;
    if(mySubs.includes(u.uid)) return true;
    
    if(rol==='director'){return u.rol==='regional';}
    if(rol==='regional'){return ['director'].includes(u.rol)||(u.rol==='zona'&&u.region===up.region);}
    if(rol==='zona'){return ['regional','director'].includes(u.rol)||(u.rol==='sucursal'&&u.zona===up.zona);}
    if(rol==='sucursal'){return ['zona','regional','director'].includes(u.rol);}
    
    if(typeof ADMIN_HIERARCHY!=='undefined' && ADMIN_HIERARCHY.includes(rol)){
      const myIdx=ADMIN_HIERARCHY.indexOf(rol);
      const uIdx=ADMIN_HIERARCHY.indexOf(u.rol);
      if(u.pais!==up.pais) return false;
      return uIdx===myIdx-1||uIdx===myIdx+1;
    }
    return false;
  });
}

// ── NOTIFICACIONES ────────────────────────────────────────────────────────────
async function loadUserNotifications(){
  if(!currentUser) return;
  try{
    const snap=await getDocs(collection(db,`notificaciones_${currentUser.uid}`));
    notifications=snap.docs.map(d=>({id:d.id,...d.data()}));
    notifications.sort((a,b)=>((b.ts||0)-(a.ts||0)));
  }catch(e){ notifications=[]; }
  renderNotifications();
}

async function addUserNotification(uid, notif){
  try{
    const data={...notif, ts: Date.now(), leida:false};
    await addDoc(collection(db,`notificaciones_${uid}`), data);
    // Si es el usuario actual, actualizar en memoria
    if(uid===currentUser?.uid){
      notifications.unshift({id:'_tmp_'+Date.now(),...data});
      renderNotifications();
    }
  }catch(e){console.error('Error guardando notif:',e);}
}

function renderNotifications(){
  const unread=notifications.filter(n=>!n.leida).length;
  const badge=document.getElementById('notifBadge');
  const icon=document.getElementById('notifIcon');
  const btn=document.getElementById('notifBtn');
  if(badge){ badge.textContent=unread; badge.style.display=unread>0?'flex':'none'; }
  if(icon) icon.innerHTML=unread>0
    ?`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`
    :`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;opacity:.5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`;
  if(btn){ btn.style.borderColor=unread>0?'#991b1b':'var(--border)'; btn.style.color=unread>0?'#991b1b':'var(--dark)'; }
  const list=document.getElementById('notifList');
  if(!list) return;
  if(!notifications.length){
    list.innerHTML='<div class="np-empty">Sin notificaciones</div>';
    return;
  }
  list.innerHTML=notifications.map(n=>`
    <div class="np-item ${n.leida?'':'unread'}" onclick="handleNotifClick('${n.id}','${n.planId||''}','${n.tab||''}')">
      <div class="np-dot ${n.leida?'read':''}"></div>
      <div>
        <div class="np-text">${escHtml(n.mensaje||'')}</div>
        <div class="np-time">${n.fecha||''}</div>
      </div>
    </div>`).join('');
}

window.handleNotifClick=async(notifId, planId, tab)=>{
  // Marcar como leida
  if(notifId&&!notifId.startsWith('_tmp_')){
    try{ await updateDoc(doc(db,`notificaciones_${currentUser.uid}`,notifId),{leida:true}); }catch(e){}
  }
  const n=notifications.find(x=>x.id===notifId);
  if(n) n.leida=true;
  renderNotifications();
  // Cerrar panel
  document.getElementById('notifPanel').classList.remove('open');
  // Navegar al plan
  if(!planId) return;
  const tabIdx={info:0,seguimientos:1,archivos:2,comentarios:3,cambios:4};
  const targetTab=tab||'info';
  const targetIdx=tabIdx[targetTab]||0;
  // Buscar en allPlanes primero
  let p=allPlanes.find(x=>x.id===planId);
  // Si no esta en allPlanes, buscarlo en Firestore (planes o unoauno)
  if(!p){
    try{
      let snap=await getDoc(doc(db,'planes',planId));
      if(snap.exists()){ p={id:snap.id,...snap.data(),tipo:'fortalecimiento'}; allPlanes.push(p); }
      else{
        snap=await getDoc(doc(db,'unoauno',planId));
        if(snap.exists()){ p={id:snap.id,...snap.data(),tipo:'unoauno'}; allPlanes.push(p); }
      }
    }catch(e){ console.error('Error cargando plan:',e); return; }
  }
  if(p){ openDetail(planId); setTimeout(()=>setDetailTab(targetTab,null,targetIdx),250); }
};

window.markAllRead=async()=>{
  for(const n of notifications){
    if(!n.leida&&n.id&&!n.id.startsWith('_tmp_')){
      try{ await updateDoc(doc(db,`notificaciones_${currentUser.uid}`,n.id),{leida:true}); }catch(e){}
      n.leida=true;
    }
  }
  renderNotifications();
};

window.toggleNotif=(e)=>{
  e.stopPropagation();
  const p=document.getElementById('notifPanel');
  p.classList.toggle('open');
};

// Cerrar notif panel al hacer click afuera
document.addEventListener('click',e=>{
  const panel=document.getElementById('notifPanel');
  if(panel&&panel.classList.contains('open')){
    const wrap=document.querySelector('.notif-wrap');
    if(wrap&&!wrap.contains(e.target)){
      panel.classList.remove('open');
    }
  }
});

function checkOverdueNotifications(){
  if(!currentUser||!allPlanes.length) return;
  const today=new Date(); today.setHours(0,0,0,0);
  allPlanes.forEach(p=>{
    if(p.estado==='Cierre') return;
    // Solo notificar planes que me pertenecen o reportan a mí
    const esMio=p.creadoPor===currentUser.uid||p.liderUid===currentUser.uid;
    const esMiReporte=getSubordinateUids().includes(p.creadoPor||p.liderUid);
    if(!esMio&&!esMiReporte) return;
    (p.smart||[]).forEach((s,idx)=>{
      const fc=parseDate(s.fcierre);
      if(fc&&fc<today){
        // Verificar si ya hay notif de este acuerdo
        const key=`vencido_${p.id}_${idx}`;
        const yaNotif=notifications.some(n=>n.key===key);
        if(!yaNotif){
          addUserNotification(currentUser.uid,{
            tipo:'vencido',
            key,
            mensaje:`⚠️ Acuerdo #${idx+1} de ${p.asesor||'—'} venció el ${fmtDate(s.fcierre)}`,
            planId:p.id,
            tab:'seguimientos',
            fecha:fmtDate(new Date())
          });
        }
      }
    });
  });
}

async function notificarNivelSuperior(p, fechaStr){
  try{
    const rolJerarquia={sucursal:'zona',zona:'regional',regional:'director',director:'rh'};
    const rolActual=userProfile.rol;
    const rolSuperior=rolJerarquia[rolActual];
    if(!rolSuperior) return;
    let q;
    if(rolActual==='sucursal') q=query(collection(db,'users'),where('rol','==','zona'),where('zona','==',userProfile.zona||''));
    else if(rolActual==='zona') q=query(collection(db,'users'),where('rol','==','regional'),where('region','==',userProfile.region||''));
    else q=query(collection(db,'users'),where('rol','==',rolSuperior));
    const snap=await getDocs(q);
    for(const d of snap.docs){
      await addUserNotification(d.id,{
        tipo:'cierre',
        mensaje:`✅ ${userProfile.nombre||'Un gerente'} cerró el plan de ${p.asesor||'—'}`,
        planId:activePlanId,
        tab:'info',
        fecha:fechaStr
      });
    }
  }catch(e){console.error('Error notif superior:',e);}
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
window.doLogin=async()=>{
  const email=document.getElementById('loginEmail').value.trim();
  const pass=document.getElementById('loginPass').value;
  const err=document.getElementById('loginErr');
  const btn=document.getElementById('loginBtn');
  err.style.display='none';
  if(!email||!pass){err.textContent='Completa todos los campos.';err.style.display='block';return;}
  
  if(btn){
    btn.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Ingresando...';
    btn.disabled=true;
  }

  try{
    await signInWithEmailAndPassword(auth,email,pass);
  }
  catch(e){
    console.error('LOGIN ERROR:', e);
    err.textContent='Error: ' + e.message;
    err.style.display='block';
    if(btn){ btn.innerHTML='Ingresar'; btn.disabled=false; }
  }
};

window.doLogout=async()=>{
  notifications=[];
  allUsers=[];
  renderNotifications();

  // Clear fields and reset button
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPass').value = '';
  const btn = document.getElementById('loginBtn');
  if(btn) { btn.innerHTML = 'Ingresar'; btn.disabled = false; }
  const err=document.getElementById('loginErr');
  if(err) err.style.display='none';

  await signOut(auth);
};

// Cambiar contraseña
window.openChPass=()=>document.getElementById('chpassOverlay').classList.add('open');
window.closeChPass=()=>{
  document.getElementById('chpassOverlay').classList.remove('open');
  document.getElementById('chpassInput').value='';
  hideErr('chpassErr');
};
window.doChangePass=async()=>{
  const newPass=document.getElementById('chpassInput').value.trim();
  if(!newPass||newPass.length<6){showErr('chpassErr','Mínimo 6 caracteres.');return;}
  try{
    await updatePassword(auth.currentUser, newPass);
    closeChPass();
    alert('✅ Contraseña actualizada correctamente.');
  }catch(e){
    console.error('Error actualizando contraseña:', e);
    showErr('chpassErr','No se pudo actualizar la contraseña. Por favor, vuelve a intentarlo.');
  }
};

onAuthStateChanged(auth, async user=>{
  if(user){
    currentUser=user;
    const snap=await getDoc(doc(db,'users',user.uid));
    userProfile=snap.exists()?snap.data():{nombre:user.email,rol:'rh'};
    storageAvailable=true;
    // Cargar todos los usuarios para menciones y jerarquía
    const usersSnap=await getDocs(collection(db,'users'));
    allUsers=usersSnap.docs.map(d=>({uid:d.id,...d.data()}));
    await loadUserNotifications();
    try {
      const configSnap=await getDoc(doc(db,'config','empresa'));
      if(configSnap.exists()){
        window.EmpresaConfig=configSnap.data();
      } else {
        const defaultConfig = {
          paises: ['Guatemala', 'El Salvador', 'Honduras', 'México'],
          areas: [
            {id: 'Comercial', nombre: 'Comercial', color: 'background:#dcfce7;color:#166534'}
          ],
          puestos: []
        };
        await setDoc(doc(db,'config','empresa'), defaultConfig);
        window.EmpresaConfig=defaultConfig;
      }
    } catch(e) {
      console.error("Error cargando config de Firebase:", e);
      window.EmpresaConfig = { paises: ['Guatemala (Error)'], areas: [], puestos: [] };
    }

    initApp();
  }else{
    currentUser=null; userProfile=null;
    notifications=[]; allUsers=[];
    document.getElementById('loginWrap').style.display='flex';
    document.getElementById('appWrap').style.display='none';
    document.getElementById('appWrap').classList.remove('visible');
  }
});

function initApp(){
  document.getElementById('loginWrap').style.display='none';
  const appWrap=document.getElementById('appWrap');
  appWrap.style.display='flex';
  appWrap.classList.add('visible');
  const nombre=userProfile.nombre||currentUser.email;
  document.getElementById('unameEl').textContent=nombre;
  document.getElementById('uroleEl').textContent=rolLabel(userProfile.rol);
  document.getElementById('avatarEl').textContent=nombre.substring(0,2).toUpperCase();
  applyRoleUI();
  loadPlanes();
}

function applyRoleUI(){
  const rol=userProfile.rol;
  const isRH=rol==='rh';
  const isAdmin=isAdminArea(userProfile);
  const isCom=!isAdmin||isRH;

  document.getElementById('navUsuarios').style.display=isRH?'flex':'none';
  const navAdmin=document.getElementById('navAdmin');
  if(navAdmin) navAdmin.style.display=(rol==='rh_global' || rol==='rh')?'flex':'none';

  // Botones de creación: Plan Fortalecimiento (admin+rh), Uno a Uno (comercial+rh)
  const btnPlan=document.getElementById('btnNuevoPlan');
  const btnUaU=document.getElementById('btnNuevoUaU');
  if(btnPlan) btnPlan.style.display=(isRH||isAdmin)?'':'none';
  if(btnUaU) btnUaU.style.display=(isRH||isCom)?'':'none';

  const toggleRow=document.getElementById('viewToggleRow');
  const hasReportes=['director','regional','zona','rh'].includes(rol)||ADMIN_HIERARCHY.includes(rol);
  toggleRow.style.display=hasReportes?'block':'none';
  renderFilters();
  updateSubViewCounts();
}

window.toggleSidebar=()=>{
  document.getElementById('sidebar').classList.toggle('collapsed');
};

window.toggleTheme=()=>{
  const isDark=document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark?'dark':'light');
};

// ── SUB-VISTAS (MIS PLANES / MIS REPORTES) ────────────────────────────────────
window.setSubView=(v,btn)=>{
  currentSubView=v;
  document.querySelectorAll('.vt-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderAll();
};

function updateSubViewCounts(){
  const rol=userProfile.rol;
  const hasReportes=['director','regional','zona','rh'].includes(rol)||ADMIN_HIERARCHY.includes(rol);
  if(!hasReportes) return;
  const subUids=getSubordinateUids();
  const activos=p=>['En curso','En seguimiento'].includes(p.estado);
  const creadorDe=p=>p.creadoPor||p.liderUid||'';
  const misPlanesCount=allPlanes.filter(p=>creadorDe(p)===currentUser.uid&&activos(p)).length;
  const misReportesCount=['director','regional','zona'].includes(rol)
    ?allPlanes.filter(p=>creadorDe(p)!==currentUser.uid&&activos(p)).length
    :allPlanes.filter(p=>subUids.includes(creadorDe(p))&&activos(p)).length;
  document.querySelectorAll('.vt-btn').forEach(btn=>{
    if(btn.getAttribute('onclick')?.includes("'mis'")) btn.textContent=`Mis planes (${misPlanesCount})`;
    if(btn.getAttribute('onclick')?.includes("'reportes'")) btn.textContent=`Mis reportes (${misReportesCount})`;
  });
}

// ── FILTERS ───────────────────────────────────────────────────────────────────
function renderFilters(){
  const rol=userProfile.rol;
  const bar=document.getElementById('filterBar');
  bar.innerHTML='';
  const add=(label,id,type,opts)=>{
    const lbl=document.createElement('label');
    lbl.innerHTML=`<span style="margin-bottom:3px;display:block">${label}</span>`;
    if(type==='input'){
      const inp=document.createElement('input');inp.type='text';inp.id=id;inp.placeholder='Nombre...';inp.oninput=renderAll;lbl.appendChild(inp);
    }else{
      const sel=document.createElement('select');sel.id=id;sel.onchange=renderAll;
      opts.forEach(o=>{const op=document.createElement('option');op.textContent=o;sel.appendChild(op);});lbl.appendChild(sel);
    }
    bar.appendChild(lbl);
  };
  if(rol==='rh'){
    add('País','fPais','select',['Todos','Guatemala','México','Honduras','El Salvador']);
    add('Región','fRegion','select',['Todas','Freddy','Keny','Marlon','Sandra','Juan Manuel','Carlos Noriega']);
    add('Zona','fZona','select',['Todas','Giovany','Freddy','Diego','Jose','Selvin','Keny','Marlon','Sandra','Eva','Juan Manuel','Carlos Noriega']);
    add('Sucursal','fSucursal','select',['Todas','Barillas','Camojá','Caes','Chimaltenango','Zona 10','Majadas','Xela']);
  }
  if(rol==='director'){
    add('Región','fRegion','select',['Todas','Freddy','Keny','Marlon','Sandra','Juan Manuel','Carlos Noriega']);
    add('Zona','fZona','select',['Todas','Giovany','Freddy','Diego','Jose','Selvin','Keny','Marlon','Sandra','Eva','Juan Manuel','Carlos Noriega']);
  }
  if(rol==='regional'){add('Zona','fZona','select',['Todas','Giovany','Freddy','Diego','Jose','Selvin']);add('Sucursal','fSucursal','select',['Todas','Barillas','Camojá','Caes','Chimaltenango','Majadas']);}
  if(rol==='zona'){add('Sucursal','fSucursal','select',['Todas','Barillas','Camojá','Cuilco','Huehuetenango','MCP Huehuetenango']);}
  add('Etapa','fEtapa','select',['Todas','En curso','En seguimiento','Cierre']);
  add('Buscar asesor','fSearch','input',[]);
  const clr=document.createElement('button');clr.className='clr';clr.textContent='✕ Limpiar';clr.onclick=clearFilters;bar.appendChild(clr);
}

window.clearFilters=()=>{
  document.querySelectorAll('#filterBar select').forEach(s=>s.selectedIndex=0);
  const si=document.getElementById('fSearch');if(si)si.value='';
  renderAll();
};

// ── LOAD PLANES ───────────────────────────────────────────────────────────────
async function buildQuery(colName){
  const rol=userProfile.rol;
  if(rol==='rh') return getDocs(collection(db,colName));
  if(rol==='director'){
    // Doble consulta: por pais Y por region, por si el pais no está guardado correctamente
    const pais=userProfile.pais||'Guatemala';
    const regNames=Object.keys(GT_DATA);
    const [s1,s2]=await Promise.all([
      getDocs(query(collection(db,colName),where('pais','==',pais))),
      getDocs(query(collection(db,colName),where('region','in',regNames)))
    ]);
    const map=new Map([...s1.docs,...s2.docs].map(d=>[d.id,d]));
    return {docs:[...map.values()]};
  }
  if(rol==='regional') return getDocs(query(collection(db,colName),where('region','==',userProfile.region)));
  if(rol==='zona') return getDocs(query(collection(db,colName),where('zona','==',userProfile.zona)));
  if(ADMIN_HIERARCHY.includes(rol)){const _pais=userProfile.pais||'';if(!_pais)return{docs:[]};return getDocs(query(collection(db,colName),where('pais','==',_pais)));  }
  return getDocs(query(collection(db,colName),where('liderUid','==',currentUser.uid)));
}

async function loadPlanes(){
  document.getElementById('kanbanArea').innerHTML='<div class="loading"><div class="spinner"></div> Cargando...</div>';
  const safeQuery=async(col)=>{
    try{return await buildQuery(col);}catch(e){
      console.warn('buildQuery fallback para',col,e);
      try{return await getDocs(query(collection(db,col),where('liderUid','==',currentUser.uid)));}
      catch(e2){console.error('buildQuery fallback error',e2);return{docs:[]};}
    }
  };
  try{
    const rol=userProfile.rol;
    const isRH=rol==='rh';
    const isAdmin=isAdminArea(userProfile);
    const isCom=!isAdmin||isRH;
    const promises=[];
    if(isRH||isAdmin) promises.push(safeQuery('planes').then(s=>s.docs.map(d=>({id:d.id,...d.data(),tipo:'fortalecimiento'}))));
    else promises.push(Promise.resolve([]));
    if(isRH||isCom) promises.push(safeQuery('unoauno').then(s=>s.docs.map(d=>({id:d.id,...d.data(),tipo:'unoauno'}))));
    else promises.push(Promise.resolve([]));
    const [fort,uau]=await Promise.all(promises);
    allPlanes=[...fort,...uau];
    allPlanes.sort((a,b)=>(b.creadoEn?.seconds||0)-(a.creadoEn?.seconds||0));
    checkOverdueNotifications();
    updateSubViewCounts();
    renderAll();
  }catch(e){
    console.error('Error cargando planes/dashboard:', e);
    document.getElementById('kanbanArea').innerHTML=`<div class="loading" style="color:var(--danger)">⚠️ Error al cargar los planes. Por favor, recarga la página.</div>`;
  }
}

// ── RENDER ────────────────────────────────────────────────────────────────────
window.renderAll=()=>{
  const plans=filteredPlans();
  const hayAtr=plans.some(isAtrasado);
  renderKPIs(plans,hayAtr);
  const rol=userProfile.rol;
  if(currentSubView==='reportes'&&['director','regional','zona'].includes(rol)){
    const me=currentUser.uid;
    const creadorDe=p=>p.creadoPor||p.liderUid||'';
    const reportPlans=allPlanes.filter(p=>creadorDe(p)!==me);
    document.getElementById('kanbanArea').innerHTML=renderReportesHierarchy(reportPlans);
  } else {
    renderKanban(plans,hayAtr);
  }
};

// ── JERARQUÍA VISUAL DE REPORTES ─────────────────────────────────────────────
function planStats(ps){
  const total=ps.length;
  const enC=ps.filter(p=>p.estado==='En curso'&&!isAtrasado(p)).length;
  const enS=ps.filter(p=>p.estado==='En seguimiento'&&!isAtrasado(p)).length;
  const cie=ps.filter(p=>p.estado==='Cierre').length;
  const atr=ps.filter(isAtrasado).length;
  const avgPct=total>0?Math.round(ps.reduce((s,p)=>s+(p.pct||0),0)/total):0;
  return {total,enC,enS,cie,atr,avgPct};
}

function hierBadges(st){
  return `<span class="hier-stat hs-total">${st.total} plan${st.total!==1?'es':''}</span>`+
    (st.enC?`<span class="hier-stat hs-ec">En curso: ${st.enC}</span>`:'')+
    (st.enS?`<span class="hier-stat hs-es">En seg: ${st.enS}</span>`:'')+
    (st.cie?`<span class="hier-stat hs-ci">Cierre: ${st.cie}</span>`:'')+
    (st.atr?`<span class="hier-stat hs-atr">⚠ ${st.atr}</span>`:'')+
    `<span class="hier-stat hs-pct">${st.avgPct}% avance</span>`;
}

function hierPlanList(ps){
  if(!ps.length) return '';
  return `<div class="hier-plan-list">${ps.map(p=>{
    const isUaU=p.tipo==='unoauno';
    const atr=isAtrasado(p);
    const stCls=atr?'atr':p.estado==='Cierre'?'good':p.estado==='En seguimiento'?'neu':'mid';
    const meta=isUaU?`S${p.semana||'?'}`:(p.pct!==undefined?`${p.pct}%`:'');
    return `<div class="hier-plan-item ${isUaU?'tipo-unoauno':'tipo-fortalecimiento'}" onclick="openDetail('${p.id}')">
      <span style="flex:1;font-weight:700;font-size:12px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.asesor||'—'}</span>
      ${meta?`<span style="font-size:10px;color:var(--muted);flex-shrink:0">${meta}</span>`:''}
      <span class="pill ${stCls}" style="font-size:10px;flex-shrink:0">${p.estado}</span>
    </div>`;
  }).join('')}</div>`;
}

function hierNode(id,levelCls,label,name,ps,childrenHtml){
  const st=planStats(ps);
  return `<div class="hier-node">
    <div class="hier-card" onclick="toggleHN('${id}')">
      <div class="hier-card-top">
        <span class="hier-lvl-badge ${levelCls}">${label}</span>
        <span class="hier-name">${name}</span>
        <span class="hier-chevron" id="hc_${id}">▶</span>
      </div>
      <div class="hier-stats">${hierBadges(st)}</div>
    </div>
    <div class="hier-children" id="hn_${id}">${childrenHtml}</div>
  </div>`;
}

function sucNodes(plans){
  const bySuc={};
  plans.forEach(p=>{const s=p.sucursal||'Sin sucursal';(bySuc[s]=bySuc[s]||[]).push(p);});
  return Object.entries(bySuc).sort((a,b)=>a[0].localeCompare(b[0])).map(([s,sp])=>
    hierNode('s_'+s.replace(/[\s,\.]/g,'_'),'hier-lvl-sucursal','Sucursal',s,sp,hierPlanList(sp))
  ).join('');
}

function zonaNodes(regionName,plans){
  const byZona={};
  plans.forEach(p=>{const z=p.zona||'Sin zona';(byZona[z]=byZona[z]||[]).push(p);});
  return Object.entries(byZona).sort((a,b)=>a[0].localeCompare(b[0])).map(([z,zp])=>{
    const skip=regionName.trim().toLowerCase()===z.trim().toLowerCase();
    if(skip) return sucNodes(zp); // Regla: Regional=Zona → saltar directo a sucursales
    return hierNode('z_'+z.replace(/[\s,\.]/g,'_'),'hier-lvl-zona','Zona',z,zp,sucNodes(zp));
  }).join('');
}

function renderReportesHierarchy(plans){
  const rol=userProfile.rol;
  if(!plans.length) return `<div style="padding:40px;text-align:center;color:var(--muted);font-size:13px">No hay planes de reportes disponibles.</div>`;
  if(rol==='director'){
    const byReg={};
    plans.forEach(p=>{const r=p.region||'Sin región';(byReg[r]=byReg[r]||[]).push(p);});
    return `<div class="hierarchy-view">${
      Object.entries(byReg).sort((a,b)=>a[0].localeCompare(b[0])).map(([r,rp])=>
        hierNode('r_'+r.replace(/[\s,\.]/g,'_'),'hier-lvl-regional','Regional',r,rp,zonaNodes(r,rp))
      ).join('')
    }</div>`;
  }
  if(rol==='regional'){
    const myReg=userProfile.region||'';
    const byZona={};
    plans.forEach(p=>{const z=p.zona||'Sin zona';(byZona[z]=byZona[z]||[]).push(p);});
    return `<div class="hierarchy-view">${
      Object.entries(byZona).sort((a,b)=>a[0].localeCompare(b[0])).map(([z,zp])=>{
        const skip=myReg.trim().toLowerCase()===z.trim().toLowerCase();
        if(skip) return sucNodes(zp);
        return hierNode('z_'+z.replace(/[\s,\.]/g,'_'),'hier-lvl-zona','Zona',z,zp,sucNodes(zp));
      }).join('')
    }</div>`;
  }
  if(rol==='zona'){
    return `<div class="hierarchy-view">${sucNodes(plans)}</div>`;
  }
  return '';
}

window.toggleHN=(id)=>{
  const el=document.getElementById('hn_'+id);
  const chev=document.getElementById('hc_'+id);
  const card=el?.previousElementSibling;
  if(!el) return;
  const isOpen=el.style.display==='block';
  el.style.display=isOpen?'none':'block';
  if(chev) chev.style.transform=isOpen?'':'rotate(90deg)';
  if(card) card.classList.toggle('open',!isOpen);
};

function filteredPlans(){
  const rol=userProfile.rol;
  const hasReportes=['director','regional','zona','rh'].includes(rol)||ADMIN_HIERARCHY.includes(rol);
  const subUids=getSubordinateUids();

  const creadorDe=p=>p.creadoPor||p.liderUid||'';

  let base=allPlanes;
  if(hasReportes){
    if(currentSubView==='mis'){
      base=allPlanes.filter(p=>creadorDe(p)===currentUser.uid);
    } else {
      // Director/Regional/Zona: field-based (cubre todos los niveles de la jerarquía)
      // RH y Admin: UID-based con subordinados directos
      if(['director','regional','zona'].includes(rol)){
        base=allPlanes.filter(p=>creadorDe(p)!==currentUser.uid);
      } else {
        base=allPlanes.filter(p=>subUids.includes(creadorDe(p)));
      }
    }
  }

  const pais=getVal('fPais')||'Todos',region=getVal('fRegion')||'Todas';
  const zona=getVal('fZona')||'Todas',sucursal=getVal('fSucursal')||'Todas';
  const etapa=getVal('fEtapa')||'Todas',search=(getVal('fSearch')||'').toLowerCase();

  return base.filter(p=>{
    if(pais!=='Todos'&&p.pais!==pais) return false;
    if(region!=='Todas'&&p.region!==region) return false;
    if(zona!=='Todas'&&p.zona!==zona) return false;
    if(sucursal!=='Todas'&&p.sucursal!==sucursal) return false;
    if(etapa!=='Todas'&&p.estado!==etapa) return false;
    if(search&&!(p.asesor||'').toLowerCase().includes(search)) return false;
    return true;
  });
}

function isAtrasado(p){
  if(p.estado==='Cierre') return false;
  return (p.smart||[]).some(s=>{
    const fc=parseDate(s.fcierre);
    return fc&&fc<TODAY;
  });
}

function acuerdosVencidos(p){
  return (p.smart||[]).map((s,i)=>{
    const fc=parseDate(s.fcierre);
    return {idx:i, vencido: fc&&fc<TODAY};
  });
}

function renderKPIs(plans,hayAtr){
  const atrN=plans.filter(isAtrasado).length;
  const enC=plans.filter(p=>p.estado==='En curso'&&!isAtrasado(p)).length;
  const enS=plans.filter(p=>p.estado==='En seguimiento'&&!isAtrasado(p)).length;
  const cie=plans.filter(p=>p.estado==='Cierre').length;
  const cols=hayAtr?5:4;
  document.getElementById('kpiGrid').style.gridTemplateColumns=`repeat(${cols},1fr)`;
  document.getElementById('kpiGrid').innerHTML=`
    <div class="kpi"><div class="lbl">Total planes</div><div class="val">${plans.length}</div></div>
    <div class="kpi"><div class="lbl">En curso</div><div class="val cm">${enC}</div></div>
    <div class="kpi"><div class="lbl">En seguimiento</div><div class="val" style="color:#1e40af">${enS}</div></div>
    <div class="kpi"><div class="lbl">Cerrados</div><div class="val cg">${cie}</div></div>
    ${hayAtr?`<div class="kpi"><div class="lbl">Atrasados</div><div class="val ca">${atrN}</div></div>`:''}`;
}

function renderKanban(plans,hayAtr){
  const rol=userProfile.rol;
  const cols=hayAtr?['Atrasados','En curso','En seguimiento','Cierre']:['En curso','En seguimiento','Cierre'];
  let h='<div class="kanban">';
  for(const col of cols){
    const isAtrCol=col==='Atrasados';
    const cp=isAtrCol?plans.filter(isAtrasado):plans.filter(p=>p.estado===col&&!isAtrasado(p));
    if(isAtrCol&&cp.length===0) continue;
    const bc=isAtrCol?'atr':col==='En curso'?'mid':col==='En seguimiento'?'neu':'good';
    h+=`<div class="k-col${isAtrCol?' col-atr':''}">
      <div class="k-head"><span class="k-title">${col}</span><span class="pill ${bc}">${cp.length}</span></div>`;
    for(const p of cp){
      const atr=isAtrasado(p);
      const avenc=acuerdosVencidos(p);
      const segsN=(p.seguimientos||[]).length;
      const archN=(p.archivos||[]).length;
      const comN=(p.comentarios||[]).length;
      const isUaU=p.tipo==='unoauno';
      const tipoBadge=isUaU
        ?`<span class="pc-tipo-badge badge-uau">Uno a Uno</span>`
        :`<span class="pc-tipo-badge badge-fort">Fortalecimiento</span>`;
      const tipoClass=isUaU?'tipo-unoauno':'tipo-fortalecimiento';
      const smartOrdenado=[...(p.smart||[])].sort((a,b)=>{
        const av=parseDate(a.fcierre),bv=parseDate(b.fcierre);
        const aVenc=av&&av<TODAY,bVenc=bv&&bv<TODAY;
        if(aVenc&&!bVenc) return -1; if(!aVenc&&bVenc) return 1; return 0;
      });
      const cierreTag=smartOrdenado[0]?.fcierre?`<span style="color:var(--muted)">Cierre:</span> <b>${fmtDate(smartOrdenado[0].fcierre)}</b>`:'';
      const semanaTag=isUaU&&p.semana?`<span style="color:var(--muted)">Semana:</span> <b>${p.semana}</b>`:'';
      const proxSegTag=p.proxSeg?`<span style="color:var(--muted)">Próx. seg.:</span> <b>${fmtDate(p.proxSeg)}</b>`:'';
      h+=`<div class="pcard ${tipoClass}${atr?' atr-card':''}" onclick="openDetail('${p.id}')">
        ${tipoBadge}
        <div class="pc-name">${p.asesor||'—'}</div>
        <div class="pc-sub">Por: <b>${p.lider||'—'}</b>${p.puesto?' · '+p.puesto:''}</div>
        <div class="pc-tags">
          ${['rh','director'].includes(rol)&&p.region?`<span class="tag tag-reg">${p.region}</span>`:''}
          ${['rh','director','regional'].includes(rol)&&p.zona?`<span class="tag tag-zona">${p.zona}</span>`:''}
          ${p.sucursal?`<span class="tag tag-suc">${p.sucursal}</span>`:''}
          ${atr?'<span class="tag tag-atr">⚠ Atrasado</span>':''}
        </div>
        <div class="pc-foot" style="flex-direction:column;align-items:flex-start;gap:2px">
          ${semanaTag?`<span>${semanaTag}</span>`:''}
          ${cierreTag?`<span>${cierreTag}</span>`:''}
          ${proxSegTag?`<span>${proxSegTag}</span>`:''}
        </div>
        ${atr&&!isUaU?`<div style="margin-top:6px">
          ${avenc.filter(a=>a.vencido).map(a=>`<div style="font-size:10px;color:var(--atr);font-weight:700;background:var(--atrbg);padding:2px 6px;border-radius:4px;margin-bottom:2px">⚠ Acuerdo #${a.idx+1} vencido</div>`).join('')}
        </div>`:''}
        <div class="pc-counts">
          ${segsN>0?`<span class="pc-count">${lIcon('clipboard',11)} ${segsN} seg.</span>`:''}
          ${archN>0?`<span class="pc-count">${lIcon('paperclip',11)} ${archN} arch.</span>`:''}
          ${comN>0?`<span class="pc-count">${lIcon('message-circle',11)} ${comN} com.</span>`:''}
        </div>
      </div>`;
    }
    h+='</div>';
  }
  h+='</div>';
  document.getElementById('kanbanArea').innerHTML=h;
}
// Helper: colección activa según tipo de plan
function planCol(){return activePlanData?.tipo==='unoauno'?'unoauno':'planes';}

// ── DETAIL ────────────────────────────────────────────────────────────────────
window.openDetail=id=>{
  activePlanId=id;
  const p=allPlanes.find(x=>x.id===id);
  if(!p) return;
  activePlanData=p;
  const isUaU=p.tipo==='unoauno';
  const headStyle=isUaU?'background:var(--gold)':'background:var(--dark)';
  const headColor=isUaU?'color:var(--dark)':'color:#fff';
  document.getElementById('fm-head').style.cssText=`padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;${headStyle};flex-shrink:0`;
  document.getElementById('fm-title').style.color=isUaU?'var(--dark)':'#fff';
  document.getElementById('fm-sub').style.color=isUaU?'rgba(0,0,0,.6)':'rgba(255,255,255,.6)';
  document.getElementById('fm-title').textContent=p.asesor||'Plan';
  const subParts=[p.lider,p.pais,isUaU?`Semana ${p.semana||'—'}`:p.sucursal].filter(Boolean);
  document.getElementById('fm-sub').textContent=subParts.join(' · ');
  refreshTabHeaders(p);
  setDetailTab('info',null,0);
  document.getElementById('foverlay').classList.add('open');
};

function refreshTabHeaders(p){
  const isUaU=p.tipo==='unoauno';
  const segsN=(p.seguimientos||[]).length;
  const archN=(p.archivos||[]).length;
  const comN=(p.comentarios||[]).length;
  const cambiosN=(p.historialCambios||[]).length;
  const canEdit=userProfile.rol==='rh'||p.liderUid===currentUser.uid;
  const ac=isUaU?'var(--gold)':'var(--gold)';
  if(isUaU){
    document.getElementById('fmTabsEl').innerHTML=`
      <div class="fm-tab active" onclick="setDetailTab('info',this,0)">Información</div>
      <div class="fm-tab" onclick="setDetailTab('graficas',this,1)">Gráficas históricas</div>
      <div class="fm-tab" onclick="setDetailTab('seguimientos',this,2)">Seguimientos (${segsN})</div>
      <div class="fm-tab" onclick="setDetailTab('archivos',this,3)">Archivos (${archN})</div>
      <div class="fm-tab" onclick="setDetailTab('comentarios',this,4)">Comentarios (${comN})</div>
      <div class="fm-tab" onclick="setDetailTab('cambios',this,5)">Historial (${cambiosN})</div>`;
  } else {
    document.getElementById('fmTabsEl').innerHTML=`
      <div class="fm-tab active" onclick="setDetailTab('info',this,0)">Información</div>
      <div class="fm-tab" onclick="setDetailTab('seguimientos',this,1)">Seguimientos (${segsN})</div>
      <div class="fm-tab" onclick="setDetailTab('archivos',this,2)">Archivos (${archN})</div>
      <div class="fm-tab" onclick="setDetailTab('comentarios',this,3)">Comentarios (${comN})</div>
      <div class="fm-tab" onclick="setDetailTab('cambios',this,4)">Historial (${cambiosN})</div>`;
  }
  const editBtn=document.getElementById('fm-edit-btn');
  if(editBtn) editBtn.style.display=canEdit&&p.estado!=='Cierre'&&!isUaU?'':'none';
  // Ajuste color botones header para UaU
  document.querySelectorAll('.fm-head .btn').forEach(b=>{
    b.style.color=isUaU?'var(--dark)':'';
    b.style.borderColor=isUaU?'rgba(0,0,0,.2)':'';
    b.style.background=isUaU?'rgba(255,255,255,.6)':'';
  });
}

window.closeDetail=()=>{document.getElementById('foverlay').classList.remove('open');};

window.setDetailTab=(tab,el,idx)=>{
  document.querySelectorAll('.fm-tab').forEach(t=>t.classList.remove('active'));
  if(el) el.classList.add('active');
  else document.querySelectorAll('.fm-tab')[idx||0]?.classList.add('active');
  const p=activePlanData; if(!p) return;
  const body=document.getElementById('fm-body');
  const foot=document.getElementById('fm-foot');
  const canAct=userProfile.rol==='rh'||p.liderUid===currentUser.uid;
  const isUaU=p.tipo==='unoauno';

  // ── UNO A UNO: Info tab ──────────────────────────────────────────────────
  if(tab==='info'&&isUaU){
    const ind=p.indicadores||{};
    const ppt=ind.metaUtilidad>0?((ind.utilidadGenerada||0)/ind.metaUtilidad*100).toFixed(1):0;
    const mc=ind.montoCotizado>0?((ind.facturacion||0)/ind.montoCotizado*100).toFixed(1):0;
    body.innerHTML=`
      <div class="fm-section">Datos Generales</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
        <div class="fm-field"><label>Semana</label><p>${p.semana||'—'} / ${p.año||''}</p></div>
        <div class="fm-field"><label>Sucursal</label><p>${p.sucursal||'—'}</p></div>
        <div class="fm-field"><label>Estado</label><p><span class="pill ${p.estado==='Cierre'?'good':p.estado==='En seguimiento'?'neu':'mid'}">${p.estado}</span></p></div>
      </div>
      <div class="fm-section">Indicadores — Semana ${p.semana||''}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        ${[
          ['Meta de Utilidad',fmt$(ind.metaUtilidad,p.pais)],
          ['Utilidad Generada',fmt$(ind.utilidadGenerada,p.pais)],
          ['% PPT',ppt+'%'],
          ['Monto Cotizado',fmt$(ind.montoCotizado,p.pais)],
          ['Facturación',fmt$(ind.facturacion,p.pais)],
          ['Tasa de Conversión',mc+'%'],
          ['Clientes Atendidos',ind.clientesAtendidos??'—'],
          ['Cotizaciones',ind.cotizaciones??'—'],
          ['Facturas',ind.facturas??'—'],
          ['Oport > $2.5K',ind.oport2_5K_mas??'—'],
          ['Oport < $2.5K',ind.oport2_5K_menos??'—'],
          ['Total Oport SF',ind.totalOportSF??'—'],
          ['Oport Perdidas',ind.oportunidadesPerdidas??'—']
        ].map(([lbl,val])=>`<div class="fm-field"><label>${lbl}</label><p style="font-weight:700">${val}</p></div>`).join('')}
      </div>
      <div class="fm-section">Resumen y Compromisos</div>
      <div class="fm-field" style="margin-bottom:10px"><label>Resumen / Causas</label><p>${p.resumen||'—'}</p></div>
      <div class="fm-field" style="margin-bottom:10px"><label>Compromisos del Asesor</label><p>${p.compromisosAsesor||'—'}</p></div>
      <div class="fm-field" style="margin-bottom:10px"><label>Compromisos / Despeje Gerente</label><p>${p.compromisosGerente||'—'}</p></div>
      ${canAct&&p.estado!=='Cierre'?`<div class="fm-section" style="margin-top:14px">Estado del plan</div>
        <div class="stage-sel">
          <button class="stage-opt sel-cierre" onclick="changeStage('${p.id}','Cierre')">${lIcon('check-circle',14)} Cerrar Uno a Uno</button>
        </div>`:''}`;
    foot.innerHTML=`
      ${canAct&&p.estado!=='Cierre'?`<button class="btn btn-gold" onclick="openUauSeg()">${lIcon('plus',13)} Seguimiento</button>`:''}
      <button class="btn" onclick="setDetailTab('comentarios',null,4)">${lIcon('message-circle',13)} Comentar</button>
      <button class="btn" onclick="sendActivePlanByEmail()" title="Enviar PDF por correo">${lIcon('mail',13)} Enviar PDF</button>
      <button class="btn" onclick="printActivePlan()" title="Generar PDF">${lIcon('file-text',13)} PDF</button>
      <span style="font-size:11px;color:var(--muted);flex:1;margin-left:4px">${(p.seguimientos||[]).length} seg.</span>`;
    return;
  }

  // ── UNO A UNO: Gráficas tab ──────────────────────────────────────────────
  if(tab==='graficas'&&isUaU){
    body.innerHTML=`<div class="fm-section">Gráficas Históricas por Indicador</div>
      <p style="font-size:11px;color:var(--muted);margin-bottom:14px;font-style:italic">Evolución semanal de indicadores. Se actualiza con cada seguimiento registrado.</p>
      <div class="chart-grid" id="chartGrid"></div>`;
    foot.innerHTML=`<span style="font-size:11px;color:var(--muted)">${buildChartData(p).length} semana(s) registradas</span>`;
    renderUauCharts(p);
    return;
  }

  // ── UNO A UNO: Seguimientos tab ─────────────────────────────────────────
  if(tab==='seguimientos'&&isUaU){
    const segs=p.seguimientos||[];
    let html='<div class="fm-section">Seguimientos semanales — comparativa de indicadores</div>';
    if(!segs.length){
      html+='<div style="text-align:center;color:var(--muted);font-size:12px;padding:30px">Sin seguimientos aún. Agrega el primero con el botón de abajo.</div>';
    } else {
      // Ordenar cronológico, mostrar más reciente primero
      const sortedSegs=[...segs].sort((a,b)=>a.año!==b.año?a.año-b.año:a.semana-b.semana);
      const baseEntry={semana:p.semana,año:p.año,...(p.indicadores||{})};
      const allEntries=[baseEntry,...sortedSegs.map(s=>({semana:s.semana,año:s.año,...(s.indicadores||{})}))];
      const displaySegs=[...sortedSegs].reverse();
      html+=displaySegs.map((sg,dispIdx)=>{
        const chronoIdx=sortedSegs.length-1-dispIdx;
        const prevEntry=allEntries[chronoIdx];
        const currEntry=allEntries[chronoIdx+1];
        const archs=(sg.archivos||[]).length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
          ${sg.archivos.map(a=>`<a href="${a.url}" target="_blank" style="font-size:11px;background:var(--soft);border:1px solid var(--border);border-radius:6px;padding:3px 8px;text-decoration:none;color:var(--dark)">${fileIcon(a.nombre)} ${a.nombre}</a>`).join('')}
        </div>`:'';
        return `<div class="seg-block">
          <div class="seg-block-head">
            <span style="background:var(--gold);color:var(--dark);padding:3px 12px;border-radius:6px;font-weight:800;font-size:11px">Semana ${sg.semana} · ${sg.año}</span>
            <span style="font-size:11px;color:var(--muted)">Por <b>${sg.autor||'—'}</b> · ${sg.registradoEn||sg.fecha||''}</span>
          </div>
          ${buildSegCompTable(prevEntry,currEntry,p.pais)}
          ${sg.resumen?`<div class="seg-txt-box"><label>Resumen del Uno a Uno</label>${sg.resumen}</div>`:''}
          ${sg.compromisosAsesor?`<div class="seg-txt-box"><label>Compromisos del Asesor</label>${sg.compromisosAsesor}</div>`:''}
          ${sg.compromisosGerente?`<div class="seg-txt-box"><label>Compromisos / Despeje del Gerente</label>${sg.compromisosGerente}</div>`:''}
          ${archs}
        </div>`;
      }).join('');
    }
    body.innerHTML=html;
    foot.innerHTML=`${canAct&&p.estado!=='Cierre'?`<button class="btn btn-gold" onclick="openUauSeg()">+ Agregar seguimiento</button>`:''}
      <span style="font-size:11px;color:var(--muted);flex:1;margin-left:8px">${segs.length} seguimiento(s)</span>`;
    return;
  }

  if(tab==='info'){
    const atr=isAtrasado(p);
    const stCls=atr?'atr':p.estado==='Cierre'?'good':p.estado==='En seguimiento'?'neu':'mid';
    const avenc=acuerdosVencidos(p);
    body.innerHTML=`
      <div class="fm-section">Datos generales</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
        <div class="fm-field"><label>Fecha inicio</label><p>${fmtDate(p.fecha)||'—'}</p></div>
        <div class="fm-field"><label>Estado</label><p><span class="pill ${stCls}">${atr?'⚠ Atrasado':p.estado}</span></p></div>
        <div class="fm-field"><label>Progreso</label><p>${p.pct||0}%</p></div>
      </div>
      ${p.region||p.zona||p.sucursal?`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
        ${p.region?`<div class="fm-field"><label>Región</label><p>${p.region}</p></div>`:''}
        ${p.zona?`<div class="fm-field"><label>Zona</label><p>${p.zona}</p></div>`:''}
        ${p.sucursal?`<div class="fm-field"><label>Sucursal</label><p>${p.sucursal}</p></div>`:''}
      </div>`:''}
      ${atr&&avenc.some(a=>a.vencido)?`<div class="vencido-alert" style="margin-bottom:14px">
        <span>⚠️ <strong>Acuerdo(s) vencido(s):</strong> ${avenc.filter(a=>a.vencido).map(a=>`Acuerdo #${a.idx+1}`).join(', ')}</span>
      </div>`:''}
      <div class="fm-section">1. Fortalezas actuales</div>
      <div class="fm-field" style="margin-bottom:14px"><p>${p.fortalezas||'—'}</p></div>
      <div class="fm-section">2. Áreas para fortalecer</div>
      <div class="fm-field" style="margin-bottom:14px"><p>${p.areas||'—'}</p></div>
      <div class="fm-section">3. Acuerdos SMART</div>
      ${(p.smart||[]).map((s,i)=>{
        const fc=parseDate(s.fcierre);
        const venc=fc&&fc<TODAY;
        return `<div class="smart-card" style="margin-bottom:8px">
          <div class="sc-head" style="${venc?'background:#7c2d12':''}" onclick="this.nextElementSibling.classList.toggle('coll')">
            <span class="sc-num">${venc?'⚠ ':''}Acuerdo #${i+1}</span>
            <span class="sc-ttl">${s.obj?.substring(0,50)||'—'}</span>
          </div>
          <div class="sc-body">
            <div class="sc-field"><label>F. Seguimiento</label><span style="font-size:13px">${fmtDate(s.fseg)||'—'}</span></div>
            <div class="sc-field"><label>F. Cierre</label><span style="font-size:13px;${venc?'color:var(--atr);font-weight:700':''}">${fmtDate(s.fcierre)||'—'}${venc?' ⚠':''}</span></div>
            <div class="sc-field full"><label>Objetivo</label><span style="font-size:13px">${s.obj||'—'}</span></div>
            <div class="sc-field full"><label>Acción</label><span style="font-size:13px">${s.accion||'—'}</span></div>
            <div class="sc-field full"><label>Evidencia</label><span style="font-size:13px">${s.evidencia||'—'}</span></div>
            <div class="sc-field full"><label>Soporte</label><span style="font-size:13px">${s.soporte||'—'}</span></div>
            ${(s.archivos||[]).length?`<div class="sc-field full"><label>Archivos del acuerdo</label>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
                ${s.archivos.map(a=>`<a href="${a.url}" target="_blank" style="font-size:11px;background:var(--soft);border:1px solid var(--border);border-radius:6px;padding:3px 8px;text-decoration:none;color:var(--dark)">${fileIcon(a.nombre)} ${a.nombre}</a>`).join('')}
              </div></div>`:''}
          </div>
        </div>`;
      }).join('')}
      ${canAct&&p.estado!=='Cierre'?`<div class="fm-section" style="margin-top:14px">Marcar plan como cerrado</div>
        <div class="stage-sel">
          <button class="stage-opt sel-cierre" onclick="changeStage('${p.id}','Cierre')">${lIcon('check-circle',14)} Cerrar plan</button>
        </div>`:''}`;
    foot.innerHTML=`
      ${canAct&&p.estado!=='Cierre'?`<button class="btn btn-primary" onclick="openSeg()">${lIcon('plus',13)} Seguimiento</button>`:''}
      <button class="btn" onclick="setDetailTab('comentarios',null,3)">${lIcon('message-circle',13)} Comentar</button>
      <button class="btn" onclick="sendActivePlanByEmail()" title="Enviar PDF por correo">${lIcon('mail',13)} Enviar PDF</button>
      <button class="btn" onclick="printActivePlan()" title="Generar PDF">${lIcon('file-text',13)} PDF</button>
      <span style="font-size:11px;color:var(--muted);flex:1;margin-left:4px">${(p.seguimientos||[]).length} seg. · ${(p.archivos||[]).length} arch.</span>`;
  }

  else if(tab==='seguimientos'){
    const segs=p.seguimientos||[];
    const smart=p.smart||[];
    let html='<div class="fm-section">Ruta de seguimientos</div>';
    if(smart.length>1){
      // Agrupar por acuerdo
      smart.forEach((s,si)=>{
        const fc=parseDate(s.fcierre);
        const venc=fc&&fc<TODAY;
        const segDeEste=segs.filter(sg=>sg.acuerdoIdx===si||(!sg.acuerdoIdx&&si===0));
        const segOrdenados=[...segDeEste].reverse(); // más reciente primero
        html+=`<div style="margin-bottom:16px;border:1px solid ${venc?'#fed7aa':'var(--border)'};border-radius:12px;overflow:hidden">
          <div style="background:${venc?'var(--atrbg)':'var(--dark)'};color:${venc?'var(--atr)':'#fff'};padding:8px 14px;font-size:12px;font-weight:800">
            ${venc?'⚠ ':''}Acuerdo #${si+1} — ${s.obj?.substring(0,50)||'—'} · Cierre: ${fmtDate(s.fcierre)}
          </div>
          <div style="padding:12px">
            ${segOrdenados.length===0?'<div style="font-size:12px;color:var(--muted);font-style:italic">Sin seguimientos aún.</div>':''}
            <div class="tl">${segOrdenados.map(sg=>`
              <div class="tl-item"><div class="tld tld-done"></div>
                <div style="flex:1">
                  <div class="tl-date" style="display:flex;gap:8px;flex-wrap:wrap">
                    <span>Próx. seg.: <b>${fmtDate(sg.fecha)}</b></span>
                    <span class="pill gray">${sg.pct}%</span>
                    <span style="font-size:10px;color:var(--muted)">Por <b>${sg.autor||'—'}</b> el ${sg.registradoEn||'—'}</span>
                  </div>
                  <div class="tl-text" style="margin-top:4px"><b>Avances:</b> ${sg.avance}</div>
                  <div style="font-size:12px;color:var(--muted);margin-top:2px"><b>Acuerdo:</b> ${sg.acuerdo}</div>
                  ${sg.soporte?`<div style="font-size:12px;color:var(--muted);margin-top:2px"><b>Soporte:</b> ${sg.soporte}</div>`:''}
                  ${(sg.archivos||[]).length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
                    ${sg.archivos.map(a=>`<a href="${a.url}" target="_blank" style="font-size:11px;background:var(--soft);border:1px solid var(--border);border-radius:6px;padding:3px 8px;text-decoration:none;color:var(--dark)">${fileIcon(a.nombre)} ${a.nombre}</a>`).join('')}
                  </div>`:''}
                </div>
              </div>`).join('')}
            </div>
          </div>
        </div>`;
      });
    } else {
      // Un solo acuerdo — vista lineal simple
      const segOrdenados=[...segs].reverse();
      html+=`<div class="tl">${segOrdenados.map(s=>`
        <div class="tl-item"><div class="tld tld-done"></div>
          <div style="flex:1">
            <div class="tl-date" style="display:flex;gap:8px;flex-wrap:wrap">
              <span>Próx. seg.: <b>${fmtDate(s.fecha)}</b></span>
              <span class="pill gray">${s.pct}%</span>
              <span style="font-size:10px;color:var(--muted)">Por <b>${s.autor||'—'}</b> el ${s.registradoEn||'—'}</span>
            </div>
            <div class="tl-text" style="margin-top:4px"><b>Avances:</b> ${s.avance}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px"><b>Acuerdo:</b> ${s.acuerdo}</div>
            ${s.soporte?`<div style="font-size:12px;color:var(--muted);margin-top:2px"><b>Soporte:</b> ${s.soporte}</div>`:''}
            ${(s.archivos||[]).length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
              ${s.archivos.map(a=>`<a href="${a.url}" target="_blank" style="font-size:11px;background:var(--soft);border:1px solid var(--border);border-radius:6px;padding:3px 8px;text-decoration:none;color:var(--dark)">${fileIcon(a.nombre)} ${a.nombre}</a>`).join('')}
            </div>`:''}
          </div>
        </div>`).join('')}
        ${p.estado!=='Cierre'?`<div class="tl-item"><div class="tld tld-pend"></div><div><div class="tl-date">Próx. seguimiento: ${fmtDate(p.proxSeg)||'—'}</div><div class="tl-text" style="color:var(--muted)">Pendiente</div></div></div>`:''}
      </div>`;
    }
    body.innerHTML=html;
    foot.innerHTML=`${canAct&&p.estado!=='Cierre'?`<button class="btn btn-primary" onclick="openSeg()">+ Agregar seguimiento</button>`:''}
      <span style="font-size:11px;color:var(--muted);flex:1;margin-left:8px">${segs.length} seguimiento(s)</span>`;
  }

  else if(tab==='archivos'){
    const archs=p.archivos||[];
    body.innerHTML=`<div class="fm-section">Archivos adjuntos del plan</div>
      <div class="file-zone" id="planFileZone" onclick="document.getElementById('planFileInput').click()" style="margin-bottom:14px">
        <div><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg></div>
        <p>Arrastra, pega (Ctrl+V) o haz clic para subir archivos<br><span style="font-size:11px">Imágenes, PDF, Excel — cualquier formato</span></p>
      </div>
      <input type="file" id="planFileInput" multiple style="display:none" onchange="uploadPlanFiles(this)">
      <div class="file-list">
        ${archs.map(a=>`<div class="file-item">
          <span style="font-size:18px">${fileIcon(a.nombre)}</span>
          <span class="file-item-name">${a.nombre}</span>
          <span class="file-item-meta">${fmtDate(a.fecha)||''}</span>
          <a href="${a.url}" target="_blank" class="btn btn-sm">${lIcon('download',11)} Descargar</a>
          ${canAct?`<button class="btn btn-sm" style="color:#991b1b" title="Eliminar" onclick="deletePlanFile('${a.url}')">${lIcon('trash-2',11)}</button>`:''}
        </div>`).join('')}
      </div>`;
    // Habilitar paste en zona de archivos
    setupPasteZone('planFileZone', files=>uploadPlanFilesDirectly(files));
    foot.innerHTML=`<span style="font-size:11px;color:var(--muted)">${archs.length} archivo(s)</span>`;
  }

  else if(tab==='comentarios'){
    renderComments(p,body,foot);
  }

  else if(tab==='cambios'){
    const cambios=p.historialCambios||[];
    body.innerHTML=`<div class="fm-section">Historial de cambios</div>
      <p style="font-size:11px;color:var(--muted);margin-bottom:14px;font-style:italic">Registro automático de todos los cambios realizados al plan.</p>
      ${cambios.length===0?`<div style="text-align:center;color:var(--muted);font-size:12px;padding:30px">Sin cambios registrados.</div>`:
      `<div class="tl">${cambios.map(c=>`
        <div class="tl-item"><div class="tld tld-done" style="background:#6366f1"></div>
          <div style="flex:1">
            <div class="tl-date"><b>${c.autor||'—'}</b> · ${c.fecha||'—'}</div>
            <div class="tl-text" style="margin-top:4px;font-size:12px">Cambió <b>${c.campo||'—'}</b>: <span style="color:var(--bad)">${c.anterior||'—'}</span> → <span style="color:var(--good)">${c.nuevo||'—'}</span></div>
          </div>
        </div>`).join('')}
      </div>`}`;
    foot.innerHTML=`<span style="font-size:11px;color:var(--muted)">${cambios.length} cambio(s)</span>`;
  }
};

// ── COMENTARIOS CON MENCIONES, EDITAR, HILOS ILIMITADOS ──────────────────────
function renderComments(p,body,foot){
  const comments=p.comentarios||[];
  let h='<div class="fm-section">Comentarios internos</div>';
  h+='<p style="font-size:11px;color:var(--muted);margin-bottom:14px;font-style:italic">Los comentarios son conversación interna del equipo.</p>';

  function renderReplyThread(replies, parentPath){
    if(!replies||!replies.length) return '';
    return `<div class="c-replies">
      ${replies.map((r,ri)=>{
        const path=`${parentPath}_${ri}`;
        const esMio=r.autorUid===currentUser.uid;
        return `<div class="comment-item" style="margin-bottom:10px" id="cmt_${path}">
          <div class="c-avatar" style="width:28px;height:28px;font-size:10px;background:${avatarBg(r.rol)};color:${avatarColor(r.rol)}">${(r.autor||'?').substring(0,2).toUpperCase()}</div>
          <div class="c-bubble">
            <div class="c-meta">
              <span class="c-author">${r.autor||'—'}</span>
              <span class="c-role" style="background:${rolBg(r.rol)}">${rolLabel(r.rol)}</span>
              <span class="c-time">${r.fecha||''}</span>
              ${esMio?`<button class="c-action edit-btn" title="Editar" onclick="editComment('${path}')">${lIcon('pencil',12)}</button>`:''}
            </div>
            <div class="c-text" id="ctxt_${path}">${renderMentions(escHtml(r.texto))}</div>
            <div class="c-actions">
              <button class="c-action" onclick="toggleReply('rbox_${path}')">↩ Responder</button>
            </div>
            <div id="rbox_${path}" style="display:none;margin-top:8px">${replyBox(path)}</div>
            ${renderReplyThread(r.respuestas, path)}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  h+=comments.map((c,ci)=>{
    const esMio=c.autorUid===currentUser.uid;
    return `<div class="comment-item" id="cmt_${ci}">
      <div class="c-avatar" style="background:${avatarBg(c.rol)};color:${avatarColor(c.rol)}">${(c.autor||'?').substring(0,2).toUpperCase()}</div>
      <div class="c-bubble">
        <div class="c-meta">
          <span class="c-author">${c.autor||'Usuario'}</span>
          <span class="c-role" style="background:${rolBg(c.rol)}">${rolLabel(c.rol)}</span>
          <span class="c-time">${c.fecha||''}</span>
          ${esMio?`<button class="c-action edit-btn" onclick="editComment('${ci}')">✏️</button>`:''}
        </div>
        <div class="c-text" id="ctxt_${ci}">${renderMentions(escHtml(c.texto))}</div>
        <div class="c-actions">
          <button class="c-action" onclick="toggleReply('rbox_${ci}')">↩ Responder</button>
        </div>
        <div id="rbox_${ci}" style="display:none;margin-top:8px">${replyBox(ci)}</div>
        ${renderReplyThread(c.respuestas, String(ci))}
      </div>
    </div>`;
  }).join('');

  // Input nuevo comentario con @menciones y paste
  h+=`<div class="c-input-wrap">
    <div class="c-avatar" style="background:${avatarBg(userProfile.rol)};color:${avatarColor(userProfile.rol)}">${(userProfile.nombre||'TU').substring(0,2).toUpperCase()}</div>
    <div class="c-input-area" style="position:relative">
      <textarea class="c-input" id="newComment" rows="3" placeholder="Escribe un comentario... usa @ para mencionar"></textarea>
      <div class="mention-drop" id="mentionDropMain"></div>
      <div style="display:flex;justify-content:flex-end;margin-top:6px">
        <button class="btn btn-primary btn-sm" onclick="saveComment()">Publicar</button>
      </div>
    </div>
  </div>`;

  body.innerHTML=h;
  foot.innerHTML=`<span style="font-size:11px;color:var(--muted)">${comments.length} comentario(s)</span>`;

  // Inicializar mention en textarea principal
  setupMentionInput(document.getElementById('newComment'),'mentionDropMain');
  // Paste en comentarios
  setupPasteZone('fm-body', files=>{/* paste en comentarios — agregar al seguimiento activo si aplica */});
}

function replyBox(path){
  const dropId=`mdrop_${path}`;
  return `<div style="display:flex;gap:8px">
    <div class="c-avatar" style="width:26px;height:26px;font-size:10px;background:${avatarBg(userProfile.rol)};color:${avatarColor(userProfile.rol)}">${(userProfile.nombre||'TU').substring(0,2).toUpperCase()}</div>
    <div style="flex:1;position:relative">
      <textarea class="c-input" id="rtext_${path}" rows="2" placeholder="Responder... usa @ para mencionar" style="min-height:60px"></textarea>
      <div class="mention-drop" id="${dropId}"></div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:4px">
        <button class="btn btn-sm" onclick="toggleReply('rbox_${path}')">Cancelar</button>
        <button class="btn btn-primary btn-sm" onclick="saveReply('${path}')">Responder</button>
      </div>
    </div>
  </div>`;
}

window.toggleReply=id=>{
  const el=document.getElementById(id);
  if(!el) return;
  const visible=el.style.display!=='none';
  el.style.display=visible?'none':'block';
  if(!visible){
    const ta=el.querySelector('textarea');
    if(ta){
      ta.focus();
      const dropId=`mdrop_${id.replace('rbox_','')}`;
      setupMentionInput(ta, dropId);
    }
  }
};

// Editar comentario inline
window.editComment=path=>{
  const pathStr=String(path);
  const parts=pathStr.split('_');
  // Obtener el texto actual del nodo
  const txtEl=document.getElementById(`ctxt_${pathStr}`);
  if(!txtEl) return;
  const currentText=txtEl.innerText.replace(/@(\w+)/g,'@$1'); // strip HTML
  txtEl.innerHTML=`<textarea class="c-input" id="edit_${pathStr}" style="min-height:60px;width:100%">${currentText}</textarea>
    <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:4px">
      <button class="btn btn-sm" onclick="cancelEdit('${pathStr}','${escHtml(currentText)}')">Cancelar</button>
      <button class="btn btn-primary btn-sm" onclick="confirmEdit('${pathStr}')">Guardar</button>
    </div>`;
};

window.cancelEdit=(path,original)=>{
  const txtEl=document.getElementById(`ctxt_${path}`);
  if(txtEl) txtEl.innerHTML=renderMentions(escHtml(original));
};

window.confirmEdit=async path=>{
  const ta=document.getElementById(`edit_${path}`);
  if(!ta) return;
  const newText=ta.value.trim();
  if(!newText) return;
  // Actualizar en el array de comentarios (deep path)
  const comentarios=JSON.parse(JSON.stringify(activePlanData.comentarios||[]));
  const parts=path.split('_').map(Number);
  let node=comentarios[parts[0]];
  for(let i=1;i<parts.length;i++){
    node=node.respuestas[parts[i]];
  }
  node.texto=newText;
  node.editado=nowStr();
  await updateDoc(doc(db,planCol(),activePlanId),{comentarios});
  activePlanData.comentarios=comentarios;
  const planIdx=allPlanes.findIndex(x=>x.id===activePlanId);
  if(planIdx>=0) allPlanes[planIdx].comentarios=comentarios;
  refreshTabHeaders(activePlanData);
  setDetailTab('comentarios',null,3);
};

window.saveComment=async()=>{
  const texto=document.getElementById('newComment')?.value.trim();
  if(!texto) return;
  const p=activePlanData;
  const comment={
    autor:userProfile.nombre||currentUser.email,
    autorUid:currentUser.uid,
    rol:userProfile.rol,
    texto,
    fecha:nowStr(),
    respuestas:[]
  };
  const comentarios=[...(p.comentarios||[]),comment];
  await updateDoc(doc(db,planCol(),activePlanId),{comentarios});
  activePlanData.comentarios=comentarios;
  const planIdx=allPlanes.findIndex(x=>x.id===activePlanId);
  if(planIdx>=0) allPlanes[planIdx].comentarios=comentarios;

  // Notificar al dueño del plan si no soy yo
  if(p.liderUid&&p.liderUid!==currentUser.uid){
    await addUserNotification(p.liderUid,{
      tipo:'comentario',
      mensaje:`💬 ${userProfile.nombre} comentó en el plan de ${p.asesor||'—'}`,
      planId:activePlanId,
      tab:'comentarios',
      fecha:nowStr()
    });
  }
  // Notificar menciones
  await notificarMenciones(texto, activePlanId, p.asesor||'—');

  refreshTabHeaders(activePlanData);
  setDetailTab('comentarios',null,3);
  renderAll();
};

window.saveReply=async path=>{
  const pathStr=String(path);
  const ta=document.getElementById(`rtext_${pathStr}`);
  if(!ta) return;
  const texto=ta.value.trim();
  if(!texto) return;
  const reply={
    autor:userProfile.nombre||currentUser.email,
    autorUid:currentUser.uid,
    rol:userProfile.rol,
    texto,
    fecha:nowStr(),
    respuestas:[]
  };
  const comentarios=JSON.parse(JSON.stringify(activePlanData.comentarios||[]));
  const parts=pathStr.split('_').map(Number);
  let node=comentarios[parts[0]];
  for(let i=1;i<parts.length;i++){
    node=node.respuestas[parts[i]];
  }
  if(!node.respuestas) node.respuestas=[];
  node.respuestas.push(reply);
  await updateDoc(doc(db,planCol(),activePlanId),{comentarios});
  activePlanData.comentarios=comentarios;
  const planIdx=allPlanes.findIndex(x=>x.id===activePlanId);
  if(planIdx>=0) allPlanes[planIdx].comentarios=comentarios;

  // Notificar al autor del comentario padre
  const autorPadreUid=comentarios[parts[0]]?.autorUid;
  if(autorPadreUid&&autorPadreUid!==currentUser.uid){
    await addUserNotification(autorPadreUid,{
      tipo:'respuesta',
      mensaje:`↩ ${userProfile.nombre} respondió tu comentario en el plan de ${activePlanData.asesor||'—'}`,
      planId:activePlanId,
      tab:'comentarios',
      fecha:nowStr()
    });
  }
  await notificarMenciones(texto, activePlanId, activePlanData.asesor||'—');

  refreshTabHeaders(activePlanData);
  setDetailTab('comentarios',null,3);
};

async function notificarMenciones(texto, planId, asesor){
  const menciones=[...texto.matchAll(/@([\w\sáéíóúÁÉÍÓÚñÑ]+?)(?=\s|$|[^\wáéíóúÁÉÍÓÚñÑ])/g)].map(m=>m[1].trim().toLowerCase());
  if(!menciones.length) return;
  for(const u of allUsers){
    if(u.uid===currentUser.uid) continue;
    if(menciones.some(m=>u.nombre?.toLowerCase().includes(m))){
      await addUserNotification(u.uid,{
        tipo:'mencion',
        mensaje:`🔔 ${userProfile.nombre} te mencionó en el plan de ${asesor}`,
        planId,
        tab:'comentarios',
        fecha:nowStr()
      });
    }
  }
}
// ── MENCIONES @ ───────────────────────────────────────────────────────────────
function setupMentionInput(textarea, dropId){
  if(!textarea) return;
  textarea.addEventListener('input', ()=>handleMentionInput(textarea, dropId));
  textarea.addEventListener('keydown', e=>{
    const drop=document.getElementById(dropId);
    if(!drop||drop.style.display==='none') return;
    if(e.key==='Escape'){drop.style.display='none';}
  });
  // Paste de imágenes en textarea
  textarea.addEventListener('paste', e=>{
    const items=e.clipboardData?.items||[];
    for(const item of items){
      if(item.type.startsWith('image/')){
        e.preventDefault();
        const file=item.getAsFile();
        if(file) pendingSegFiles.push(file);
        renderSegFileList();
      }
    }
  });
}

function handleMentionInput(textarea, dropId){
  const val=textarea.value;
  const pos=textarea.selectionStart;
  const before=val.substring(0,pos);
  const match=before.match(/@([\wáéíóúÁÉÍÓÚñÑ\s]*)$/);
  const drop=document.getElementById(dropId);
  if(!drop) return;
  if(!match){drop.style.display='none';return;}
  const query=(match[1]||'').toLowerCase().trim();
  const mentionables=getMentionableUsers().filter(u=>
    !query||u.nombre?.toLowerCase().includes(query)
  ).slice(0,8);
  if(!mentionables.length){drop.style.display='none';return;}
  drop.style.display='block';
  drop.innerHTML=mentionables.map(u=>`
    <div class="mention-item" onclick="insertMention('${u.nombre}','${dropId}','${textarea.id}')">
      <div class="c-avatar" style="width:26px;height:26px;font-size:10px;background:${avatarBg(u.rol)};color:${avatarColor(u.rol)};flex-shrink:0">${(u.nombre||'?').substring(0,2).toUpperCase()}</div>
      <div><div class="mention-item-name">${u.nombre||'—'}</div><div class="mention-item-role">${rolLabel(u.rol)}</div></div>
    </div>`).join('');
}

window.insertMention=(nombre, dropId, textareaId)=>{
  const ta=document.getElementById(textareaId);
  const drop=document.getElementById(dropId);
  if(!ta) return;
  const val=ta.value;
  const pos=ta.selectionStart;
  const before=val.substring(0,pos);
  const after=val.substring(pos);
  const newBefore=before.replace(/@[\wáéíóúÁÉÍÓÚñÑ\s]*$/,`@${nombre} `);
  ta.value=newBefore+after;
  ta.focus();
  const newPos=newBefore.length;
  ta.setSelectionRange(newPos,newPos);
  if(drop) drop.style.display='none';
};

// ── PASTE EN ZONAS DE ARCHIVOS ────────────────────────────────────────────────
function setupPasteZone(zoneId, onFiles){
  const zone=document.getElementById(zoneId)||document.querySelector('.'+zoneId);
  if(!zone) return;
  zone.addEventListener('paste', e=>{
    const items=e.clipboardData?.items||[];
    const files=[];
    for(const item of items){
      if(item.type.startsWith('image/')){
        const file=item.getAsFile();
        if(file) files.push(file);
      }
    }
    if(files.length) onFiles(files);
  });
}

// ── FILES ─────────────────────────────────────────────────────────────────────
window.uploadPlanFiles=async input=>{
  await uploadPlanFilesDirectly(Array.from(input.files));
};

async function uploadPlanFilesDirectly(files){
  if(!files.length) return;
  const now=fmtDate(new Date());
  const archs=[...(activePlanData.archivos||[])];
  for(const f of files){
    try{
      const r=ref(storage,`planes/${activePlanId}/${Date.now()}_${f.name}`);
      await uploadBytes(r,f);
      const url=await getDownloadURL(r);
      archs.push({nombre:f.name,url,fecha:now});
    }catch(e){console.error(e);}
  }
  await updateDoc(doc(db,planCol(),activePlanId),{archivos:archs});
  activePlanData.archivos=archs;
  const planIdx=allPlanes.findIndex(x=>x.id===activePlanId);
  if(planIdx>=0) allPlanes[planIdx].archivos=archs;
  refreshTabHeaders(activePlanData);
  setDetailTab('archivos',null,2);
  renderAll();
}

window.deletePlanFile=async url=>{
  if(!confirm('¿Eliminar este archivo?')) return;
  const archs=(activePlanData.archivos||[]).filter(a=>a.url!==url);
  await updateDoc(doc(db,planCol(),activePlanId),{archivos:archs});
  activePlanData.archivos=archs;
  const planIdx=allPlanes.findIndex(x=>x.id===activePlanId);
  if(planIdx>=0) allPlanes[planIdx].archivos=archs;
  refreshTabHeaders(activePlanData);
  setDetailTab('archivos',null,2);
  renderAll();
};

// Seguimiento: acumular archivos (no reemplazar)
window.previewSegFiles=input=>{
  Array.from(input.files).forEach(f=>pendingSegFiles.push(f));
  renderSegFileList();
};

function renderSegFileList(){
  const list=document.getElementById('segFileList');
  if(!list) return;
  list.innerHTML=pendingSegFiles.map((f,i)=>`
    <div class="file-item">
      <span style="font-size:18px">${fileIcon(f.name)}</span>
      <span class="file-item-name">${f.name}</span>
      <span class="file-item-meta">${(f.size/1024).toFixed(0)} KB</span>
      <button class="file-item-del" onclick="removeSegFile(${i})">✕</button>
    </div>`).join('');
}

window.removeSegFile=i=>{
  pendingSegFiles.splice(i,1);
  renderSegFileList();
};

// ── SEGUIMIENTO ───────────────────────────────────────────────────────────────
window.openSeg=()=>{
  pendingSegFiles=[];
  const fi=document.getElementById('segFiles');if(fi) fi.value='';
  const fl=document.getElementById('segFileList');if(fl) fl.innerHTML='';
  ['segFecha','segAvance','segPct','segAcuerdo','segSoporte'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  hideErr('segErrMsg');

  // Selector de acuerdo si hay >1
  const smart=activePlanData?.smart||[];
  const selWrap=document.getElementById('segAcuerdoSelWrap');
  const vencidoWrap=document.getElementById('segVencidoWrap');
  if(selWrap){
    if(smart.length>1){
      selWrap.style.display='block';
      const sel=document.getElementById('segAcuerdoSel');
      sel.innerHTML=smart.map((s,i)=>{
        const fc=parseDate(s.fcierre);
        const venc=fc&&fc<TODAY;
        return `<option value="${i}">${venc?'⚠ ':''}Acuerdo #${i+1}: ${s.obj?.substring(0,40)||'—'}${venc?' (VENCIDO)':''}`;
      }).join('');
      onSegAcuerdoChange();
    } else {
      selWrap.style.display='none';
      if(vencidoWrap) vencidoWrap.style.display='none';
      // Verificar si el único acuerdo está vencido
      if(smart.length===1){
        const fc=parseDate(smart[0].fcierre);
        if(fc&&fc<TODAY&&vencidoWrap){
          vencidoWrap.style.display='block';
          document.getElementById('segVencidoTxt').textContent=`⚠️ Este acuerdo venció el ${fmtDate(smart[0].fcierre)}`;
          document.getElementById('extendBox').style.display='none';
          // Max fecha
          document.getElementById('segFecha').max='';
        }
      }
    }
  }
  document.getElementById('segOverlay').classList.add('open');
  // Paste en seg
  const segZone=document.querySelector('#segOverlay .seg-modal');
  if(segZone){
    segZone.addEventListener('paste',e=>{
      const items=e.clipboardData?.items||[];
      for(const item of items){
        if(item.type.startsWith('image/')){
          e.preventDefault();
          const file=item.getAsFile();
          if(file){pendingSegFiles.push(file);renderSegFileList();}
        }
      }
    },{once:false});
  }
};

window.onSegAcuerdoChange=()=>{
  const sel=document.getElementById('segAcuerdoSel');
  if(!sel) return;
  const idx=parseInt(sel.value)||0;
  const smart=activePlanData?.smart||[];
  const s=smart[idx];
  const vencidoWrap=document.getElementById('segVencidoWrap');
  if(!s||!vencidoWrap) return;
  const fc=parseDate(s.fcierre);
  const venc=fc&&fc<TODAY;
  if(venc){
    vencidoWrap.style.display='block';
    document.getElementById('segVencidoTxt').textContent=`⚠️ Acuerdo #${idx+1} venció el ${fmtDate(s.fcierre)}`;
    document.getElementById('extendBox').style.display='none';
    document.getElementById('segFecha').max='';
  } else {
    vencidoWrap.style.display='none';
    if(s.fcierre) document.getElementById('segFecha').max=s.fcierre;
  }
};

window.showExtendBox=()=>{
  document.getElementById('extendBox').style.display='block';
};

window.confirmarExtender=async()=>{
  const nuevaFecha=document.getElementById('extendFecha').value;
  if(!nuevaFecha){alert('Selecciona una nueva fecha.');return;}
  const sel=document.getElementById('segAcuerdoSel');
  const idx=sel?parseInt(sel.value)||0:0;
  const smart=JSON.parse(JSON.stringify(activePlanData.smart||[]));
  smart[idx].fcierre=nuevaFecha;
  await updateDoc(doc(db,planCol(),activePlanId),{smart});
  activePlanData.smart=smart;
  const planIdx=allPlanes.findIndex(x=>x.id===activePlanId);
  if(planIdx>=0) allPlanes[planIdx].smart=smart;
  // Re-evaluar
  onSegAcuerdoChange();
  document.getElementById('extendBox').style.display='none';
  alert(`✅ Fecha extendida al ${fmtDate(nuevaFecha)}`);
};

window.closeSeg=()=>document.getElementById('segOverlay').classList.remove('open');

window.saveSeg=async()=>{
  const ids=['segAvance','segPct','segAcuerdo','segSoporte','segFecha'];
  let ok=true;
  ids.forEach(id=>{const el=document.getElementById(id);if(el){el.classList.remove('err');if(!el.value.trim()){el.classList.add('err');ok=false;}}});
  if(!ok){showErr('segErrMsg','Completa todos los campos.');return;}

  const smart=activePlanData?.smart||[];
  const selEl=document.getElementById('segAcuerdoSel');
  const acuerdoIdx=selEl&&smart.length>1?parseInt(selEl.value)||0:0;
  const s=smart[acuerdoIdx];

  // Validar fecha vs cierre del acuerdo
  const fechaSeg=document.getElementById('segFecha').value;
  if(s?.fcierre&&fechaSeg>s.fcierre){
    showErr('segErrMsg',`La fecha de seguimiento no puede superar el cierre del acuerdo (${fmtDate(s.fcierre)}).`);
    return;
  }

  const now=fmtDate(new Date());
  const archivosSubidos=[];
  for(const f of pendingSegFiles){
    try{
      const r=ref(storage,`seguimientos/${activePlanId}/${Date.now()}_${f.name}`);
      await uploadBytes(r,f);
      const url=await getDownloadURL(r);
      archivosSubidos.push({nombre:f.name,url,fecha:now});
    }catch(e){console.error(e);}
  }

  const seg={
    avance:document.getElementById('segAvance').value.trim(),
    pct:parseInt(document.getElementById('segPct').value)||0,
    acuerdo:document.getElementById('segAcuerdo').value.trim(),
    soporte:document.getElementById('segSoporte').value.trim(),
    fecha:fechaSeg,
    acuerdoIdx,
    autor:userProfile.nombre||currentUser.email,
    registradoEn:now,
    archivos:archivosSubidos
  };

  const seguimientos=[...(activePlanData.seguimientos||[]),seg];
  const updates={seguimientos,proxSeg:fechaSeg,pct:seg.pct,estado:'En seguimiento'};
  await updateDoc(doc(db,planCol(),activePlanId),updates);
  Object.assign(activePlanData,updates);
  const planIdx=allPlanes.findIndex(x=>x.id===activePlanId);
  if(planIdx>=0) Object.assign(allPlanes[planIdx],updates);

  closeSeg();
  refreshTabHeaders(activePlanData);
  setDetailTab('seguimientos',null,1);
  renderAll();

  // Imprimir anexo
  buildSegPrint(seg, activePlanData);
  setTimeout(()=>window.print(),400);
};

// ── CIERRE ────────────────────────────────────────────────────────────────────
let pendingCierreFile=null;
window.previewCierreFile=input=>{
  pendingCierreFile=input.files[0]||null;
  const prev=document.getElementById('cierreFilePreview');
  if(pendingCierreFile) prev.innerHTML=`<div class="file-item" style="margin-top:8px"><span>${fileIcon(pendingCierreFile.name)}</span><span class="file-item-name">${pendingCierreFile.name}</span></div>`;
  else prev.innerHTML='';
};

window.openCierreModal=()=>{
  document.getElementById('cierreJustificacion').value='';
  document.getElementById('cierreFilePreview').innerHTML='';
  pendingCierreFile=null;
  hideErr('cierreErrMsg');
  document.getElementById('cierreOverlay').classList.add('open');
};

window.confirmarCierre=async()=>{
  const just=document.getElementById('cierreJustificacion').value.trim();
  if(!just){showErr('cierreErrMsg','La justificación es obligatoria.');return;}
  const p=activePlanData;
  let urlCierre=null;
  if(pendingCierreFile){
    try{
      const r=ref(storage,`cierres/${activePlanId}/${Date.now()}_${pendingCierreFile.name}`);
      await uploadBytes(r,pendingCierreFile);
      urlCierre=await getDownloadURL(r);
    }catch(e){console.error(e);}
  }
  const fechaStr=nowStr();
  const cierreData={
    justificacion:just,
    archivo:urlCierre?{nombre:pendingCierreFile.name,url:urlCierre}:null,
    cerradoPor:userProfile.nombre||currentUser.email,
    cerradoEn:fechaStr
  };
  await updateDoc(doc(db,planCol(),activePlanId),{estado:'Cierre',cierre:cierreData});
  const planIdx=allPlanes.findIndex(x=>x.id===activePlanId);
  if(planIdx>=0){allPlanes[planIdx].estado='Cierre';allPlanes[planIdx].cierre=cierreData;}
  if(p){p.estado='Cierre';p.cierre=cierreData;}
  await notificarNivelSuperior(p,fechaStr);
  document.getElementById('cierreOverlay').classList.remove('open');
  renderAll();
  setDetailTab('info',null,0);
};

window.changeStage=async(id,stage)=>{
  if(stage==='Cierre'){openCierreModal();return;}
  await updateDoc(doc(db,'planes',id),{estado:stage});
  const p=allPlanes.find(x=>x.id===id);if(p) p.estado=stage;
  if(activePlanData) activePlanData.estado=stage;
  renderAll();
  setDetailTab('info',null,0);
};
// ── NUEVO PLAN ────────────────────────────────────────────────────────────────
let smartFilesMap={}; // { rowNum: [File,...] }

const TABS=[
  ()=>{
    const up=userProfile;
    const autoHier=up.rol==='sucursal'&&up.region;
    return `<div class="form-grid">
      <div class="form-group"><label>Nombre completo del colaborador *</label><input type="text" id="f_nombre" placeholder="Nombre y apellidos" value="${formData.nombre||''}"></div>
      <div class="form-group"><label>Puesto *</label><input type="text" id="f_puesto" placeholder="Ej. Coordinador Administrativo" value="${formData.puesto||''}"></div>
      <div class="form-group"><label>País *</label><select id="f_pais">
        <option value="">— Selecciona —</option>
        <option ${formData.pais==='Guatemala'?'selected':''}>Guatemala</option>
        <option ${formData.pais==='México'?'selected':''}>México</option>
        <option ${formData.pais==='Honduras'?'selected':''}>Honduras</option>
        <option ${formData.pais==='El Salvador'?'selected':''}>El Salvador</option>
      </select></div>
    </div>`;
  },
  ()=>`<div class="form-group full">
    <label>1. Fortalezas actuales *</label>
    <p style="font-size:11px;color:var(--muted);margin-bottom:6px;font-style:italic">Identifica los aspectos positivos y aportes de valor que el colaborador ya aporta.</p>
    <textarea id="f_fortalezas" rows="8" placeholder="Describe las fortalezas...">${formData.fortalezas||''}</textarea>
  </div>`,
  ()=>`<div class="form-group full">
    <label>2. Áreas para fortalecer *</label>
    <p style="font-size:11px;color:var(--muted);margin-bottom:6px;font-style:italic">Comportamientos o habilidades que, al trabajarlas, impulsarán el desempeño.</p>
    <textarea id="f_areas" rows="8" placeholder="Describe las áreas de mejora...">${formData.areas||''}</textarea>
  </div>`,
  ()=>`<div>
    <p style="font-size:11px;color:var(--muted);margin-bottom:12px;font-style:italic">3. Acuerdos SMART — Todos los campos marcados con * son obligatorios.</p>
    <div id="smartCards"></div>
    <button class="add-smart-btn" onclick="addSmartCard()">+ Agregar acuerdo SMART</button>
    <div style="margin-top:14px;padding:12px;background:var(--soft);border-radius:10px;font-size:11px;color:var(--muted);text-align:center;border:1px solid var(--border)">
      <b style="color:var(--dark)">4. Nuestro acuerdo de colaboración</b><br>
      Como colaborador, asumo el reto de mi crecimiento.<br>
      Como organización, nos comprometemos a brindar el apoyo y las herramientas necesarias.
    </div>
  </div>`
];

window.openModal=()=>{currentTab=0;smartRows=0;formData={};smartFilesMap={};renderTab(0);updateNav();document.getElementById('modalOverlay').classList.add('open');hideErr('errMsg');};
window.closeModal=()=>{document.getElementById('modalOverlay').classList.remove('open');formData={};smartFilesMap={};};
window.goTab=(t,el)=>{saveTabData();currentTab=t;renderTab(t);updateNav();hideErr('errMsg');};
window.nextTab=()=>{if(validateTab()){saveTabData();currentTab++;renderTab(currentTab);updateNav();}};
window.prevTab=()=>{saveTabData();currentTab--;renderTab(currentTab);updateNav();};

function saveTabData(){
  const g=id=>document.getElementById(id)?.value||'';
  if(currentTab===0){formData.nombre=g('f_nombre');formData.puesto=g('f_puesto');formData.pais=g('f_pais');}
  else if(currentTab===1){formData.fortalezas=g('f_fortalezas');}
  else if(currentTab===2){formData.areas=g('f_areas');}
}
function renderTab(t){
  document.getElementById('tabContent').innerHTML=TABS[t]();
  document.querySelectorAll('.mtab').forEach((el,i)=>el.classList.toggle('active',i===t));
  if(t===3){smartRows=0;smartFilesMap={};document.getElementById('smartCards').innerHTML='';addSmartCard();}
}
function updateNav(){
  document.getElementById('btnPrev').style.display=currentTab>0?'':'none';
  document.getElementById('btnNext').style.display=currentTab<3?'':'none';
  document.getElementById('btnSave').style.display=currentTab===3?'':'none';
}
function validateTab(){
  hideErr('errMsg');let ok=true;
  document.querySelectorAll('#tabContent input:not([type=button]):not([type=file]),#tabContent select,#tabContent textarea').forEach(f=>{
    f.classList.remove('err');
    if(f.closest('.sc-body.coll')) return;
    if(!f.value.trim()){f.classList.add('err');ok=false;}
  });
  if(!ok) showErr('errMsg','Completa todos los campos obligatorios.');
  return ok;
}

window.addSmartCard=()=>{
  smartRows++;const n=smartRows;
  smartFilesMap[n]=[];
  const div=document.createElement('div');div.className='smart-card';div.id='sc_'+n;
  div.innerHTML=`<div class="sc-head" onclick="document.getElementById('sc_b_${n}').classList.toggle('coll')">
    <span class="sc-num">Acuerdo #${n}</span>
    <span class="sc-ttl" id="sc_t_${n}">Sin título aún</span>
    <button class="sc-del" onclick="event.stopPropagation();this.closest('.smart-card').remove()">✕</button>
  </div>
  <div class="sc-body" id="sc_b_${n}">
    <div class="sc-field full"><label>Objetivo (¿Qué?) *</label>
      <textarea id="s${n}_obj" rows="3" oninput="document.getElementById('sc_t_${n}').textContent=this.value.substring(0,55)||'Sin título aún'" placeholder="Objetivo claro y medible..."></textarea></div>
    <div class="sc-field full"><label>Acción Observable (¿Cómo?) *</label>
      <textarea id="s${n}_acc" rows="3" placeholder="Acciones concretas y observables..."></textarea></div>
    <div class="sc-field"><label>Fecha de seguimiento *</label><input type="date" id="s${n}_fseg"></div>
    <div class="sc-field"><label>Fecha de cierre (máx. 3 meses) *</label><input type="date" id="s${n}_fci"></div>
    <div class="sc-field full"><label>Evidencia requerida *</label>
      <textarea id="s${n}_evi" rows="2" placeholder="Describe qué evidencia se necesita..."></textarea></div>
    <div class="sc-field full"><label>Soporte necesario *</label>
      <textarea id="s${n}_sop" rows="2" placeholder="¿Qué apoyo necesita?"></textarea></div>
    <div class="sc-field full">
      <label>Archivos de respaldo (opcional)</label>
      <div class="file-zone" onclick="document.getElementById('sf_${n}').click()">
        <div style="font-size:20px">📎</div>
        <p>Adjuntar archivos opcionales al acuerdo<br><span style="font-size:10px">Imágenes, PDF, Excel</span></p>
      </div>
      <input type="file" id="sf_${n}" multiple style="display:none" onchange="addSmartFiles(${n},this)">
      <div class="file-list" id="sf_list_${n}"></div>
    </div>
  </div>`;
  document.getElementById('smartCards').appendChild(div);
};

window.addSmartFiles=(n,input)=>{
  Array.from(input.files).forEach(f=>{
    if(!smartFilesMap[n]) smartFilesMap[n]=[];
    smartFilesMap[n].push(f);
  });
  const list=document.getElementById(`sf_list_${n}`);
  if(list){
    list.innerHTML=smartFilesMap[n].map((f,i)=>`
      <div class="file-item">
        <span style="font-size:16px">${fileIcon(f.name)}</span>
        <span class="file-item-name">${f.name}</span>
        <span class="file-item-meta">${(f.size/1024).toFixed(0)} KB</span>
        <button class="file-item-del" onclick="removeSmartFile(${n},${i})">✕</button>
      </div>`).join('');
  }
};

window.removeSmartFile=(n,i)=>{
  if(smartFilesMap[n]) smartFilesMap[n].splice(i,1);
  const list=document.getElementById(`sf_list_${n}`);
  if(list){
    list.innerHTML=(smartFilesMap[n]||[]).map((f,i)=>`
      <div class="file-item">
        <span style="font-size:16px">${fileIcon(f.name)}</span>
        <span class="file-item-name">${f.name}</span>
        <span class="file-item-meta">${(f.size/1024).toFixed(0)} KB</span>
        <button class="file-item-del" onclick="removeSmartFile(${n},${i})">✕</button>
      </div>`).join('');
  }
};

window.savePlan=async()=>{
  hideErr('errMsg');
  let ok=true;
  document.querySelectorAll('.sc-body:not(.coll) input:not([type=file]),.sc-body:not(.coll) textarea').forEach(f=>{
    f.classList.remove('err');
    if(!f.value.trim()){f.classList.add('err');ok=false;}
  });
  if(!ok){showErr('errMsg','Completa todos los campos de los acuerdos SMART.');return;}
  saveTabData();
  const smart=[];
  for(let i=1;i<=smartRows;i++){
    if(!document.getElementById('sc_'+i)) continue;
    smart.push({
      obj:document.getElementById('s'+i+'_obj')?.value||'',
      accion:document.getElementById('s'+i+'_acc')?.value||'',
      fseg:document.getElementById('s'+i+'_fseg')?.value||'',
      fcierre:document.getElementById('s'+i+'_fci')?.value||'',
      evidencia:document.getElementById('s'+i+'_evi')?.value||'',
      soporte:document.getElementById('s'+i+'_sop')?.value||'',
      archivos:[] // se llenan post-save
    });
  }
  const up=userProfile;
  const planData={
  asesor:formData.nombre||'',puesto:formData.puesto||'',lider:userProfile.nombre||currentUser.email,
    liderUid:currentUser.uid,creadoPor:currentUser.uid,
    fecha:new Date().toISOString().slice(0,10),pais:formData.pais||'',
    proxSeg:'',region:up.region||'',zona:up.zona||'',
    sucursal:'',
    fortalezas:formData.fortalezas||'',areas:formData.areas||'',
    smart,estado:'En curso',pct:0,
    seguimientos:[],archivos:[],comentarios:[],
    creadoEn:serverTimestamp()
  };
  try{
    const r=await addDoc(collection(db,'planes'),planData);
    planData.id=r.id;
    // Subir archivos de acuerdos SMART
    for(let i=1;i<=smartRows;i++){
      const files=smartFilesMap[i]||[];
      const idx=i-1;
      if(!planData.smart[idx]) continue;
      const archivosAcuerdo=[];
      for(const f of files){
        try{
          const sr=ref(storage,`smart/${r.id}/${idx}/${Date.now()}_${f.name}`);
          await uploadBytes(sr,f);
          const url=await getDownloadURL(sr);
          archivosAcuerdo.push({nombre:f.name,url,fecha:fmtDate(new Date())});
        }catch(e){console.error(e);}
      }
      planData.smart[idx].archivos=archivosAcuerdo;
    }
    if(planData.smart.some(s=>s.archivos?.length)){
      await updateDoc(doc(db,'planes',r.id),{smart:planData.smart});
    }
    planData.tipo='fortalecimiento';
    allPlanes.unshift(planData);
    closeModal();
    currentSubView='mis';
    renderAll();
    showToast('Plan de Fortalecimiento creado. Haz clic en la tarjeta para abrirlo.');
  }catch(e){
    console.error('Error guardando plan:',e);
    showErr('errMsg','No se pudo guardar el plan. Por favor, verifica tu conexión e inténtalo de nuevo.');
  }
};

// ── EDICIÓN ───────────────────────────────────────────────────────────────────
let editFormData={};let editTab=0;

window.openEditModal=()=>{
  const p=activePlanData;if(!p) return;
  const canEdit=userProfile.rol==='rh'||p.liderUid===currentUser.uid;
  if(!canEdit){alert('Solo RH o el dueño del plan pueden editar.');return;}
  editFormData={...p,nombre:p.asesor};
  editTab=0;renderEditTab(0);
  document.querySelectorAll('#editTabs .mtab').forEach((t,i)=>t.classList.toggle('active',i===0));
  document.getElementById('editOverlay').classList.add('open');
  hideErr('editErrMsg');
};

window.closeEditModal=()=>document.getElementById('editOverlay').classList.remove('open');

window.goEditTab=(t,el)=>{
  saveEditTabData();editTab=t;renderEditTab(t);
  document.querySelectorAll('#editTabs .mtab').forEach(mt=>mt.classList.remove('active'));
  if(el) el.classList.add('active');
};

function renderEditTab(t){
  const p=editFormData;const up=userProfile;
  const autoHier=up.rol==='sucursal'&&up.region;
  const content=document.getElementById('editTabContent');
  if(t===0){
    content.innerHTML=`<div class="form-grid">
      <div class="form-group"><label>Nombre completo del colaborador *</label><input type="text" id="ef_nombre" value="${p.asesor||''}"></div>
      <div class="form-group"><label>Puesto *</label><input type="text" id="ef_puesto" value="${p.puesto||''}"></div>
      <div class="form-group"><label>País *</label><select id="ef_pais">
        <option ${p.pais==='Guatemala'?'selected':''}>Guatemala</option>
        <option ${p.pais==='México'?'selected':''}>México</option>
        <option ${p.pais==='Honduras'?'selected':''}>Honduras</option>
        <option ${p.pais==='El Salvador'?'selected':''}>El Salvador</option>
      </select></div>
    </div>`;
  } else if(t===1){
    content.innerHTML=`<div class="form-group full"><label>1. Fortalezas actuales *</label><textarea id="ef_fortalezas" rows="10" style="width:100%;min-height:200px">${p.fortalezas||''}</textarea></div>`;
  } else if(t===2){
    content.innerHTML=`<div class="form-group full"><label>2. Áreas para fortalecer *</label><textarea id="ef_areas" rows="10" style="width:100%;min-height:200px">${p.areas||''}</textarea></div>`;
  } else if(t===3){
    const smarts=p.smart||[];
    content.innerHTML=`<div>${smarts.map((s,i)=>`
      <div class="smart-card" style="margin-bottom:10px">
        <div class="sc-head"><span class="sc-num">Acuerdo #${i+1}</span><span class="sc-ttl">${s.obj?.substring(0,55)||'Sin título'}</span></div>
        <div class="sc-body">
          <div class="sc-field full"><label>Objetivo *</label><textarea id="es${i}_obj" rows="2">${s.obj||''}</textarea></div>
          <div class="sc-field full"><label>Acción Observable *</label><textarea id="es${i}_acc" rows="2">${s.accion||''}</textarea></div>
          <div class="sc-field"><label>Fecha de seguimiento *</label><input type="date" id="es${i}_fseg" value="${s.fseg||''}"></div>
          <div class="sc-field"><label>Fecha de cierre *</label><input type="date" id="es${i}_fci" value="${s.fcierre||''}"></div>
          <div class="sc-field full"><label>Evidencia *</label><textarea id="es${i}_evi" rows="2">${s.evidencia||''}</textarea></div>
          <div class="sc-field full"><label>Soporte necesario *</label><textarea id="es${i}_sop" rows="2">${s.soporte||''}</textarea></div>
        </div>
      </div>`).join('')}</div>`;
  }
}

function saveEditTabData(){
  const g=id=>{const el=document.getElementById(id);return el?el.value:null;};
  if(editTab===0){
   if(g('ef_nombre')!==null) editFormData._ef={nombre:g('ef_nombre'),puesto:g('ef_puesto'),pais:g('ef_pais')};
  } else if(editTab===1){if(g('ef_fortalezas')!==null) editFormData._ef_fortalezas=g('ef_fortalezas');}
  else if(editTab===2){if(g('ef_areas')!==null) editFormData._ef_areas=g('ef_areas');}
  else if(editTab===3){
    const newSmart=(editFormData.smart||[]).map((s,i)=>({
      ...s,
      obj:g(`es${i}_obj`)??s.obj,accion:g(`es${i}_acc`)??s.accion,
      fseg:g(`es${i}_fseg`)??s.fseg,fcierre:g(`es${i}_fci`)??s.fcierre,
      evidencia:g(`es${i}_evi`)??s.evidencia,soporte:g(`es${i}_sop`)??s.soporte
    }));
    editFormData._ef_smart=newSmart;
  }
}

window.saveEdit=async()=>{
  saveEditTabData();
  const p=activePlanData;
  const fechaStr=nowStr();
  const cambios=[...(p.historialCambios||[])];
  const updates={};
  const ef=editFormData._ef;
  if(ef){
    const campos=[{k:'asesor',label:'Nombre',v:ef.nombre},{k:'puesto',label:'Puesto',v:ef.puesto},{k:'pais',label:'País',v:ef.pais}];
    campos.forEach(({k,label,v})=>{if(v!==null&&v!==p[k]){updates[k]=v;cambios.push({campo:label,anterior:p[k]||'—',nuevo:v,autor:userProfile.nombre,fecha:fechaStr});}});
  }
  if(editFormData._ef_fortalezas!==undefined&&editFormData._ef_fortalezas!==p.fortalezas){updates.fortalezas=editFormData._ef_fortalezas;cambios.push({campo:'Fortalezas',anterior:'(anterior)',nuevo:'(actualizado)',autor:userProfile.nombre,fecha:fechaStr});}
  if(editFormData._ef_areas!==undefined&&editFormData._ef_areas!==p.areas){updates.areas=editFormData._ef_areas;cambios.push({campo:'Áreas',anterior:'(anterior)',nuevo:'(actualizado)',autor:userProfile.nombre,fecha:fechaStr});}
  if(editFormData._ef_smart) updates.smart=editFormData._ef_smart;
  if(cambios.length>(p.historialCambios||[]).length) updates.historialCambios=cambios;
  if(!Object.keys(updates).length){closeEditModal();return;}
  try{
    await updateDoc(doc(db,planCol(),activePlanId),updates);
    Object.assign(p,updates);
    const planIdx=allPlanes.findIndex(x=>x.id===activePlanId);
    if(planIdx>=0) Object.assign(allPlanes[planIdx],updates);
    closeEditModal();
    refreshTabHeaders(p);
    document.getElementById('fm-title').textContent=p.asesor||'Plan';
    setDetailTab('cambios',null,4);
    renderAll();
  }catch(e){
    console.error('Error editando plan:',e);
    showErr('editErrMsg','No se pudieron guardar los cambios. Inténtalo de nuevo.');
  }
};

// ── IMPRESIÓN ─────────────────────────────────────────────────────────────────
window.printActivePlan=()=>{
  if(activePlanData?.tipo==='unoauno'){buildUauPrintDoc(activePlanData);}
  else{buildPrintDoc(activePlanData,activePlanData.seguimientos||[]);}
  setTimeout(()=>window.print(),400);
};

window.sendActivePlanByEmail=async()=>{
  if(!activePlanData) return;
  const btns = document.querySelectorAll('[onclick="sendActivePlanByEmail()"]');
  btns.forEach(b => { b.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Enviando...`; b.disabled = true; });
  
  if(activePlanData.tipo==='unoauno'){buildUauPrintDoc(activePlanData);}
  else{buildPrintDoc(activePlanData,activePlanData.seguimientos||[]);}
  
  const element = document.getElementById('printArea');
  element.style.display = 'block';
  
  const opt = {
    margin:       10,
    filename:     `Plan_${activePlanData.asesor||'Fortalecimiento'}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
    element.style.display = 'none';

    const storageRef = ref(storage, `pdfs/${activePlanData.id}_${Date.now()}.pdf`);
    await uploadBytes(storageRef, pdfBlob);
    const downloadUrl = await getDownloadURL(storageRef);

    const uidsToSend = new Set([activePlanData.creadoPor, activePlanData.liderUid, currentUser.uid]);
    const emails = [];
    for(const id of uidsToSend){
      if(id){
        const userObj = allUsers.find(u => u.uid === id);
        if(userObj && userObj.email) emails.push(userObj.email);
      }
    }
    
    const to = [...new Set(emails)];
    if(to.length > 0) {
      await addDoc(collection(db, 'mail'), {
        to: to,
        message: {
          subject: `PDF: Plan de Fortalecimiento - ${activePlanData.asesor}`,
          html: `<p>Hola,</p>
                 <p>Adjunto encontrarás el enlace para descargar el PDF del plan o Uno a Uno de <b>${activePlanData.asesor}</b>.</p>
                 <p><a href="${downloadUrl}" style="background:var(--foreground);color:#fff;padding:8px 12px;text-decoration:none;border-radius:6px;display:inline-block;">Descargar PDF</a></p>
                 <p>Saludos.</p>`
        }
      });
      showToast('✅ Correo con PDF enviado correctamente.');
    } else {
      showToast('⚠️ No se encontraron correos para enviar.');
    }
  } catch(e) {
    console.error('Error enviando PDF por correo:', e);
    showToast('❌ No se pudo enviar el PDF. Inténtalo más tarde.');
  } finally {
    element.style.display = 'none';
    btns.forEach(b => { b.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Enviar PDF`; b.disabled = false; });
  }
};

function buildSegPrint(seg,p){
  document.getElementById('printArea').innerHTML=`<div class="print-doc">
    <div class="ph">
      <div class="ph-logo">FERCO<span>CERÁMICA</span></div>
      <div class="ph-title"><h2>ANEXO DE SEGUIMIENTO</h2><p>Plan de Fortalecimiento — ${p.asesor||''}</p></div>
    </div>
    <div class="pmeta">
      <span class="ml">Asesor:</span><span>${p.asesor||''}</span>
      <span class="ml">Líder:</span><span>${p.lider||''}</span>
      <span class="ml">Acuerdo #:</span><span>${(seg.acuerdoIdx||0)+1}</span>
      <span class="ml">Registrado por:</span><span>${seg.autor||''}</span>
      <span class="ml">Fecha registro:</span><span>${seg.registradoEn||''}</span>
      <span class="ml">Próx. seguimiento:</span><span>${fmtDate(seg.fecha)}</span>
    </div>
    <div class="psec">REGISTRO DE SEGUIMIENTO</div>
    <div class="pmeta">
      <span class="ml">% Avance:</span><span>${seg.pct||0}%</span>
      <span class="ml">Soporte:</span><span>${seg.soporte||''}</span>
      <span class="ml">Avances observados:</span><span>${seg.avance||''}</span>
      <span class="ml">Acuerdos próx. seg.:</span><span>${seg.acuerdo||''}</span>
    </div>
    ${(seg.archivos||[]).length?`<div class="seg-files-annex"><p>Archivos adjuntos:</p>${seg.archivos.map(a=>`<a class="seg-file-link" href="${a.url}" target="_blank">📎 ${a.nombre}</a>`).join('')}</div>`:''}
    <div class="psigs"><div><div class="psig" style="margin-top:50px">${p.asesor||'Colaborador'}</div></div><div><div class="psig" style="margin-top:50px">${p.lider||'Líder'}</div></div></div>
  </div>`;
}

function buildPrintDoc(p, segs){
  const smart=p.smart||[];
  // Acuerdos + sus seguimientos agrupados
  const acuerdosHtml=smart.map((s,si)=>{
    const segDeEste=(p.seguimientos||[]).filter(sg=>sg.acuerdoIdx===si||(sg.acuerdoIdx===undefined&&si===0));
    const segOrdenados=[...segDeEste].reverse();
    const archivosAcuerdo=(s.archivos||[]).map(a=>`<a class="seg-file-link" href="${a.url}" target="_blank">📎 ${a.nombre}</a>`).join('');
    return `<div class="print-acuerdo-block">
      <h4>Acuerdo #${si+1}: ${s.obj||'—'}</h4>
      <div class="pmeta">
        <span class="ml">Acción:</span><span>${s.accion||'—'}</span>
        <span class="ml">F. Seg.:</span><span>${fmtDate(s.fseg)}</span>
        <span class="ml">Evidencia:</span><span>${s.evidencia||'—'}</span>
        <span class="ml">F. Cierre:</span><span>${fmtDate(s.fcierre)}</span>
        <span class="ml">Soporte:</span><span>${s.soporte||'—'}</span>
      </div>
      ${archivosAcuerdo?`<div class="seg-files-annex">${archivosAcuerdo}</div>`:''}
      ${segOrdenados.length?`<div class="seg-annex">
        <h3>Seguimientos del Acuerdo #${si+1}</h3>
        ${segOrdenados.map((sg,i)=>`<div class="print-seg-item">
          <div class="psi-date">📅 ${fmtDate(sg.fecha)} · ${sg.pct||0}% · Por: ${sg.autor||'—'} · Reg.: ${sg.registradoEn||'—'}</div>
          <div><b>Avances:</b> ${sg.avance||''}</div>
          <div><b>Acuerdo:</b> ${sg.acuerdo||''}</div>
          ${sg.soporte?`<div><b>Soporte:</b> ${sg.soporte}</div>`:''}
          ${(sg.archivos||[]).length?`<div class="seg-files-annex">${sg.archivos.map(a=>`<a class="seg-file-link" href="${a.url}" target="_blank">📎 ${a.nombre}</a>`).join('')}</div>`:''}
        </div>`).join('')}
      </div>`:''}
    </div>`;
  }).join('');

  const archivosGeneralesHtml=(p.archivos||[]).length?`<div class="seg-annex">
    <h3>Archivos generales del plan</h3>
    ${p.archivos.map(a=>`<a class="seg-file-link" href="${a.url}" target="_blank">📎 ${a.nombre} (${fmtDate(a.fecha)})</a>`).join('')}
  </div>`:'';

  const cierreHtml=p.cierre?`<div class="seg-annex">
    <h3>Registro de cierre</h3>
    <p style="font-size:9px;color:#64748b;margin-bottom:6px">Cerrado por: ${p.cierre.cerradoPor||'—'} · ${p.cierre.cerradoEn||''}</p>
    <div class="pbox">${p.cierre.justificacion||''}</div>
    ${p.cierre.archivo?`<div class="seg-files-annex"><a class="seg-file-link" href="${p.cierre.archivo.url}" target="_blank">📎 ${p.cierre.archivo.nombre}</a></div>`:''}
    <div class="psigs"><div><div class="psig">Firma del Colaborador</div></div><div><div class="psig">Firma del Líder</div></div></div>
  </div>`:'';

  document.getElementById('printArea').innerHTML=`<div class="print-doc">
    <div class="ph">
      <div class="ph-logo">FERCO<span>CERÁMICA</span></div>
      <div class="ph-title"><h2>PLAN DE FORTALECIMIENTO DE CAPACITACIÓN</h2><p>Este espacio tiene como fin potenciar tu talento y alinear esfuerzos para alcanzar tu mejor versión profesional.</p></div>
      <div style="font-size:10px;color:#64748b;text-align:right">Planes de Fortalecimiento<br>FERCO Cerámica</div>
    </div>
    <div class="pmeta">
      <span class="ml">Fecha:</span><span>${fmtDate(p.fecha)||''}</span>
      <span class="ml">Nombre completo:</span><span>${p.asesor||''}</span>
      <span class="ml">Puesto:</span><span>${p.puesto||''}</span>
      <span class="ml">Líder:</span><span>${p.lider||''}</span>
    </div>
    <div class="psec">1. NUESTRO PUNTO DE PARTIDA: FORTALEZAS ACTUALES</div>
    <div class="pbox">${p.fortalezas||''}</div>
    <div class="psec">2. ÁREAS PARA FORTALECER</div>
    <div class="pbox">${p.areas||''}</div>
    <div class="psec">3. ACUERDOS DE MEJORA CONTINUA (SMART)</div>
    ${acuerdosHtml}
    <div class="psec">4. NUESTRO ACUERDO DE COLABORACIÓN</div>
    <div class="pacuerdo">Reconocemos que este proceso es un esfuerzo compartido.<br>Como colaborador, asumo el reto de mi crecimiento.<br>Como organización, nos comprometemos a brindar el apoyo y las herramientas necesarias.</div>
    <div class="psigs"><div><div class="psig">Firma del Colaborador</div></div><div><div class="psig">Firma del Líder</div></div></div>
    ${archivosGeneralesHtml}
    ${cierreHtml}
    ${(p.seguimientos||[]).length>0&&!p.cierre?`<div class="psigs" style="margin-top:40px"><div><div class="psig">Firma del Colaborador</div></div><div><div class="psig">Firma del Líder</div></div></div>`:''}
  </div>`;
}

// ── VISTAS ────────────────────────────────────────────────────────────────────
window.showView=(v,el)=>{
  document.querySelectorAll('.s-item').forEach(i=>i.classList.remove('active'));
  if(el) el.classList.add('active');
  document.getElementById('viewDashboard').style.display=v==='dashboard'?'':'none';
  document.getElementById('viewUsuarios').style.display=v==='usuarios'?'':'none';
  document.getElementById('pageTitle').textContent=v==='dashboard'?'Dashboard':'Gestión de Usuarios';
  if(v==='usuarios') loadUsers();
};

// ── USUARIOS ──────────────────────────────────────────────────────────────────
window.toggleUH=(id)=>{
  const el=document.getElementById('uhn_'+id);
  const chev=document.getElementById('uhc_'+id);
  const card=el?.previousElementSibling;
  if(!el) return;
  const isOpen=el.style.display==='block';
  el.style.display=isOpen?'none':'block';
  if(chev) chev.style.transform=isOpen?'':'rotate(90deg)';
  if(card) card.classList.toggle('open',!isOpen);
};

async function loadUsers(){
  document.getElementById('usersLoading').style.display='flex';
  const areaContainer = document.getElementById('usersHierarchyArea');
  areaContainer.style.display='none';
  areaContainer.innerHTML='';
  
  try {
    const snap=await getDocs(collection(db,'users'));
    const list=snap.docs.map(d=>({uid:d.id,...d.data()}));
    allUsers=list; // populate global memory
    
    // Helper mappings
    const paisLabel = p => {
      const key = String(p||'Global').toLowerCase().trim();
      if(key === 'gt') return 'Guatemala';
      if(key === 'hn') return 'Honduras';
      if(key === 'sv') return 'El Salvador';
      if(key === 'mx') return 'México';
      if(key === 'global') return 'Global';
      return p || 'Global';
    };

    const areaLabel = a => {
      if(!a) return 'Otros';
      if(a==='rh_global') return 'RH Global';
      return a.charAt(0).toUpperCase()===a.charAt(0) ? a : (AREA_LEGACY_MAP[a] || a);
    };

    // Agrupación jerárquica: País -> Área -> Usuarios
    const grouped = {};
    list.forEach(u => {
      const p = paisLabel(u.pais);
      const a = areaLabel(u.area);
      if(!grouped[p]) grouped[p] = {};
      if(!grouped[p][a]) grouped[p][a] = [];
      grouped[p][a].push(u);
    });

    // Ordenar países (Global primero, luego alfabéticamente)
    const sortedCountries = Object.keys(grouped).sort((a,b) => {
      if(a === 'Global') return -1;
      if(b === 'Global') return 1;
      return a.localeCompare(b);
    });

    let html = '';
    sortedCountries.forEach((country, cIdx) => {
      const countryKey = 'c_' + cIdx;
      const areas = grouped[country];
      const countryUserCount = Object.values(areas).reduce((acc, val) => acc + val.length, 0);
      
      let areasHtml = '';
      Object.entries(areas).sort((a,b) => a[0].localeCompare(b[0])).forEach(([areaName, users], aIdx) => {
        const areaKey = countryKey + '_a_' + aIdx;
        
        let usersHtml = '<div class="user-grid">';
        users.forEach((u, uIdx) => {
          // Cargo: usar u.cargo si existe, si no el rolLabel del rol legacy
          const cargoDisplay = u.cargo || rolLabel(u.rol) || u.rol || '—';
          // Área badge con color
          const areaKey2 = u.esRhGlobal ? 'rh_global' : (u.area||'');
          const areaBadgeStyle = u.esRhGlobal
            ? 'background:#fce7f3;color:#9d174d'
            : (AREA_COLORS[areaKey2]||'background:var(--background);color:#475569');
          const areaDisplayLabel = u.esRhGlobal ? 'RH Global' : areaLabel(u.area||'');
          // Jerarquía: mostrar path desde nivel3 hasta cargo
          const hierParts=[u.nivel3,u.nivel4,u.nivel5,u.nivel6,u.nivel7,u.nivel8].filter(Boolean);
          const hier = hierParts.length > 1 ? hierParts.slice(0,-1).join(' › ') : (hierParts[0]||u.pais||'—');
          // Reporta a
          let bossName='Nadie';
          if(u.reportaA){
            const boss=list.find(x=>x.uid===u.reportaA);
            if(boss) bossName=`${boss.nombre} (${boss.cargo||rolLabel(boss.rol)||boss.rol})`;
          }

          usersHtml += `
            <div class="user-card-premium" style="animation-delay:${uIdx*55}ms">
              <div class="uc-top">
                <div class="uc-info">
                  <div class="uc-name">${escHtml(u.nombre||'—')}</div>
                  <div class="uc-email">${escHtml(u.email||'—')}</div>
                </div>
                <button class="uc-pass-btn" title="Restablecer Contraseña" onclick="resetUserPassword('${u.email}','${escHtml(u.nombre||'')}')">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </button>
              </div>
              <div class="uc-details">
                <div class="uc-detail-item">
                  <span class="uc-label">Cargo:</span>
                  <span class="uc-val" style="font-weight:600">${escHtml(cargoDisplay)}</span>
                </div>
                <div class="uc-detail-item">
                  <span class="uc-label">Área:</span>
                  <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;${areaBadgeStyle}">${escHtml(areaDisplayLabel)}</span>
                </div>
                <div class="uc-detail-item">
                  <span class="uc-label">Reporta a:</span>
                  <span class="uc-val" title="${escHtml(bossName)}">${escHtml(bossName)}</span>
                </div>
                <div class="uc-detail-item">
                  <span class="uc-label">Rama:</span>
                  <span class="uc-val" title="${escHtml(hier)}">${escHtml(hier)}</span>
                </div>
              </div>
            </div>`;
        });
        usersHtml += '</div>';

        areasHtml += `
          <div class="uh-node area-node">
            <div class="uh-card area-card" onclick="toggleUH('${areaKey}')">
              <span class="uh-icon">💼</span>
              <span class="uh-title">${areaName}</span>
              <span class="uh-count">${users.length} usuarios</span>
              <span class="uh-chevron" id="uhc_${areaKey}">▶</span>
            </div>
            <div class="uh-children" id="uhn_${areaKey}" style="display:none">
              ${usersHtml}
            </div>
          </div>`;
      });

      html += `
        <div class="uh-node country-node">
          <div class="uh-card country-card" onclick="toggleUH('${countryKey}')">
            <span class="uh-icon">🌎</span>
            <span class="uh-title">${country}</span>
            <span class="uh-count">${countryUserCount} usuarios</span>
            <span class="uh-chevron" id="uhc_${countryKey}">▶</span>
          </div>
          <div class="uh-children" id="uhn_${countryKey}" style="display:none">
            ${areasHtml}
          </div>
        </div>`;
    });

    areaContainer.innerHTML = html;
    document.getElementById('usersLoading').style.display='none';
    areaContainer.style.display='flex';
  } catch(e) {
    console.error('Error cargando usuarios:', e);
    areaContainer.innerHTML = `<div style="color:var(--danger);text-align:center;padding:20px;font-weight:700">⚠️ Error al cargar los usuarios. Por favor, recarga la página.</div>`;
    document.getElementById('usersLoading').style.display='none';
    areaContainer.style.display='block';
  }
}

window.openUserModal=()=>{
  document.getElementById('uNombre').value='';
  document.getElementById('uEmail').value='';
  const rhWrap=document.getElementById('uRhGlobalWrap');
  if(rhWrap) rhWrap.style.display=(currentUser&&userProfile?.rol==='rh_global')?'block':'none';
  const rhCheck=document.getElementById('uEsRhGlobal');
  if(rhCheck) rhCheck.checked=false;
  
    const rawCfg = window.EmpresaConfig || {};
  const cfg = {
    paises: rawCfg.paises || [],
    areas: rawCfg.areas || [],
    puestos: rawCfg.puestos || []
  };
  
  const sPais=document.getElementById('uPais');
  sPais.innerHTML='<option value="">Seleccione país...</option>'+
    cfg.paises.map(p=>`<option value="${p}">${p}</option>`).join('');
    
  const sArea=document.getElementById('uArea');
  sArea.innerHTML='<option value="">Seleccione área...</option>'+
    cfg.areas.map(a=>`<option value="${a.nombre}">${a.nombre}</option>`).join('');
    
  // El rol depende del área seleccionada
  const sRol=document.getElementById('uRol');
  sRol.innerHTML='<option value="">Seleccione rol...</option>';
  
  sArea.onchange = () => {
      const areaSelec = sArea.value;
      const rolesArea = cfg.puestos.filter(p => p.area === areaSelec);
      sRol.innerHTML='<option value="">Seleccione rol...</option>'+
        rolesArea.map(r=>`<option value="${r.id}">${r.nombre}</option>`).join('');
  };
  
  // Limpiar otros selects
  ['uRegion','uZona','uSucursal'].forEach(id=>{
      const el=document.getElementById(id);
      if(el) {el.innerHTML=''; el.parentElement.style.display='none';}
  });
  
  hideErr('uErr');
  document.getElementById('userModalOverlay').classList.add('open');
};

window.closeUserModal=()=>document.getElementById('userModalOverlay').classList.remove('open');

// País cambia → habilitar Área
window.onPaisChange=()=>{
  const pais = document.getElementById('uPais').value;
  const areaSelect = document.getElementById('uArea');
  const cargoSelect = document.getElementById('uCargo');
  if(!pais){ areaSelect.disabled = true; cargoSelect.disabled = true; return; }
  areaSelect.disabled = false;
}

window.onAreaChange=()=>{
  const area = document.getElementById('uArea').value;
  const cargoSelect = document.getElementById('uCargo');
  const repSelect = document.getElementById('uReportaA');
  const rawCfg = window.EmpresaConfig || {};
  const cfg = {
    paises: rawCfg.paises || [],
    areas: rawCfg.areas || [],
    puestos: rawCfg.puestos || []
  };
  repSelect.innerHTML='<option value="">— Sin asignación (Opcional) —</option>';
  if(!area){ cargoSelect.innerHTML='<option value="">— Selecciona el área primero —</option>'; cargoSelect.disabled=true; return; }
  const rolesArea = cfg.puestos.filter(p => p.area === area);
  let cHtml = '<option value="">— Selecciona el puesto / rol —</option>';
  rolesArea.forEach(r => { cHtml += `<option value="${r.id}">${r.nombre}</option>`; });
  cargoSelect.innerHTML = cHtml;
  cargoSelect.disabled = false;
};

window.onPuestoChange=()=>{
  const cargo = document.getElementById('uCargo').value;
  const repSelect = document.getElementById('uReportaA');
  const rawCfg = window.EmpresaConfig || {};
  const cfg = {
    paises: rawCfg.paises || [],
    areas: rawCfg.areas || [],
    puestos: rawCfg.puestos || []
  };
  if(!cargo){ repSelect.innerHTML='<option value="">— Sin asignación (Opcional) —</option>'; return; }
  const puestoInfo = cfg.puestos.find(p => p.id === cargo);
  if(!puestoInfo || !puestoInfo.reportaA) { repSelect.innerHTML='<option value="">— Máximo Nivel (Nadie a quien reportar) —</option>'; return; }
  const parentRolId = puestoInfo.reportaA;
  const posiblesJefes = allUsers.filter(u => u.rol === parentRolId);
  let rHtml = '<option value="">— Selecciona a quién le reporta —</option>';
  if(posiblesJefes.length === 0){ rHtml += '<option value="">(No hay usuarios con el rol requerido en el sistema)</option>'; }
  else { posiblesJefes.forEach(jefe => { rHtml += `<option value="${jefe.uid}">${jefe.nombre} (${jefe.pais || 'Global'})</option>`; }); }
  repSelect.innerHTML = rHtml;
}

window.populateReportaA=()=>{}

// Mapea cargo + área → rol legacy (compatibilidad con getSubordinateUids)
function deriveRolLegacy(cargo, area, reportaA, nivel=99) {
  if (area !== 'Comercial') {
     if(nivel <= 2) return 'dir_admin';
     if(nivel === 3) return 'gerente_admin';
     if(nivel === 4) return 'jefe_admin';
     return 'admin';
  } else {
     if(nivel <= 2) return 'director';
     if(nivel === 3) return 'regional';
     if(nivel === 4) return 'zona';
     return 'sucursal';
  }
}


window.saveUser=async()=>{
  const nombre=document.getElementById('uNombre').value.trim();
  const email=document.getElementById('uEmail').value.trim();
  const pais=document.getElementById('uPais')?.value||'';
  const area=document.getElementById('uArea')?.value||'';
  const cargo=document.getElementById('uCargo')?.value.trim()||'';
  const reportaA=document.getElementById('uReportaA')?.value||'';
  const esRhGlobal=document.getElementById('uEsRhGlobal')?.checked||false;

  // Validaciones
  if(!nombre||!email){showErr('userErrMsg','Completa el nombre y correo del usuario.');return;}
  if(!pais||!area){showErr('userErrMsg','Selecciona el país y el área.');return;}
  if(!cargo){showErr('userErrMsg','Escribe el cargo o puesto.');return;}

  // Derivar rol legacy para compatibilidad con acceso control
  const nivel = parseInt(document.getElementById('uCargo').dataset.nivel || '99', 10);
  const rolLegacy=esRhGlobal?'rh_global':deriveRolLegacy(cargo,area,reportaA, nivel);

  // Generar contraseña aleatoria de 16 caracteres
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pass='';
  for(let i=0;i<16;i++) pass+=chars.charAt(Math.floor(Math.random()*chars.length));

  // Animación de carga en el botón
  const btnCrear=document.getElementById('btnCrearUsuario');
  const spinnerHTML='<span style="display:inline-flex;align-items:center;gap:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 0.8s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Creando...</span>';
  if(btnCrear){btnCrear.disabled=true;btnCrear.innerHTML=spinnerHTML;}

  let secondaryApp=null;
  let createdUid=null;
  try{
    secondaryApp=initializeApp(firebaseConfig,'secondary_'+Date.now());
    const secondaryAuth=getAuth(secondaryApp);

    // 1. Crear cuenta en Firebase Auth
    const cred=await createUserWithEmailAndPassword(secondaryAuth,email,pass);
    createdUid=cred.user.uid;

    // 2. Guardar perfil usando la db principal (Monica está autenticada)
    //    Si falla por reglas, intentar con db del nuevo usuario
    const profile={
      nombre,email,cargo,
      area:esRhGlobal?'rh_global':area,
      pais:esRhGlobal?'Global':(pais||''),
      esRhGlobal,rol:rolLegacy,reportaA
    };
    let writeOk=false;
    try{
      await setDoc(doc(db,'users',createdUid),profile);
      writeOk=true;
    }catch(writeErr){
      console.warn('Write con db primario falló, intentando con db secundario:',writeErr.code);
      const secondaryDb=getFirestore(secondaryApp);
      await setDoc(doc(secondaryDb,'users',createdUid),profile);
      writeOk=true;
    }

    // 3. Enviar reset de contraseña
    try{await sendPasswordResetEmail(secondaryAuth,email);}catch(_){}

    // 4. Cerrar sesión secundaria (fire-and-forget, no bloquea)
    signOut(secondaryAuth).catch(()=>{});
    deleteApp(secondaryApp).catch(()=>{});
    secondaryApp=null;

    if(writeOk){
      allUsers.push({uid:createdUid,...profile});
      closeUserModal();
      loadUsers();
      showToast(`Usuario "${nombre}" creado. Se enviará un correo para configurar la contraseña.`);
      sendEmailNotification(
        email,'¡Bienvenido a Ferco Planes de Fortalecimiento!',
        `<p>Hola ${nombre},</p><p>Tu cuenta ha sido creada con el cargo de <b>${cargo}</b> en el área de <b>${area}</b>.</p><p>Has recibido otro correo oficial para configurar tu contraseña.</p><p>Saludos,<br>El equipo de Recursos Humanos</p>`
      ).catch(()=>{});
    }

  }catch(e){
    console.error('Error creando usuario:',e);
    if(e.code==='auth/email-already-in-use'){
      showErr('userErrMsg','Este correo ya está registrado. Usa un correo diferente.');
    }else if(e.code==='auth/invalid-email'){
      showErr('userErrMsg','El correo no tiene un formato válido.');
    }else if(e.code==='auth/network-request-failed'){
      showErr('userErrMsg','Error de red. Verifica tu conexión e inténtalo de nuevo.');
    }else{
      showErr('userErrMsg',`Error (${e.code||e.message||'desconocido'}). Intenta de nuevo.`);
    }
  }finally{
    // Siempre restaurar el botón y limpiar la app secundaria
    if(secondaryApp){deleteApp(secondaryApp).catch(()=>{});}
    if(btnCrear){btnCrear.disabled=false;btnCrear.innerHTML='Crear usuario';}
  }
};

window.resetUserPassword=async(email,nombre)=>{
  if(!confirm(`¿Enviar correo de reestablecimiento de contraseña a ${email}?`)) return;
  try{
    await sendPasswordResetEmail(auth,email);
    showToast(`📧 Correo enviado a ${email}`);
  }catch(e){
    console.error('Error al resetear contraseña:', e);
    alert('No se pudo enviar el correo de restablecimiento. Inténtalo de nuevo.');
  }
};

function showToast(msg,duration=3500){
  let t=document.getElementById('toastEl');
  if(!t){t=document.createElement('div');t.id='toastEl';
    t.style.cssText='position:fixed;bottom:24px;right:24px;background:var(--foreground);color:#fff;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.25);transition:opacity .3s;pointer-events:none';
    document.body.appendChild(t);}
  t.textContent=msg;t.style.opacity='1';
  clearTimeout(t._to);t._to=setTimeout(()=>{t.style.opacity='0';},duration);
}

// ── UNO A UNO ─────────────────────────────────────────────────────────────────

// Indicadores numéricos (orden canónico)
const UAU_INDS=['metaUtilidad','utilidadGenerada','montoCotizado','facturacion',
  'clientesAtendidos','cotizaciones','facturas','oport2_5K_mas','oport2_5K_menos',
  'totalOportSF','oportunidadesPerdidas'];

const UAU_IND_LABELS={
  metaUtilidad:'Meta de Utilidad ($)',
  utilidadGenerada:'Utilidad Generada ($)',
  montoCotizado:'Monto Cotizado ($)',
  facturacion:'Facturación ($)',
  clientesAtendidos:'Clientes Atendidos',
  cotizaciones:'Cotizaciones',
  facturas:'Facturas',
  oport2_5K_mas:'Oportunidades > $2.5K',
  oport2_5K_menos:'Oportunidades < $2.5K',
  totalOportSF:'Total Oport. Abiertas en SF',
  oportunidadesPerdidas:'Oportunidades Perdidas'
};

let uauData={};
let uauTab=0;
let uauChartInstances={};
let uauSegData={};
let uauSegTab=0;

function getSucursalesForUser(){
  const pais=(userProfile.pais||'').toLowerCase();
  if(pais.startsWith('hon')||pais==='hn') return HN_SUCS||[];
  if(pais.startsWith('el sal')||pais==='sv') return SV_SUCS||[];
  if(pais.startsWith('m\xe9x')||pais.startsWith('mex')||pais==='mx') return MX_SUCS||[];
  if(pais.startsWith('guat')||pais==='gt'){
    const all=[];
    Object.values(GT_DATA||{}).forEach(reg=>Object.values(reg).forEach(sucs=>all.push(...sucs)));
    return [...new Set(all)].sort();
  }
  return [];
}

window.openUnoAUnoForm=()=>{
  uauData={semana:getISOWeek(),año:new Date().getFullYear()};
  uauTab=0;
  document.querySelectorAll('#uauTabs .mtab').forEach((t,i)=>t.classList.toggle('active',i===0));
  renderUauTab(0);
  updateUauNav();
  hideErr('uauErrMsg');
  document.getElementById('uauModalOverlay').classList.add('open');
};

window.closeUauModal=()=>{
  document.getElementById('uauModalOverlay').classList.remove('open');
  uauData={};
};

window.goUauTab=(t,el)=>{
  saveUauTabData();
  uauTab=t;
  renderUauTab(t);
  document.querySelectorAll('#uauTabs .mtab').forEach(mt=>mt.classList.remove('active'));
  if(el) el.classList.add('active');
  updateUauNav();
  hideErr('uauErrMsg');
};

window.nextUauTab=()=>{
  if(!validateUauTab()) return;
  saveUauTabData();
  const next=uauTab+1;
  if(next>2) return;
  uauTab=next;
  document.querySelectorAll('#uauTabs .mtab').forEach((t,i)=>t.classList.toggle('active',i===uauTab));
  renderUauTab(uauTab);
  updateUauNav();
  hideErr('uauErrMsg');
};

window.prevUauTab=()=>{
  saveUauTabData();
  const prev=uauTab-1;
  if(prev<0) return;
  uauTab=prev;
  document.querySelectorAll('#uauTabs .mtab').forEach((t,i)=>t.classList.toggle('active',i===uauTab));
  renderUauTab(uauTab);
  updateUauNav();
  hideErr('uauErrMsg');
};

function updateUauNav(){
  const prev=document.getElementById('uauBtnPrev');
  const next=document.getElementById('uauBtnNext');
  const save=document.getElementById('uauBtnSave');
  if(prev) prev.style.display=uauTab>0?'':'none';
  if(next) next.style.display=uauTab<2?'':'none';
  if(save) save.style.display=uauTab===2?'':'none';
}

function validateUauTab(){
  if(uauTab===0){
    const asesor=document.getElementById('uauAsesor')?.value.trim();
    const semana=document.getElementById('uauSemana')?.value;
    const sucursal=document.getElementById('uauSucursal')?.value;
    if(!asesor){showErr('uauErrMsg','Ingresa el nombre del asesor.');return false;}
    if(!semana){showErr('uauErrMsg','Ingresa el número de semana.');return false;}
    if(!sucursal){showErr('uauErrMsg','Selecciona una sucursal.');return false;}
  }
  return true;
}

function saveUauTabData(){
  if(uauTab===0){
    uauData.asesor=document.getElementById('uauAsesor')?.value.trim()||'';
    uauData.semana=parseInt(document.getElementById('uauSemana')?.value)||getISOWeek();
    uauData.año=parseInt(document.getElementById('uauAño')?.value)||new Date().getFullYear();
    uauData.sucursal=document.getElementById('uauSucursal')?.value||'';
  } else if(uauTab===1){
    const inds={};
    UAU_INDS.forEach(k=>{
      const v=parseFloat(document.getElementById('uau_'+k)?.value)||0;
      inds[k]=v;
    });
    uauData.indicadores=inds;
  } else if(uauTab===2){
    uauData.resumen=document.getElementById('uauResumen')?.value.trim()||'';
    uauData.compromisosAsesor=document.getElementById('uauCompAsesor')?.value.trim()||'';
    uauData.compromisosGerente=document.getElementById('uauCompGerente')?.value.trim()||'';
  }
}

function renderUauTab(t){
  const c=document.getElementById('uauTabContent');
  if(!c) return;
  if(t===0){
    const sucs=getSucursalesForUser();
    const sucsOpts=sucs.map(s=>`<option value="${escHtml(s)}"${uauData.sucursal===s?' selected':''}>${escHtml(s)}</option>`).join('');
    c.innerHTML=`<div class="form-grid">
      <div class="form-group" style="grid-column:1/-1"><label>Nombre del Asesor *</label>
        <input type="text" id="uauAsesor" placeholder="Nombre completo" value="${escHtml(uauData.asesor||'')}"></div>
      <div class="form-group"><label>Número de Semana *</label>
        <input type="number" id="uauSemana" min="1" max="53" value="${uauData.semana||getISOWeek()}"></div>
      <div class="form-group"><label>Año</label>
        <input type="number" id="uauAño" min="2020" max="2099" value="${uauData.año||new Date().getFullYear()}"></div>
      <div class="form-group" style="grid-column:1/-1"><label>Sucursal *</label>
        <select id="uauSucursal"><option value="">— Selecciona —</option>${sucsOpts}</select></div>
    </div>`;
  } else if(t===1){
    const inds=uauData.indicadores||{};
    const pptVal=inds.metaUtilidad>0?((inds.utilidadGenerada||0)/(inds.metaUtilidad)*100).toFixed(1):'—';
    const mcVal=inds.montoCotizado>0?((inds.facturacion||0)/(inds.montoCotizado)*100).toFixed(1):'—';
    const sym=getCurrSymbol(userProfile.pais);
    const dynLbl=k=>UAU_IND_LABELS[k].replace('($)',`(${sym})`);
    c.innerHTML=`<div class="uau-ind-grid">
      ${UAU_INDS.map(k=>`
      <div class="form-group">
        <label>${dynLbl(k)}</label>
        <input type="number" id="uau_${k}" min="0" step="any" value="${inds[k]||0}"
          oninput="calcUauPPT();calcUauMC()">
      </div>`).join('')}
      <div class="form-group uau-calc-field">
        <label>% PPT <span style="font-weight:400;font-size:9px;opacity:.7;display:block;margin-top:1px">Utilidad Generada ÷ Meta Utilidad × 100</span></label>
        <div class="uau-calc-val" id="uauPPTVal">${pptVal !== '—' ? pptVal+'%' : '—'}</div>
      </div>
      <div class="form-group uau-calc-field">
        <label>Tasa de Conversión % <span style="font-weight:400;font-size:9px;opacity:.7;display:block;margin-top:1px">Facturación ÷ Monto Cotizado × 100</span></label>
        <div class="uau-calc-val" id="uauMCVal">${mcVal !== '—' ? mcVal+'%' : '—'}</div>
      </div>
    </div>`;
  } else if(t===2){
    c.innerHTML=`<div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group"><label>Resumen del Uno a Uno / Causas</label>
        <textarea id="uauResumen" rows="4" style="width:100%">${escHtml(uauData.resumen||'')}</textarea></div>
      <div class="form-group"><label>Compromisos del Asesor</label>
        <textarea id="uauCompAsesor" rows="4" style="width:100%">${escHtml(uauData.compromisosAsesor||'')}</textarea></div>
      <div class="form-group"><label>Compromisos / Despeje de Caminos del Gerente</label>
        <textarea id="uauCompGerente" rows="4" style="width:100%">${escHtml(uauData.compromisosGerente||'')}</textarea></div>
    </div>`;
  }
}

window.calcUauPPT=()=>{
  const meta=parseFloat(document.getElementById('uau_metaUtilidad')?.value)||0;
  const util=parseFloat(document.getElementById('uau_utilidadGenerada')?.value)||0;
  const el=document.getElementById('uauPPTVal');
  if(el) el.textContent=meta>0?(util/meta*100).toFixed(1)+'%':'—';
};

window.calcUauMC=()=>{
  const cot=parseFloat(document.getElementById('uau_montoCotizado')?.value)||0;
  const fac=parseFloat(document.getElementById('uau_facturacion')?.value)||0;
  const el=document.getElementById('uauMCVal');
  if(el) el.textContent=cot>0?(fac/cot*100).toFixed(1)+'%':'—';
};

window.saveUnoAUno=async()=>{
  if(!validateUauTab()) return;
  saveUauTabData();
  if(!uauData.asesor){showErr('uauErrMsg','Completa los datos del asesor.');return;}
  try{
    const payload={
      tipo:'unoauno',
      asesor:uauData.asesor,
      semana:uauData.semana,
      año:uauData.año,
      sucursal:uauData.sucursal,
      pais:userProfile.pais||'',
      region:userProfile.region||'',
      zona:userProfile.zona||'',
      lider:userProfile.nombre||'',
      liderUid:currentUser.uid,
      creadoPor:currentUser.uid,
      indicadores:uauData.indicadores||{},
      resumen:uauData.resumen||'',
      compromisosAsesor:uauData.compromisosAsesor||'',
      compromisosGerente:uauData.compromisosGerente||'',
      estado:'En curso',
      seguimientos:[],
      archivos:[],
      comentarios:[],
      creadoEn:serverTimestamp()
    };
    await addDoc(collection(db,'unoauno'),payload);
    closeUauModal();
    currentSubView='mis';
    await loadPlanes();
    renderAll();
    showToast('Uno a Uno creado. Haz clic en la tarjeta para abrirlo.');
  }catch(e){
    console.error('Error guardando UAU:', e);
    showErr('uauErrMsg','No se pudo guardar el Uno a Uno. Por favor, inténtalo de nuevo.');
  }
};

// ── UAU SEGUIMIENTO ────────────────────────────────────────────────────────────
window.openUauSeg=()=>{
  uauSegData={semana:getISOWeek(),año:new Date().getFullYear()};
  uauSegTab=0;
  document.querySelectorAll('#uauSegTabs .mtab').forEach((t,i)=>t.classList.toggle('active',i===0));
  renderUauSegTab(0);
  hideErr('uauSegErrMsg');
  document.getElementById('uauSegOverlay').classList.add('open');
};

window.closeUauSeg=()=>{
  document.getElementById('uauSegOverlay').classList.remove('open');
  uauSegData={};
};

window.goUauSegTab=(t,el)=>{
  saveUauSegTabData();
  uauSegTab=t;
  renderUauSegTab(t);
  document.querySelectorAll('#uauSegTabs .mtab').forEach(mt=>mt.classList.remove('active'));
  if(el) el.classList.add('active');
  hideErr('uauSegErrMsg');
};

function saveUauSegTabData(){
  if(uauSegTab===0){
    const inds={};
    UAU_INDS.forEach(k=>{
      const v=parseFloat(document.getElementById('uauSeg_'+k)?.value)||0;
      inds[k]=v;
    });
    uauSegData.indicadores=inds;
    uauSegData.semana=parseInt(document.getElementById('uauSegSemana')?.value)||getISOWeek();
    uauSegData.año=parseInt(document.getElementById('uauSegAño')?.value)||new Date().getFullYear();
  } else if(uauSegTab===1){
    uauSegData.resumen=document.getElementById('uauSegResumen')?.value.trim()||'';
    uauSegData.compromisosAsesor=document.getElementById('uauSegCompAsesor')?.value.trim()||'';
    uauSegData.compromisosGerente=document.getElementById('uauSegCompGerente')?.value.trim()||'';
  }
}

function renderUauSegTab(t){
  const c=document.getElementById('uauSegTabContent');
  if(!c) return;
  if(t===0){
    const inds=uauSegData.indicadores||{};
    c.innerHTML=`<div class="uau-ind-grid" style="padding:4px 0">
      <div class="form-group" style="grid-column:1/-1;display:flex;gap:12px">
        <div style="flex:1"><label>Semana</label>
          <input type="number" id="uauSegSemana" min="1" max="53" value="${uauSegData.semana||getISOWeek()}"></div>
        <div style="flex:1"><label>Año</label>
          <input type="number" id="uauSegAño" min="2020" max="2099" value="${uauSegData.año||new Date().getFullYear()}"></div>
      </div>
      ${(()=>{const sym=getCurrSymbol(activePlanData?.pais||userProfile.pais);const dl=k=>UAU_IND_LABELS[k].replace('($)',`(${sym})`);return UAU_INDS.map(k=>`
      <div class="form-group">
        <label>${dl(k)}</label>
        <input type="number" id="uauSeg_${k}" min="0" step="any" value="${inds[k]||0}"
          oninput="calcSegUauPPT();calcSegUauMC()">
      </div>`).join('');})()}
      <div class="form-group uau-calc-field">
        <label>% PPT <span style="font-weight:400;font-size:9px;opacity:.7;display:block;margin-top:1px">Utilidad Generada ÷ Meta Utilidad × 100</span></label>
        <div class="uau-calc-val" id="uauSegPPTVal">—</div>
      </div>
      <div class="form-group uau-calc-field">
        <label>Tasa de Conversión % <span style="font-weight:400;font-size:9px;opacity:.7;display:block;margin-top:1px">Facturación ÷ Monto Cotizado × 100</span></label>
        <div class="uau-calc-val" id="uauSegMCVal">—</div>
      </div>
    </div>`;
  } else if(t===1){
    c.innerHTML=`<div style="display:flex;flex-direction:column;gap:14px;padding:4px 0">
      <div class="form-group"><label>Resumen del Uno a Uno / Causas</label>
        <textarea id="uauSegResumen" rows="3" style="width:100%">${escHtml(uauSegData.resumen||'')}</textarea></div>
      <div class="form-group"><label>Compromisos del Asesor</label>
        <textarea id="uauSegCompAsesor" rows="3" style="width:100%">${escHtml(uauSegData.compromisosAsesor||'')}</textarea></div>
      <div class="form-group"><label>Compromisos / Despeje de Caminos del Gerente</label>
        <textarea id="uauSegCompGerente" rows="3" style="width:100%">${escHtml(uauSegData.compromisosGerente||'')}</textarea></div>
    </div>`;
  }
}

window.calcSegUauPPT=()=>{
  const meta=parseFloat(document.getElementById('uauSeg_metaUtilidad')?.value)||0;
  const util=parseFloat(document.getElementById('uauSeg_utilidadGenerada')?.value)||0;
  const el=document.getElementById('uauSegPPTVal');
  if(el) el.textContent=meta>0?(util/meta*100).toFixed(1)+'%':'—';
};

window.calcSegUauMC=()=>{
  const cot=parseFloat(document.getElementById('uauSeg_montoCotizado')?.value)||0;
  const fac=parseFloat(document.getElementById('uauSeg_facturacion')?.value)||0;
  const el=document.getElementById('uauSegMCVal');
  if(el) el.textContent=cot>0?(fac/cot*100).toFixed(1)+'%':'—';
};

window.saveUauSeg=async()=>{
  saveUauSegTabData();
  if(!uauSegData.semana){showErr('uauSegErrMsg','Ingresa el número de semana.');return;}
  try{
    const seg={
      semana:uauSegData.semana,
      año:uauSegData.año||new Date().getFullYear(),
      indicadores:uauSegData.indicadores||{},
      resumen:uauSegData.resumen||'',
      compromisosAsesor:uauSegData.compromisosAsesor||'',
      compromisosGerente:uauSegData.compromisosGerente||'',
      fecha:nowStr(),
      autor:userProfile.nombre||'',
      archivos:[]
    };
    const segs=[...(activePlanData.seguimientos||[]),seg];
    const uauUpdates={seguimientos:segs,estado:'En seguimiento'};
    await updateDoc(doc(db,'unoauno',activePlanId),uauUpdates);
    Object.assign(activePlanData,uauUpdates);
    const idx=allPlanes.findIndex(x=>x.id===activePlanId);
    if(idx>=0) Object.assign(allPlanes[idx],uauUpdates);
    closeUauSeg();
    showToast('✅ Seguimiento guardado correctamente.');
    setDetailTab('graficas',null,1);
    renderUauCharts(activePlanData);
  }catch(e){
    console.error('Error guardando seguimiento UAU:', e);
    showErr('uauSegErrMsg','No se pudo guardar el seguimiento. Inténtalo de nuevo.');
  }
};

// ── GRÁFICAS UNO A UNO ────────────────────────────────────────────────────────
function buildChartData(p){
  const entries=[{semana:p.semana,año:p.año,...(p.indicadores||{})}];
  for(const seg of p.seguimientos||[]){
    entries.push({semana:seg.semana,año:seg.año,...(seg.indicadores||{})});
  }
  return entries.sort((a,b)=>a.año!==b.año?a.año-b.año:a.semana-b.semana);
}

// Genera tabla comparativa anterior vs actual para un seguimiento
function buildSegCompTable(prev, curr, pais){
  const sym=getCurrSymbol(pais);
  const MFLDS=['metaUtilidad','utilidadGenerada','montoCotizado','facturacion'];
  const fmtM=n=>sym+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});
  const lbl={...UAU_IND_LABELS,ppt:'% PPT',margenConversion:'Tasa de Conversión %'};
  Object.keys(lbl).forEach(k=>{lbl[k]=lbl[k].replace('($)',`(${sym})`);});
  const allF=[...UAU_INDS,'ppt','margenConversion'];
  const rows=allF.map(k=>{
    let pV,cV,diffStr,isPos;
    if(k==='ppt'){
      const pm=prev.metaUtilidad||0;pV=pm>0?(prev.utilidadGenerada||0)/pm*100:0;
      const cm=curr.metaUtilidad||0;cV=cm>0?(curr.utilidadGenerada||0)/cm*100:0;
      const d=cV-pV;isPos=d>=0;diffStr=(d>=0?'▲ +':'▼ ')+Math.abs(d).toFixed(1)+' pts';
      return `<tr><td class="cmp-lbl">${lbl[k]}</td><td>${pV.toFixed(1)}%</td><td>${cV.toFixed(1)}%</td><td class="${isPos?'cmp-pos':'cmp-neg'}">${diffStr}</td></tr>`;
    } else if(k==='margenConversion'){
      const pc=prev.montoCotizado||0;pV=pc>0?(prev.facturacion||0)/pc*100:0;
      const cc=curr.montoCotizado||0;cV=cc>0?(curr.facturacion||0)/cc*100:0;
      const d=cV-pV;isPos=d>=0;diffStr=(d>=0?'▲ +':'▼ ')+Math.abs(d).toFixed(1)+' pts';
      return `<tr><td class="cmp-lbl">${lbl[k]}</td><td>${pV.toFixed(1)}%</td><td>${cV.toFixed(1)}%</td><td class="${isPos?'cmp-pos':'cmp-neg'}">${diffStr}</td></tr>`;
    } else {
      pV=prev[k]||0;cV=curr[k]||0;const d=cV-pV;isPos=d>=0;
      const isMon=MFLDS.includes(k);
      const fv=v=>isMon?fmtM(v):Number(v||0).toLocaleString('en-US');
      const fd=v=>isMon?sym+Math.abs(v).toLocaleString('en-US'):Math.abs(v).toLocaleString('en-US');
      diffStr=(d>=0?'▲ +':'▼ ')+fd(d);
      return `<tr><td class="cmp-lbl">${lbl[k]}</td><td>${fv(pV)}</td><td>${fv(cV)}</td><td class="${isPos?'cmp-pos':'cmp-neg'}">${diffStr}</td></tr>`;
    }
  }).join('');
  return `<div class="seg-cmp"><table>
    <thead><tr><th>Indicador</th><th>S${prev.semana} ${prev.año} (anterior)</th><th>S${curr.semana} ${curr.año} (actual)</th><th>Diferencia</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function renderUauCharts(p){
  const container=document.getElementById('chartGrid');
  if(!container) return;

  // Destruir instancias previas
  Object.values(uauChartInstances).forEach(ch=>{try{ch.destroy();}catch(e){}});
  uauChartInstances={};

  const entries=buildChartData(p);
  if(entries.length<1){container.innerHTML='<p style="color:var(--muted);padding:16px">Aún no hay datos históricos suficientes.</p>';return;}

  const labels=entries.map(e=>`S${e.semana} ${e.año}`);
  const allFields=[...UAU_INDS,'ppt','margenConversion'];
  const sym=getCurrSymbol(p.pais);
  const fieldLabels={...UAU_IND_LABELS,ppt:'% PPT',margenConversion:'Tasa de Conversión %'};
  Object.keys(fieldLabels).forEach(k=>{fieldLabels[k]=fieldLabels[k].replace('($)',`(${sym})`);});

  container.innerHTML=allFields.map(k=>`
    <div class="chart-card" style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:16px">
      <h4 style="font-size:12px;font-weight:700;color:var(--dark);margin-bottom:12px">${fieldLabels[k]||k}</h4>
      <div style="position:relative;height:160px"><canvas id="chart_${k}"></canvas></div>
    </div>`).join('');

  allFields.forEach(k=>{
    const vals=entries.map(e=>{
      if(k==='ppt'){const m=e.metaUtilidad||0;return m>0?parseFloat(((e.utilidadGenerada||0)/m*100).toFixed(2)):null;}
      if(k==='margenConversion'){const c=e.montoCotizado||0;return c>0?parseFloat(((e.facturacion||0)/c*100).toFixed(2)):null;}
      return e[k]??null;
    });
    const canvas=document.getElementById('chart_'+k);
    if(!canvas) return;
    try{
      uauChartInstances[k]=new Chart(canvas,{
        type:'line',
        data:{
          labels,
          datasets:[{
            label:fieldLabels[k]||k,
            data:vals,
            borderColor:'var(--primary)',
            backgroundColor:'rgba(245,158,11,0.12)',
            borderWidth:2.5,
            pointBackgroundColor:'var(--primary)',
            pointRadius:5,
            tension:0.35,
            fill:true,
            spanGaps:true
          }]
        },
        options:{
          responsive:true,maintainAspectRatio:false,
          plugins:{legend:{display:false}},
          scales:{x:{ticks:{font:{size:10}}},y:{ticks:{font:{size:10}},beginAtZero:false}}
        }
      });
    }catch(ex){console.warn('chart error',k,ex);}
  });
}

// ── PDF UNO A UNO ─────────────────────────────────────────────────────────────
function buildUauPrintDoc(p){
  const entries=buildChartData(p);
  const fmtN=n=>(n||0).toLocaleString('es',{minimumFractionDigits:0,maximumFractionDigits:2});

  // Tabla de indicadores por semana
  const indHeaders=`<tr><th>Indicador</th>${entries.map(e=>`<th>S${e.semana} ${e.año}</th>`).join('')}</tr>`;
  const allFieldsPrint=[...UAU_INDS,'ppt','margenConversion'];
  const symPrint=getCurrSymbol(p.pais);
  const fieldLabelsPrint={...UAU_IND_LABELS,ppt:'% PPT',margenConversion:'Tasa de Conversión %'};
  Object.keys(fieldLabelsPrint).forEach(k=>{fieldLabelsPrint[k]=fieldLabelsPrint[k].replace('($)',`(${symPrint})`);});
  const indRows=allFieldsPrint.map(k=>{
    const cells=entries.map(e=>{
      let v;
      if(k==='ppt'){const m=e.metaUtilidad||0;v=m>0?((e.utilidadGenerada||0)/m*100).toFixed(1)+'%':'—';}
      else if(k==='margenConversion'){const c=e.montoCotizado||0;v=c>0?((e.facturacion||0)/c*100).toFixed(1)+'%':'—';}
      else v=fmtN(e[k]);
      return `<td>${v}</td>`;
    }).join('');
    return `<tr><td style="font-weight:600;background:#fffbeb">${fieldLabelsPrint[k]||k}</td>${cells}</tr>`;
  }).join('');

  // Tabla comparativa Avances (semana anterior vs actual)
  const sym=getCurrSymbol(p.pais);
  const MFLDS=['metaUtilidad','utilidadGenerada','montoCotizado','facturacion'];
  const fmtM=n=>sym+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});
  let avancesHtml='';
  if(entries.length>=2){
    const prev=entries[entries.length-2];
    const curr=entries[entries.length-1];
    const lblAv={...UAU_IND_LABELS,ppt:'% PPT',margenConversion:'Tasa de Conversión %'};
    Object.keys(lblAv).forEach(k=>{lblAv[k]=lblAv[k].replace('($)',`(${sym})`);});
    const allFAv=[...UAU_INDS,'ppt','margenConversion'];
    const avRows=allFAv.map(k=>{
      let pV,cV,diffStr,pos;
      if(k==='ppt'){
        const pm=prev.metaUtilidad||0;pV=pm>0?((prev.utilidadGenerada||0)/pm*100):0;
        const cm=curr.metaUtilidad||0;cV=cm>0?((curr.utilidadGenerada||0)/cm*100):0;
        const d=cV-pV;pos=d>=0;diffStr=(d>=0?'▲ +':'▼ ')+Math.abs(d).toFixed(1)+' pts';
        return `<tr><td style="font-weight:600;background:#fffbeb;padding:4px 8px">${lblAv[k]}</td><td style="padding:4px 8px;text-align:right">${pV.toFixed(1)}%</td><td style="padding:4px 8px;text-align:right">${cV.toFixed(1)}%</td><td style="padding:4px 8px;text-align:right;font-weight:700;color:${pos?'#166534':'#991b1b'}">${diffStr}</td></tr>`;
      } else if(k==='margenConversion'){
        const pc=prev.montoCotizado||0;pV=pc>0?((prev.facturacion||0)/pc*100):0;
        const cc=curr.montoCotizado||0;cV=cc>0?((curr.facturacion||0)/cc*100):0;
        const d=cV-pV;pos=d>=0;diffStr=(d>=0?'▲ +':'▼ ')+Math.abs(d).toFixed(1)+' pts';
        return `<tr><td style="font-weight:600;background:#fffbeb;padding:4px 8px">${lblAv[k]}</td><td style="padding:4px 8px;text-align:right">${pV.toFixed(1)}%</td><td style="padding:4px 8px;text-align:right">${cV.toFixed(1)}%</td><td style="padding:4px 8px;text-align:right;font-weight:700;color:${pos?'#166534':'#991b1b'}">${diffStr}</td></tr>`;
      } else {
        pV=prev[k]||0;cV=curr[k]||0;const d=cV-pV;pos=d>=0;
        const isMon=MFLDS.includes(k);
        const fv=v=>isMon?fmtM(v):Number(v).toLocaleString('en-US');
        const fd=v=>isMon?sym+Math.abs(v).toLocaleString('en-US'):Math.abs(v).toLocaleString('en-US');
        diffStr=(d>=0?'▲ +':'▼ ')+fd(d);
        return `<tr><td style="font-weight:600;background:#fffbeb;padding:4px 8px">${lblAv[k]}</td><td style="padding:4px 8px;text-align:right">${fv(pV)}</td><td style="padding:4px 8px;text-align:right">${fv(cV)}</td><td style="padding:4px 8px;text-align:right;font-weight:700;color:${pos?'#166534':'#991b1b'}">${diffStr}</td></tr>`;
      }
    }).join('');
    avancesHtml=`<div style="margin-top:24px"><h3 style="font-size:13px;font-weight:800;color:var(--foreground);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">Avances — S${prev.semana} ${prev.año} → S${curr.semana} ${curr.año}</h3><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:9px"><thead style="background:var(--foreground);color:#fff"><tr><th style="padding:6px 8px;text-align:left">Indicador</th><th style="padding:6px 8px;text-align:right">S${prev.semana} ${prev.año}</th><th style="padding:6px 8px;text-align:right">S${curr.semana} ${curr.año}</th><th style="padding:6px 8px;text-align:right">Avances</th></tr></thead><tbody>${avRows}</tbody></table></div></div>`;
  }

  // Seguimientos con comparativa completa por semana
  const segsHtml=(()=>{
    const pSegs=(p.seguimientos||[]);
    if(!pSegs.length) return '';
    const sortedS=[...pSegs].sort((a,b)=>a.año!==b.año?a.año-b.año:a.semana-b.semana);
    const baseE={semana:p.semana,año:p.año,...(p.indicadores||{})};
    const allE=[baseE,...sortedS.map(s=>({semana:s.semana,año:s.año,...(s.indicadores||{})}))];
    return sortedS.map((seg,i)=>{
      const prev=allE[i],curr=allE[i+1];
      const allFSeg=[...UAU_INDS,'ppt','margenConversion'];
      const MFLDS2=['metaUtilidad','utilidadGenerada','montoCotizado','facturacion'];
      const fmtM2=n=>sym+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});
      const segRows=allFSeg.map(k=>{
        let pV,cV,diffStr,isPos;
        if(k==='ppt'){
          const pm=prev.metaUtilidad||0;pV=pm>0?(prev.utilidadGenerada||0)/pm*100:0;
          const cm=curr.metaUtilidad||0;cV=cm>0?(curr.utilidadGenerada||0)/cm*100:0;
          const d=cV-pV;isPos=d>=0;diffStr=(d>=0?'▲ +':'▼ ')+Math.abs(d).toFixed(1)+' pts';
          return `<tr><td style="font-weight:700;background:#fffbeb;padding:4px 7px;font-size:8px">${fieldLabelsPrint[k]||k}</td><td style="text-align:right;padding:4px 7px;font-size:8px">${pV.toFixed(1)}%</td><td style="text-align:right;padding:4px 7px;font-size:8px">${cV.toFixed(1)}%</td><td style="text-align:right;padding:4px 7px;font-size:8px;font-weight:700;color:${isPos?'#166534':'#991b1b'}">${diffStr}</td></tr>`;
        } else if(k==='margenConversion'){
          const pc=prev.montoCotizado||0;pV=pc>0?(prev.facturacion||0)/pc*100:0;
          const cc=curr.montoCotizado||0;cV=cc>0?(curr.facturacion||0)/cc*100:0;
          const d=cV-pV;isPos=d>=0;diffStr=(d>=0?'▲ +':'▼ ')+Math.abs(d).toFixed(1)+' pts';
          return `<tr><td style="font-weight:700;background:#fffbeb;padding:4px 7px;font-size:8px">${fieldLabelsPrint[k]||k}</td><td style="text-align:right;padding:4px 7px;font-size:8px">${pV.toFixed(1)}%</td><td style="text-align:right;padding:4px 7px;font-size:8px">${cV.toFixed(1)}%</td><td style="text-align:right;padding:4px 7px;font-size:8px;font-weight:700;color:${isPos?'#166534':'#991b1b'}">${diffStr}</td></tr>`;
        } else {
          pV=prev[k]||0;cV=curr[k]||0;const d=cV-pV;isPos=d>=0;
          const isMon=MFLDS2.includes(k);
          const fv=v=>isMon?fmtM2(v):Number(v||0).toLocaleString('en-US');
          const fd=v=>isMon?sym+Math.abs(v).toLocaleString('en-US'):Math.abs(v).toLocaleString('en-US');
          diffStr=(d>=0?'▲ +':'▼ ')+fd(d);
          return `<tr><td style="font-weight:700;background:#fffbeb;padding:4px 7px;font-size:8px">${fieldLabelsPrint[k]||k}</td><td style="text-align:right;padding:4px 7px;font-size:8px">${fv(pV)}</td><td style="text-align:right;padding:4px 7px;font-size:8px">${fv(cV)}</td><td style="text-align:right;padding:4px 7px;font-size:8px;font-weight:700;color:${isPos?'#166534':'#991b1b'}">${diffStr}</td></tr>`;
        }
      }).join('');
      return `<div style="border:1px solid #fde68a;border-radius:8px;padding:12px;margin-bottom:12px;background:#fffbeb;page-break-inside:avoid">
        <p style="font-size:10px;font-weight:800;color:#92400e;margin-bottom:8px">📋 Seguimiento S${seg.semana} ${seg.año} · ${seg.fecha||''} · Por: ${seg.autor||'—'}</p>
        <div style="overflow-x:auto;margin-bottom:8px">
          <table style="width:100%;border-collapse:collapse">
            <thead style="background:var(--foreground);color:#fff">
              <tr><th style="padding:5px 7px;text-align:left;font-size:8px">Indicador</th><th style="padding:5px 7px;text-align:right;font-size:8px">S${prev.semana} ${prev.año} (ant.)</th><th style="padding:5px 7px;text-align:right;font-size:8px">S${curr.semana} ${curr.año}</th><th style="padding:5px 7px;text-align:right;font-size:8px">Diferencia</th></tr>
            </thead>
            <tbody>${segRows}</tbody>
          </table>
        </div>
        ${seg.resumen?`<p style="font-size:9px;margin-bottom:4px"><b>Resumen:</b> ${seg.resumen}</p>`:''}
        ${seg.compromisosAsesor?`<p style="font-size:9px;margin-bottom:4px"><b>Compromisos Asesor:</b> ${seg.compromisosAsesor}</p>`:''}
        ${seg.compromisosGerente?`<p style="font-size:9px;margin-bottom:2px"><b>Compromisos Gerente:</b> ${seg.compromisosGerente}</p>`:''}
        ${(seg.archivos||[]).length?`<p style="font-size:9px;margin-top:4px"><b>Archivos:</b> ${seg.archivos.map(a=>a.nombre).join(', ')}</p>`:''}
      </div>`;
    }).join('');
  })();

  document.getElementById('printArea').innerHTML=`<div class="print-doc">
    <div class="ph">
      <div class="ph-logo">FERCO<span>CERÁMICA</span></div>
      <div class="ph-title">
        <h2>REGISTRO DE UNO A UNO</h2>
        <p>Seguimiento semanal de indicadores comerciales</p>
      </div>
      <div style="font-size:10px;color:#64748b;text-align:right">FERCO Cerámica</div>
    </div>
    <div class="pmeta">
      <span class="ml">Asesor:</span><span>${p.asesor||''}</span>
      <span class="ml">Líder:</span><span>${p.lider||''}</span>
      <span class="ml">Sucursal:</span><span>${p.sucursal||''}</span>
      <span class="ml">País:</span><span>${p.pais||''}</span>
      <span class="ml">Semana Inicial:</span><span>S${p.semana} ${p.año}</span>
    </div>
    <div class="psec" style="background:var(--primary);color:var(--foreground)">INDICADORES HISTÓRICOS</div>
    <div style="overflow-x:auto;margin-bottom:16px">
      <table style="width:100%;border-collapse:collapse;font-size:9px">
        <thead style="background:var(--foreground);color:#fff">${indHeaders}</thead>
        <tbody>${indRows}</tbody>
      </table>
    </div>
    <div class="psec" style="background:var(--primary);color:var(--foreground)">RESUMEN DE LA SESIÓN INICIAL</div>
    ${p.resumen?`<div class="pbox">${p.resumen}</div>`:'<div class="pbox" style="color:#94a3b8">Sin resumen registrado.</div>'}
    ${p.compromisosAsesor?`<div class="psec">COMPROMISOS DEL ASESOR</div><div class="pbox">${p.compromisosAsesor}</div>`:''}
    ${p.compromisosGerente?`<div class="psec">COMPROMISOS DEL GERENTE</div><div class="pbox">${p.compromisosGerente}</div>`:''}
    ${segsHtml?`<div class="psec" style="background:var(--primary);color:var(--foreground)">SEGUIMIENTOS REGISTRADOS</div>${segsHtml}`:''}
    <div class="psigs"><div><div class="psig">${p.asesor||'Asesor'}</div></div><div><div class="psig">${p.lider||'Líder'}</div></div></div>
  </div>`;
}
// ── PANEL DE CONFIGURACIÓN (ADMIN) ────────────────────────────────────────────
window.openAdminConfig = () => {
    document.getElementById('kanbanArea').style.display = 'none';
    document.getElementById('adminConfigArea').style.display = 'flex';
    document.querySelectorAll('.vt-btn').forEach(b => b.classList.remove('active'));
    renderAdminConfig();
};

window.closeAdminConfig = () => {
    document.getElementById('adminConfigArea').style.display = 'none';
    document.getElementById('kanbanArea').style.display = 'flex';
    renderAll();
};

async function saveConfigToDb() {
    try {
        await setDoc(doc(db, 'config', 'empresa'), window.EmpresaConfig);
        alert('✅ Configuración guardada correctamente.');
    } catch(e) {
        console.error(e);
        alert('❌ Error al guardar configuración.');
    }
}

window.renderAdminConfig = () => {
    if (!window.EmpresaConfig) return;
    const cfg = window.EmpresaConfig;

    // Países
    const paisesList = document.getElementById('adminPaisesList');
    if (paisesList) {
        paisesList.innerHTML = (cfg.paises || []).map((p, i) => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg); padding:8px 12px; border-radius:6px; border:1px solid var(--border);">
                <span>${escHtml(p)}</span>
                <button onclick="deletePais(${i})" style="color:var(--danger); background:none; border:none; cursor:pointer;" title="Eliminar País">${lIcon('trash-2', 16)}</button>
            </div>
        `).join('');
    }

    // Áreas
    const areasList = document.getElementById('adminAreasList');
    if (areasList) {
        areasList.innerHTML = (cfg.areas || []).map((a, i) => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg); padding:8px 12px; border-radius:6px; border:1px solid var(--border);">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="display:inline-block; width:12px; height:12px; border-radius:50%; ${a.color}"></span>
                    <span>${escHtml(a.nombre)}</span>
                </div>
                <button onclick="deleteArea(${i})" style="color:var(--danger); background:none; border:none; cursor:pointer;" title="Eliminar Área">${lIcon('trash-2', 16)}</button>
            </div>
        `).join('');
    }

    // Puestos
    const puestosTable = document.getElementById('adminPuestosTable');
    if (puestosTable) {
        const getPuestoNombre = (id) => {
            if(!id) return 'Ninguno (Máximo Nivel)';
            const p = (cfg.puestos||[]).find(x => x.id === id);
            return p ? p.nombre : id;
        };

        puestosTable.innerHTML = (cfg.puestos || []).map((p, i) => `
            <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:12px; font-weight:500;">${escHtml(p.nombre)}</td>
                <td style="padding:12px; color:var(--text-muted);">${escHtml(p.id)}</td>
                <td style="padding:12px;">${escHtml(p.area)}</td>
                <td style="padding:12px;"><span style="background:var(--bg); padding:4px 8px; border-radius:4px; font-size:12px; border:1px solid var(--border);">${escHtml(getPuestoNombre(p.reportaA))}</span></td>
                <td style="padding:12px; text-align:right;">
                    <button onclick="deletePuesto(${i})" style="color:var(--danger); background:none; border:none; cursor:pointer;">${lIcon('trash-2', 16)} Eliminar</button>
                </td>
            </tr>
        `).join('');
    }
};

window.addPaisPrompt = async () => {
    const p = prompt('Nombre del nuevo País:');
    if (!p) return;
    if (!window.EmpresaConfig.paises) window.EmpresaConfig.paises = [];
    if (window.EmpresaConfig.paises.includes(p)) { alert('Ese país ya existe'); return; }
    window.EmpresaConfig.paises.push(p);
    await saveConfigToDb();
    renderAdminConfig();
};

window.deletePais = async (index) => {
    if (!confirm('¿Seguro que deseas eliminar este País? Esto no borrará a los usuarios que ya lo tienen asignado, pero ya no aparecerá en el formulario.')) return;
    window.EmpresaConfig.paises.splice(index, 1);
    await saveConfigToDb();
    renderAdminConfig();
};

window.addAreaPrompt = async () => {
    const a = prompt('Nombre de la nueva Área Comercial (Ej: Logística):');
    if (!a) return;
    const id = a.toLowerCase().replace(/\s+/g, '_');
    if (!window.EmpresaConfig.areas) window.EmpresaConfig.areas = [];
    if (window.EmpresaConfig.areas.find(x => x.id === id)) { alert('Esta área ya existe'); return; }
    window.EmpresaConfig.areas.push({
        id: id,
        nombre: a,
        color: 'background:#f1f5f9;color:#334155' // default neutral color
    });
    await saveConfigToDb();
    renderAdminConfig();
};

window.deleteArea = async (index) => {
    if (!confirm('¿Seguro que deseas eliminar esta Área?')) return;
    window.EmpresaConfig.areas.splice(index, 1);
    await saveConfigToDb();
    renderAdminConfig();
};

window.addPuestoModal = () => {
    document.getElementById('puestoNombre').value = '';
    document.getElementById('puestoId').value = '';
    
    // Poblar áreas
    const selArea = document.getElementById('puestoArea');
    selArea.innerHTML = (window.EmpresaConfig.areas || []).map(a => `<option value="${a.nombre}">${a.nombre}</option>`).join('');
    
    // Poblar Reporta A
    const selReporta = document.getElementById('puestoReporta');
    selReporta.innerHTML = '<option value="">Nadie (Máximo Nivel)</option>' + 
        (window.EmpresaConfig.puestos || []).map(p => `<option value="${p.id}">${p.nombre} (${p.area})</option>`).join('');

    hideErr('puestoErr');
    document.getElementById('puestoModal').classList.add('open');
};

window.closePuestoModal = () => {
    document.getElementById('puestoModal').classList.remove('open');
};

window.savePuesto = async () => {
    const nombre = document.getElementById('puestoNombre').value.trim();
    const id = document.getElementById('puestoId').value.trim();
    const area = document.getElementById('puestoArea').value;
    const reportaA = document.getElementById('puestoReporta').value;

    if (!nombre || !id) { showErr('puestoErr', 'El nombre y el identificador son obligatorios.'); return; }
    if (!window.EmpresaConfig.puestos) window.EmpresaConfig.puestos = [];
    if (window.EmpresaConfig.puestos.find(x => x.id === id)) { showErr('puestoErr', 'El identificador ya está en uso.'); return; }

    window.EmpresaConfig.puestos.push({ id, nombre, area, reportaA });
    closePuestoModal();
    await saveConfigToDb();
    renderAdminConfig();
};
