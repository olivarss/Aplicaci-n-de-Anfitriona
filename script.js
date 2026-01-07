let escala = 1;
let modoActual = 'operacion';
let historial = [];
const plano = document.getElementById('plano-bar');
const sonido = document.getElementById('sonidoPop');

window.onload = () => {
    const saved = localStorage.getItem('mapaBarV8');
    if(saved) {
        plano.innerHTML = saved;
        document.querySelectorAll('.mesa').forEach(configurarMesa);
        document.querySelectorAll('.zona').forEach(configurarZona);
    }
    cambiarModo('operacion');
};

function cambiarModo(val) {
    modoActual = val;
    const herramientas = document.getElementById('herramientas-edicion');
    herramientas.style.display = (val === 'operacion') ? 'none' : 'block';
    
    document.getElementById('btn-nueva-zona').style.display = (val === 'edit-zonas') ? 'inline' : 'none';
    document.getElementById('btn-nueva-mesa').style.display = (val === 'edit-mesas') ? 'inline' : 'none';

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
        m.style.left = "250px"; m.style.top = "250px";
        m.dataset.capacidad = cap; m.dataset.inicio = "0";
        m.innerHTML = `<strong>#${num}</strong><span class="pax-info">${cap}p</span><div class="cronometro" style="display:none">00:00</div>`;
        configurarMesa(m);
        plano.appendChild(m);
        historial.push(m);
    }
}

function configurarMesa(mesa) {
    mesa.onclick = () => {
        if (modoActual !== 'operacion') return;
        if (mesa.classList.contains('disponible')) {
            const r = prompt(`¿Comensales?`, mesa.dataset.capacidad);
            if (r) {
                mesa.classList.replace('disponible', 'ocupada');
                mesa.querySelector('.pax-info').innerText = `${r}/${mesa.dataset.capacidad}`;
                mesa.dataset.inicio = Date.now();
                mesa.querySelector('.cronometro').style.display = "block";
                sonido.play();
            }
        } else if (confirm("¿Liberar mesa?")) {
            mesa.classList.remove('ocupada', 'alerta-tiempo');
            mesa.classList.add('disponible');
            mesa.querySelector('.pax-info').innerText = `${mesa.dataset.capacidad}p`;
            mesa.dataset.inicio = "0";
            mesa.querySelector('.cronometro').style.display = "none";
        }
    };

    interact(mesa).draggable({
        listeners: { move(e) {
            mesa.style.left = (parseFloat(mesa.style.left) || 0) + e.dx/escala + "px";
            mesa.style.top = (parseFloat(mesa.style.top) || 0) + e.dy/escala + "px";
        }}
    }).resizable({
        edges: { right: true, bottom: true },
        listeners: { move(e) {
            mesa.style.width = e.rect.width / escala + 'px';
            mesa.style.height = e.rect.height / escala + 'px';
        }}
    });
}

function agregarZona() {
    const nom = prompt("Nombre del Salón:");
    if (nom) {
        const z = document.createElement('div');
        z.className = 'zona editando';
        z.style.left = "100px"; z.style.top = "100px";
        z.style.width = "400px"; z.style.height = "400px";
        z.innerHTML = `<span>${nom}</span>`;
        configurarZona(z);
        plano.appendChild(z);
        historial.push(z);
    }
}

function configurarZona(zona) {
    interact(zona).draggable({
        listeners: { move(e) {
            zona.style.left = (parseFloat(zona.style.left) || 0) + e.dx/escala + "px";
            zona.style.top = (parseFloat(zona.style.top) || 0) + e.dy/escala + "px";
        }}
    }).resizable({
        edges: { right: true, bottom: true },
        listeners: { move(e) {
            zona.style.width = e.rect.width / escala + 'px';
            zona.style.height = e.rect.height / escala + 'px';
        }}
    });
}

function deshacer() {
    if (historial.length > 0) {
        const ultimo = historial.pop();
        ultimo.remove();
    }
}

// Mantenemos las funciones de Zoom, Guardar y Cronómetro igual que antes...
function resetZoom() {
    const zonas = document.querySelectorAll('.zona');
    if (zonas.length === 0) { escala = 1; plano.dataset.x = 0; plano.dataset.y = 0; }
    else {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        zonas.forEach(z => {
            const x = parseFloat(z.style.left), y = parseFloat(z.style.top);
            const w = parseFloat(z.style.width), h = parseFloat(z.style.height);
            if (x < minX) minX = x; if (y < minY) minY = y;
            if (x + w > maxX) maxX = x + w; if (y + h > maxY) maxY = y + h;
        });
        const p = 50;
        escala = Math.min(window.innerWidth / (maxX - minX + p*2), (window.innerHeight * 0.8) / (maxY - minY + p*2), 1.5);
        plano.dataset.x = -minX * escala + p; plano.dataset.y = -minY * escala + p;
    }
    actTrans();
}

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

function actTrans() { plano.style.transform = `translate(${plano.dataset.x}px, ${plano.dataset.y}px) scale(${escala})`; }
function guardarDisposicion() { localStorage.setItem('mapaBarV8', plano.innerHTML); alert("¡Guardado!"); }
