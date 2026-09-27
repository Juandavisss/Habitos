const API = 'http://127.0.0.1:8000';

// ── DATOS DE OPCIONES ──
const RAZAS = [
  { id:'humano',  emoji:'👨', nombre:'Humano',  desc:'+5 a todo',        bonus:{ hp:0,  fuerza:0, stamina:0  } },
  { id:'elfo',    emoji:'🧝', nombre:'Elfo',    desc:'+15 XP bonus',     bonus:{ hp:-10,fuerza:-2,stamina:10 } },
  { id:'orco',    emoji:'👹', nombre:'Orco',    desc:'+30 HP, +5 fuerza',bonus:{ hp:30, fuerza:5, stamina:-5 } },
  { id:'enano',   emoji:'🧔', nombre:'Enano',   desc:'+20 HP, duro',     bonus:{ hp:20, fuerza:2, stamina:0  } },
  { id:'elfo-oscuro', emoji:'🧟', nombre:'Elfo Oscuro', desc:'+10 fuerza, -HP', bonus:{ hp:-20,fuerza:10,stamina:5 } },
  { id:'draconido',   emoji:'🐲', nombre:'Dracónido',   desc:'+25 HP, fuego',   bonus:{ hp:25, fuerza:8, stamina:-10} },
  { id:'halfling',    emoji:'🧒', nombre:'Halfling',    desc:'+20 stamina',     bonus:{ hp:0,  fuerza:-3,stamina:20} },
  { id:'no-muerto',   emoji:'💀', nombre:'No Muerto',   desc:'Resistente',      bonus:{ hp:15, fuerza:5, stamina:-15} },
];

const CLASES = [
  { id:'guerrero', emoji:'⚔️',  nombre:'Guerrero', desc:'Alta fuerza y HP',   stats:{ hp:120,fuerza:12,stamina:40,xpMult:1.0 } },
  { id:'mago',     emoji:'🔮',  nombre:'Mago',     desc:'XP x1.5, menos HP',  stats:{ hp:70, fuerza:5, stamina:60,xpMult:1.5 } },
  { id:'arquero',  emoji:'🏹',  nombre:'Arquero',  desc:'Equilibrado, veloz',  stats:{ hp:90, fuerza:9, stamina:55,xpMult:1.2 } },
  { id:'ladron',   emoji:'🗡️',  nombre:'Ladrón',   desc:'+Oro, críticos',      stats:{ hp:80, fuerza:8, stamina:50,xpMult:1.1 } },
];

const COLORES = [
  { id:'azul',     hex:'#3060c0' },
  { id:'rojo',     hex:'#c02020' },
  { id:'verde',    hex:'#208040' },
  { id:'morado',   hex:'#8030c0' },
  { id:'dorado',   hex:'#c09020' },
  { id:'negro',    hex:'#202030' },
  { id:'blanco',   hex:'#d0d0e0' },
  { id:'naranja',  hex:'#c06010' },
];

const ARMAS = [
  { id:'espada',  emoji:'⚔️',  nombre:'Espada',   desc:'+Daño directo'  },
  { id:'hacha',   emoji:'🪓',  nombre:'Hacha',    desc:'+Daño área'     },
  { id:'arco',    emoji:'🏹',  nombre:'Arco',     desc:'+Alcance'       },
  { id:'baston',  emoji:'🪄',  nombre:'Bastón',   desc:'+XP bonus'      },
  { id:'daga',    emoji:'🗡️',  nombre:'Daga',     desc:'+Críticos'      },
  { id:'escudo',  emoji:'🛡️',  nombre:'Escudo',   desc:'+Defensa'       },
  { id:'lanza',   emoji:'🔱',  nombre:'Lanza',    desc:'+Alcance medio' },
  { id:'martillo',emoji:'🔨',  nombre:'Martillo', desc:'+Rompe armadura'},
];

// ── ESTADO DE SELECCIÓN ──
let seleccion = {
  nombre: '',
  raza: null,
  clase: null,
  color: null,
  arma: null,
};

// ── INICIALIZAR ──
window.onload = () => {
  // Si ya hay personaje creado, ir directo al juego
  const guardado = localStorage.getItem('personaje-creado');
  if (guardado) {
    window.location.href = 'index.html';
    return;
  }

  renderRazas();
  renderClases();
  renderColores();
  renderArmas();
  actualizarPreview();
  iniciarCanvasPreview();
};

// ── RENDER RAZAS ──
function renderRazas() {
  const grid = document.getElementById('razas-grid');
  grid.innerHTML = '';
  RAZAS.forEach(r => {
    const div = document.createElement('div');
    div.className = 'opcion-item';
    div.onclick = () => seleccionar('raza', r.id, div);
    div.innerHTML = `
      <span class="opcion-emoji">${r.emoji}</span>
      <span class="opcion-nombre">${r.nombre}</span>
      <span class="opcion-desc">${r.desc}</span>`;
    grid.appendChild(div);
  });
}

// ── RENDER CLASES ──
function renderClases() {
  const grid = document.getElementById('clases-grid');
  grid.innerHTML = '';
  CLASES.forEach(c => {
    const div = document.createElement('div');
    div.className = 'opcion-item';
    div.onclick = () => seleccionar('clase', c.id, div);
    div.innerHTML = `
      <span class="opcion-emoji">${c.emoji}</span>
      <span class="opcion-nombre">${c.nombre}</span>
      <span class="opcion-desc">${c.desc}</span>`;
    grid.appendChild(div);
  });
}

// ── RENDER COLORES ──
function renderColores() {
  const grid = document.getElementById('colores-grid');
  grid.innerHTML = '';
  COLORES.forEach(c => {
    const div = document.createElement('div');
    div.className = 'color-item';
    div.style.background = c.hex;
    div.title = c.id;
    div.onclick = () => {
      document.querySelectorAll('.color-item').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
      seleccion.color = c.id;
      actualizarPreview();
    };
    grid.appendChild(div);
  });
}

// ── RENDER ARMAS ──
function renderArmas() {
  const grid = document.getElementById('armas-grid');
  grid.innerHTML = '';
  ARMAS.forEach(a => {
    const div = document.createElement('div');
    div.className = 'opcion-item';
    div.onclick = () => seleccionar('arma', a.id, div);
    div.innerHTML = `
      <span class="opcion-emoji">${a.emoji}</span>
      <span class="opcion-nombre">${a.nombre}</span>
      <span class="opcion-desc">${a.desc}</span>`;
    grid.appendChild(div);
  });
}

// ── SELECCIONAR OPCIÓN ──
function seleccionar(tipo, id, elemento) {
  // Desmarcar anteriores del mismo tipo
  const grid = elemento.parentElement;
  grid.querySelectorAll('.opcion-item').forEach(el => el.classList.remove('selected'));
  elemento.classList.add('selected');
  seleccion[tipo] = id;
  actualizarPreview();
  validarFormulario();
}

// ── ACTUALIZAR PREVIEW ──
function actualizarPreview() {
  const nombre = document.getElementById('input-nombre').value.trim() || 'Aventurero';
  seleccion.nombre = nombre;
  document.getElementById('preview-name').textContent = nombre;

  const clase = CLASES.find(c => c.id === seleccion.clase);
  const raza  = RAZAS.find(r => r.id === seleccion.raza);

  if (clase) {
    document.getElementById('preview-class').textContent = `${clase.emoji} ${clase.nombre}${raza ? ' · ' + raza.nombre : ''}`;
  } else {
    document.getElementById('preview-class').textContent = 'Elige tu clase';
  }

  // Stats preview
  const stats = document.getElementById('preview-stats');
  if (clase) {
    const hp      = clase.stats.hp      + (raza?.bonus.hp      || 0);
    const fuerza  = clase.stats.fuerza  + (raza?.bonus.fuerza  || 0);
    const stamina = clase.stats.stamina + (raza?.bonus.stamina  || 0);
    const xpMult  = clase.stats.xpMult;
    stats.innerHTML = `
      <div class="preview-stat">❤ HP <span>${hp}</span></div>
      <div class="preview-stat">⚡ Fuerza <span>${fuerza}</span></div>
      <div class="preview-stat">🌿 Stamina <span>${stamina}</span></div>
      <div class="preview-stat">✨ XP x<span>${xpMult}</span></div>`;
  } else {
    stats.innerHTML = '';
  }

  dibujarPreview();
}

// ── CANVAS PREVIEW ──
const PREVIEW_W = 200, PREVIEW_H = 220;
let previewAnim = 0;

function iniciarCanvasPreview() {
  const canvas = document.getElementById('preview-canvas');
  canvas.width  = PREVIEW_W;
  canvas.height = PREVIEW_H;
  animarPreview();
}

function animarPreview() {
  dibujarPreview();
  previewAnim++;
  requestAnimationFrame(animarPreview);
}

function dibujarPreview() {
  const canvas = document.getElementById('preview-canvas');
  const ctx = canvas.getContext('2d');
  const W = PREVIEW_W, H = PREVIEW_H;

  ctx.clearRect(0, 0, W, H);

  // Fondo
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d1a3a');
  bg.addColorStop(1, '#1a1a26');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Suelo
  ctx.fillStyle = '#2a2a4a';
  ctx.fillRect(0, H * .75, W, H * .25);

  // Línea suelo
  ctx.strokeStyle = 'rgba(255,255,255,.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H * .75);
  ctx.lineTo(W, H * .75);
  ctx.stroke();

  // Dibujar sprite del personaje
  dibujarSprite(ctx, W / 2, H * .72);
}

function dibujarSprite(ctx, x, y) {
  const clase = seleccion.clase || 'guerrero';
  const color = COLORES.find(c => c.id === seleccion.color)?.hex || '#3060c0';
  const arma  = seleccion.arma  || null;
  const bob   = Math.sin(previewAnim * .05) * 3;

  ctx.save();
  ctx.translate(x, y + bob);

  // ── CUERPO BASE ──
  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Piernas
  ctx.fillStyle = color;
  ctx.fillRect(-12, 20, 10, 28);
  ctx.fillRect(2,   20, 10, 28);

  // Botas
  ctx.fillStyle = '#3a2a10';
  ctx.fillRect(-13, 42, 12, 8);
  ctx.fillRect(1,   42, 12, 8);

  // Cuerpo / túnica
  ctx.fillStyle = color;
  ctx.fillRect(-14, -10, 28, 32);

  // Cinturón
  ctx.fillStyle = '#5a3a10';
  ctx.fillRect(-14, 16, 28, 5);

  // Detalles del cinturón
  ctx.fillStyle = '#c89820';
  ctx.fillRect(-3, 17, 6, 3);

  // Cuello / piel
  ctx.fillStyle = '#e8c090';
  ctx.fillRect(-5, -14, 10, 8);

  // Cabeza
  const razaActual = RAZAS.find(r => r.id === seleccion.raza);
  const esOrco = seleccion.raza === 'orco' || seleccion.raza === 'elfo-oscuro';
  const esElfo  = seleccion.raza === 'elfo';

  ctx.fillStyle = esOrco ? '#6a9a40' : '#e8c090';
  ctx.beginPath();
  ctx.ellipse(0, -26, 14, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Orejas de elfo
  if (esElfo || seleccion.raza === 'elfo-oscuro') {
    ctx.fillStyle = esElfo ? '#e8c090' : '#5a7a30';
    ctx.beginPath(); ctx.ellipse(-16, -26, 5, 8, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 16, -26, 5, 8,  0.5, 0, Math.PI * 2); ctx.fill();
  }

  // Ojos
  ctx.fillStyle = '#fff';
  ctx.fillRect(-7, -30, 5, 4);
  ctx.fillRect( 2, -30, 5, 4);
  ctx.fillStyle = clase === 'mago' ? '#8030c0' : '#2040a0';
  ctx.fillRect(-6, -29, 3, 3);
  ctx.fillRect( 3, -29, 3, 3);

  // Cejas
  ctx.fillStyle = '#5a3a10';
  ctx.fillRect(-8, -34, 6, 2);
  ctx.fillRect( 2, -34, 6, 2);

  // PELO / CASCO según clase
  if (clase === 'guerrero') {
    // Casco metálico
    ctx.fillStyle = '#808090';
    ctx.beginPath(); ctx.ellipse(0, -34, 15, 12, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillRect(-15, -34, 30, 6);
    ctx.fillStyle = '#c0c0d0';
    ctx.fillRect(-2, -46, 4, 14);
    ctx.fillStyle = '#a0a0b0';
    ctx.fillRect(-15, -30, 4, 8);
    ctx.fillRect(11,  -30, 4, 8);
  } else if (clase === 'mago') {
    // Sombrero de mago
    ctx.fillStyle = '#4020a0';
    ctx.beginPath();
    ctx.moveTo(-18, -30);
    ctx.lineTo(18,  -30);
    ctx.lineTo(8,   -60);
    ctx.lineTo(-8,  -60);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#6030c0';
    ctx.fillRect(-20, -33, 40, 6);
    // Estrella en el sombrero
    ctx.fillStyle = '#f0c040';
    ctx.font = '10px serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', 0, -44);
  } else if (clase === 'arquero') {
    // Capucha verde
    ctx.fillStyle = '#205020';
    ctx.beginPath(); ctx.ellipse(0, -34, 16, 14, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillRect(-16, -34, 32, 10);
    ctx.fillStyle = '#306030';
    ctx.beginPath(); ctx.moveTo(-4, -44); ctx.lineTo(4, -44); ctx.lineTo(2, -58); ctx.lineTo(-2, -58); ctx.closePath(); ctx.fill();
  } else if (clase === 'ladron') {
    // Capucha oscura
    ctx.fillStyle = '#202030';
    ctx.beginPath(); ctx.ellipse(0, -32, 15, 13, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillRect(-15, -32, 30, 8);
    // Máscara
    ctx.fillStyle = '#101018';
    ctx.fillRect(-8, -28, 16, 6);
  }

  // HOMBROS / HOMBRERA
  ctx.fillStyle = clase === 'guerrero' ? '#707080' : color;
  ctx.beginPath(); ctx.ellipse(-16, -5, 7, 5, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 16, -5, 7, 5,  0.3, 0, Math.PI * 2); ctx.fill();

  // BRAZOS
  ctx.fillStyle = '#e8c090';
  // Brazo izquierdo (sin arma)
  ctx.fillRect(-24, -5, 8, 22);
  // Brazo derecho (con arma)
  const armBob = Math.sin(previewAnim * .05) * 2;
  ctx.fillRect(16, -5 + armBob, 8, 20);

  // ARMA
  if (arma) dibujarArma(ctx, arma, armBob);

  // Brillo en el pecho
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.fillRect(-10, -8, 6, 18);

  ctx.restore();
}

function dibujarArma(ctx, armaId, bob) {
  ctx.save();
  ctx.translate(28, -2 + bob);

  switch(armaId) {
    case 'espada':
      // Guarda
      ctx.fillStyle = '#c89820';
      ctx.fillRect(-6, 8, 12, 4);
      // Hoja
      ctx.fillStyle = '#d0d0e0';
      ctx.fillRect(-2, -28, 4, 38);
      ctx.fillStyle = '#e8e8f8';
      ctx.fillRect(-1, -28, 2, 36);
      // Punta
      ctx.beginPath(); ctx.moveTo(-2, -28); ctx.lineTo(2, -28); ctx.lineTo(0, -40); ctx.closePath();
      ctx.fillStyle = '#d0d0e0'; ctx.fill();
      // Mango
      ctx.fillStyle = '#5a3a10';
      ctx.fillRect(-3, 12, 6, 14);
      break;

    case 'hacha':
      // Mango
      ctx.fillStyle = '#5a3a10';
      ctx.fillRect(-2, -20, 4, 45);
      // Hoja
      ctx.fillStyle = '#9090a0';
      ctx.beginPath();
      ctx.moveTo(0, -20); ctx.lineTo(20, -30); ctx.lineTo(22, -8); ctx.lineTo(0, -4);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b0b0c0';
      ctx.beginPath();
      ctx.moveTo(0, -20); ctx.lineTo(18, -28); ctx.lineTo(20, -10); ctx.lineTo(0, -6);
      ctx.closePath(); ctx.fill();
      break;

    case 'arco':
      // Arco
      ctx.strokeStyle = '#5a3a10';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(-8, 0, 28, -Math.PI * .55, Math.PI * .55);
      ctx.stroke();
      // Cuerda
      ctx.strokeStyle = '#e0d0a0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, -15); ctx.lineTo(10, 15);
      ctx.stroke();
      // Flecha
      ctx.fillStyle = '#c89820';
      ctx.fillRect(-5, -1, 20, 2);
      ctx.fillStyle = '#909090';
      ctx.beginPath(); ctx.moveTo(15,-3); ctx.lineTo(22,0); ctx.lineTo(15,3); ctx.closePath(); ctx.fill();
      break;

    case 'baston':
      // Palo
      ctx.fillStyle = '#4a2a08';
      ctx.fillRect(-3, -40, 6, 60);
      // Orbe
      const og = ctx.createRadialGradient(0,-42,0,0,-42,12);
      og.addColorStop(0,'#c080ff'); og.addColorStop(.6,'#8030c0'); og.addColorStop(1,'transparent');
      ctx.fillStyle = og;
      ctx.beginPath(); ctx.arc(0,-42,12,0,Math.PI*2); ctx.fill();
      // Brillo orbe
      ctx.fillStyle='rgba(255,255,255,.4)';
      ctx.beginPath(); ctx.arc(-3,-46,4,0,Math.PI*2); ctx.fill();
      break;

    case 'daga':
      // Hoja corta
      ctx.fillStyle = '#c0c0d0';
      ctx.fillRect(-2, -16, 4, 24);
      ctx.beginPath(); ctx.moveTo(-2,-16); ctx.lineTo(2,-16); ctx.lineTo(0,-26); ctx.closePath();
      ctx.fill();
      // Guarda
      ctx.fillStyle = '#c89820';
      ctx.fillRect(-6, 8, 12, 3);
      // Mango
      ctx.fillStyle = '#202030';
      ctx.fillRect(-3, 11, 6, 10);
      break;

    case 'escudo':
      ctx.translate(-50, 0);
      // Escudo
      ctx.fillStyle = '#707080';
      ctx.beginPath();
      ctx.moveTo(0, -20); ctx.lineTo(20, -20); ctx.lineTo(22, 10); ctx.lineTo(10, 22); ctx.lineTo(-2, 10);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#9090a0';
      ctx.beginPath();
      ctx.moveTo(2, -18); ctx.lineTo(18, -18); ctx.lineTo(20, 8); ctx.lineTo(10, 18); ctx.lineTo(0, 8);
      ctx.closePath(); ctx.fill();
      // Emblema
      ctx.fillStyle = '#c89820';
      ctx.font = '14px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('⚔', 10, 0);
      break;

    case 'lanza':
      // Palo
      ctx.fillStyle = '#5a3a10';
      ctx.fillRect(-2, -50, 4, 70);
      // Punta
      ctx.fillStyle = '#c0c0d0';
      ctx.beginPath(); ctx.moveTo(-4,-50); ctx.lineTo(4,-50); ctx.lineTo(2,-72); ctx.lineTo(-2,-72); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d0d0e0';
      ctx.beginPath(); ctx.moveTo(-1,-50); ctx.lineTo(1,-50); ctx.lineTo(0,-70); ctx.closePath(); ctx.fill();
      break;

    case 'martillo':
      // Mango
      ctx.fillStyle = '#5a3a10';
      ctx.fillRect(-3, -20, 6, 50);
      // Cabeza
      ctx.fillStyle = '#808090';
      ctx.fillRect(-14, -28, 28, 18);
      ctx.fillStyle = '#9090a0';
      ctx.fillRect(-12, -26, 24, 14);
      // Detalle
      ctx.fillStyle = '#c89820';
      ctx.fillRect(-14, -22, 28, 4);
      break;
  }

  ctx.restore();
}

// ── VALIDAR FORMULARIO ──
function validarFormulario() {
  const { nombre, raza, clase, color, arma } = seleccion;
  const valido = nombre && raza && clase && color && arma;
  document.getElementById('btn-comenzar').disabled = !valido;
}

// ── COMENZAR AVENTURA ──
async function comenzarAventura() {
  const clase = CLASES.find(c => c.id === seleccion.clase);
  const raza  = RAZAS.find(r  => r.id === seleccion.raza);
  const arma  = ARMAS.find(a  => a.id === seleccion.arma);

  const hp      = clase.stats.hp      + raza.bonus.hp;
  const fuerza  = clase.stats.fuerza  + raza.bonus.fuerza;
  const stamina = clase.stats.stamina + raza.bonus.stamina;

  // Guardar en BD
  await fetch(`${API}/personaje`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre:       seleccion.nombre,
      hp:           hp,
      hp_max:       hp,
      fuerza:       fuerza,
      stamina:      stamina,
      stamina_max:  stamina,
    })
  });

  // Guardar configuración visual en localStorage
  localStorage.setItem('personaje-config', JSON.stringify({
    clase:  seleccion.clase,
    raza:   seleccion.raza,
    color:  seleccion.color,
    arma:   seleccion.arma,
    xpMult: clase.stats.xpMult,
  }));

  localStorage.setItem('personaje-creado', 'true');

  // Ir al juego
  window.location.href = 'index.html';
}