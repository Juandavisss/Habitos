const API = 'http://127.0.0.1:8000';

// ── CLASES por nivel ──
const CLASES = [
  { nivel: 1,  nombre: 'Iniciado',  avatar: '🧙' },
  { nivel: 3,  nombre: 'Guerrero',  avatar: '⚔️' },
  { nivel: 5,  nombre: 'Héroe',     avatar: '🛡️' },
  { nivel: 8,  nombre: 'Leyenda',   avatar: '🌟' },
  { nivel: 12, nombre: 'Semidiós',  avatar: '⚡' },
];

// ── MISIONES por defecto ──
const MISIONES_DEFAULT = [
  { nombre: 'Comer 3000 kcal hoy',        icono: '🍖', xp_reward: 25, oro_reward: 10, hp_penalty: 15, stamina_bonus: 5  },
  { nombre: 'Beber 2.5L de agua',          icono: '💧', xp_reward: 15, oro_reward: 5,  hp_penalty: 10, stamina_bonus: 3  },
  { nombre: 'Ejercicio o caminar 30min',   icono: '⚡', xp_reward: 30, oro_reward: 15, hp_penalty: 0,  stamina_bonus: 8  },
  { nombre: 'Sin malos hábitos hoy',       icono: '🛡', xp_reward: 35, oro_reward: 20, hp_penalty: 25, stamina_bonus: 0  },
  { nombre: 'Dormir +7 horas (anoche)',    icono: '🌙', xp_reward: 20, oro_reward: 8,  hp_penalty: 12, stamina_bonus: 10 },
  { nombre: 'Estudiar / Avanzar en curso', icono: '📚', xp_reward: 40, oro_reward: 25, hp_penalty: 5,  stamina_bonus: 0  },
];

// ── Al cargar la página ──
window.onload = async () => {
  mostrarFecha();
  await cargarMisiones();
  await cargarPersonaje();
  await cargarInventario();
};

// ── Fecha de hoy ──
function mostrarFecha() {
  const hoy = new Date();
  document.getElementById('fecha').textContent =
    hoy.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
}

// ── Cargar personaje desde el backend ──
async function cargarPersonaje() {
  const res  = await fetch(`${API}/personaje`);
  const data = await res.json();
  renderPersonaje(data);
}

// ── Pintar personaje en pantalla ──
function renderPersonaje(p) {
  const cls = [...CLASES].reverse().find(c => p.nivel >= c.nivel) || CLASES[0];

  document.getElementById('avatar').textContent    = cls.avatar;
  document.getElementById('nombre').textContent    = p.nombre;
  document.getElementById('clase').textContent     = `★ ${cls.nombre} ★`;

  // Barras
  setBar('hp',      p.hp,      p.hp_max);
  setBar('xp',      p.xp,      p.xp_siguiente);
  setBar('stamina', p.stamina, p.stamina_max);

  // Stats
  document.getElementById('stat-nivel').textContent  = p.nivel;
  document.getElementById('stat-fuerza').textContent = p.fuerza;
  document.getElementById('stat-oro').textContent    = p.oro;
  document.getElementById('stat-racha').textContent  = p.racha;
  document.getElementById('stat-kills').textContent  = p.kills;
  document.getElementById('stat-boss').textContent   = p.boss_streak;
}

// ── Función para actualizar una barra ──
function setBar(nombre, valor, maximo) {
  const pct = Math.max(0, Math.min(100, (valor / maximo) * 100));
  document.getElementById(`${nombre}-bar`).style.width   = pct + '%';
  document.getElementById(`${nombre}-label`).textContent = `${valor}/${maximo}`;
}

// ── Cargar misiones ──
async function cargarMisiones() {
  const res  = await fetch(`${API}/misiones`);
  const data = await res.json();

  // Si no hay misiones hoy, las creamos
  if (data.length === 0) {
    await crearMisionesDelDia();
    return cargarMisiones();
  }

  renderMisiones(data);
}

// ── Crear misiones del día en la base de datos ──
async function crearMisionesDelDia() {
  for (const m of MISIONES_DEFAULT) {
    await fetch(`${API}/misiones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m)
    });
  }
}

// ── Pintar misiones en pantalla ──
function renderMisiones(misiones) {
  const lista = document.getElementById('misiones-lista');
  lista.innerHTML = '';

  misiones.forEach(m => {
    const div = document.createElement('div');
    div.className = 'mision-item' +
      (m.completada === true ? ' completada' : m.completada === false ? ' fallada' : '');

    div.innerHTML = `
      <div class="mision-icono">${m.icono}</div>
      <div class="mision-info">
        <div class="mision-nombre">${m.nombre}</div>
        <div class="mision-reward">
          <span class="xp">+${m.xp_reward} XP</span> &nbsp;
          <span class="gold">+${m.oro_reward} oro</span>
          ${m.hp_penalty ? `&nbsp;<span class="penalt">-${m.hp_penalty} HP si fallas</span>` : ''}
        </div>
      </div>
      <div class="btn-group">
        <button class="btn-ok"   onclick="accionMision(${m.id}, true)"  ${m.completada !== null ? 'disabled' : ''}>✔ Hecho</button>
        <button class="btn-fail" onclick="accionMision(${m.id}, false)" ${m.completada !== null ? 'disabled' : ''}>✘ Fallé</button>
      </div>`;

    lista.appendChild(div);
  });
}

// ── Completar o fallar una misión ──
async function accionMision(id, completada) {
  // 1. Actualizar misión en la BD
  await fetch(`${API}/misiones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completada })
  });

  // 2. Obtener personaje actual
  const res = await fetch(`${API}/personaje`);
  const p   = await res.json();

  // 3. Obtener la misión para saber sus valores
  const resMisiones = await fetch(`${API}/misiones`);
  const misiones    = await resMisiones.json();
  const mision      = misiones.find(m => m.id === id);

  // 4. Calcular nuevos stats
  let cambios = {};

  if (completada) {
    cambios.xp      = p.xp + mision.xp_reward;
    cambios.oro     = p.oro + mision.oro_reward;
    cambios.stamina = Math.min(p.stamina_max, p.stamina + mision.stamina_bonus);
    cambios.kills   = p.kills + 1;
  } else {
    cambios.hp = Math.max(0, p.hp - mision.hp_penalty);
    if (mision.icono === '🛡') cambios.boss_streak = 0;
  }

  // 5. Subida de nivel
  let nivel      = p.nivel;
  let xp         = cambios.xp ?? p.xp;
  let xpSig      = p.xp_siguiente;
  let hpMax      = p.hp_max;
  let staminaMax = p.stamina_max;
  let fuerza     = p.fuerza;

  while (xp >= xpSig) {
    xp    -= xpSig;
    nivel++;
    xpSig  = Math.floor(xpSig * 1.4);
    hpMax += 20;
    staminaMax += 5;
    fuerza += 2;
  }

  cambios.nivel        = nivel;
  cambios.xp           = xp;
  cambios.xp_siguiente = xpSig;
  cambios.hp_max       = hpMax;
  cambios.stamina_max  = staminaMax;
  cambios.fuerza       = fuerza;

  // 6. Guardar en la BD
  await fetch(`${API}/personaje`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cambios)
  });

  // 7. Refrescar pantalla
  await cargarPersonaje();
  await cargarMisiones();
}

// ── Cargar inventario ──
async function cargarInventario() {
  const res  = await fetch(`${API}/inventario`);
  const data = await res.json();
  renderInventario(data);
}

// ── Pintar inventario ──
function renderInventario(items) {
  const grid = document.getElementById('inventario-grid');
  grid.className = 'inventario-grid';
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = '<p class="inv-vacio">Aún no tienes equipo. ¡Derrota enemigos!</p>';
    return;
  }

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'inv-item';
    div.innerHTML = `${item.emoji}<span>${item.nombre}</span>`;
    grid.appendChild(div);
  });
}

// ── Nuevo día ──
async function resetDia() {
  if (!confirm('¿Empezar un nuevo día? Las misiones se reinician.')) return;
  await crearMisionesDelDia();
  await cargarMisiones();
}

// ════════════════════════════════════════════════════════════
//  BATTLE BANNER ENGINE
// ════════════════════════════════════════════════════════════
const cv  = document.getElementById('battle-canvas');
const cx  = cv.getContext('2d');

function resizeCv() {
  cv.width  = cv.offsetWidth  || 700;
  cv.height = cv.offsetHeight || 200;
}
resizeCv();
window.addEventListener('resize', resizeCv);

const ZONES = [
  {
    name: 'CIUDAD DE ORIGEN', sky: ['#0d1a3a','#162040'], ground: ['#2a2a4a','#1a1a30'],
    details: (W,H) => {
      cx.fillStyle='#1e1e38';
      for(let x=0;x<W;x+=28) for(let y=H*.72;y<H;y+=14){ cx.fillRect(x+(y%28==0?4:0),y,26,12); }
      [[W*.18,H*.52],[W*.5,H*.52]].forEach(([tx,ty])=>{
        cx.fillStyle='#3a2010'; cx.fillRect(tx-3,ty,6,18);
        const fl=.5+.5*Math.sin(bAnim*.12);
        cx.fillStyle=`rgba(255,${120+fl*80},20,${.7+fl*.3})`;
        cx.beginPath(); cx.ellipse(tx,ty-8+fl*3,5,10,0,0,Math.PI*2); cx.fill();
      });
    }
  },
  {
    name: 'BOSQUE MALDITO', sky: ['#071a07','#0d2a0d'], ground: ['#0a2a0a','#061506'],
    details: (W,H) => {
      [[W*.08,H*.28],[W*.22,H*.22],[W*.38,H*.3],[W*.55,H*.25],[W*.7,H*.3],[W*.85,H*.24],[W*.95,H*.28]].forEach(([tx,ty])=>{
        cx.fillStyle='#2a1a08'; cx.fillRect(tx-5,ty,10,H-ty);
        cx.fillStyle='#0a3a0a'; cx.beginPath(); cx.moveTo(tx,ty-40); cx.lineTo(tx-22,ty+20); cx.lineTo(tx+22,ty+20); cx.closePath(); cx.fill();
        cx.fillStyle='#0d4a0d'; cx.beginPath(); cx.moveTo(tx,ty-60); cx.lineTo(tx-18,ty); cx.lineTo(tx+18,ty); cx.closePath(); cx.fill();
      });
      for(let i=0;i<6;i++){
        const fx=W*(.1+i*.15)+Math.sin(bAnim*.03+i)*20;
        const fy=H*(.55+.1*Math.cos(bAnim*.04+i*1.3));
        const fa=.4+.6*Math.sin(bAnim*.08+i*2);
        cx.fillStyle=`rgba(160,255,100,${fa})`; cx.beginPath(); cx.arc(fx,fy,2,0,Math.PI*2); cx.fill();
      }
    }
  },
  {
    name: 'LAGO DE LAS SOMBRAS', sky: ['#050d1a','#080d20'], ground: ['#05101e','#030c18'],
    details: (W,H) => {
      const wY=H*.55;
      cx.fillStyle='#0a1830'; cx.fillRect(0,wY,W,H-wY);
      for(let r=0;r<5;r++){
        const rp=(bAnim*.015+r*.4)%1; const rw=rp*W*.35; const ra=1-rp;
        cx.strokeStyle=`rgba(60,140,220,${ra*.4})`; cx.lineWidth=1.5;
        cx.beginPath(); cx.ellipse(W*.5,wY+8,rw,rw*.25,0,0,Math.PI*2); cx.stroke();
      }
      cx.fillStyle='#d0d8e8'; cx.beginPath(); cx.arc(W*.8,H*.2,18,0,Math.PI*2); cx.fill();
      cx.fillStyle='#050d1a'; cx.beginPath(); cx.arc(W*.8+6,H*.2-3,14,0,Math.PI*2); cx.fill();
    }
  },
  {
    name: 'DESIERTO DE HUESOS', sky: ['#1e0e04','#2a1208'], ground: ['#4a2e10','#3a2208'],
    details: (W,H) => {
      cx.fillStyle='#3a2a10';
      cx.beginPath(); cx.moveTo(0,H*.72); cx.quadraticCurveTo(W*.25,H*.58,W*.5,H*.68); cx.quadraticCurveTo(W*.75,H*.78,W,H*.65); cx.lineTo(W,H); cx.lineTo(0,H); cx.closePath(); cx.fill();
      cx.fillStyle='rgba(220,80,20,.8)'; cx.beginPath(); cx.arc(W*.15,H*.25,24,0,Math.PI*2); cx.fill();
      [[W*.3,H*.74],[W*.6,H*.71],[W*.8,H*.76]].forEach(([sx,sy])=>{
        cx.font='16px serif'; cx.textAlign='center'; cx.fillText('💀',sx,sy);
      });
    }
  },
  {
    name: 'INFIERNO', sky: ['#1a0202','#250404'], ground: ['#3a0808','#250404'],
    details: (W,H) => {
      [W*.1,W*.35,W*.65,W*.9].forEach((fx,fi)=>{
        const fh=30+15*Math.sin(bAnim*.08+fi);
        const grd=cx.createLinearGradient(fx,H*.65-fh,fx,H*.65);
        grd.addColorStop(0,'transparent'); grd.addColorStop(.5,`rgba(255,${60+fi*20},0,.7)`); grd.addColorStop(1,'rgba(255,200,0,.9)');
        cx.fillStyle=grd; cx.beginPath(); cx.ellipse(fx,H*.65,12,fh,0,0,Math.PI*2); cx.fill();
      });
      for(let e=0;e<12;e++){
        const ex=(e*83+bAnim*1.5)%W; const ey=H*(.4+.4*((e*47+bAnim*.5)%1));
        const ea=.6+.4*Math.sin(bAnim*.1+e);
        cx.fillStyle=`rgba(255,${80+ea*100},0,${ea*.8})`; cx.beginPath(); cx.arc(ex,ey,1.5,0,Math.PI*2); cx.fill();
      }
    }
  },
  {
    name: 'SANCTUM DEL DRAGÓN', sky: ['#08030f','#100518'], ground: ['#180830','#0d0520'],
    details: (W,H) => {
      const ng=cx.createRadialGradient(W*.5,H*.3,0,W*.5,H*.3,W*.4);
      ng.addColorStop(0,`rgba(100,20,180,${.08+.04*Math.sin(bAnim*.03)})`); ng.addColorStop(1,'transparent');
      cx.fillStyle=ng; cx.fillRect(0,0,W,H);
      [[W*.05,H*.3],[W*.95,H*.3]].forEach(([px,py])=>{
        cx.fillStyle='#1a0a30'; cx.fillRect(px-10,py,20,H-py);
        cx.fillStyle='#2a1050'; cx.fillRect(px-13,py-6,26,10);
      });
    }
  },
];

const ZONE_ENEMIES = [
  [{ emoji:'🐀', name:'Rata de Alcantarilla', hp:30,  maxHp:30,  xpDrop:15, goldDrop:5  }],
  [{ emoji:'🐺', name:'Lobo del Bosque',      hp:60,  maxHp:60,  xpDrop:30, goldDrop:12, item:{emoji:'🪖',name:'Casco del Novato'} },
   { emoji:'🕷', name:'Araña Venenosa',       hp:40,  maxHp:40,  xpDrop:20, goldDrop:8  }],
  [{ emoji:'🦈', name:'Tiburón Sombrío',      hp:90,  maxHp:90,  xpDrop:45, goldDrop:20, item:{emoji:'🛡',name:'Escudo de Espumas'} }],
  [{ emoji:'🦂', name:'Escorpión del Desierto',hp:110,maxHp:110, xpDrop:55, goldDrop:28, item:{emoji:'⚔',name:'Espada de Arena'} }],
  [{ emoji:'😈', name:'Demonio de Fuego',     hp:150, maxHp:150, xpDrop:75, goldDrop:40, item:{emoji:'🪓',name:'Hacha Infernal'} },
   { emoji:'💀', name:'Señor de los Muertos', hp:120, maxHp:120, xpDrop:60, goldDrop:30, item:{emoji:'🏹',name:'Arco Maldito'} }],
  [{ emoji:'🐉', name:'DRAGÓN FINAL',         hp:300, maxHp:300, xpDrop:200,goldDrop:100,item:{emoji:'👑',name:'Corona del Dragón'} }],
];

const BS = {
  zoneIdx:0, enemyIdx:0, enemy:null,
  phase:'walking', phaseTimer:0,
  charX:0, charY:0, charBobPhase:0, charAttackAnim:0,
  enemyShakeX:0, enemyDeathAlpha:1,
  floats:[], orbs:[],
  droppedItem:null, itemAlpha:0,
  flashAlpha:0, flashColor:'#fff',
  transAlpha:0, transDir:0,
};

let bAnim = 0;

function initBattle() {
  BS.enemy = { ...ZONE_ENEMIES[0][0] };
  BS.phase = 'walking';
  BS.charX = 0;
  document.getElementById('zone-title').textContent = ZONES[0].name;
  requestAnimationFrame(drawBattle);
}

function addFloat(text, x, y, color='#fff') {
  BS.floats.push({ text, x, y, vy:-1.2, alpha:1, color, life:1 });
}

function addOrb(x, y) {
  BS.orbs.push({ x, y, alpha:1, size:5, speed:.06 });
}

function drawBattle() {
  const W = cv.width, H = cv.height;
  if (!W || !H) { requestAnimationFrame(drawBattle); return; }
  bAnim++;
  cx.clearRect(0,0,W,H);

  const zone = ZONES[BS.zoneIdx];
  const skyG = cx.createLinearGradient(0,0,0,H*.75);
  skyG.addColorStop(0, zone.sky[0]); skyG.addColorStop(1, zone.sky[1]);
  cx.fillStyle=skyG; cx.fillRect(0,0,W,H);

  const grdG = cx.createLinearGradient(0,H*.65,0,H);
  grdG.addColorStop(0, zone.ground[0]); grdG.addColorStop(1, zone.ground[1]);
  cx.fillStyle=grdG; cx.fillRect(0,H*.65,W,H*.35);

  zone.details(W,H);

  cx.strokeStyle='rgba(255,255,255,.08)'; cx.lineWidth=1;
  cx.beginPath(); cx.moveTo(0,H*.65); cx.lineTo(W,H*.65); cx.stroke();

  const floorY = H*.62;
  if (BS.charX===0) { BS.charX=W*.05; BS.charY=floorY; }

  // ── FASES ──
  if (BS.phase==='walking') {
    BS.charBobPhase+=.15;
    BS.charX += W*.004;
    if (BS.charX >= W*.22) { BS.charX=W*.22; BS.phase='fighting'; BS.phaseTimer=0; }

  } else if (BS.phase==='fighting') {
    BS.charBobPhase+=.05;
    BS.phaseTimer++;
    if (BS.charAttackAnim>0) BS.charAttackAnim=Math.max(0,BS.charAttackAnim-.04);
    if (BS.phaseTimer%80===0) BS.charAttackAnim=1;

    if (BS.phaseTimer%80===40 && BS.enemy) {
      const dmg=8+Math.floor(Math.random()*6);
      BS.enemy.hp=Math.max(0,BS.enemy.hp-dmg);
      BS.enemyShakeX=8; BS.flashAlpha=.2; BS.flashColor='#ff4040';
      addFloat(`-${dmg}`, W*.65+(Math.random()-.5)*20, floorY-40, '#ff6060');

      if (BS.enemy.hp<=0) {
        BS.phase='victory'; BS.phaseTimer=0;
        BS.flashAlpha=.5; BS.flashColor='#ffdd40';
        for(let i=0;i<5;i++) addOrb(W*.65+(Math.random()-.5)*30, floorY-20);
        addFloat(`+${BS.enemy.xpDrop} XP`,  W*.5, floorY-60, '#b080ff');
        addFloat(`+${BS.enemy.goldDrop} ORO`,W*.5, floorY-80, '#f0c040');
        if (BS.enemy.item) {
          BS.droppedItem=BS.enemy.item;
          // Guardar item en BD
          fetch(`${API}/inventario`,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(BS.enemy.item) })
            .then(()=>cargarInventario());
        }
      }
    }

  } else if (BS.phase==='victory') {
    BS.phaseTimer++;
    BS.enemyDeathAlpha=Math.max(0,BS.enemyDeathAlpha-.02);
    if (BS.droppedItem) BS.itemAlpha=Math.min(1,BS.itemAlpha+.04);

    if (BS.phaseTimer>120) {
      BS.droppedItem=null; BS.itemAlpha=0;
      const zone=ZONE_ENEMIES[BS.zoneIdx];
      const next=BS.enemyIdx+1;
      if (next<zone.length) {
        BS.enemyIdx=next;
        BS.enemy={...zone[next]}; BS.enemyDeathAlpha=1; BS.enemyShakeX=0;
        BS.phase='walking'; BS.charX=W*.05;
      } else {
        BS.enemyIdx=0; BS.phase='transition'; BS.phaseTimer=0; BS.transAlpha=0; BS.transDir=1;
      }
    }

  } else if (BS.phase==='transition') {
    if (BS.transDir===1) {
      BS.transAlpha=Math.min(1,BS.transAlpha+.03);
      if (BS.transAlpha>=1) {
        BS.zoneIdx=(BS.zoneIdx+1)%ZONES.length;
        BS.transDir=-1; BS.charX=W*.05;
        BS.enemy={...ZONE_ENEMIES[BS.zoneIdx][0]}; BS.enemyDeathAlpha=1;
        BS.phase='walking';
        document.getElementById('zone-title').textContent=ZONES[BS.zoneIdx].name;
      }
    } else {
      BS.transAlpha=Math.max(0,BS.transAlpha-.025);
    }
  }

  // ── ENEMIGO ──
  if (BS.enemy && BS.phase!=='transition') {
    const ex=W*.65+(BS.enemyShakeX>0?Math.sin(bAnim*.8)*BS.enemyShakeX:0);
    const ey=floorY-8;
    if (BS.enemyShakeX>0) BS.enemyShakeX=Math.max(0,BS.enemyShakeX-.8);

    cx.globalAlpha=BS.enemyDeathAlpha;
    cx.fillStyle=`rgba(0,0,0,.3)`; cx.beginPath(); cx.ellipse(ex,ey+16,22,6,0,0,Math.PI*2); cx.fill();

    const es=Math.min(W,H)*.22;
    cx.font=`${es}px serif`; cx.textAlign='center'; cx.textBaseline='bottom';
    if (BS.phase==='victory') {
      cx.save(); cx.translate(ex,ey); cx.rotate((1-BS.enemyDeathAlpha)*Math.PI*.5); cx.fillText(BS.enemy.emoji,0,0); cx.restore();
    } else {
      cx.fillText(BS.enemy.emoji, ex, ey+Math.sin(bAnim*.04)*4);
    }

    // Barra HP enemigo
    if (BS.phase==='fighting'||BS.phase==='victory') {
      const bw=W*.28,bh=10,bx=ex-bw/2,by=floorY-es*1.1-22;
      cx.globalAlpha=.9;
      cx.fillStyle='#1a0808'; cx.fillRect(bx,by,bw,bh);
      cx.strokeStyle='#600'; cx.lineWidth=1; cx.strokeRect(bx,by,bw,bh);
      const hpPct=Math.max(0,BS.enemy.hp/BS.enemy.maxHp);
      cx.fillStyle=hpPct>.5?'#30c840':hpPct>.25?'#e0a020':'#e02020';
      cx.fillRect(bx+1,by+1,(bw-2)*hpPct,bh-2);
      cx.font=`bold ${Math.max(9,H*.055)}px Inter`; cx.textAlign='center'; cx.textBaseline='middle';
      cx.fillStyle='#fff'; cx.fillText(`${BS.enemy.name}  ${BS.enemy.hp}/${BS.enemy.maxHp}`,ex,by+bh/2);
    }

    // Item drop
    if (BS.droppedItem && BS.itemAlpha>0) {
      cx.globalAlpha=BS.itemAlpha;
      cx.font=`${Math.min(W,H)*.13}px serif`; cx.textAlign='center'; cx.textBaseline='middle';
      cx.fillText(BS.droppedItem.emoji, ex, floorY-10+Math.sin(bAnim*.05)*5);
      cx.font=`bold ${Math.max(8,H*.065)}px Inter`; cx.fillStyle='#60d0ff';
      cx.fillText(BS.droppedItem.name, ex, floorY+Math.min(W,H)*.08);
    }
    cx.globalAlpha=1;
  }

  // ── PERSONAJE ──
  {
    const bob=Math.sin(BS.charBobPhase)*(BS.phase==='walking'?4:2);
    const attackOff=BS.charAttackAnim*W*.07;
    const cx_=BS.charX+attackOff, cy_=BS.charY+bob-8;
    const cs=Math.min(W,H)*.2;

    cx.fillStyle='rgba(0,0,0,.3)'; cx.beginPath(); cx.ellipse(BS.charX,BS.charY+14,18,5,0,0,Math.PI*2); cx.fill();

    if (BS.charAttackAnim>.3) {
      const cg=cx.createRadialGradient(cx_,cy_,0,cx_,cy_,cs*.7);
      cg.addColorStop(0,`rgba(255,220,60,${BS.charAttackAnim*.5})`); cg.addColorStop(1,'transparent');
      cx.fillStyle=cg; cx.beginPath(); cx.arc(cx_,cy_,cs*.7,0,Math.PI*2); cx.fill();
    }

    const clsActual=[...CLASES].reverse().find(c=>c.nivel<=1)||CLASES[0];
    cx.font=`${cs}px serif`; cx.textAlign='center'; cx.textBaseline='bottom';
    cx.fillText(clsActual.avatar, cx_, cy_);

    if (BS.charAttackAnim>.2) {
      cx.save(); cx.strokeStyle=`rgba(255,200,50,${BS.charAttackAnim})`; cx.lineWidth=3;
      cx.shadowColor='#ffcc30'; cx.shadowBlur=10;
      cx.beginPath(); cx.moveTo(cx_+cs*.3,cy_-cs*.4); cx.quadraticCurveTo(cx_+cs*.6+BS.charAttackAnim*W*.08,cy_-cs*.1,cx_+cs*.4,cy_+cs*.3); cx.stroke();
      cx.restore();
    }
  }

  // ── ORBES XP ──
  for(let i=BS.orbs.length-1;i>=0;i--) {
    const o=BS.orbs[i];
    o.x+=(BS.charX-o.x)*(o.speed+.01); o.y+=(BS.charY-o.y)*(o.speed+.01);
    o.speed=Math.min(.15,o.speed+.002);
    if(Math.hypot(o.x-BS.charX,o.y-BS.charY)<10){BS.orbs.splice(i,1);continue;}
    cx.fillStyle=`rgba(180,100,255,.9)`; cx.beginPath(); cx.arc(o.x,o.y,o.size,0,Math.PI*2); cx.fill();
  }

  // ── TEXTOS FLOTANTES ──
  for(let i=BS.floats.length-1;i>=0;i--) {
    const f=BS.floats[i];
    f.y+=f.vy; f.life-=.016; f.alpha=f.life;
    if(f.life<=0){BS.floats.splice(i,1);continue;}
    cx.globalAlpha=f.alpha;
    cx.font=`bold ${Math.max(11,H*.07)}px 'Cinzel',serif`;
    cx.textAlign='center'; cx.textBaseline='middle';
    cx.fillStyle=f.color; cx.shadowColor=f.color; cx.shadowBlur=6;
    cx.fillText(f.text,f.x,f.y);
    cx.shadowBlur=0; cx.globalAlpha=1;
  }

  // ── FLASH ──
  if(BS.flashAlpha>0) {
    cx.fillStyle=BS.flashColor; cx.globalAlpha=BS.flashAlpha;
    cx.fillRect(0,0,W,H); cx.globalAlpha=1;
    BS.flashAlpha=Math.max(0,BS.flashAlpha-.04);
  }

  // ── TRANSICIÓN ──
  if(BS.transAlpha>0) {
    cx.fillStyle='#000'; cx.globalAlpha=BS.transAlpha; cx.fillRect(0,0,W,H);
    if(BS.transAlpha>.6) {
      cx.globalAlpha=(BS.transAlpha-.6)/.4;
      cx.font=`bold ${Math.max(14,H*.1)}px 'Cinzel',serif`;
      cx.textAlign='center'; cx.textBaseline='middle';
      cx.fillStyle='#f0c040';
      cx.fillText(ZONES[BS.zoneIdx]?.name||'',W/2,H/2);
    }
    cx.globalAlpha=1;
  }

  requestAnimationFrame(drawBattle);
}

// Arrancar banner cuando carga la página
window.addEventListener('load', initBattle);