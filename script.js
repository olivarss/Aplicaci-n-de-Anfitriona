let escala = 1;
let modoActual = 'operacion';
let historial = [];
const plano = document.getElementById('plano-bar');

window.onload = () => {
    const saved = localStorage.getItem('mapaBarV9');
    if(saved) {
        plano.innerHTML = saved;
        document.querySelectorAll('.mesa').forEach(configurarMesa);
        document.querySelectorAll('.zona').forEach(configurarZona);
    }
    cambiarModo('operacion');
};

function cambiarModo(val) {
    modoActual = val;
    // Mostrar/Ocultar botones
    document.getElementById('btn-zona').style.display = (val === 'edit-zonas') ? 'inline-block' : 'none';
    document.getElementById('btn-mesa').style.display = (val === 'edit-mesas') ? 'inline-block' : 'none';

    // Bloquear/Desbloquear elementos
    document.querySelectorAll('.mesa').forEach(m => {
        m.classList.toggle('editando', val === 'edit-mesas');
        interact(m).draggable(val === 'edit-mesas').resizable(val === 'edit-mesas');
    });

    document.querySelectorAll('.zona').forEach(z => {
        z.classList.toggle('editando', val === 'edit-zonas');
        z.style.pointerEvents = (val === 'edit-zonas') ? 'auto' : 'none';
        interact(z).draggable(val === 'edit-zonas').resizable(val === 'edit-zonas');
    });
}

function agregarMesa() {
    const num = prompt("Nº mesa:"), cap = prompt("Capacidad:");
    if (num && cap) {
        const m = document.createElement('div');
        m.className = 'mesa disponible editando';
        m.style.left = "100px"; m.style.top = "100px";
        m.dataset.capacidad = cap; m.dataset.inicio = "0";
        m.innerHTML = `<strong>#${num}</strong><span>${cap}p</span><div class="cronometro" style="display:none">00:00</div>`;
        configurarMesa(m);
        plano.appendChild(m);
        historial.push(m);
    }
}

function configurarMesa(mesa) {
    mesa.onclick = () => {
        if (modoActual !== 'operacion') return;
        if (mesa.classList.contains('disponible')) {
            const r = prompt("¿Comensales?", mesa.dataset.capacidad);
            if (r) {
                mesa.classList.replace('disponible', 'ocupada');
                mesa.dataset.inicio = Date.now();
                mesa.querySelector('.cronometro').style.display = "block";
                document.getElementById('sonidoPop').play();
            }
        } else if (confirm("¿Liberar?")) {
            mesa.classList.remove('ocupada', 'alerta-tiempo');
            mesa.classList.add('disponible');
            mesa.dataset.inicio = "0";
            mesa.querySelector('.cronometro').style.display = "none";
        }
    };
    interact(mesa).draggable({ listeners: { move(e) {
        mesa.style.left = (parseFloat(mesa.style.left) || 0) + e.dx/escala + "px";
        mesa.style.top = (parseFloat(mesa.style.top) || 0) + e.dy/escala + "px";
    }}}).resizable({ edges: { right: true, bottom: true }, listeners: { move(e) {
        mesa.style.width = e.rect.width / escala + 'px';
        mesa.style.height = e.rect.height / escala + 'px';
    }}});
}

function agregarZona() {
    const nom = prompt("Nombre zona:");
    if (nom) {
        const z = document.createElement('div');
        z.className = 'zona editando';
        z.style.left = "50px"; z.style.top = "50px";
        z.style.width = "300px"; z.style.height = "300px";
        z.innerHTML = `<span>${nom}</span>`;
        configurarZona(z);
        plano.appendChild(z);
        historial.push(z);
    }
}

function configurarZona(z) {
    interact(z).draggable({ listeners: { move(e) {
        z.style.left = (parseFloat(z.style.left) || 0) + e.dx/escala + "px";
        z.style.top = (parseFloat(z.style.top) || 0) + e.dy/escala + "px";
    }}}).resizable({ edges: { right: true, bottom: true }, listeners: { move(e) {
        z.style.width = e.rect.width / escala + 'px';
        z.style.height = e.rect.height / escala + 'px';
    }}});
}

function deshacer() { if (historial.length > 0) historial.pop().remove(); }
function actTrans() { plano.style.transform = `translate(${plano.dataset.x}px, ${plano.dataset.y}px) scale(${escala})`; }
function resetZoom() { escala = 1; plano.dataset.x = 0; plano.dataset.y = 0; actTrans(); }
function guardarDisposicion() { localStorage.setItem('mapaBarV9', plano.innerHTML); alert("Guardado"); }

setInterval(() => {
    document.querySelectorAll('.mesa.ocupada').forEach(m => {
        const segs = Math.floor((Date.now() - parseInt(m.dataset.inicio)) / 1000);
        m.querySelector('.cronometro').innerText = `${Math.floor(segs/60)}:${(segs%60).toString().padStart(2,'0')}`;
        if (segs >= 5400) m.classList.add('alerta-tiempo');
    });
}, 1000);

interact('#viewport').gesturable({ onmove: e => { escala *= (1+e.ds); actTrans(); } })
.draggable({ listeners: { move(e) {
    plano.dataset.x = (parseFloat(plano.dataset.x) || 0) + e.dx;
    plano.dataset.y = (parseFloat(plano.dataset.y) || 0) + e.dy;
    actTrans();
}}});
