let escala = 1, panX = 0, panY = 0;
let modoActual = 'operacion';

const plano = document.getElementById('plano-bar');
const contenedorMesas = document.getElementById('contenedor-mesas');
const imgFondo = document.getElementById('img-fondo');
const sonido = document.getElementById('sonidoPop');

window.onload = function() {
    // 1. Cargar imagen
    const savedImg = localStorage.getItem('bar_fondo_img');
    if (savedImg) {
        imgFondo.src = savedImg;
        imgFondo.style.display = 'block';
        imgFondo.onload = zoomAjustarPantalla; // Ajustar al cargar
    }

    // 2. Cargar mesas y sus estados
    const savedMesas = localStorage.getItem('bar_mesas_html');
    if (savedMesas) {
        contenedorMesas.innerHTML = savedMesas;
        document.querySelectorAll('.mesa').forEach(m => {
            configurarMesa(m);
            // Mostrar cronómetro si estaba ocupada
            if(m.classList.contains('ocupada')) {
                m.querySelector('.cronometro').style.display = 'block';
            }
        });
    }
    
    cambiarModo('operacion');
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
        imgFondo.onload = zoomAjustarPantalla;
    }
    reader.readAsDataURL(event.target.files[0]);
}

function zoomAjustarPantalla() {
    if (!imgFondo.complete || !imgFondo.src) return;
    
    const vW = window.innerWidth;
    const vH = window.innerHeight * 0.9; // 90% del alto
    const imgW = imgFondo.naturalWidth;
    const imgH = imgFondo.naturalHeight;

    const ratioW = vW / imgW;
    const ratioH = vH / imgH;
    
    escala = Math.min(ratioW, ratioH) * 0.95; // 5% de margen
    panX = (vW - imgW * escala) / 2;
    panY = (vH - imgH * escala) / 2;
    
    actualizarVista();
}

function agregarMesa() {
    const m = document.createElement('div');
    m.className = 'mesa disponible editando';
    // Poner en el centro visible
    m.style.left = (Math.abs(panX) + 50) / escala + "px";
    m.style.top = (Math.abs(panY) + 50) / escala + "px";
    m.dataset.inicio = "0";
    m.innerHTML = `<strong>#</strong><div class="cronometro" style="display:none">00:00</div>`;
    configurarMesa(m);
    contenedorMesas.appendChild(m);
    guardarTodo();
}

function configurarMesa(m) {
    m.onpointerup = function(e) {
        if (modoActual === 'edit-mesas') {
            const n = prompt("Nº de mesa:", m.querySelector('strong').innerText);
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

function actualizarVista() { 
    plano.style.transform = `translate(${panX}px, ${panY}px) scale(${escala})`; 
}

// Navegación (Zoom con dedos y arrastre)
interact('#viewport').gesturable({
    onmove: function (e) {
        escala *= (1 + e.ds);
        actualizarVista();
    }
}).draggable({
    listeners: { move(e) {
        if (modoActual === 'edit-mesas' && e.target.classList.contains('mesa')) return;
        panX += e.dx; panY += e.dy;
        actualizarVista();
    }}
});

function borrarTodo() {
    if(confirm("Se borrará el mapa y las mesas. ¿Estás seguro?")) {
        localStorage.clear();
        location.reload();
    }
}

// Reloj de mesas (No se detiene aunque refresques)
setInterval(() => {
    document.querySelectorAll('.mesa.ocupada').forEach(m => {
        const inicio = parseInt(m.dataset.inicio);
        if (inicio > 0) {
            const segs = Math.floor((Date.now() - inicio) / 1000);
            const mnts = Math.floor(segs / 60);
            const rSegs = (segs % 60).toString().padStart(2, '0');
            m.querySelector('.cronometro').innerText = `${mnts}:${rSegs}`;
        }
    });
}, 1000);
