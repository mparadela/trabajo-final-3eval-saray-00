class Evento {
    constructor(titulo, fecha, hora, esFestivo = false) {
        this.id = Date.now().toString();
        this.titulo = titulo;
        this.fecha = fecha;
        this.hora = hora || '';
        this.esFestivo = esFestivo;
    }

    getFechaFormateada() {
        const [anno, mes, dia] = this.fecha.split('-');
        return `${dia}/${mes}/${anno}`;
    }

    getTextoFecha() {
        if (this.hora) return `${this.getFechaFormateada()} a las ${this.hora}`;
        return this.getFechaFormateada();
    }
}

let listaEventos = [];

async function cargarFestivos() {
    const badge = document.getElementById('api-status');
    try {
        const respuesta = await fetch('https://date.nager.at/api/v3/PublicHolidays/2025/ES');
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);

        const festivos = await respuesta.json();
        festivos.forEach(f => {
            listaEventos.push(new Evento(f.localName, f.date, '', true));
        });

        badge.textContent = 'API conectada ✓';
        badge.style.color = '#0f9d58';
    } catch (error) {
        console.error('Error al cargar festivos:', error);
        badge.textContent = 'Error al cargar la API';
        badge.style.color = '#d93025';
    }
    renderizarEventos();
}

function renderizarEventos() {
    const contenedor = document.getElementById('event-list');
    contenedor.innerHTML = '';

    if (listaEventos.length === 0) {
        contenedor.innerHTML = '<p class="empty-msg">No hay eventos programados.</p>';
        return;
    }

    const ordenados = [...listaEventos].sort((a, b) => a.fecha.localeCompare(b.fecha));

    ordenados.forEach(evento => {
        const tipo = evento.esFestivo ? 'holiday' : 'user-event';
        const badgeClase = evento.esFestivo ? 'badge-holiday' : 'badge-user';
        const badgeTexto = evento.esFestivo ? 'Festivo' : 'Mi evento';
        const botonEliminar = evento.esFestivo
            ? ''
            : `<button class="btn-delete" onclick="eliminarEvento('${evento.id}')">✕</button>`;

        contenedor.innerHTML += `
            <div class="event-card ${tipo}">
                <div class="event-info">
                    <div class="event-title">
                        ${evento.titulo}
                        <span class="badge ${badgeClase}">${badgeTexto}</span>
                    </div>
                    <div class="event-date">${evento.getTextoFecha()}</div>
                </div>
                ${botonEliminar}
            </div>
        `;
    });
}

function guardarEnLocalStorage() {
    const propios = listaEventos.filter(e => !e.esFestivo);
    localStorage.setItem('eventos', JSON.stringify(propios));
}

function cargarDeLocalStorage() {
    const datos = localStorage.getItem('eventos');
    if (!datos) return;

    JSON.parse(datos).forEach(d => {
        const evento = new Evento(d.titulo, d.fecha, d.hora, false);
        evento.id = d.id;
        listaEventos.push(evento);
    });
}

function abrirModal() {
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function cerrarModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    limpiarFormulario();
}

function limpiarFormulario() {
    document.getElementById('event-form').reset();
    document.getElementById('error-title').textContent = '';
    document.getElementById('error-date').textContent = '';
    document.getElementById('error-time').textContent = '';
}

function validarFormulario(titulo, fecha, hora) {
    let esValido = true;

    document.getElementById('error-title').textContent = '';
    document.getElementById('error-date').textContent = '';
    document.getElementById('error-time').textContent = '';

    if (titulo.trim() === '') {
        document.getElementById('error-title').textContent = 'El título no puede estar vacío.';
        esValido = false;
    }

    if (fecha === '') {
        document.getElementById('error-date').textContent = 'La fecha es obligatoria.';
        esValido = false;
    } else {
        const hoy = new Date().toISOString().split('T')[0];
        if (fecha < hoy) {
            document.getElementById('error-date').textContent = 'La fecha no puede ser anterior a hoy.';
            esValido = false;
        }
    }

    if (hora === '') {
        document.getElementById('error-time').textContent = 'La hora es obligatoria.';
        esValido = false;
    }

    return esValido;
}

function manejarFormulario(e) {
    e.preventDefault();

    const titulo = document.getElementById('title').value;
    const fecha = document.getElementById('date').value;
    const hora = document.getElementById('time').value;

    if (!validarFormulario(titulo, fecha, hora)) return;

    const nuevoEvento = new Evento(titulo, fecha, hora, false);
    listaEventos.push(nuevoEvento);
    guardarEnLocalStorage();
    renderizarEventos();
    cerrarModal();
}

function eliminarEvento(id) {
    listaEventos = listaEventos.filter(e => e.id !== id);
    guardarEnLocalStorage();
    renderizarEventos();
}

const CODIGOS_TIEMPO = {
    0: { desc: 'Cielo despejado', icono: '☀️' },
    1: { desc: 'Principalmente claro', icono: '🌤️' },
    2: { desc: 'Parcialmente nublado', icono: '⛅' },
    3: { desc: 'Nublado', icono: '☁️' },
    45: { desc: 'Niebla', icono: '🌫️' },
    48: { desc: 'Niebla', icono: '🌫️' },
    51: { desc: 'Llovizna', icono: '🌦️' },
    61: { desc: 'Lluvia', icono: '🌧️' },
    71: { desc: 'Nieve', icono: '🌨️' },
    80: { desc: 'Chubascos', icono: '🌦️' },
    95: { desc: 'Tormenta', icono: '⛈️' },
};

function obtenerDatosTiempo(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max&timezone=Europe/Madrid`;

    fetch(url)
        .then(r => {
            if (!r.ok) throw new Error('Error en Open-Meteo');
            return r.json();
        })
        .then(datos => {
            const codigo = datos.daily.weathercode[0];
            const temp = datos.daily.temperature_2m_max[0];

            const info = CODIGOS_TIEMPO[codigo]
                || CODIGOS_TIEMPO[Object.keys(CODIGOS_TIEMPO).reverse().find(k => k <= codigo)]
                || { desc: 'Sin datos', icono: '🌡️' };

            document.getElementById('weather-icon').textContent = info.icono;
            document.getElementById('weather-temp').textContent = `${temp}°C`;
            document.getElementById('weather-desc').textContent = info.desc;
        })
        .catch(err => {
            console.error('No se pudo cargar el tiempo:', err);
            document.getElementById('weather-desc').textContent = 'No disponible';
        });
}

function cargarTiempo() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const { latitude, longitude } = pos.coords;
                document.querySelector('.weather-city').textContent = 'Tu ubicación';
                obtenerDatosTiempo(latitude, longitude);
            },
            () => {
                obtenerDatosTiempo(41.6488, -0.8891);
            }
        );
    } else {
        obtenerDatosTiempo(41.6488, -0.8891);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarDeLocalStorage();
    cargarFestivos();
    cargarTiempo();

    document.getElementById('btn-open-modal').addEventListener('click', abrirModal);
    document.getElementById('btn-close-modal').addEventListener('click', cerrarModal);
    document.getElementById('btn-cancel').addEventListener('click', cerrarModal);
    document.getElementById('event-form').addEventListener('submit', manejarFormulario);
});