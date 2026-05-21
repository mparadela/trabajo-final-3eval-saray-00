class Evento{
    constructor(titulo, fecha, hora, esFestivo = false){
        this.id = Date.now().toString();
        this.titulo = titulo; 
        this.fecha = fecha; 
        this.hora = hora || ''; 
        this.esFestivo = esFestivo; 
    }

    getFechaFormateada(){
        const [anno, mes, dia] = this.fecha.split('-');
        return '${dia}/${mes}/${anno}';
    }

    getTextoFecha(){
        if(this.hora){
            return `${this.getFecha.Formateada()} a las ${this.hora}`;

        
        }

        return this.getFechaFormateada();
    }
}

async function cargarFestivos(){
    const estadoBadge = document.getElementById('api-status');

try{
    const respuesta = await fetch('https://date.nager.at/api/v3/PublicHolidays/2025/ES');
    if(!respuesta.ok){
        throw new Error(`Error Http: ${respuesta.status}`);
    
    }
    const festivos = await respuesta.json();

    festivos.forEach(festivo => {
        const evento = new Evento(festivo.localName, festivo.date, '', true);
        listaEventos.push(evento);
    });

    estadoBadge.textContent = 'la api esta conectada'; 
} catch(error){
    console.error("no se cargan los festivos", error); 
    estadoBadge.textContent = "la api da error";
}
renderizarEventos(); 
}


function renderizarEventos(){
    const contenedor = document.getElementById('event-list');
    contenedor.innerHTML = ''; 

    if(listaEventos.length === 0){
        contenedor.innerHTML = 'no hay eventos programados'; 
        return; 
    }

    const ordenados = [...listaEventos].sort((a,b) => a.fecha.localeCompare(b.fecha));

    ordenados.forEach(eventos=>{
        const tipo = evento.esFestivo ? 'holiday' : 'user-event'; 
        const badgeTexto = evento.esFestivo ? 'festivo' : 'Mi evento';
        const badgeClase = evento.esFestivo ? 'badge-holiday' : 'badge-user'; 

        const botonEliminar = evento.esFestivo 
        ? '' : `<button class="btn-delete" onclick="eliminarEvento('${evento.id}')">✕</button>`;

        const card = `            <div class="event-card ${tipo}">
                <div class="event-info">
                    <div class="event-title">
                        ${evento.titulo}
                        <span class="badge ${badgeClase}">${badgeTexto}</span>
                    </div>
                    <div class="event-date">${evento.getTextoFecha()}</div>
                </div>
                ${botonEliminar}
            </div>`;

            contenedor.innerHTML += card; 
    });

}


function eliminarEvento(id){
    console.log('Eliminar evento con el id:', id); 
}

document.addEventListener('DOMContentLoaded', ()=>{
    cargarFestivos();
});