let escala = 1, panX = 0, panY = 0;
let modoActual = 'operacion';
let historial = [];
let anchoMesaPreferido = "60px", altoMesaPreferido = "60px";

const plano = document.getElementById('plano-bar');
const sonido = document.getElementById('sonidoPop');

window.onload = function() {
    const savedData = localStorage.getItem('mapaBar_ESTABLE_V1');
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
    const fb = document.getElementById('feedback');
    
    if(val === 'operacion') fb.innerText = "ATENCIÓN: Toca mesas para ocupar.";
    if(val === 'edit-zonas') fb.innerText = "PASO 1: Mueve o crea Áreas.";
    if(val === 'edit-mesas') fb.innerText = "PASO 2: Toca Área para rellenar / Toca Mesa para editar.";

    document.querySelectorAll('.mesa').forEach(m => {
        const canEdit = (val === 'edit-mesas');
        m.classList.toggle('editando', canEdit);
        // Destruimos instancias previas para evitar bloqueos
        interact(m).unset();
        configurarMesa(m);
    });

    document.querySelectorAll('.zona').forEach(z => {
        const canEditZ = (val === 'edit-zonas');
        const canEditM = (val === 'edit-mesas');
        z.classList.toggle('editando', canEditZ);
        z.style.pointerEvents = (canEditZ || canEditM) ? 'auto' : 'none';
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
    z.style.left = (Math.abs(panX) + 50) / escala + "px";
    z.style.top = (Math.abs(panY) + 50) / escala + "px";
    z.innerHTML = `<span>${nom}</span>`;
    configurarZona(z);
    plano.appendChild(z);
    historial.push(z);
    guardarDisposicion();
}

function configurarZona(z) {
    // CLICK PARA RELLENAR MESAS
    z.onclick = function(e) {
        if (modoActual !== 'edit-mesas' || e.target !== z) return;
        const cant = prompt("¿Cuántas mesas?", "8");
        if (!cant || isNaN(cant)) return;
        
        const margen = 15;
        let col = 0, fila = 0;
        const zW = parseFloat(z.style.width);
        const mW = parseFloat(anchoMesaPreferido);
        const mH = parseFloat(altoMesaPreferido);

        for (let i = 0; i < cant; i++) {
            const m = document.createElement('div');
            m.className = 'mesa disponible editando';
            m.style.width = anchoMesaPreferido; m.style.height = altoMesaPreferido;
            let posX = margen + (col * (mW + margen));
            let posY = 45 + (fila * (mH + margen));
            
            if (posX + mW > zW - margen) {
                col = 0; fila++;
                posX = margen; posY = 45 + (fila * (mH + margen));
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

    // MOVIMIENTO Y TAMAÑO DE ZONAS
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
    // CLICK PARA ATENCIÓN O EDICIÓN
    m.onclick = function(e) {
        e.stopPropagation();
        if (modoActual === 'edit-mesas') {
            const nNombre = prompt("Número/Nombre:", m.querySelector('strong').innerText.replace('#',''));
            const nCap = prompt("Capacidad:", m.dataset.capacidad);
            if (nNombre !== null) m.querySelector('strong').innerText = "#" + nNombre;
            if (nCap !== null) { m.dataset.capacidad = nCap; m.querySelector('span').innerText = nCap + "p"; }
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
            } else if (confirm("¿Liberar mesa?")) {
                m.classList.remove('ocupada', 'alerta-tiempo');
                m.classList.add('disponible');
                m.dataset.inicio = "0";
                m.querySelector('.cronometro').style.display = "none";
            }
            guardarDisposicion();
        }
    };

    // MOVIMIENTO Y TAMAÑO DE MESAS
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

function guardarDisposicion() { localStorage.setItem('mapaBar_ESTABLE_V1', plano.innerHTML); }
function deshacer() { if (historial.length > 0) { historial.pop().remove(); guardarDisposicion(); } }

function resetZoom() { 
    panX = 10; panY = 10; escala = 0.8; 
    actualizarVista(); 
}

function actualizarVista() { 
    plano.style.transform = `translate(${panX}px, ${panY}px) scale(${escala})`; 
}

// NAVEGACIÓN DEL FONDO
interact('#viewport').gesturable({
    onmove: function (e) {
        const nEscala = escala * (1 + e.ds);
        if (nEscala > 0.1 && nEscala < 5) {
            escala = nEscala;
            actualizarVista();
        }
    }
}).draggable({
    listeners: { move(e) {
        // Solo arrastramos el mapa si no estamos moviendo un objeto
        if (modoActual !== 'operacion' && (e.target.classList.contains('mesa') || e.target.classList.contains('zona'))) return;
        panX += e.dx; panY += e.dy;
        actualizarVista();
    }}
});

function exportarMapa() {
    const datos = localStorage.getItem('mapaBar_ESTABLE_V1');
    const codigo = btoa(unescape(encodeURIComponent(datos)));
    prompt("Copia este código de seguridad:", codigo);
}

function importarMapa() {
    const codigo = prompt("Pega el código de tu mapa:");
    if (codigo) {
        const deco = decodeURIComponent(escape(atob(codigo)));
        localStorage.setItem('mapaBar_ESTABLE_V1', deco);
        location.reload();
    }
}

setInterval(() => {
    document.querySelectorAll('.mesa.ocupada').forEach(m => {
        const segs = Math.floor((Date.now() - parseInt(m.dataset.inicio)) / 1000);
        const min = Math.floor(segs/60);
        const s = (segs%60).toString().padStart(2,'0');
        m.querySelector('.cronometro').innerText = `${min}:${s}`;
        if (segs >= 5400) m.classList.add('alerta-tiempo');
    });
}, 1000);
