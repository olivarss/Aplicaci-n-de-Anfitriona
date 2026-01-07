let escala = 1, panX = 0, panY = 0;
let modoActual = 'operacion';
let anchoMesaPref = 60, altoMesaPref = 60;

const plano = document.getElementById('plano-bar');
const sonido = document.getElementById('sonidoPop');

window.onload = function() {
    const savedData = localStorage.getItem('mapaBar_FINAL_V200');
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

// --- MODO ATENCIÓN ULTRA RÁPIDO (SIN PREGUNTAS) ---
function configurarMesa(m) {
    m.onpointerup = function(e) {
        e.stopPropagation();
        if (modoActual === 'edit-mesas') {
            const nNombre = prompt("Nombre/Nº:", m.querySelector('strong').innerText.replace('#',''));
            if (nNombre !== null) m.querySelector('strong').innerText = "#" + nNombre;
            guardarDisposicion();
        } else if (modoActual === 'operacion') {
            if (m.classList.contains('disponible')) {
                // CAMBIO: Ocupar instantáneamente
                m.classList.replace('disponible', 'ocupada');
                m.dataset.inicio = Date.now();
                m.querySelector('.cronometro').style.display = "block";
                if(sonido) sonido.play().catch(()=>{});
            } else {
                // Liberar con confirmación rápida
                if (confirm("¿Liberar mesa?")) {
                    m.classList.remove('ocupada', 'alerta-tiempo');
                    m.classList.add('disponible');
                    m.dataset.inicio = "0";
                    m.querySelector('.cronometro').style.display = "none";
                }
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
    });
}

// --- FUNCIÓN PARA CARGAR BOCETO (IA SUGERIDA) ---
function procesarBoceto(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    alert("Analizando boceto... (Simulación de IA: Buscando cuadrados negros y X)");
    
    // Aquí es donde el código recibiría las coordenadas de la imagen.
    // Como prototipo, esto limpia el mapa y prepara el área de carga.
    if(confirm("¿Deseas que la IA auto-genere el mapa basado en el dibujo?")) {
        // En un escenario real, aquí se enviaría la imagen a una API de Visión.
        alert("Boceto cargado. Por favor, pega aquí el código que te daré al analizar tu imagen.");
    }
}

function agregarZona() {
    const nom = prompt("Nombre del área:");
    if (!nom) return;
    const z = document.createElement('div');
    z.className = 'zona editando';
    z.style.width = "350px"; z.style.height = "350px";
    z.style.left = "100px"; z.style.top = "100px";
    z.innerHTML = `<span>${nom}</span>`;
    configurarZona(z);
    plano.appendChild(z);
    guardarDisposicion();
}

function configurarZona(z) {
    z.onclick = function(e) {
        if (modoActual !== 'edit-mesas' || e.target !== z) return;
        const cant = prompt("¿Cuántas mesas?", "6");
        if (!cant) return;
        const startX = parseFloat(z.style.left);
        const startY = parseFloat(z.style.top);
        for (let i = 0; i < cant; i++) {
            const m = document.createElement('div');
            m.className = 'mesa disponible editando';
            m.style.left = (startX + 20 + (i*70)%300) + "px";
            m.style.top = (startY + 50 + Math.floor(i/4)*70) + "px";
            m.dataset.inicio = "0";
            m.innerHTML = `<strong>#${i+1}</strong><span>4p</span><div class="cronometro" style="display:none">00:00</div>`;
            configurarMesa(m);
            plano.appendChild(m);
        }
        guardarDisposicion();
    };

    interact(z).draggable({
        enabled: modoActual === 'edit-zonas',
        listeners: { move(e) {
            z.style.left = (parseFloat(z.style.left) || 0) + e.dx/escala + "px";
            z.style.top = (parseFloat(z.style.top) || 0) + e.dy/escala + "px";
        }, end() { guardarDisposicion(); }}
    });
}

function guardarDisposicion() { localStorage.setItem('mapaBar_FINAL_V200', plano.innerHTML); }
function resetZoom() { panX = 10; panY = 10; escala = 0.8; actualizarVista(); }
function actualizarVista() { plano.style.transform = `translate(${panX}px, ${panY}px) scale(${escala})`; }

interact('#viewport').draggable({
    listeners: { move(e) {
        if (modoActual !== 'operacion' && (e.target.classList.contains('mesa') || e.target.classList.contains('zona'))) return;
        panX += e.dx; panY += e.dy;
        actualizarVista();
    }}
});

function exportarMapa() {
    const datos = localStorage.getItem('mapaBar_FINAL_V200');
    const codigo = btoa(unescape(encodeURIComponent(datos)));
    prompt("Copia este código:", codigo);
}

function importarMapa() {
    const codigo = prompt("Pega el código:");
    if (codigo) {
        const deco = decodeURIComponent(escape(atob(codigo)));
        localStorage.setItem('mapaBar_FINAL_V200', deco);
        location.reload();
    }
}

setInterval(() => {
    document.querySelectorAll('.mesa.ocupada').forEach(m => {
        const segs = Math.floor((Date.now() - parseInt(m.dataset.inicio)) / 1000);
        m.querySelector('.cronometro').innerText = `${Math.floor(segs/60)}:${(segs%60).toString().padStart(2,'0')}`;
    });
}, 1000);
