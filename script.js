let escala = 1, panX = 0, panY = 0;
let modoActual = 'operacion';
let historial = [];
let anchoMesaPreferido = "60px", altoMesaPreferido = "60px";

const plano = document.getElementById('plano-bar');
const sonido = document.getElementById('sonidoPop');

window.onload = function() {
    const savedData = localStorage.getItem('mapaBar_FINAL_FIX');
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
    
    document.querySelectorAll('.mesa').forEach(m => {
        m.classList.toggle('editando', val === 'edit-mesas');
        interact(m).unset(); // Limpieza profunda
        configurarMesa(m);
    });

    document.querySelectorAll('.zona').forEach(z => {
        z.classList.toggle('editando', val === 'edit-zonas');
        z.style.pointerEvents = (val === 'edit-zonas' || val === 'edit-mesas') ? 'auto' : 'none';
        interact(z).unset();
        configurarZona(z);
    });
}

function agregarZona() {
    const nom = prompt("Nombre del área:");
    if (!nom) return;
    const z = document.createElement('div');
    z.className = 'zona editando';
    z.style.width = "350px"; z.style.height = "350px";
    z.style.left = (Math.abs(panX) + 100) / escala + "px";
    z.style.top = (Math.abs(panY) + 100) / escala + "px";
    z.innerHTML = `<span>${nom}</span>`;
    configurarZona(z);
    plano.appendChild(z);
    historial.push(z);
    guardarDisposicion();
}

function configurarZona(z) {
    // CLICK PARA RELLENAR MESAS (Solo en modo mesas)
    z.addEventListener('click', function(e) {
        if (modoActual !== 'edit-mesas' || e.target !== z) return;
        const cant = prompt("¿Cuántas mesas?", "8");
        if (!cant || isNaN(cant)) return;
        
        for (let i = 0; i < cant; i++) {
            const m = document.createElement('div');
            m.className = 'mesa disponible editando';
            m.style.width = anchoMesaPreferido; m.style.height = altoMesaPreferido;
            m.style.left = "20px"; m.style.top = "50px"; // Posición base inicial
            m.dataset.capacidad = "4"; m.dataset.inicio = "0";
            m.innerHTML = `<strong>#${i+1}</strong><span>4p</span><div class="cronometro" style="display:none">00:00</div>`;
            configurarMesa(m);
            z.appendChild(m);
        }
        guardarDisposicion();
    });

    interact(z).draggable({
        enabled: modoActual === 'edit-zonas',
        listeners: { move(e) {
            z.style.left = (parseFloat(z.style.left) || 0) + e.dx/escala + "px";
            z.style.top = (parseFloat(z.style.top) || 0) + e.dy/escala + "px";
        }, end() { guardarDisposicion(); }}
    }).resizable({
        enabled: modoActual === 'edit-zonas',
        edges: { right: true, bottom: true },
        listeners: { move(e) {
            z.style.width = e.rect.width / escala + 'px';
            z.style.height = e.rect.height / escala + 'px';
        }, end() { guardarDisposicion(); }}
    });
}

function configurarMesa(m) {
    // EVENTO DE TOQUE REFORZADO PARA MÓVILES
    m.onpointerdown = function(e) { e.stopPropagation(); };
    m.onpointerup = function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (modoActual === 'edit-mesas') {
            const nNombre = prompt("Número/Nombre:", m.querySelector('strong').innerText.replace('#',''));
            const nCap = prompt("Capacidad:", m.dataset.capacidad);
            if (nNombre !== null) m.querySelector('strong').innerText = "#" + nNombre;
            if (nCap !== null) { m.dataset.capacidad = nCap; m.querySelector('span').innerText = nCap + "p"; }
            guardarDisposicion();
        } else if (modoActual === 'operacion') {
            if (m.classList.contains('disponible')) {
                const r = prompt("¿Comensales?", m.dataset.capacidad);
                if (r) {
                    m.classList.replace('disponible', 'ocupada');
                    m.dataset.inicio = Date.now();
                    m.querySelector('.cronometro').style.display = "block";
                    sonido.play().catch(()=>{});
                }
            } else if (confirm("¿Liberar mesa?")) {
                m.classList.remove('ocupada', 'alerta-tiempo');
                m.classList.add('disponible');
                m.dataset.inicio = "0";
                m.querySelector('.cronometro').style.display = "none";
            }
            guardarDisposicion();
        }
    };

    interact(m).draggable({
        enabled: modoActual === 'edit-mesas',
        listeners: { move(e) {
            m.style.left = (parseFloat(m.style.left) || 0) + e.dx/escala + "px";
            m.style.top = (parseFloat(m.style.top) || 0) + e.dy/escala + "px";
        }, end() { guardarDisposicion(); }}
    }).resizable({
        enabled: modoActual === 'edit-mesas',
        edges: { right: true, bottom: true },
        listeners: { move(e) {
            m.style.width = e.rect.width / escala + 'px';
            m.style.height = e.rect.height / escala + 'px';
            anchoMesaPreferido = m.style.width; altoMesaPreferido = m.style.height;
        }, end() { guardarDisposicion(); }}
    });
}

function actualizarVista() { plano.style.transform = `translate(${panX}px, ${panY}px) scale(${escala})`; }
function resetZoom() { panX = 10; panY = 10; escala = 0.8; actualizarVista(); }
function guardarDisposicion() { localStorage.setItem('mapaBar_FINAL_FIX', plano.innerHTML); }
function deshacer() { if (historial.length > 0) { historial.pop().remove(); guardarDisposicion(); } }

// NAVEGACIÓN MAPA
interact('#viewport').gesturable({
    onmove: function (e) {
        escala *= (1 + e.ds);
        actualizarVista();
    }
}).draggable({
    listeners: { move(e) {
        if (modoActual !== 'operacion') {
            if (e.target.classList.contains('mesa') || e.target.classList.contains('zona')) return;
        }
        panX += e.dx; panY += e.dy;
        actualizarVista();
    }}
});

function exportarMapa() {
    const datos = localStorage.getItem('mapaBar_FINAL_FIX');
    const codigo = btoa(unescape(encodeURIComponent(datos)));
    prompt("Copia este código:", codigo);
}

function importarMapa() {
    const codigo = prompt("Pega el código:");
    if (codigo) {
        const deco = decodeURIComponent(escape(atob(codigo)));
        localStorage.setItem('mapaBar_FINAL_FIX', deco);
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
