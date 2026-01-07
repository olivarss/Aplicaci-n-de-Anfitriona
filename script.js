window.onload = function() {
    const datosGuardados = localStorage.getItem('miBarMapa');
    if (datosGuardados) {
        document.getElementById('plano-bar').innerHTML = datosGuardados;
        reconstruirFunciones();
    }
};

function agregarMesa() {
    const numero = prompt("Número de mesa:");
    const capacidad = prompt("¿Cuántos caben?");
    
    if (numero && capacidad) {
        const nuevaMesa = document.createElement('div');
        nuevaMesa.classList.add('mesa', 'disponible');
        nuevaMesa.style.left = "100px";
        nuevaMesa.style.top = "100px";
        nuevaMesa.innerHTML = `<strong>#${numero}</strong><span>${capacidad}pax</span>`;
        
        configurarMesa(nuevaMesa);
        document.getElementById('plano-bar').appendChild(nuevaMesa);
    }
}

function configurarMesa(mesa) {
    let tiempoPresionado;

    // 1. Cambiar color al tocar (clic rápido)
    mesa.onclick = function() {
        this.classList.toggle('disponible');
        this.classList.toggle('ocupada');
    };

    // 2. Borrar mesa al mantener presionado (1 segundo)
    mesa.ontouchstart = function(e) {
        tiempoPresionado = setTimeout(() => {
            if(confirm("¿Borrar esta mesa?")) {
                mesa.remove();
            }
        }, 1000);
        iniciarArrastre(e, mesa);
    };

    mesa.ontouchend = function() {
        clearTimeout(tiempoPresionado);
    };
}

function iniciarArrastre(e, elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    e = e.touches[0];
    pos3 = e.clientX;
    pos4 = e.clientY;

    document.ontouchend = () => {
        document.ontouchend = null;
        document.ontouchmove = null;
    };

    document.ontouchmove = (e) => {
        e = e.touches[0];
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Calculamos nueva posición
        let nuevaTop = elmnt.offsetTop - pos2;
        let nuevaLeft = elmnt.offsetLeft - pos1;

        elmnt.style.top = nuevaTop + "px";
        elmnt.style.left = nuevaLeft + "px";
    };
}

function guardarDisposicion() {
    // Antes de guardar, nos aseguramos de que las mesas estén en su sitio
    const plano = document.getElementById('plano-bar').innerHTML;
    localStorage.setItem('miBarMapa', plano);
    alert("¡Mapa guardado!");
}

function reconstruirFunciones() {
    const mesas = document.querySelectorAll('.mesa');
    mesas.forEach(mesa => configurarMesa(mesa));
}