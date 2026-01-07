let escala = 1, panX = 0, panY = 0;
let modoActual = 'operacion';
let historial = [];
let anchoMesaPreferido = "60px", altoMesaPreferido = "60px";

const plano = document.getElementById('plano-bar');
const sonido = document.getElementById('sonidoPop');

window.onload = function() {
    const savedData = localStorage.getItem('mapaBar_vFinal');
    if (savedData) {
        plano.innerHTML = savedData;
        document.querySelectorAll('.mesa').forEach(configurarMesa);
        document.querySelectorAll('.zona').forEach(configurarZona);
    }
    cambiarModo('operacion');
    setTimeout(resetZoom, 500);
};

function cambiarModo(val) {
    modoActual = val;
    const fb = document.getElementById('feedback');
    document.getElementById('herramientas-edicion').style.display = (val === 'operacion') ? 'none' : 'block';

    if(val === 'operacion') fb.innerText = "🛡️ MODO OPERACIÓN";
    if(val === 'edit-zonas') fb.innerText = "🏗️ PASO 1: CREAR ÁREAS";
    if(val === 'edit-mesas') fb.innerText = "🪑 PASO 2: TOCA ÁREA PARA RELLENAR / TOCA MESA PARA EDITAR";

    document.querySelectorAll('.mesa').forEach(m => {
        const isEditing = (val === 'edit-mesas');
        m.classList.toggle('editando', isEditing);
        interact(m).draggable(isEditing).resizable(isEditing);
    });

    document.querySelectorAll('.zona').forEach(z => {
        const isEditingZonas = (val === 'edit-zonas');
        const isEditingMesas = (val === 'edit-mesas');
        z.classList.toggle('editando', isEditingZonas);
        z.style.pointerEvents = (isEditingZonas || isEditingMesas) ? 'auto' : 'none';
        interact(z).draggable(isEditingZonas).resizable(isEditingZonas);
    });
}

function configurarZona(z) {
    z.onclick = function() {
        if (modoActual !== 'edit-mesas') return;
        const cantidad = prompt(`¿Cuántas mesas para este salón?`, "10");
        if (!cantidad || isNaN(cantidad)) return;

        const margen = 20;
        let col = 0, fila = 0;
        const zW = parseFloat(z.style.width), mW = parseFloat(anchoMesaPreferido), mH = parseFloat(altoMesaPreferido);

        for (let i = 0; i < cantidad; i++) {
            const m = document.createElement('div');
            m.className = 'mesa disponible editando';
            m.style.width = anchoMesaPreferido; m.style.height = altoMesaPreferido;
            let posX = margen + (col * (mW + margen));
            let posY = 40 + (fila * (mH + margen));
            if (posX + mW > zW - margen) { col = 0; fila++; posX = margen; posY = 40 + (fila * (mH + margen)); }
            m.style.left = posX + "px"; m.style.top = posY + "px";
            m.dataset.capacidad = "4"; m.dataset.inicio = "0";
            m.innerHTML = `<strong>#${i+1}</strong><span>4p</span><div class="cronometro" style="display:none">00:00</div>`;
            configurarMesa(m);
            z.appendChild(m);
            col++;
        }
        guardarDisposicion();
    };

    interact(z).draggable({
        listeners: { move(e) {
            z.style.left = (parseFloat(z.style.left) || 0) + e.dx/escala + "px";
            z.style.top = (parseFloat(z.style.top) || 0) + e.dy/escala + "px";
        }, end() { guardarDisposicion(); }}
    }).resizable({
        edges: { right: true, bottom: true },
        listeners: { move(e) {
            z.style.width = e.rect.width / escala + 'px';
            z.style.height = e.rect.height / escala + 'px';
        }, end() { guardarDisposicion(); }}
    });
}

function configurarMesa(mesa) {
    mesa.onclick = function(e) {
        e.stopPropagation();
        if (modoActual === 'edit-mesas') {
            const nNombre = prompt("Número/Nombre:", mesa.querySelector('strong').innerText.replace('#',''));
            const nCap = prompt("Capacidad:", mesa.dataset.capacidad);
            if (nNombre) mesa.querySelector('strong').innerText = "#" + nNombre;
            if (nCap) { mesa.dataset.capacidad = nCap; mesa.querySelector('span').innerText = nCap + "p"; }
            guardarDisposicion();
            return;
        }
        if (modoActual === 'operacion') {
            if (mesa.classList.contains('disponible')) {
                const r = prompt("¿Comensales?", mesa.dataset.capacidad);
                if (r) {
                    mesa.classList.replace('disponible', 'ocupada');
                    mesa.dataset.inicio = Date.now();
                    mesa.querySelector('.cronometro').style.display = "block";
                    if(sonido) { sonido.currentTime = 0; sonido.play().catch(()=>{}); }
                }
            } else if (confirm("¿Liberar mesa?")) {
                mesa.classList.remove('ocupada', 'alerta-tiempo');
                mesa.classList.add('disponible');
                mesa.dataset.inicio = "0";
                mesa.querySelector('.cronometro').style.display = "none";
            }
            guardarDisposicion();
        }
    };

    interact(mesa).draggable({
        listeners: { move(e) {
            if (modoActual !== 'edit-mesas') return;
            mesa.style.left = (parseFloat(mesa.style.left) || 0) + e.dx/escala + "px";
            mesa.style.top = (parseFloat(mesa.style.top) || 0) + e.dy/escala + "px";
        }, end() { guardarDisposicion(); }}
    }).resizable({
        edges: { right: true, bottom: true },
        listeners: { move(e) {
            if (modoActual !== 'edit-mesas') return;
            mesa.style.width = e.rect.width / escala + 'px';
            mesa.style.height = e.rect.height / escala + 'px';
            anchoMesaPreferido = mesa.style.width; altoMesaPreferido = mesa.style.height;
        }, end() { guardarDisposicion(); }}
    });
}

function agregarZona() {
    const nom = prompt("Nombre del área:");
    if (nom) {
        const z = document.createElement('div');
        z.className = 'zona editando';
        z.style.width = "400px"; z.style.height = "400px";
        z.style.left = (window.innerWidth/2 - panX)/escala - 150 + "px";
        z.style.top = (window.innerHeight/2 - panY)/escala - 150 + "px";
        z.innerHTML = `<span>${nom}</span>`;
        configurarZona(z);
        plano.appendChild(z);
        historial.push(z);
        guardarDisposicion();
    }
}

// NAVEGACIÓN PRO
interact('#viewport').gesturable({
    onmove: function (e) {
        const factor = 0.5;
        const nEscala = escala * (1 + e.ds * factor);
        if (nEscala > 0.15 && nEscala < 4) {
            panX -= (e.clientX0 - panX) * (nEscala / escala - 1);
            panY -= (e.clientY0 - panY) * (nEscala / escala - 1);
            escala = nEscala; actualizarVista();
        }
    }
}).draggable({
    listeners: { move(e) {
        if (modoActual !== 'operacion' && (e.target.classList.contains('mesa') || e.target.classList.contains('zona'))) return;
        panX += e.dx; panY += e.dy;
        actualizarVista();
    }}
});

function actualizarVista() { plano.style.transform = `translate(${panX}px, ${panY}px) scale(${escala})`; }
function deshacer() { if (historial.length > 0) { historial.pop().remove(); guardarDisposicion(); } }
function resetZoom() { panX = 20; panY = 20; escala = 0.7; actualizarVista(); }
function guardarDisposicion() { localStorage.setItem('mapaBar_vFinal', plano.innerHTML); }

// BACKUP
function exportarMapa() {
    const datos = localStorage.getItem('mapaBar_vFinal');
    const codigo = btoa(unescape(encodeURIComponent(datos)));
    navigator.clipboard.writeText(codigo).then(() => alert("✅ Código de mapa copiado. Guárdalo en tus Notas."));
}

function importarMapa() {
    const codigo = prompt("Pega el código de tu mapa:");
    if (codigo) {
        const deco = decodeURIComponent(escape(atob(codigo)));
        localStorage.setItem('mapaBar_vFinal', deco);
        location.reload();
    }
}

setInterval(() => {
    document.querySelectorAll('.mesa.ocupada').forEach(m => {
        const segs = Math.floor((Date.now() - parseInt(m.dataset.inicio)) / 1000);
        m.querySelector('.cronometro').innerText = `${Math.floor(segs/60)}:${(segs%60).toString().padStart(2,'0')}`;
        if (segs >= 5400) m.classList.add('alerta-tiempo');
    });
}, 1000);
