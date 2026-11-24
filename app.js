/*
 * NAFER · Prototipo UX v1.2 · HTML/CSS/JS independientes.
 * IMPORTANTE: esta aplicación es una simulación local. NO implementa inicio
 * de sesión, autorización de servidor, API, emails ni base de datos.
 * El selector superior suplanta usuarios SÓLO para validar el recorrido UX.
 */
'use strict';

const STORAGE_KEY = 'nafer-ux-v1.2-three-roles';
const SERVICE_TYPES = [
  'Frenos', 'Mantenimiento general', 'Tren delantero y suspensión',
  'Motor', 'Embrague y transmisión', 'Electricidad y batería',
  'Diagnóstico general', 'Otro / No sé'
];
const STATUS = Object.freeze({
  TURNO_SOLICITADO: 'Turno solicitado',
  TURNO_AGENDADO: 'Turno agendado',
  EN_REVISION: 'En revisión del taller',
  PRESUPUESTADO: 'Presupuestado',
  ACEPTADO: 'Aceptado',
  RECHAZADO: 'Rechazado · caso cerrado',
  EN_REPARACION: 'En reparación',
  FINALIZADO: 'Trabajo finalizado'
});
const STATUS_ORDER = [
  'TURNO_SOLICITADO', 'TURNO_AGENDADO', 'EN_REVISION',
  'PRESUPUESTADO', 'ACEPTADO', 'EN_REPARACION', 'FINALIZADO'
];
const MENU = {
  ADMIN: [['dashboard','⌂','Resumen'],['requests','≡','Solicitudes'],['appointments','▦','Turnos'],['quotes','▤','Presupuestos'],['customers','♙','Clientes'],['workshops','▣','Talleres']],
  CLIENTE: [['dashboard','⌂','Inicio'],['vehicles','▣','Mis vehículos'],['requests','≡','Solicitudes'],['appointments','▦','Mis turnos'],['quotes','▤','Presupuestos']],
  TALLER: [['dashboard','⌂','Mi taller'],['requests','≡','Trabajos asignados'],['appointments','▦','Agenda'],['quotes','▤','Presupuestos']]
};

const $ = id => document.getElementById(id);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => (
  {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]
));
const money = value => new Intl.NumberFormat('es-AR', {
  style:'currency', currency:'ARS', maximumFractionDigits:0
}).format(Number(value) || 0);
const dateTime = value => value ? new Date(value).toLocaleString('es-AR', {
  day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
}) : 'Pendiente';
const dateOnly = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('es-AR') : 'A confirmar';
const future = hours => {
  const d = new Date(Date.now() + hours * 3600000);
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-') +
    'T' + [String(d.getHours()).padStart(2,'0'), String(d.getMinutes()).padStart(2,'0')].join(':');
};
const now = () => new Date().toISOString();

function seedData() {
  return {
    users: [
      {id:'admin',role:'ADMIN',name:'Administración NAFER',email:'administracion@nafer.demo'},
      {id:'c1',role:'CLIENTE',kind:'PARTICULAR',area:'CABA',name:'Cliente particular (demo)',email:'cliente@ejemplo.com'},
      {id:'c2',role:'CLIENTE',kind:'EMPRESA',area:'Zona Norte',name:'Flota Empresa Demo',email:'flotas@ejemplo.com'},
      {id:'w1',role:'TALLER',workshopId:'t1',name:'Operador NAFER',email:'taller@nafer.demo'},
      {id:'w2',role:'TALLER',workshopId:'t2',name:'Operador Taller Demo Norte',email:'norte@taller.demo'}
    ],
    workshops: [
      {id:'t1',name:'NAFER · Taller Central',address:'Juan B. Justo 9677, CABA',area:'CABA',email:'taller@nafer.demo',active:true,services:[...SERVICE_TYPES]},
      {id:'t2',name:'Taller Demo Norte',address:'Dirección a definir · Taller ficticio',area:'Zona Norte',email:'norte@taller.demo',active:true,services:['Frenos','Tren delantero y suspensión','Mantenimiento general']}
    ],
    vehicles: [
      {id:'v1',ownerId:'c1',plate:'AA 123 BB',brand:'Volkswagen',model:'Gol Trend',year:2018,mileage:85300},
      {id:'v2',ownerId:'c1',plate:'AD 456 EF',brand:'Ford',model:'Ranger',year:2021,mileage:62100},
      {id:'v3',ownerId:'c2',plate:'AE 789 GH',brand:'Fiat',model:'Fiorino',year:2022,mileage:47700}
    ],
    requests: [
      {id:1042,ownerId:'c1',vehicleId:'v2',workshopId:'t1',category:'Frenos',description:'Necesito cambiar el líquido de frenos y revisar el sistema.',status:'TURNO_SOLICITADO',createdAt:now(),appointmentAt:null,diagnosis:'',closedAt:null,history:[{at:now(),by:'Cliente particular',message:'Solicitud creada y taller asignado',status:'TURNO_SOLICITADO'}]},
      {id:1041,ownerId:'c1',vehicleId:'v1',workshopId:'t1',category:'Mantenimiento general',description:'Service de los 85.000 kilómetros.',status:'PRESUPUESTADO',createdAt:now(),appointmentAt:future(-24),diagnosis:'Se requiere cambio de aceite, filtro y control general.',closedAt:null,history:[{at:now(),by:'Operador NAFER',message:'Presupuesto emitido',status:'PRESUPUESTADO'},{at:now(),by:'Operador NAFER',message:'Vehículo inspeccionado',status:'EN_REVISION'},{at:now(),by:'Operador NAFER',message:'Turno asignado',status:'TURNO_AGENDADO'}]},
      {id:1040,ownerId:'c2',vehicleId:'v3',workshopId:'t2',category:'Frenos',description:'Revisión de frenos de la unidad de reparto.',status:'TURNO_AGENDADO',createdAt:now(),appointmentAt:future(48),diagnosis:'',closedAt:null,history:[{at:now(),by:'Operador Taller Demo Norte',message:'Turno confirmado',status:'TURNO_AGENDADO'},{at:now(),by:'Flota Empresa Demo',message:'Solicitud creada',status:'TURNO_SOLICITADO'}]}
    ],
    quotes: [
      {id:'p1',requestId:1041,diagnosis:'Se requiere cambio de aceite, filtro y control general.',items:[{name:'Aceite y filtro',amount:1,price:95000},{name:'Mano de obra',amount:1,price:48000}],validUntil:'2027-12-31',terms:'Importes expresados en ARS. Trabajos adicionales requieren nueva autorización.',createdAt:now(),decisionAt:null}
    ],
    nextRequestId:1043, nextVehicleId:4, nextUserId:3, nextWorkshopId:3, nextQuoteId:2
  };
}
function loadData() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (raw && Array.isArray(raw.users) && Array.isArray(raw.workshops) &&
        Array.isArray(raw.vehicles) && Array.isArray(raw.requests) && Array.isArray(raw.quotes)) return raw;
  } catch (_) { /* almacenamiento deshabilitado: usar estado temporal */ }
  return seedData();
}
let db = loadData();
let viewerId = db.users.some(u => u.id === 'c1') ? 'c1' : db.users[0].id;
let page = 'dashboard';
let requestId = 1042;
let quoteId = 'p1';
let confirmation = null;
const actor = () => db.users.find(u => u.id === viewerId) || db.users[0];
const user = id => db.users.find(u => u.id === id);
const workshop = id => db.workshops.find(w => w.id === id);
const vehicle = id => db.vehicles.find(v => v.id === id);
const request = id => db.requests.find(r => r.id === Number(id));
const quoteFor = id => db.quotes.find(q => q.requestId === Number(id));
const amount = q => q ? q.items.reduce((sum, item) => sum + item.amount * item.price, 0) : 0;
const isOwner = r => actor().role === 'CLIENTE' && r.ownerId === actor().id;
const isWorkshop = r => actor().role === 'TALLER' && r.workshopId === actor().workshopId;
const canSee = r => actor().role === 'ADMIN' || isOwner(r) || isWorkshop(r);
const accessibleRequests = () => [...db.requests].filter(canSee).sort((a,b) => b.id - a.id);
const accessibleVehicles = () => db.vehicles.filter(v => actor().role === 'ADMIN' || v.ownerId === actor().id);
const matchingWorkshops = category => db.workshops.filter(w => w.active && w.services.includes(category));
function chosenWorkshop(category) {
  const options = matchingWorkshops(category);
  const area = String(actor().area || '').trim().toLowerCase();
  return options.find(w => w.area.toLowerCase() === area) || options[0] || null;
}
function log(r, message, status = r.status) {
  r.history.unshift({at:now(),by:actor().name,message,status});
}
function persist(message) {
  try {localStorage.setItem(STORAGE_KEY, JSON.stringify(db));}
  catch (_) { /* sin persistencia, sigue funcionando la sesión */ }
  render();
  if (message) toast(message);
}
function toast(message) {
  const el = $('toast'); el.textContent = message; el.hidden = false;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => {el.hidden = true;}, 3500);
}
function button(title, action, id, variant='outline') {
  return `<button type="button" class="btn btn-${variant} btn-sm" data-action="${escapeHTML(action)}" ${id !== undefined ? `data-id="${escapeHTML(id)}"` : ''}>${escapeHTML(title)}</button>`;
}
function tag(r) {
  const color = r.status === 'RECHAZADO' ? 'danger' :
    ['ACEPTADO','FINALIZADO'].includes(r.status) ? 'success' :
    ['TURNO_SOLICITADO','TURNO_AGENDADO'].includes(r.status) ? 'pending' : 'info';
  return `<span class="tag ${color}">${escapeHTML(STATUS[r.status] || r.status)}</span>`;
}
function heading(title, intro, primary='') {
  const label = actor().role === 'ADMIN' ? 'Administración NAFER' :
    actor().role === 'TALLER' ? 'Portal del taller' : 'Portal del cliente';
  return `<div class="page-heading"><div><p class="eyebrow-small">${label}</p><h1>${escapeHTML(title)}</h1><p class="subhead">${escapeHTML(intro)}</p></div>${primary}</div>`;
}
function empty(text) { return `<div class="empty">${escapeHTML(text)}</div>`; }
function stats(items) {
  return `<div class="grid-stats">${items.map(([label,count,icon]) => `<div class="stat-card"><span class="stat-icon">${icon}</span><div class="stat-number">${count}</div><div class="stat-label">${escapeHTML(label)}</div></div>`).join('')}</div>`;
}
function requestRow(r) {
  const v = vehicle(r.vehicleId), w = workshop(r.workshopId), u = user(r.ownerId);
  return `<div class="item-row"><div class="item-main"><div class="item-title">#SOL-${r.id} · ${escapeHTML(v?.brand)} ${escapeHTML(v?.model)}</div>
    <p class="item-desc">${escapeHTML(v?.plate)} · ${escapeHTML(r.category)} · ${escapeHTML(w?.name || 'Sin asignar')}</p>
    ${actor().role !== 'CLIENTE' ? `<p class="item-desc">Cliente: ${escapeHTML(u?.name)}</p>` : ''}</div>
    <div class="item-actions">${tag(r)}${button('Ver detalle','open-request',r.id)}</div></div>`;
}
function dashboard() {
  const a = actor(), rows = accessibleRequests();
  const intro = a.role === 'ADMIN' ? 'Administrá clientes, talleres y solicitudes de toda la red.' :
    a.role === 'TALLER' ? `Gestioná únicamente los trabajos asignados a ${workshop(a.workshopId)?.name || 'tu taller'}.` :
    'Registrá tus vehículos, pedí turnos y seguí tus reparaciones.';
  const primary = a.role === 'CLIENTE' ? button('+ Solicitar turno','new-request',undefined,'primary') :
    a.role === 'ADMIN' ? button('+ Registrar cliente','add-client',undefined,'primary') : button('Ver trabajos','nav','requests','primary');
  const active = rows.filter(r => !['FINALIZADO','RECHAZADO'].includes(r.status));
  const pending = rows.filter(r => r.status === 'TURNO_SOLICITADO');
  const quoted = rows.filter(r => r.status === 'PRESUPUESTADO');
  const repair = rows.filter(r => r.status === 'EN_REPARACION');
  return `${heading(a.role==='TALLER'?'Panel del taller':a.role==='ADMIN'?'Resumen general':`Hola, ${a.kind==='EMPRESA'?'equipo de la flota':'¡bienvenido!'}`, intro, primary)}
    <div class="demo-note">Vista de prueba: el selector de usuario cambia entre clientes, talleres y NAFER sin contraseña. En producción cada persona ingresará con su email y contraseña.</div>
    ${a.role === 'CLIENTE' ? `<div class="hero-banner"><h2>Tu vehículo, siempre al día.</h2><p>Elegí el trabajo, obtené el taller asignado y seguí el estado del turno y la reparación.</p>${button('Solicitar turno →','new-request',undefined,'primary')}</div>` : ''}
    ${stats([['Solicitudes activas',active.length,'≡'],['Turnos solicitados',pending.length,'▦'],['Presupuestos pendientes',quoted.length,'▤'],['En reparación',repair.length,'⚙']])}
    <div class="card"><div class="card-header"><h2>${a.role==='TALLER'?'Trabajos de mi taller':'Solicitudes recientes'}</h2>${button('Ver todas','nav','requests')}</div>
    ${rows.length ? rows.slice(0,6).map(requestRow).join('') : empty('No hay solicitudes en este perfil.')}</div>`;
}
function vehiclesPage() {
  const list = accessibleVehicles();
  return `${heading('Mis vehículos',actor().kind==='EMPRESA'?'Gestioná las unidades de tu flota.':'Registrá tus vehículos y consultá los trabajos que solicitaste.',button('+ Agregar vehículo','add-vehicle',undefined,'primary'))}
    <div class="vehicle-grid">${list.map(v => `<div class="vehicle-card"><div class="vehicle-icon">▰</div><strong>${escapeHTML(v.brand)} ${escapeHTML(v.model)}</strong><p>Año ${v.year} · ${Number(v.mileage || 0).toLocaleString('es-AR')} km</p><span class="plate">${escapeHTML(v.plate)}</span>
    <div class="inline-actions">${button('Solicitar trabajo','new-request',v.id,'dark')}</div></div>`).join('') || empty('Todavía no tenés vehículos registrados.')}</div>`;
}
function requestsPage() {
  const list = accessibleRequests();
  return `${heading('Solicitudes',actor().role==='ADMIN'?'Controlá el estado de las solicitudes de toda la red.':actor().role==='TALLER'?'Trabajos asignados exclusivamente a tu taller.':'Seguí cada solicitud de principio a fin.',actor().role==='CLIENTE'?button('+ Solicitar turno','new-request',undefined,'primary'):'')}
    <div class="card"><div class="card-header"><h2>Bandeja de solicitudes</h2><small>${list.length} resultados</small></div>${list.map(requestRow).join('') || empty('No hay solicitudes para este usuario.')}</div>`;
}
function appointmentsPage() {
  const list = accessibleRequests().filter(r => r.appointmentAt);
  return `${heading('Agenda de turnos','Turnos comunicados por los talleres a los clientes.')}
    <div class="card">${list.length ? [...list].sort((a,b) => a.appointmentAt.localeCompare(b.appointmentAt)).map(r => {
      const w = workshop(r.workshopId), v = vehicle(r.vehicleId);
      return `<div class="item-row"><div><div class="item-title">${escapeHTML(v?.plate)} · ${escapeHTML(w?.name)}</div><p class="item-desc">${dateTime(r.appointmentAt)} · #SOL-${r.id}</p></div><div class="item-actions">${tag(r)}${button('Ver solicitud','open-request',r.id)}</div></div>`;
    }).join('') : empty('Aún no hay turnos agendados.')}</div>`;
}
function quotesPage() {
  const list = db.quotes.map(q => ({q,r:request(q.requestId)})).filter(x => x.r && canSee(x.r));
  return `${heading('Presupuestos','Consultá el diagnóstico, los importes y la decisión del cliente.')}
    <div class="card">${list.length ? list.map(({q,r}) => {
      const v = vehicle(r.vehicleId);
      return `<div class="item-row"><div><div class="item-title">Presupuesto #P-${r.id} · ${escapeHTML(v?.brand)} ${escapeHTML(v?.model)}</div>
        <p class="item-desc">${escapeHTML(workshop(r.workshopId)?.name)} · Vigencia: ${dateOnly(q.validUntil)}</p></div>
        <div class="item-actions"><strong class="price-sm">${money(amount(q))}</strong>${tag(r)}${button('Ver detalle','open-request',r.id)}</div></div>`;
    }).join('') : empty('Todavía no hay presupuestos disponibles.')}</div>`;
}
function customersPage() {
  const list = db.users.filter(u => u.role === 'CLIENTE');
  return `${heading('Clientes','NAFER registra a particulares y empresas que administran sus flotas.',button('+ Registrar cliente','add-client',undefined,'primary'))}
    <div class="card">${list.map(u => `<div class="item-row"><div><div class="item-title">${escapeHTML(u.name)}</div><p class="item-desc">${escapeHTML(u.email)} · ${u.kind==='EMPRESA'?'Empresa / Flota':'Particular'} · ${escapeHTML(u.area || 'Zona a definir')} · ${db.vehicles.filter(v=>v.ownerId===u.id).length} vehículo(s)</p></div><span class="tag info">Registrado</span></div>`).join('') || empty('Todavía no se registraron clientes.')}</div>`;
}
function workshopsPage() {
  return `${heading('Talleres de la red','NAFER administra especialidades, ubicación y disponibilidad de cada taller.',button('+ Registrar taller','add-workshop',undefined,'primary'))}
    <div class="card">${db.workshops.map(w => {
      const active = db.requests.filter(r => r.workshopId === w.id && !['FINALIZADO','RECHAZADO'].includes(r.status)).length;
      return `<div class="item-row"><div><div class="item-title">${escapeHTML(w.name)}</div><p class="item-desc">${escapeHTML(w.address)} · ${escapeHTML(w.area)} · ${w.services.length} especialidades</p>
        <p class="item-desc">Usuario: ${escapeHTML(w.email)} · ${active} trabajo(s) en curso</p></div>
        <div class="item-actions"><span class="tag ${w.active?'success':'danger'}">${w.active?'Habilitado':'Deshabilitado'}</span>${button('Editar','edit-workshop',w.id)}${button(w.active?'Deshabilitar':'Habilitar','toggle-workshop',w.id,w.active?'danger':'dark')}</div></div>`;
    }).join('')}</div>`;
}
function steps(r) {
  const index = STATUS_ORDER.indexOf(r.status);
  const isRejected = r.status === 'RECHAZADO';
  return `<div class="mini-steps">${STATUS_ORDER.map((s,i) => `<span class="mini-step ${isRejected ? i <= 3?'done':'' : i < index?'done':i === index?'current':''}">${escapeHTML(STATUS[s])}</span>`).join('')}
    ${isRejected ? '<span class="mini-step current">Rechazado · cerrado</span>' : ''}</div>`;
}
function detailsActions(r) {
  const a = actor();
  if (a.role === 'ADMIN' && r.status === 'TURNO_SOLICITADO') return `<div class="actions-block"><h3>Gestión NAFER</h3><p class="subhead">Podés reasignar esta solicitud a otro taller compatible antes de que se agende el turno.</p><div class="inline-actions">${button('Reasignar taller','assign-workshop',r.id,'primary')}</div></div>`;
  if (a.role === 'TALLER' && isWorkshop(r)) {
    const lookup = {
      TURNO_SOLICITADO: ['Asignar fecha y horario','schedule', 'primary'],
      TURNO_AGENDADO: ['Registrar ingreso e iniciar revisión','begin-review','primary'],
      EN_REVISION: ['Cargar diagnóstico y presupuesto','prepare-quote','primary'],
      ACEPTADO: ['Iniciar reparación','start-repair','primary'],
      EN_REPARACION: ['Finalizar reparación','finish-repair','primary']
    };
    const entry = lookup[r.status];
    if (entry) return `<div class="actions-block"><h3>Acción del taller</h3><div class="inline-actions">${button(entry[0],entry[1],r.id,entry[2])}</div></div>`;
  }
  if (isOwner(r) && r.status === 'PRESUPUESTADO') return `<div class="actions-block"><h3>Tu decisión</h3><p class="subhead">Revisá el diagnóstico y el presupuesto. Solo el cliente puede aprobar o rechazar.</p><div class="inline-actions">${button('Aceptar presupuesto','decide-accept',r.id,'primary')}${button('Rechazar presupuesto','decide-reject',r.id,'danger')}</div></div>`;
  return '';
}
function detailPage() {
  const r = request(requestId);
  if (!r || !canSee(r)) return heading('Solicitud no disponible','No tenés acceso a este registro.');
  const v = vehicle(r.vehicleId), w = workshop(r.workshopId), c = user(r.ownerId), q = quoteFor(r.id);
  return `${heading(`Solicitud #SOL-${r.id}`,`${v.brand} ${v.model} · ${v.plate}`,button('Volver a solicitudes','nav','requests'))}
    <div class="card"><div class="card-header"><h2>Estado del trabajo</h2>${tag(r)}</div>${steps(r)}
      <div class="fact-grid"><div class="fact"><div class="fact-label">Cliente</div><div class="fact-value">${escapeHTML(c?.name)}</div></div>
      <div class="fact"><div class="fact-label">Vehículo</div><div class="fact-value">${escapeHTML(v?.brand)} ${escapeHTML(v?.model)} · ${escapeHTML(v?.plate)}</div></div>
      <div class="fact"><div class="fact-label">Trabajo solicitado</div><div class="fact-value">${escapeHTML(r.category)}</div></div>
      <div class="fact"><div class="fact-label">Fecha del turno</div><div class="fact-value">${dateTime(r.appointmentAt)}</div></div></div>
      <div class="section-title"><h3>Descripción del cliente</h3></div><p class="subhead">${escapeHTML(r.description)}</p>
      <div class="section-title"><h3>Taller asignado · Dónde acudir</h3></div>
      <div class="location-card"><strong>${escapeHTML(w?.name || 'Sin taller asignado')}</strong><p>${escapeHTML(w?.address || 'Pendiente de asignación')}</p><small>${escapeHTML(w?.area || '')}${!r.appointmentAt?' · Esperá que el taller confirme día y hora antes de acudir.':''}</small></div>
      ${r.diagnosis?`<div class="section-title"><h3>Diagnóstico del taller</h3></div><p class="subhead">${escapeHTML(r.diagnosis)}</p>`:''}
      ${q?`<div class="section-title"><h3>Presupuesto</h3></div><div class="quote-box">
        ${q.items.map(item => `<div class="quote-line"><span>${escapeHTML(item.name)} × ${item.amount}</span><strong>${money(item.amount*item.price)}</strong></div>`).join('')}
        <div class="quote-total"><strong>Total</strong><strong class="price">${money(amount(q))}</strong></div>
        <p class="subhead">Válido hasta ${dateOnly(q.validUntil)}. ${escapeHTML(q.terms)}</p></div>`:''}
      ${r.status === 'RECHAZADO' ? '<div class="callout">El cliente rechazó el presupuesto y el caso se cerró. No se puede iniciar la reparación.</div>' : ''}
      ${r.status === 'FINALIZADO' ? '<div class="callout">Trabajo finalizado. Queda registrado en el historial del vehículo.</div>' : ''}
      ${detailsActions(r)}
    </div>
    <div class="card"><h2>Historial de movimientos</h2><div class="section-title"></div><ul class="timeline">${r.history.map(e => `<li><strong>${escapeHTML(e.message)}</strong>${escapeHTML(e.by)} · ${dateTime(e.at)}<p>${escapeHTML(STATUS[e.status] || e.status)}</p></li>`).join('')}</ul></div>`;
}
function render() {
  const a = actor();
  const options = db.users.map(u => `<option value="${escapeHTML(u.id)}" ${u.id===viewerId?'selected':''}>${escapeHTML(u.role==='ADMIN'?'NAFER · Administrador':u.role==='TALLER'?`Taller · ${workshop(u.workshopId)?.name||u.name}`:u.kind==='EMPRESA'?`Cliente empresa · ${u.name}`:`Cliente · ${u.name}`)}</option>`);
  $('role-switch').innerHTML = options.join('');
  $('role-label').textContent = a.role==='ADMIN'?'ADMINISTRACIÓN NAFER':a.role==='TALLER'?'PORTAL DEL TALLER':'PORTAL DEL CLIENTE';
  const menu = MENU[a.role];
  const screens = {dashboard,requests:requestsPage,appointments:appointmentsPage,quotes:quotesPage,customers:customersPage,workshops:workshopsPage,vehicles:vehiclesPage,detail:detailPage};
  if (page !== 'detail' && !menu.some(entry => entry[0] === page)) page = 'dashboard';
  $('side-nav').innerHTML = menu.map(([key,icon,label]) => `<button type="button" class="nav-button ${key===page?'active':''}" data-nav="${key}"><span class="nav-icon">${icon}</span>${escapeHTML(label)}</button>`).join('');
  $('location-crumb').textContent = page==='detail'?'Detalle de solicitud':menu.find(entry=>entry[0]===page)?.[2]||'Inicio';
  $('screen').innerHTML = screens[page]();
  document.body.classList.remove('mob-open');
}
function navigate(to) { page=to; render(); window.scrollTo({top:0,behavior:'smooth'}); }

// Los diálogos comparten el mismo contenedor: formularios centralizados.
function modal(title, description, html, formId, confirmLabel='Guardar') {
  $('modal-root').hidden = false;
  $('modal-root').innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}"><div class="modal-top"><div><h2>${escapeHTML(title)}</h2><p>${escapeHTML(description)}</p></div><button type="button" class="modal-close" data-action="close" aria-label="Cerrar">×</button></div>
    <div class="modal-body">${html}</div><div class="modal-actions"><button type="button" class="btn btn-outline" data-action="close">Cancelar</button><button type="submit" form="${escapeHTML(formId)}" class="btn btn-primary">${escapeHTML(confirmLabel)}</button></div></div>`;
  $('modal-root').querySelector('input,select,textarea,button')?.focus();
}
function closeModal() {$('modal-root').hidden=true;$('modal-root').innerHTML='';confirmation=null;}
function confirmModal(title, description, label, action, id) {
  confirmation={action,id};
  $('modal-root').hidden=false;
  $('modal-root').innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}"><div class="modal-top"><h2>${escapeHTML(title)}</h2><button type="button" class="modal-close" data-action="close">×</button></div>
    <div class="modal-body"><p class="subhead">${escapeHTML(description)}</p></div>
    <div class="modal-actions"><button type="button" class="btn btn-outline" data-action="close">Cancelar</button><button type="button" class="btn ${action==='decide-reject'?'btn-danger':'btn-primary'}" data-action="confirm">${escapeHTML(label)}</button></div></div>`;
}
function formField(label, name, value='', type='text', extra='') {
  return `<div class="field"><label for="f-${name}">${escapeHTML(label)}</label><input id="f-${name}" type="${escapeHTML(type)}" name="${escapeHTML(name)}" value="${escapeHTML(value)}" ${extra} required></div>`;
}
function serviceChecks(selected) {
  return `<div class="field full"><label>Especialidades del taller</label><div class="check-grid">${SERVICE_TYPES.map(s => `<label><input type="checkbox" name="services" value="${escapeHTML(s)}" ${selected.includes(s)?'checked':''}> ${escapeHTML(s)}</label>`).join('')}</div></div>`;
}
function newVehicle() {
  if (actor().role!=='CLIENTE') return;
  modal('Agregar vehículo','Los vehículos de una empresa forman parte de su flota.',`<form id="form-vehicle" class="form-grid">
    ${formField('Patente','plate','','text','maxlength="12"')}${formField('Marca','brand')}${formField('Modelo','model')}
    ${formField('Año','year',String(new Date().getFullYear()),'number','min="1950" max="2100"')}${formField('Kilómetros','mileage','0','number','min="0"')}
    </form>`,'form-vehicle','Registrar vehículo');
}
function newRequest(vehicleId) {
  if (actor().role!=='CLIENTE') return;
  const vehicles = accessibleVehicles();
  if (!vehicles.length) {toast('Primero registrá un vehículo.');navigate('vehicles');return;}
  modal('Solicitar turno','El sistema propone un taller según el tipo de trabajo.',`<form id="form-request" class="form-grid">
    <div class="field full"><label for="r-vehicle">Vehículo</label><select id="r-vehicle" name="vehicleId" required>${vehicles.map(v=>`<option value="${escapeHTML(v.id)}" ${vehicleId===v.id?'selected':''}>${escapeHTML(v.brand+' '+v.model+' · '+v.plate)}</option>`).join('')}</select></div>
    <div class="field full"><label for="r-category">Tipo de trabajo</label><select id="r-category" name="category" required><option value="">Seleccioná un servicio</option>${SERVICE_TYPES.map(s=>`<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('')}</select></div>
    <div class="field full"><label for="r-description">¿Qué necesita tu vehículo?</label><textarea id="r-description" name="description" minlength="8" maxlength="1600" placeholder="Ej.: cambiar líquido de frenos, pérdida de aceite, ruido al frenar..." required></textarea></div>
    <div class="field full"><label>Taller propuesto</label><div id="workshop-preview" class="location-card input-preview">Elegí un tipo de trabajo para ver el taller.</div></div></form>`,'form-request','Solicitar turno');
}
function schedule(r) {
  modal('Asignar turno',`#SOL-${r.id} · ${vehicle(r.vehicleId)?.plate}`,`<form id="form-schedule" class="form-grid" data-id="${r.id}">
    <div class="field full"><label for="schedule-at">Día y hora</label><input id="schedule-at" name="appointmentAt" type="datetime-local" min="${future(0)}" required></div>
    <p class="subhead full">El cliente verá el turno y la dirección del taller asignado.</p></form>`,'form-schedule','Confirmar turno');
}
function prepareQuote(r) {
  modal('Cargar diagnóstico y presupuesto',`#SOL-${r.id} · ${vehicle(r.vehicleId)?.plate}`,`<form id="form-quote" class="form-grid" data-id="${r.id}">
    <div class="field full"><label for="q-diagnosis">Desperfecto encontrado / diagnóstico</label><textarea id="q-diagnosis" name="diagnosis" minlength="10" maxlength="2000" required></textarea></div>
    ${formField('Descripción de repuestos / materiales','partName','Repuestos y materiales')}
    ${formField('Costo de repuestos (ARS)','parts','0','number','min="0" step="1"')}
    ${formField('Costo de mano de obra (ARS)','labor','0','number','min="0" step="1"')}
    ${formField('Vigencia del presupuesto','validUntil',future(168).slice(0,10),'date')}
    <div class="field full"><label for="q-terms">Condiciones</label><textarea id="q-terms" name="terms" required>Importes en ARS. Reparaciones adicionales sujetas a aprobación del cliente.</textarea></div>
    <p class="subhead full">Editor de dos renglones de demostración. La versión productiva admitirá ítems ilimitados.</p></form>`,'form-quote','Enviar presupuesto');
}
function addClient() {
  modal('Registrar cliente','NAFER crea la cuenta y luego envía una invitación segura en producción.',`<form id="form-client" class="form-grid">
    <div class="field"><label for="client-type">Tipo de cliente</label><select id="client-type" name="kind"><option value="PARTICULAR">Particular</option><option value="EMPRESA">Empresa con flota</option></select></div>
    ${formField('Nombre / razón social','name')}${formField('Email de acceso','email','','email')}${formField('Zona de atención','area','CABA')}
    <p class="subhead full">En este prototipo se crea el usuario sin contraseña. En producción se activará mediante email y una contraseña elegida por el cliente.</p></form>`,'form-client','Registrar cliente');
}
function workshopForm(w) {
  const editing=Boolean(w);
  modal(editing?'Editar taller':'Registrar taller','Configurar especialidades y el usuario que gestionará sus trabajos.',`<form id="form-workshop" class="form-grid" data-id="${escapeHTML(w?.id||'')}">
    ${formField('Nombre del taller','name',w?.name||'')}${formField('Zona / localidad','area',w?.area||'')}
    <div class="field full">${formField('Dirección donde atenderá','address',w?.address||'')}</div>
    ${formField('Email del usuario Taller','email',w?.email||'','email',editing?'readonly':'')}
    ${serviceChecks(w?.services||[])}
    <p class="subhead full">El taller debe tener al menos una especialidad. Los talleres ficticios de la demo no representan establecimientos verificados.</p></form>`,'form-workshop',editing?'Guardar cambios':'Registrar taller');
}
function assignWorkshop(r) {
  const options=matchingWorkshops(r.category);
  modal('Reasignar taller',`Solicitud #SOL-${r.id} · ${r.category}`,`<form id="form-assign" class="form-grid" data-id="${r.id}">
    <div class="field full"><label for="new-workshop">Taller compatible</label><select id="new-workshop" name="workshopId" required>${options.map(w=>`<option value="${escapeHTML(w.id)}" ${w.id===r.workshopId?'selected':''}>${escapeHTML(w.name+' · '+w.area)}</option>`).join('')}</select></div></form>`,'form-assign','Asignar taller');
}
function requireActor(role) {
  if (actor().role!==role) {toast('Esta acción no corresponde a tu perfil.');return false;}
  return true;
}
function transition(r,expected,next,message) {
  if (r.status!==expected) {toast('El estado cambió: esta acción ya no está disponible.');return false;}
  r.status=next;
  log(r,message);
  return true;
}
function action(name,id) {
  if(name==='close')return closeModal();
  if(name==='nav')return navigate(id);
  if(name==='new-request')return newRequest(id);
  if(name==='add-vehicle')return newVehicle();
  if(name==='add-client'&&requireActor('ADMIN'))return addClient();
  if(name==='add-workshop'&&requireActor('ADMIN'))return workshopForm();
  if(name==='edit-workshop'&&requireActor('ADMIN'))return workshopForm(workshop(id));
  if(name==='open-request') {
    const r=request(id); if(!r||!canSee(r))return toast('No tenés acceso a esta solicitud.');
    requestId=r.id;return navigate('detail');
  }
  if(name==='confirm' && confirmation) {
    const {action:confirmed,id:target}=confirmation;closeModal();return finalize(confirmed,target);
  }
  const r=request(id);
  if(name==='toggle-workshop'&&requireActor('ADMIN')) {
    const w=workshop(id);if(!w)return;
    if(w.active && db.requests.some(x=>x.workshopId===w.id&&!['RECHAZADO','FINALIZADO'].includes(x.status)))return toast('Reasigná primero los trabajos activos de este taller.');
    w.active=!w.active;return persist('Estado del taller actualizado.');
  }
  if(!r||!canSee(r))return;
  if(name==='assign-workshop'&&requireActor('ADMIN')&&r.status==='TURNO_SOLICITADO')return assignWorkshop(r);
  if(name==='schedule'&&isWorkshop(r)&&r.status==='TURNO_SOLICITADO')return schedule(r);
  if(name==='begin-review'&&isWorkshop(r)&&r.status==='TURNO_AGENDADO')return confirmModal('Comenzar revisión','Registrá el ingreso del vehículo al taller para iniciar el diagnóstico.','Comenzar revisión','begin-review',r.id);
  if(name==='prepare-quote'&&isWorkshop(r)&&r.status==='EN_REVISION')return prepareQuote(r);
  if(name==='decide-accept'&&isOwner(r)&&r.status==='PRESUPUESTADO')return confirmModal('Aceptar presupuesto',`Aceptás realizar la reparación por ${money(amount(quoteFor(r.id)))}.`,'Aceptar presupuesto','decide-accept',r.id);
  if(name==='decide-reject'&&isOwner(r)&&r.status==='PRESUPUESTADO')return confirmModal('Rechazar presupuesto','El caso se cerrará y el taller no podrá iniciar la reparación.','Rechazar y cerrar','decide-reject',r.id);
  if(name==='start-repair'&&isWorkshop(r)&&r.status==='ACEPTADO')return confirmModal('Iniciar reparación','Confirmá que comienza el trabajo autorizado por el cliente.','Iniciar reparación','start-repair',r.id);
  if(name==='finish-repair'&&isWorkshop(r)&&r.status==='EN_REPARACION')return confirmModal('Finalizar trabajo','El trabajo quedará finalizado en el historial del vehículo.','Finalizar trabajo','finish-repair',r.id);
}
function finalize(name,id) {
  const r=request(id);if(!r||!canSee(r))return;
  const changes={
    'begin-review':['TURNO_AGENDADO','EN_REVISION','Taller registró ingreso del vehículo e inició revisión'],
    'decide-accept':['PRESUPUESTADO','ACEPTADO','Cliente aceptó el presupuesto'],
    'decide-reject':['PRESUPUESTADO','RECHAZADO','Cliente rechazó presupuesto y cerró el caso'],
    'start-repair':['ACEPTADO','EN_REPARACION','Taller inició reparación autorizada'],
    'finish-repair':['EN_REPARACION','FINALIZADO','Taller finalizó la reparación']
  };
  const change=changes[name];if(!change)return;
  if(name.startsWith('decide-')?!isOwner(r):!isWorkshop(r))return toast('Operación no permitida.');
  if((name==='decide-accept'||name==='decide-reject') && quoteFor(r.id)?.validUntil < future(0).slice(0,10)) return toast('El presupuesto está vencido.');
  if(transition(r,...change)) {
    if(name==='decide-reject'||name==='finish-repair') r.closedAt=now();
    if(name.startsWith('decide-')) quoteFor(r.id).decisionAt=now();
    return persist('Estado actualizado correctamente.');
  }
}
function submit(event) {
  if (!(event.target instanceof HTMLFormElement))return;
  event.preventDefault();const form=event.target;if(!form.reportValidity())return;
  const data=new FormData(form);
  const val=name=>String(data.get(name)||'').trim();
  if(form.id==='form-vehicle'&&requireActor('CLIENTE')) {
    const plate=val('plate').toUpperCase().replace(/\s+/g,' ');
    if(db.vehicles.some(v=>v.plate===plate))return toast('Esta patente ya está registrada.');
    db.vehicles.push({id:`v${db.nextVehicleId++}`,ownerId:actor().id,plate,brand:val('brand'),model:val('model'),year:Number(val('year')),mileage:Number(val('mileage'))});
    closeModal();return persist('Vehículo registrado.');
  }
  if(form.id==='form-client'&&requireActor('ADMIN')) {
    const email=val('email').toLowerCase();
    if(db.users.some(u=>u.email.toLowerCase()===email))return toast('Ese correo ya está registrado.');
    db.users.push({id:`c${db.nextUserId++}`,role:'CLIENTE',kind:val('kind'),area:val('area'),name:val('name'),email});
    closeModal();return persist('Cliente registrado en la demostración.');
  }
  if(form.id==='form-workshop'&&requireActor('ADMIN')) {
    const selected=data.getAll('services').map(String);
    if(!selected.length)return toast('Elegí al menos una especialidad.');
    const id=form.dataset.id,w=id?workshop(id):null;
    const email=val('email').toLowerCase();
    if(w) {if(db.requests.some(r=>r.workshopId===w.id && !['FINALIZADO','RECHAZADO'].includes(r.status) && !selected.includes(r.category))) return toast('No se pueden quitar especialidades con trabajos activos asociados.');
      w.name=val('name');w.address=val('address');w.area=val('area');w.services=selected;}
    else {
      if(db.users.some(u=>u.email.toLowerCase()===email))return toast('Ese email ya está registrado.');
      const newId=`t${db.nextWorkshopId++}`;
      db.workshops.push({id:newId,name:val('name'),address:val('address'),area:val('area'),email,active:true,services:selected});
      db.users.push({id:`w-${newId}`,name:`Operador ${val('name')}`,email,role:'TALLER',workshopId:newId});
    }
    closeModal();return persist(w?'Taller actualizado.':'Taller incorporado a la demostración.');
  }
  if(form.id==='form-request'&&requireActor('CLIENTE')) {
    const v=vehicle(val('vehicleId'));
    if(!v||v.ownerId!==actor().id)return toast('Seleccioná un vehículo de tu cuenta.');
    const w=chosenWorkshop(val('category'));
    if(!w)return toast('No hay talleres disponibles para este servicio. Contactá a NAFER.');
    const id=db.nextRequestId++;
    db.requests.push({id,ownerId:actor().id,vehicleId:v.id,workshopId:w.id,category:val('category'),description:val('description'),status:'TURNO_SOLICITADO',createdAt:now(),appointmentAt:null,diagnosis:'',closedAt:null,history:[{at:now(),by:actor().name,message:`Solicitud de turno creada · asignada a ${w.name}`,status:'TURNO_SOLICITADO'}]});
    requestId=id;page='detail';closeModal();return persist('Solicitud enviada al taller.');
  }
  if(form.id==='form-schedule') {
    const r=request(form.dataset.id);
    if(!r||!isWorkshop(r)||r.status!=='TURNO_SOLICITADO')return toast('No podés asignar este turno.');
    const when=val('appointmentAt');if(new Date(when).getTime()<=Date.now())return toast('El turno debe ser futuro.');
    r.appointmentAt=when;
    if(transition(r,'TURNO_SOLICITADO','TURNO_AGENDADO',`Taller asignó turno para ${dateTime(when)}`)) {closeModal();return persist('Turno agendado para el cliente.');}
  }
  if(form.id==='form-quote') {
    const r=request(form.dataset.id);
    if(!r||!isWorkshop(r)||r.status!=='EN_REVISION'||quoteFor(r.id))return toast('No es posible presupuestar en este estado.');
    const parts=Number(val('parts')),labor=Number(val('labor'));
    if(parts+labor<=0)return toast('El importe del presupuesto debe ser mayor a cero.');
    if(val('validUntil')<future(0).slice(0,10))return toast('La fecha de vigencia no puede estar en el pasado.');
    r.diagnosis=val('diagnosis');
    db.quotes.push({id:`p${db.nextQuoteId++}`,requestId:r.id,diagnosis:r.diagnosis,items:[{name:val('partName'),amount:1,price:parts},{name:'Mano de obra',amount:1,price:labor}],validUntil:val('validUntil'),terms:val('terms'),createdAt:now(),decisionAt:null});
    if(transition(r,'EN_REVISION','PRESUPUESTADO',`Taller informó diagnóstico y presupuesto por ${money(parts+labor)}`)) {closeModal();return persist('Presupuesto enviado al cliente.');}
  }
  if(form.id==='form-assign'&&requireActor('ADMIN')) {
    const r=request(form.dataset.id),w=workshop(val('workshopId'));
    if(!r||r.status!=='TURNO_SOLICITADO'||!w||!w.active||!w.services.includes(r.category))return toast('La reasignación no es válida.');
    r.workshopId=w.id;log(r,`NAFER reasignó a ${w.name}`);closeModal();return persist('Taller reasignado.');
  }
}
function updatePreview() {
  const select=$('r-category'),preview=$('workshop-preview');if(!select||!preview)return;
  const w=chosenWorkshop(select.value);
  preview.innerHTML=!select.value?'Elegí un tipo de trabajo para ver el taller.':
    w?`<strong>${escapeHTML(w.name)}</strong><p>${escapeHTML(w.address)}</p><small>Asignación de demostración por especialidad y zona de cliente. El taller confirmará el horario.</small>`:
    '<strong>Sin taller compatible</strong><p>NAFER deberá incorporar una especialidad disponible.</p>';
}
$('screen').addEventListener('click',event=>{const target=event.target.closest('[data-action]');if(target)action(target.dataset.action,target.dataset.id);});
$('side-nav').addEventListener('click',event=>{const target=event.target.closest('[data-nav]');if(target)navigate(target.dataset.nav);});
$('modal-root').addEventListener('click',event=>{const target=event.target.closest('[data-action]');if(target)action(target.dataset.action,target.dataset.id);});
$('modal-root').addEventListener('submit',submit);
$('modal-root').addEventListener('change',event=>{if(event.target.id==='r-category')updatePreview();});
$('role-switch').addEventListener('change',event=>{viewerId=event.target.value;page='dashboard';closeModal();render();toast('Vista de demostración: no es un inicio de sesión real.');});
$('toggle-menu').addEventListener('click',()=>document.body.classList.toggle('mob-open'));
$('reset-demo').addEventListener('click',()=>{db=seedData();try{localStorage.removeItem(STORAGE_KEY);}catch(_){}viewerId='c1';page='dashboard';closeModal();render();toast('Datos de ejemplo restablecidos.');});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('modal-root').hidden)closeModal();});
render();
