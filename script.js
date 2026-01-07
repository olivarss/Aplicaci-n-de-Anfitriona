let escala = 1;
let modoActual = 'operacion';
let historial = [];
let anchoMesaPreferido = "60px";
let altoMesaPreferido = "60px";

// Variables para el movimiento suave
let panX = 0;
let panY = 0;

const plano = document.getElementById('plano-bar');
const sonido = document.getElementById('sonidoPop');
const viewport = document.getElementById('viewport');

window.onload = function() {
    const savedData = localStorage.getItem('mapaBarV11');
    if (savedData) {
        plano.innerHTML = savedData;
        document.querySelectorAll('.mesa').forEach(configurarMesa);
        document.querySelectorAll('.zona').forEach(configurarZona);
    }
    cambiarModo('operacion');
    // Centrado inicial
    setTimeout(resetZoom, 500);
};

// --- ZOOM PROFESIONAL (Pinch-to-zoom) ---
interact('#viewport').gesturable({
    onmove: function (event) {
        const factorSensibilidad = 0.5; // Ajusta para más o menos velocidad
        const nuevaEscala = escala * (1 + event.ds * factorSensibilidad);
        
        // Limites de zoom
        if (nuevaEscala > 0.15 && nuevaEscala < 4) {
            // Este es el secreto: ajustar el movimiento mientras haces zoom
            // para que se sienta que haces zoom hacia tus dedos
            panX -= (event.clientX0 - panX) * (nuevaEscala / escala - 1);
            panY -= (event.clientY0 - panY) * (nuevaEscala / escala - 1);
            
            escala = nuevaEscala;
            actualizarVista();
        }
    }
}).draggable({
    inertia: true,
    listeners: {
        move(event) {
            // Bloqueo de arrastre si estamos moviendo un objeto en edición
            if (modoActual !== 'operacion' && (event.target.classList.contains('mesa') || event.target.classList.contains('zona'))) return;
            
            panX += event.dx;
            panY += event.dy;
            actualizarVista();
        }
    }
});

function actualizarVista() {
    // Aplicamos la transformación usando translate y scale de forma limpia
    plano.style.transform = `translate(${panX}px, ${panY}px) scale(${escala})`;
}

function resetZoom() {
    // Centra el mapa según las áreas dibujadas
    const zonas = document.querySelectorAll('.zona');
    if (zonas.length === 0) {
        escala = 1; panX = 20; panY = 20;
    } else {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        zonas.forEach(z => {
            const x = parseFloat(z.style.left), y = parseFloat(z.style.top);
            const w = parseFloat(z.style.width), h = parseFloat(z.style.height);
            if (x < minX) minX = x; if (y < minY) minY = y;
            if (x + w > maxX) maxX = x + w; if (y + h > maxY) maxY = y + h;
        });
        
        const padding = 40;
        const availableW = window.innerWidth - (padding * 2);
        const availableH = (window.innerHeight * 0.85) - (padding * 2);
        
        escala = Math.min(availableW / (maxX - minX), availableH / (maxY - minY), 2);
        panX = -minX * escala + padding;
        panY = -minY * escala + padding;
    }
    actualizarVista();
}

// --- LOGICA DE OBJETOS (Mantener igual) ---

function cambiarModo(val) {
    modoActual = val;
    document.getElementById('btn-zona').style.display = (val === 'edit-zonas') ? 'inline-block' : 'none';
    document.getElementById('btn-mesa').style.display = (val === 'edit-mesas') ? 'inline-block' : 'none';

    document.querySelectorAll('.mesa').forEach(m => {
        const isEditing = (val === 'edit-mesas');
        m.classList.toggle('editando', isEditing);
        interact(m).draggable(isEditing).resizable(isEditing);
    });

    document.querySelectorAll('.zona').forEach(z => {
        const isEditing = (val === 'edit-zonas');
        z.classList.toggle('editando', isEditing);
        z.style.pointerEvents = isEditing ? 'auto' : 'none';
        interact(z).draggable(isEditing).resizable(isEditing);
    });
}

function agregarMesa() {
    const num = prompt("Nº mesa:"), cap = prompt("Capacidad:");
    if (num && cap) {
        const m = document.createElement('div');
        m.className = 'mesa disponible editando';
        m.style.width = anchoMesaPreferido;
        m.style.height = altoMesaPreferido;
        // Aparece en el centro relativo de la pantalla
        m.style.left = (window.innerWidth / 2 - panX) / escala + "px";
        m.style.top = (window.innerHeight / 2 - panY) / escala + "px";
        m.dataset.capacidad = cap; m.dataset.inicio = "0";
        m.innerHTML = `<strong>#${num}</strong><span>${cap}p</span><div class="cronometro" style="display:none">00:00</div>`;
        configurarMesa(m);
        plano.appendChild(m);
        historial.push(m);
    }
}

function configurarMesa(mesa) {
    mesa.onclick = function() {
        if (modoActual !== 'operacion') return;
        if (mesa.classList.contains('disponible')) {
            const r = prompt("¿Cuántos?", mesa.dataset.capacidad);
            if (r) {
                mesa.classList.replace('disponible', 'ocupada');
                mesa.dataset.inicio = Date.now();
                mesa.querySelector('.cronometro').style.display = "block";
                if(sonido) { sonido.currentTime = 0; sonido.play().catch(()=>{}); }
            }
        } else if (confirm("¿Liberar?")) {
            mesa.classList.remove('ocupada', 'alerta-tiempo');
            mesa.classList.add('disponible');
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
            anchoMesaPreferido = mesa.style.width;
            altoMesaPreferido = mesa.style.height;
        }}
    });
}

function agregarZona() {
    const nom = prompt("Nombre:");
    if (nom) {
        const z = document.createElement('div');
        z.className = 'zona editando';
        z.style.width = "300px"; z.style.height = "300px";
        z.style.left = (window.innerWidth / 2 - panX) / escala + "px";
        z.style.top = (window.innerHeight / 2 - panY) / escala + "px";
        z.innerHTML = `<span>${nom}</span>`;
        configurarZona(z);
        plano.appendChild(z);
        historial.push(z);
    }
}

function configurarZona(z) {
    interact(z).draggable({
        listeners: { move(e) {
            z.style.left = (parseFloat(z.style.left) || 0) + e.dx/escala + "px";
            z.style.top = (parseFloat(z.style.top) || 0) + e.dy/escala + "px";
        }}
    }).resizable({
        edges: { right: true, bottom: true },
        listeners: { move(e) {
            z.style.width = e.rect.width / escala + 'px';
            z.style.height = e.rect.height / escala + 'px';
        }}
    });
}

function guardarDisposicion() {
    localStorage.setItem('mapaBarV11', plano.innerHTML);
    alert("✅ Mapa Guardado");
}

function deshacer() { if (historial.length > 0) historial.pop().remove(); }

setInterval(() => {
    document.querySelectorAll('.mesa.ocupada').forEach(m => {
        const segs = Math.floor((Date.now() - parseInt(m.dataset.inicio)) / 1000);
        const min = Math.floor(segs / 60);
        const s = (segs % 60).toString().padStart(2, '0');
        m.querySelector('.cronometro').innerText = `${min}:${s}`;
        if (segs >= 5400) m.classList.add('alerta-tiempo');
    });
}, 1000);
