let escala = 1;
let modoActual = 'operacion';
let historial = [];
let anchoMesaPreferido = "60px";
let altoMesaPreferido = "60px";

const plano = document.getElementById('plano-bar');
const sonido = document.getElementById('sonidoPop');

// CARGAR AL INICIAR
window.onload = function() {
    const savedData = localStorage.getItem('mapaBarV11');
    if (savedData) {
        plano.innerHTML = savedData;
        // Re-activar funciones en objetos cargados
        document.querySelectorAll('.mesa').forEach(configurarMesa);
        document.querySelectorAll('.zona').forEach(configurarZona);
    }
    cambiarModo('operacion');
    setTimeout(resetZoom, 500);
};

function cambiarModo(val) {
    modoActual = val;
    // Mostrar u ocultar botones según el modo
    document.getElementById('btn-zona').style.display = (val === 'edit-zonas') ? 'inline-block' : 'none';
    document.getElementById('btn-mesa').style.display = (val === 'edit-mesas') ? 'inline-block' : 'none';

    // Bloquear o desbloquear mesas
    document.querySelectorAll('.mesa').forEach(m => {
        const isEditing = (val === 'edit-mesas');
        m.classList.toggle('editando', isEditing);
        interact(m).draggable(isEditing).resizable(isEditing);
    });

    // Bloquear o desbloquear zonas
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
        m.style.left = "150px"; m.style.top = "150px";
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
            const r = prompt("¿Cuántos entran?", mesa.dataset.capacidad);
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
    const nom = prompt("Nombre zona:");
    if (nom) {
        const z = document.createElement('div');
        z.className = 'zona editando';
        z.style.width = "400px"; z.style.height = "400px";
        z.style.left = "100px"; z.style.top = "100px";
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
    // ESTA ES LA CLAVE: Guardamos todo el HTML dentro de la memoria del celular
    localStorage.setItem('mapaBarV11', plano.innerHTML);
    alert("✅ ¡GUARDADO! Ahora puedes refrescar sin miedo.");
}

function deshacer() { if (historial.length > 0) historial.pop().remove(); }
function actTrans() { plano.style.transform = `translate(${plano.dataset.x || 0}px, ${plano.dataset.y || 0}px) scale(${escala})`; }
function resetZoom() { escala = 1; plano.dataset.x = 0; plano.dataset.y = 0; actTrans(); }

// CRONOMETROS
setInterval(() => {
    document.querySelectorAll('.mesa.ocupada').forEach(m => {
        const segs = Math.floor((Date.now() - parseInt(m.dataset.inicio)) / 1000);
        const min = Math.floor(segs / 60);
        const s = (segs % 60).toString().padStart(2, '0');
        m.querySelector('.cronometro').innerText = `${min}:${s}`;
        if (segs >= 5400) m.classList.add('alerta-tiempo');
    });
}, 1000);

// NAVEGACIÓN
interact('#viewport').gesturable({
    onmove: e => { escala *= (1+e.ds); actTrans(); }
}).draggable({
    listeners: { move(e) {
        if (modoActual !== 'operacion' && (e.target.classList.contains('mesa') || e.target.classList.contains('zona'))) return;
        const x = (parseFloat(plano.dataset.x) || 0) + e.dx;
        const y = (parseFloat(plano.dataset.y) || 0) + e.dy;
        plano.dataset.x = x; plano.dataset.y = y;
        actTrans();
    }}
});
