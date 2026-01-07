let escala = 1;
let modoEdicion = false;
const plano = document.getElementById('plano-bar');
const sonido = document.getElementById('sonidoPop');

window.onload = () => {
    const saved = localStorage.getItem('mapaBarV7');
    if(saved) {
        plano.innerHTML = saved;
        document.querySelectorAll('.mesa').forEach(configurarMesa);
        document.querySelectorAll('.zona').forEach(configurarZona);
    }
    alternarModo(false);
    setTimeout(resetZoom, 500);
};

function agregarMesa() {
    const num = prompt("Nº mesa:"), cap = prompt("Capacidad:");
    if (num && cap) {
        const m = document.createElement('div');
        m.className = 'mesa disponible';
        m.style.left = "250px"; m.style.top = "250px";
        m.dataset.capacidad = cap;
        m.dataset.inicio = "0";
        m.innerHTML = `<strong>#${num}</strong><span class="pax-info">${cap}p</span><div class="cronometro" style="display:none">00:00</div>`;
        configurarMesa(m);
        plano.appendChild(m);
    }
}

function configurarMesa(mesa) {
    let tBorrado;
    mesa.onclick = function() {
        if (modoEdicion) return;
        const crono = this.querySelector('.cronometro');
        const paxInfo = this.querySelector('.pax-info');
        if (this.classList.contains('disponible')) {
            const reales = prompt(`¿Comensales? (Max: ${this.dataset.capacidad})`, this.dataset.capacidad);
            if (reales === null) return;
            this.classList.replace('disponible', 'ocupada');
            paxInfo.innerText = `${reales}/${this.dataset.capacidad}`;
            this.dataset.inicio = Date.now();
            crono.style.display = "block";
            sonido.play();
        } else {
            if (confirm("¿Liberar mesa?")) {
                this.classList.remove('ocupada', 'alerta-tiempo');
                this.classList.add('disponible');
                paxInfo.innerText = `${this.dataset.capacidad}p`;
                this.dataset.inicio = "0";
                crono.style.display = "none";
            }
        }
    };
    mesa.onmousedown = mesa.ontouchstart = () => {
        if(modoEdicion) tBorrado = setTimeout(() => { if(confirm("¿Borrar mesa?")) mesa.remove(); }, 3000);
    };
    mesa.onmouseup = mesa.ontouchend = () => clearTimeout(tBorrado);
    interact(mesa).draggable({
        enabled: modoEdicion,
        listeners: { move(e) {
            mesa.style.left = (parseFloat(mesa.style.left) || 0) + e.dx/escala + "px";
            mesa.style.top = (parseFloat(mesa.style.top) || 0) + e.dy/escala + "px";
        }}
    });
}

function agregarZona() {
    const nom = prompt("Nombre del Salón:");
    if (nom) {
        const z = document.createElement('div');
        z.className = 'zona';
        z.style.left = "100px"; z.style.top = "100px";
        z.style.width = "400px"; z.style.height = "400px";
        z.innerHTML = `<span>${nom}</span>`;
        configurarZona(z);
        plano.appendChild(z);
    }
}

function configurarZona(zona) {
    let tBorrado;
    zona.onmousedown = zona.ontouchstart = () => {
        if(modoEdicion) tBorrado = setTimeout(() => { if(confirm("¿Borrar área?")) zona.remove(); }, 3000);
    };
    zona.onmouseup = zona.ontouchend = () => clearTimeout(tBorrado);
    interact(zona).draggable({
        enabled: modoEdicion,
        listeners: { move(e) {
            zona.style.left = (parseFloat(zona.style.left) || 0) + e.dx/escala + "px";
            zona.style.top = (parseFloat(zona.style.top) || 0) + e.dy/escala + "px";
        }}
    }).resizable({
        enabled: modoEdicion,
        edges: { right: true, bottom: true },
        listeners: { move(e) {
            zona.style.width = e.rect.width / escala + 'px';
            zona.style.height = e.rect.height / escala + 'px';
        }}
    });
}

function resetZoom() {
    const zonas = document.querySelectorAll('.zona');
    if (zonas.length === 0) {
        escala = 1; plano.dataset.x = 0; plano.dataset.y = 0;
    } else {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        zonas.forEach(z => {
            const x = parseFloat(z.style.left), y = parseFloat(z.style.top);
            const w = parseFloat(z.style.width), h = parseFloat(z.style.height);
            if (x < minX) minX = x; if (y < minY) minY = y;
            if (x + w > maxX) maxX = x + w; if (y + h > maxY) maxY = y + h;
        });
        const padding = 50;
        const anchoTotal = (maxX - minX) + padding * 2;
        const altoTotal = (maxY - minY) + padding * 2;
        escala = Math.min(window.innerWidth / anchoTotal, (window.innerHeight * 0.8) / altoTotal, 1.5);
        plano.dataset.x = -minX * escala + padding;
        plano.dataset.y = -minY * escala + padding;
    }
    actTrans();
}

function alternarModo(valor) {
    modoEdicion = valor;
    document.getElementById('seccion-edicion').style.display = valor ? 'block' : 'none';
    document.getElementById('feedback').innerText = valor ? "MODO EDICIÓN: Puedes mover y crear." : "MODO OPERACIÓN: Toca mesas para ocupar.";
    document.querySelectorAll('.mesa').forEach(m => interact(m).draggable(valor));
    document.querySelectorAll('.zona').forEach(z => {
        interact(z).draggable(valor).resizable(valor);
        z.style.pointerEvents = valor ? 'auto' : 'none';
    });
}

setInterval(() => {
    document.querySelectorAll('.mesa.ocupada').forEach(m => {
        const inicio = parseInt(m.dataset.inicio);
        if (inicio > 0) {
            const segs = Math.floor((Date.now() - inicio) / 1000);
            m.querySelector('.cronometro').innerText = `${Math.floor(segs/60)}:${(segs%60).toString().padStart(2,'0')}`;
            if (segs >= 5400) m.classList.add('alerta-tiempo');
        }
    });
}, 1000);

interact('#viewport').gesturable({ onmove: e => { escala *= (1+e.ds); actTrans(); } })
.draggable({ listeners: { move(e) {
    plano.dataset.x = (parseFloat(plano.dataset.x) || 0) + e.dx;
    plano.dataset.y = (parseFloat(plano.dataset.y) || 0) + e.dy;
    actTrans();
}}});

function actTrans() { plano.style.transform = `translate(${plano.dataset.x}px, ${plano.dataset.y}px) scale(${escala})`; }
function guardarDisposicion() { localStorage.setItem('mapaBarV7', plano.innerHTML); alert("¡Mapa guardado!"); }