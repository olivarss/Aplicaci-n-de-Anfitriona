let escala = 1, panX = 0, panY = 0;
let modoActual = 'operacion';
let historial = [];
let anchoMesaPref = 60, altoMesaPref = 60;

const plano = document.getElementById('plano-bar');
const sonido = document.getElementById('sonidoPop');

window.onload = function() {
    const savedData = localStorage.getItem('mapaBar_FINAL_V101');
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
        interact(m).unset();
        configurarMesa(m);
    });

    document.querySelectorAll('.zona').forEach(z => {
        z.classList.toggle('editando', val === 'edit-zonas');
        z.style.pointerEvents = (val === 'operacion') ? 'none' : 'auto';
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
    z.onclick = function(e) {
        if (modoActual !== 'edit-mesas') return;
        e.stopPropagation();
        
        const cant = prompt(`¿Cuántas mesas para ${z.innerText}?`, "6");
        if (!cant || isNaN(cant)) return;

        // --- CÁLCULO DE REJILLA CORREGIDO ---
        const startX = parseFloat(z.style.left);
        const startY = parseFloat(z.style.top);
        const zW = parseFloat(z.style.width);
        const margen = 15; // Espacio entre mesas
        
        let col = 0, fila = 0;

        for (let i = 0; i < cant; i++) {
            const m = document.createElement('div');
            m.className = 'mesa disponible editando';
            m.style.width = anchoMesaPref + "px"; 
            m.style.height = altoMesaPref + "px";
            
            // Calculamos la posición relativa al área
            let posXRelativa = margen + (col * (anchoMesaPref + margen));
            let posYRelativa = 45 + (fila * (altoMesaPref + margen));

            // Si la mesa se sale del ancho del área, saltamos a la siguiente fila
            if (posXRelativa + anchoMesaPref > zW - margen) {
                col = 0;
                fila++;
                posXRelativa = margen;
                posYRelativa = 45 + (fila * (altoMesaPref + margen));
            }

            // Posición final en el plano
            m.style.left = (startX + posXRelativa) + "px";
            m.style.top = (startY + posYRelativa) + "px";
            
            m.dataset.capacidad = "4"; 
            m.dataset.inicio = "0";
            m.innerHTML = `<strong>#${i+1}</strong><span>4p</span><div class="cronometro" style="display:none">00:00</div>`;
            
            configurarMesa(m);
            plano.appendChild(m);
            col++;
        }
        guardarDisposicion();
    };

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
    // Evento táctil prioritario
    m.onpointerup = function(e) {
        e.stopPropagation();
        if (modoActual === 'edit-mesas') {
            const nNombre = prompt("Nombre/Nº:", m.querySelector('strong').innerText.replace('#',''));
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
                    if(sonido) sonido.play().catch(()=>{});
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
            anchoMesaPref = parseFloat(m.style.width);
            altoMesaPref = parseFloat(m.style.height);
        }, end() { guardarDisposicion(); }}
    });
}

function guardarDisposicion() { localStorage.setItem('mapaBar_FINAL_V101', plano.innerHTML); }
function deshacer() { if (plano.lastChild) { plano.removeChild(plano.lastChild); guardarDisposicion(); } }
function resetZoom() { panX = 10; panY = 10; escala = 0.8; actualizarVista(); }
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
    const datos = localStorage.getItem('mapaBar_FINAL_V101');
    const codigo = btoa(unescape(encodeURIComponent(datos)));
    prompt("Copia este código:", codigo);
}

function importarMapa() {
    const codigo = prompt("Pega el código:");
    if (codigo) {
        const deco = decodeURIComponent(escape(atob(codigo)));
        localStorage.setItem('mapaBar_FINAL_V101', deco);
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
