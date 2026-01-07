let escala = 1, panX = 0, panY = 0;
let modoActual = 'operacion';

const plano = document.getElementById('plano-bar');
const contenedorMesas = document.getElementById('contenedor-mesas');
const imgFondo = document.getElementById('img-fondo');
const sonido = document.getElementById('sonidoPop');

window.onload = function() {
    // Cargar imagen de fondo
    const savedImg = localStorage.getItem('bar_fondo_img');
    if (savedImg) {
        imgFondo.src = savedImg;
        imgFondo.style.display = 'block';
    }

    // Cargar mesas
    const savedMesas = localStorage.getItem('bar_mesas_html');
    if (savedMesas) {
        contenedorMesas.innerHTML = savedMesas;
        document.querySelectorAll('.mesa').forEach(configurarMesa);
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
}

function cargarImagenFondo(event) {
    const reader = new FileReader();
    reader.onload = function() {
        imgFondo.src = reader.result;
        imgFondo.style.display = 'block';
        localStorage.setItem('bar_fondo_img', reader.result);
    }
    reader.readAsDataURL(event.target.files[0]);
}

function agregarMesa() {
    const m = document.createElement('div');
    m.className = 'mesa disponible editando';
    m.style.left = (Math.abs(panX) + 100) / escala + "px";
    m.style.top = (Math.abs(panY) + 100) / escala + "px";
    m.dataset.inicio = "0";
    m.innerHTML = `<strong>#</strong><div class="cronometro" style="display:none">00:00</div>`;
    configurarMesa(m);
    contenedorMesas.appendChild(m);
}

function configurarMesa(m) {
    m.onpointerup = function(e) {
        if (modoActual === 'edit-mesas') {
            const n = prompt("Número de mesa:", m.querySelector('strong').innerText);
            if (n !== null) m.querySelector('strong').innerText = n;
        } else {
            if (m.classList.contains('disponible')) {
                m.classList.replace('disponible', 'ocupada');
                m.dataset.inicio = Date.now();
                m.querySelector('.cronometro').style.display = "block";
                if(sonido) sonido.play().catch(()=>{});
            } else if (confirm("¿Liberar mesa?")) {
                m.classList.remove('ocupada');
                m.classList.add('disponible');
                m.dataset.inicio = "0";
                m.querySelector('.cronometro').style.display = "none";
            }
        }
        guardarTodo();
    };

    interact(m).draggable({
        enabled: modoActual === 'edit-mesas',
        listeners: { move(e) {
            m.style.left = (parseFloat(m.style.left) || 0) + e.dx/escala + "px";
            m.style.top = (parseFloat(m.style.top) || 0) + e.dy/escala + "px";
        }, end() { guardarTodo(); }}
    });
}

function guardarTodo() {
    localStorage.setItem('bar_mesas_html', contenedorMesas.innerHTML);
}

function borrarTodo() {
    if(confirm("¿Borrar todo el diseño?")) {
        localStorage.clear();
        location.reload();
    }
}

function resetZoom() { panX = 0; panY = 0; escala = 0.8; actualizarVista(); }
function actualizarVista() { plano.style.transform = `translate(${panX}px, ${panY}px) scale(${escala})`; }

// Navegación fluida del mapa
interact('#viewport').draggable({
    listeners: { move(e) {
        if (modoActual === 'edit-mesas' && e.target.classList.contains('mesa')) return;
        panX += e.dx; panY += e.dy;
        actualizarVista();
    }}
});

// Cronómetros
setInterval(() => {
    document.querySelectorAll('.mesa.ocupada').forEach(m => {
        const segs = Math.floor((Date.now() - parseInt(m.dataset.inicio)) / 1000);
        m.querySelector('.cronometro').innerText = `${Math.floor(segs/60)}:${(segs%60).toString().padStart(2,'0')}`;
    });
}, 1000);
