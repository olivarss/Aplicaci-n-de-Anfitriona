let escala = 1, panX = 0, panY = 0;
let modoActual = 'operacion';
let historial = [];
let anchoMesaPreferido = "60px", altoMesaPreferido = "60px";

const plano = document.getElementById('plano-bar');
const sonido = document.getElementById('sonidoPop');

window.onload = function() {
    const savedData = localStorage.getItem('mapaBar_vFinal_v2');
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
    document.getElementById('herramientas-edicion').style.display = (val === 'operacion') ? 'none' : 'block';
    document.getElementById('btn-nueva-zona').style.display = (val === 'edit-zonas') ? 'inline-block' : 'none';

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

function agregarZona() {
    const nom = prompt("Nombre del área (ej: Terraza):");
    if (!nom) return;
    const z = document.createElement('div');
    z.className = 'zona editando';
    z.style.width = "300px"; z.style.height = "300px";
    z.style.left = (Math.abs(panX) + 50) / escala + "px";
    z.style.top = (Math.abs(panY) + 50) / escala + "px";
    z.innerHTML = `<span>${nom}</span>`;
    configurarZona(z);
    plano.appendChild(z);
    historial.push(z);
    guardarDisposicion();
}

function configurarZona(z) {
    z.onclick = function() {
        if (modoActual !== 'edit-mesas') return;
        const cant = prompt("¿Cuántas mesas para esta área?", "6");
        if (!cant || isNaN(cant)) return;
        
        const margen = 20;
        let col = 0, fila = 0;
        for (let i = 0; i < cant; i++) {
            const m = document.createElement('div');
            m.className = 'mesa disponible editando';
            m.style.width = anchoMesaPreferido; m.style.height = altoMesaPreferido;
            let posX = margen + (col * (parseFloat(anchoMesaPreferido) + margen));
            let posY = 40 + (fila * (parseFloat(altoMesaPreferido) + margen));
            
            if (posX + parseFloat(anchoMesaPreferido) > parseFloat(z.style.width) - margen) {
                col = 0; fila++;
                posX = margen; posY = 40 + (fila * (parseFloat(altoMesaPreferido) + margen));
            }
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

function configurarMesa(m) {
    m.onclick = function(e) {
        e.stopPropagation();
        if (modoActual === 'edit-mesas') {
            const nCap = prompt("¿Capacidad?", m.dataset.capacidad);
            if (nCap) { m.dataset.capacidad = nCap; m.querySelector('span').innerText = nCap + "p"; }
            guardarDisposicion();
            return;
        }
        if (modoActual === 'operacion') {
            if (m.classList.contains('disponible')) {
                const r = prompt("¿Comensales?", m.dataset.capacidad);
                if (r) {
                    m.classList.replace('disponible', 'ocupada');
                    m.dataset.inicio = Date.now();
                    m.querySelector('.cronometro').style.display = "block";
                    sonido.play().catch(()=>{});
                }
            } else if (confirm("¿Liberar?")) {
                m.classList.remove('ocupada', 'alerta-tiempo');
                m.classList.add('disponible');
                m.dataset.inicio = "0";
                m.querySelector('.cronometro').style.display = "none";
            }
            guardarDisposicion();
        }
    };
    interact(m).draggable({
        listeners: { move(e) {
            if (modoActual !== 'edit-mesas') return;
            m.style.left = (parseFloat(m.style.left) || 0) + e.dx/escala + "px";
            m.style.top = (parseFloat(m.style.top) || 0) + e.dy/escala + "px";
        }, end() { guardarDisposicion(); }}
    });
}

function guardarDisposicion() { localStorage.setItem('mapaBar_vFinal_v2', plano.innerHTML); }
function deshacer() { if (historial.length > 0) { historial.pop().remove(); guardarDisposicion(); } }
function resetZoom() { panX = 0; panY = 0; escala = 0.8; actualizarVista(); }
function actualizarVista() { plano.style.transform = `translate(${panX}px, ${panY}px) scale(${escala})`; }

interact('#viewport').gesturable({
    onmove: function (e) {
        escala *= (1 + e.ds);
        actualizarVista();
    }
}).draggable({
    listeners: { move(e) {
        if (modoActual !== 'operacion' && (e.target.classList.contains('mesa') || e.target.classList.contains('zona'))) return;
        panX += e.dx; panY += e.dy;
        actualizarVista();
    }}
});

function exportarMapa() {
    const datos = localStorage.getItem('mapaBar_vFinal_v2');
    const codigo = btoa(unescape(encodeURIComponent(datos)));
    navigator.clipboard.writeText(codigo).then(() => alert("Copiado al portapapeles."));
}

function importarMapa() {
    const codigo = prompt("Pega el código:");
    if (codigo) {
        const deco = decodeURIComponent(escape(atob(codigo)));
        localStorage.setItem('mapaBar_vFinal_v2', deco);
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
