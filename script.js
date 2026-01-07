// --- VARIABLES GLOBALES ---
let escala = 1;
let modoActual = 'operacion';
let historial = [];
let anchoMesaPreferido = "60px"; // Tamaño inicial estándar
let altoMesaPreferido = "60px";

const plano = document.getElementById('plano-bar');
const sonido = document.getElementById('sonidoPop');

// --- CARGA INICIAL ---
window.onload = () => {
    const saved = localStorage.getItem('mapaBarVFinal_Pro');
    if(saved) {
        plano.innerHTML = saved;
        // Re-vinculamos la inteligencia a lo que cargamos
        document.querySelectorAll('.mesa').forEach(configurarMesa);
        document.querySelectorAll('.zona').forEach(configurarZona);
    }
    cambiarModo('operacion');
    setTimeout(resetZoom, 500); // Enfoque inicial
};

// --- CONTROL DE MODOS ---
function cambiarModo(val) {
    modoActual = val;
    
    // Control de visibilidad de botones
    document.getElementById('btn-zona').style.display = (val === 'edit-zonas') ? 'inline-block' : 'none';
    document.getElementById('btn-mesa').style.display = (val === 'edit-mesas') ? 'inline-block' : 'none';
    
    // Feedback visual para el usuario
    const feedback = document.getElementById('feedback');
    if(val === 'operacion') feedback.innerText = "🛡️ MODO OPERACIÓN: Todo bloqueado.";
    if(val === 'edit-zonas') feedback.innerText = "🏗️ PASO 1: Crea y ajusta las Áreas/Salones.";
    if(val === 'edit-mesas') feedback.innerText = "🪑 PASO 2: Coloca y ajusta el tamaño de Mesas.";

    // Activar/Desactivar interactividad de Mesas
    document.querySelectorAll('.mesa').forEach(m => {
        m.classList.toggle('editando', val === 'edit-mesas');
        interact(m).draggable(val === 'edit-mesas');
        interact(m).resizable(val === 'edit-mesas');
    });

    // Activar/Desactivar interactividad de Zonas
    document.querySelectorAll('.zona').forEach(z => {
        z.classList.toggle('editando', val === 'edit-zonas');
        z.style.pointerEvents = (val === 'edit-zonas') ? 'auto' : 'none';
        interact(z).draggable(val === 'edit-zonas');
        interact(z).resizable(val === 'edit-zonas');
    });
}

// --- GESTIÓN DE MESAS ---
function agregarMesa() {
    const num = prompt("Nº de mesa:"), cap = prompt("Capacidad:");
    if (num && cap) {
        const m = document.createElement('div');
        m.className = 'mesa disponible editando';
        
        // Aplicamos la memoria de tamaño
        m.style.width = anchoMesaPreferido;
        m.style.height = altoMesaPreferido;
        
        // Posicionamiento inicial centrado en la vista
        const xV = (window.innerWidth / 2 - (parseFloat(plano.dataset.x) || 0)) / escala;
        const y
