let escala = 1, panX = 0, panY = 0;
let modoActual = 'operacion';
let historial = [];
let anchoMesaPreferido = "60px", altoMesaPreferido = "60px";

const plano = document.getElementById('plano-bar');
const sonido = document.getElementById('sonidoPop');

window.onload = function() {
    const savedData = localStorage.getItem('mapaBarV13');
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
    document.getElementById('btn-zona').style.display = (val === 'edit-zonas') ? 'inline-block' : 'none';

    if(val === 'operacion') fb.innerText = "🛡️ MODO OPERACIÓN";
    if(val === 'edit-zonas') fb.innerText = "🏗️ PASO 1: Dibuja las Áreas.";
    if(val === 'edit-mesas') fb.innerText = "🪑 PASO 2: Toca un Área para meter mesas. Toca una mesa para cambiar su capacidad.";

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

// CONFIGURAR ZONA (Asistente de llenado)
function configurarZona(z) {
    z.onclick = function() {
        if (modoActual !== 'edit-mesas') return;

        const cantidad = prompt(`¿Cuántas mesas quieres en "${z.querySelector('span').innerText}"?`, "10");
        if (!cantidad || isNaN(cantidad)) return;

        const margen = 20;
        let col = 0, fila = 0;
        const zW = parseFloat(z.style.width);
        const mW = parseFloat(anchoMesaPreferido);
        const mH = parseFloat(altoMesaPreferido);

        for (let i = 0; i < cantidad; i++) {
            const m = document.createElement('div');
            m.className = 'mesa disponible editando';
            m.style.width = anchoMesaPreferido;
            m.style.height = altoMesaPreferido;
            
            let posX = margen + (col * (mW + margen));
            let posY = 40 + (fila * (mH + margen));

            if (posX + mW > zW - margen) {
                col = 0; fila++;
                posX = margen;
                posY = 40 + (fila * (mH + margen));
            }

            m.style.left = posX + "px";
            m.style.top = posY + "px";
            m.dataset.capacidad = "4"; // POR DEFECTO 4
            m.dataset.inicio = "0";
            m.innerHTML = `<strong>#${i+1}</strong><span>4p</span><div class="cronometro" style="display:none">00:00</div>`;
            
            configurarMesa(m);
            z.appendChild(m);
            col++;
        }
    };

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

// CONFIGURAR MESA (Acción dual: Editar o Operar)
function configurarMesa(mesa) {
    mesa.onclick = function(e) {
        e.stopPropagation();
        
        // SI ESTAMOS EN PASO 2: EDITAR CAPACIDAD
        if (modoActual === 'edit-mesas') {
            const nuevaCap = prompt("¿Capacidad para esta mesa?", mesa.dataset.capacidad);
            if (nuevaCap) {
                mesa.dataset.capacidad = nuevaCap;
                mesa.querySelector('span').innerText = nuevaCap + "p";
            }
            return;
        }

        // SI ESTAMOS EN OPERACION: ABRIR/CERRAR MESA
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
                mesa.dataset.inicio =
