const baseURL = 'https://calcount.develotion.com/'
const urlImg = 'https://calcount.develotion.com/imgs/'
let usuarioLogueado = null;
let arrayAlimentos = [];
let alimentosCantidad = [];

let arrayPaisesConUsuario = [];
let paises = [];


let map = null;
let marcadorUsuario = null;

let ubicacionUsuario = {
    latitude: -34.903816878014354, 
    longitude: -56.19059048108193
};


let ubicacionUsuarioIcon = L.icon({
    iconUrl: 'img/iconoUsuario.png',
    iconSize: [25, 25],
});




//Llamada al HTML
const MENU = document.querySelector("#menu");
const ROUTER = document.querySelector("#ruteo");
const NAV = document.querySelector("#nav");
const LOGIN = document.querySelector("#pantalla-login");
const REGISTRO = document.querySelector("#pantalla-registro");
const INICIO = document.querySelector("#pantalla-inicio");
const INICIOLOGUEADO = document.querySelector("#pantalla-inicioLogueado");
const REGISTROALIMENTO = document.querySelector("#pantalla-registroAlimento");
const LISTADODEREGISTRO = document.querySelector("#pantalla-listadoDeRegistro");
const BUSCARREGISTRO = document.querySelector("#pantalla-buscarRegistro");
const ELIMINARREGISTRO = document.querySelector("#pantalla-eliminarRegistro");
const MAPA = document.querySelector("#pantalla-mapa");

inicializar();
function inicializar() {
    inicializarAp();
    ROUTER.addEventListener('ionRouteDidChange', navegar);
}
function inicializarAp() {
    confirmarUsuarioLogueado();
    actualizarMenu();
    ocultarPantallas();
    if (usuarioLogueado) {
    INICIOLOGUEADO.style.display = "block"
    }else {
        LOGIN.style.display = "block"
    }
}
function mostrarPantallaMapa() {
    document.querySelector("#busquedaMapa").value = ""
    cargarUsuarioPorPais();
cargarPaisesMapa();
cargarPosicionUsuario();
funcionMapa();
    cerrarMenu();
    MAPA.style.display = "block"
}
function cargarPaisesMapa() {
    const url = baseURL + '/paises.php';
    if (usuarioLogueado) {
        const apikey = usuarioLogueado.apiKey;
        const idUsuario = usuarioLogueado.id;
        return fetch(url, {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "apiKey": apikey,
                "iduser": idUsuario
            }
        })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            if (data.error) {
                document.querySelector("#pListadoDeRegistro").innerHTML = data.error; 
            } else {
                
                paises = [];
                for (let i = 0; i < data.paises.length; i++) {
                    let paisActual = data.paises[i];
                    console.log("Pais actual:", paisActual);
                    
                    paises.push(Pais.parse(paisActual));
                }
                // Mostrar el array de paises
                return paises; 
            }
        })
        .catch((error) => {
            console.log(error);
            document.querySelector("#pListadoDeRegistro").innerHTML = "Ha ocurrido un error";
        });
    } else {
        document.querySelector("#pListadoDeRegistro").innerHTML = "No hay usuario logueado";
    }
}
function cargarPosicionUsuario() {
    if (Capacitor.isNativePlatform()) {
        // Cargar la posición del usuario desde el dispositivo.
        const loadCurrentPosition = async () => {
            const resultado = await Capacitor.Plugins.Geolocation.getCurrentPosition({timeout: 3000});
            if(resultado.coords && resultado.coords.latitude) {
                ubicacionUsuario = {
                    latitude: resultado.coords.latitude,
                    longitude: resultado.coords.longitude
                }
            }
        };
        loadCurrentPosition();
    } else {
        // Callback de éxito.
        window.navigator.geolocation.getCurrentPosition(
            function (pos) {
                if (pos && pos.coords && pos.coords.latitude) {
                    ubicacionUsuario = {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    };
                    // Una vez que se obtiene la ubicación del usuario, llamar a funcionMapa()
                    funcionMapa();
                } else {
                    // Si no se puede obtener la ubicación del usuario, llamar a funcionMapa() con el mapa predeterminado
                    funcionMapa();
                }
            },
            // Callback de error.
            function () {
                // No necesito hacer nada, ya asumí que el usuario estaba en ORT.
                // Llama a funcionMapa() con el mapa predeterminado
                funcionMapa();
            }
        );
    }
}
//muestra marcadores de ubicacion usuario y paises
function funcionMapa() {
    cargarPosicionUsuario();
    cargarPaisesMapa();
    const cantidadMinimaUsuarios = parseInt(document.querySelector("#busquedaMapa").value);
    console.log(cantidadMinimaUsuarios);

    console.log("Array de países con usuarios en funciónMapa:", arrayPaisesConUsuario);

    if (!map) { 
        map = L.map('mapa').setView([51.505, -0.09], 10); // Zoom inicial
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    } else {
        map.invalidateSize();
    }

    // Agregar o actualizar el marcador del usuario
    if (ubicacionUsuario.latitude && ubicacionUsuario.longitude) {
        if (!marcadorUsuario) {
            marcadorUsuario = L.marker([ubicacionUsuario.latitude, ubicacionUsuario.longitude], {icon: ubicacionUsuarioIcon}).addTo(map);
        } else {
            marcadorUsuario.setLatLng([ubicacionUsuario.latitude, ubicacionUsuario.longitude]);
        }
    }

    // Eliminar marcadores de países existentes
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker && layer !== marcadorUsuario) {
            map.removeLayer(layer);
        }
    });

    let coordenadasPuntos = [];

    // Agregar marcadores de países
    for (let i = 0; i < paises.length; i++) {
        let pais = paises[i];
        let latitud = pais.latitude; 
        let longitud = pais.longitude; 
        let nombrePais = pais.name; 
        let cantidadUsuarios = 0;

        for (let j = 0; j < arrayPaisesConUsuario.length; j++) {
            let paisConUsuario = arrayPaisesConUsuario[j];
            if (paisConUsuario.id === pais.id && paisConUsuario.cantidadDeUsuarios >= cantidadMinimaUsuarios) {
                cantidadUsuarios = paisConUsuario.cantidadDeUsuarios; 
                
                coordenadasPuntos.push([latitud, longitud]);
                
                L.marker([latitud, longitud]).addTo(map)
                    .bindPopup(`${nombrePais}<br>Usuarios: ${cantidadUsuarios}`);
                break;
            }
        }
    }

    // Si se encontraron puntos que cumplen las condiciones, centrar el mapa en ellos
    if (coordenadasPuntos.length > 0) {
        const bounds = L.latLngBounds(coordenadasPuntos);
        map.fitBounds(bounds); // Ajustar el mapa para mostrar todos los marcadores
    } else { 
        // Si no se encontraron puntos, centrar el mapa en la ubicación del usuario
        if (ubicacionUsuario.latitude && ubicacionUsuario.longitude) {
            map.setView([ubicacionUsuario.latitude, ubicacionUsuario.longitude], 10); // Establecer el mismo nivel de zoom cada vez
        }
    }
}
//aca quiero ver la cantidaddeUsuarios por paises
function cargarUsuarioPorPais() {
    const url = baseURL + '/usuariosPorPais.php';
    if (usuarioLogueado) {
        const apikey = usuarioLogueado.apiKey;
        const idUsuario = usuarioLogueado.id;
        return fetch(url, {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "apiKey": apikey,
                "iduser": idUsuario
            }
        })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            if (data.error) {
                document.querySelector("#pListadoDeRegistro").innerHTML = data.error; 
            } else {
                 arrayPaisesConUsuario = []; // LImpiar arrayPaissesCOnUSU
                for (let i = 0; i < data.paises.length; i++) {
                    let paisActual = data.paises[i];
                    let pais = PaisUsu.parse(paisActual); // Crear una instancia de país
                    pais.cantidadDeUsuarios = paisActual.cantidadDeUsuarios; // Establecer la cantidad de usuarios en el objeto PaisUsu
                    pais = usuariosPorPais(data.paises, pais.id); // Obtener el país del array de países
                    if (pais) {
                        arrayPaisesConUsuario.push(pais); // Agregar el país al array de países con usuarios
                        console.log("Pais con usuarios:", pais); // Mostrar el país con usuarios en el console.log
                    }
                }
                return arrayPaisesConUsuario; // Devolver el array de países con usuarios
            }
        })
        .catch((error) => {
            console.log(error);
            document.querySelector("#pListadoDeRegistro").innerHTML = "Ha ocurrido un error";
        });
    } else {
        document.querySelector("#pListadoDeRegistro").innerHTML = "No hay usuario logueado";
    }
}
function actualizarMenu() {
    ocultarMenu();
    if(usuarioLogueado) {
        //setToRoot
        document.querySelector("#btnMenuInicio").style.display = "block"
        document.querySelector("#btnMenuCerrarSesion").style.display = "block"
        document.querySelector("#btnMenuRegistrarAlimento").style.display = "block"
        document.querySelector("#btnMenuListadoDeRegistro").style.display = "block"
        document.querySelector("#btnMenuMapa").style.display = "block"
    }else {
        document.querySelector("#btnMenuIniciarSesion").style.display = "block"
        document.querySelector("#btnMenuRegistro").style.display = "block"
    }
}
function  ocultarMenu() {
    document.querySelector("#btnMenuInicio").style.display = "none";
    document.querySelector("#btnMenuIniciarSesion").style.display = "none";
    document.querySelector("#btnMenuRegistro").style.display = "none";
    document.querySelector("#btnMenuRegistrarAlimento").style.display = "none";
    document.querySelector("#btnMenuCerrarSesion").style.display = "none";
    document.querySelector("#btnMenuListadoDeRegistro").style.display = "none";
    document.querySelector("#btnMenuMapa").style.display = "none";
}
//actualizar usuario logueado desde local storage
function confirmarUsuarioLogueado () {
    const usuarioEnLocalStorage = localStorage.getItem("LoginUsuario");
    if (usuarioEnLocalStorage) {
        usuarioLogueado = JSON.parse(usuarioEnLocalStorage)
    } else {
        usuarioLogueado = null;
        console.log(usuarioLogueado)
    }
}
//subPantallas
function pantallaEliminar() {
    ELIMINARREGISTRO.style.display = "block";
    cargarAlimentos(arrayAlimentos);
    document.querySelector("#pListadoDeRegistro").innerHTML = "";
}
function pantallaBuscar() {
    BUSCARREGISTRO.style.display = "block";
    ELIMINARREGISTRO.style.display = "none";
    document.querySelector("#calendarioRegistroBuscar1").value = "";
    document.querySelector("#calendarioRegistroBuscar2").value = "";
    document.querySelector("#pFiltradoRegistros").innerHTML = "";
    document.querySelector("#listaFiltrados").innerHTML = "";
    document.querySelector("#pCaloriasDiarias").innerHTML = "";
    document.querySelector("#pFiltradoRegistros").innerHTML = "";
    document.querySelector("#pRegistroCaloriasTotales").innerHTML = "";
}
function cerrarMenu() {
MENU.close();
}
function navegar(evt) {
    const pantallaDestino = evt.detail.to;
    ocultarPantallas();
switch(pantallaDestino) {
        case"/":
        if(usuarioLogueado) {
            cargarAlimentos(arrayAlimentos);
            obtenerCalorias();
            INICIOLOGUEADO.style.display = "block"
        }else {
            INICIO.style.display = "block"
        }
        break
        case"/inicioLogueado":
        INICIOLOGUEADO.style.display = "block"
        break
        case "/login":
        LOGIN.style.display = "block";
        break;
        case "/registro":
        REGISTRO.style.display = "block";
        break;
        case "/registroAlimento":
            vaciarCampos();
        REGISTROALIMENTO.style.display = "block";
        break;
        case "/listadoDeRegistro":
            vaciarCampos();
            cargarAlimentos(arrayAlimentos);
        LISTADODEREGISTRO.style.display = "block";
        break;
            case "/buscarRegistro":
            BUSCARREGISTRO.style.display = "block";
            break;
            case "/eliminarRegistro":
            ELIMINARREGISTRO.style.display = "block";
            break;
            case "/mapa":
                MAPA.style.display = "block";
}
}
function ocultarPantallas() {
    LOGIN.style.display = "none";
    REGISTRO.style.display = "none";
    INICIO.style.display = "none";
    INICIOLOGUEADO.style.display = "none";
    REGISTROALIMENTO.style.display = "none"
    LISTADODEREGISTRO.style.display = "none"
    BUSCARREGISTRO.style.display = "none"
    ELIMINARREGISTRO.style.display = "none"
    MAPA.style.display = "none"
}
function cerrarSesion() {
    localStorage.clear();
    usuarioLogueado = null;
    cerrarMenu();
    inicializarAp();
    console.log(usuarioLogueado)
    NAV.setRoot("page-login");
    NAV.popToRoot();
    
}
function mostrarPaises () {
const url = baseURL + '/paises.php';
fetch(url, {
    method: "GET",
    headers: {
        "content-type": "application/json"
    }
})
.then((response) => {
    return response.json();
})
.then((data) => {
    
    if (data.error) {
        document.querySelector("#pRegistro").innerHTML = data.error;
    }else {
        let options = ""
        for(let i = 0; i < data.paises.length; i++) {
            let pais = data.paises[i]
            options += `<ion-select-option value="${pais.id}">${pais.name}</ion-select-option>`;
        }
        document.querySelector("#selectPaises").innerHTML = options
    }
})
.catch((error) => {
    console.log(error);
    document.querySelector("#pRegistro").innerHTML = "Ha ocurrido un error"
})
}
function vaciarCampos () {
    document.querySelector("#registroUsuario").value = "";
    document.querySelector("#registroContraseña").value = "";
    document.querySelector("#selectPaises").value = "";
    document.querySelector("#registroCalorias").value = "";
    document.querySelector("#pRegistro").innerHTML = "";
    document.querySelector("#loginUsuario").value = "";
    document.querySelector("#loginPassword").value = "";
    document.querySelector("#pLogin").innerHTML = "";
    document.querySelector("#selectAlimento").value = "";
    document.querySelector("#cantidadAlimento").value = "";
    document.querySelector("#calendario").value = "";
    document.querySelector("#pRegistroAlimento").innerHTML = "";
}
function registrarUsuario () {
    const usuario = document.querySelector("#registroUsuario").value;
    const password = document.querySelector("#registroContraseña").value;
    const pais = document.querySelector("#selectPaises").value;
    const calorias = document.querySelector("#registroCalorias").value;
    if(usuario && password && pais && calorias ) {
        if(!isNaN(calorias) && calorias > 0){
        const url = baseURL + '/usuarios.php'
        const data = {
            "usuario": usuario,
            "password":password,
            "idPais": pais,
            "caloriasDiarias": calorias
        }
        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        .then((response) => {
            console.log(response)
            return response.json();
        })
        .then((data) => {
            console.log(data)
            if(data.codigo === 200) {
                vaciarCampos();
                usuarioLogueado = Usuario.parse(data);
                document.querySelector("#tituloInicioLogueado").innerHTML = `<ion-title > Bienvenid@ ${usuario}</ion-title>`;
                document.querySelector("#present").innerHTML = `<ion-card>Registre un alimento para comenzar a utilizar la aplicacion.<br>
                </ion-card>`;
                localStorage.setItem("LoginUsuario", JSON.stringify(usuarioLogueado));
                inicializarAp();
                console.log(usuarioLogueado);
            }else {
                document.querySelector("#pRegistro").innerHTML = data.mensaje;
            }
        })
        .catch((error) => {
            console.log(error);
            document.querySelector("#pRegistro").innerHTML = "Ha ocurrrido un error.";
        })
    } else {
        document.querySelector("#pRegistro").innerHTML = "Cantidad debe ser un número mayor a 0.";
    }
} else {
    document.querySelector("#pRegistro").innerHTML = "Todos los campos obligatorios.";
}
}
function loginUsuario () {
    const usuario = document.querySelector("#loginUsuario").value
    const password = document.querySelector("#loginPassword").value
    if (usuario && password) {
        const url = baseURL + '/login.php';
        const data = {
            "usuario":usuario,
            "password":password
        };
        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        .then((response) => {
            console.log(response);
            return response.json();
        })
        .then((data) => {
            console.log(data)
            if(data.codigo === 200) {
                vaciarCampos();
                usuarioLogueado = Usuario.parse(data);
                if(usuarioLogueado){
                document.querySelector("#tituloInicioLogueado").innerHTML = 
                `<ion-title color="medium" > Bienvenid@ ${usuario}</ion-title>`;
                localStorage.setItem("LoginUsuario", JSON.stringify(usuarioLogueado));
                obtenerCalorias();
                NAV.setRoot("page-inicioLogueado")
                inicializarAp();
            }else {
                document.querySelector("#pLogin").innerHTML = data.mensaje;
            }
            } else {
                document.querySelector("#pLogin").innerHTML = data.mensaje;
            }
        })
        .catch((error) => {
            console.log(error)
            document.querySelector("#pLogin").innerHTML = "Ha ocurrido un error.";
        })
    }else {
        document.querySelector("#pLogin").innerHTML = "Todos los campos son obligatorios."
    }
}
function mostrarAlimentos() {
    const url = baseURL + '/alimentos.php';
    if(usuarioLogueado) {
        const apikey = usuarioLogueado.apiKey;
        const idUsuer = usuarioLogueado.id;
    fetch(url, {
        method: "GET",
        headers: {
            "content-type": "application/json",
            "apiKey": apikey,
            "iduser": idUsuer
        }
    })
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        if (data.error) {
            document.querySelector("#pRegistroAlimento").innerHTML = data.error;
        }else {
            let options = "";
            for(let i = 0; i < data.alimentos.length; i++) {
                let alimento = data.alimentos[i]
                console.log(alimento)
                options += `<ion-select-option value="${alimento.id}">${alimento.nombre} "${alimento.porcion.slice(-1)}"</ion-select-option>`;
            }
            document.querySelector("#selectAlimento").innerHTML = options
        }
    })
    .catch((error) => {
        console.log(error);
        document.querySelector("#pRegistroAlimento").innerHTML = "Ha ocurrido un error"
    })
} else {
    document.querySelector("#pRegistroAlimento").innerHTML = "No hay usuario logueado"
}
}
// mostrar en el INICIO 
function obtenerCalorias() {
    cargarAlimentos(arrayAlimentos);
    cerrarMenu();
    const url = baseURL + '/registros.php?idUsuario=' + usuarioLogueado.id;
    if (usuarioLogueado) {
        const apikey = usuarioLogueado.apiKey;
        const idUsuer = usuarioLogueado.id;
        fetch(url, {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "apiKey": apikey,
                "iduser": idUsuer
            }
        })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            console.log(data);
            if (data.error) {
                document.querySelector("#pCaloriasDiariasInicio").innerHTML = data.error;
            } else {
                let contCaloriasDiarias = 0;
let contCaloriasTotales = 0;

const fechaActual = new Date().toISOString().slice(0, 10);
console.log("Fecha actual:", fechaActual);

for (let i = 0; i < data.registros.length; i++) {
    let registroActual = data.registros[i];
    let alimento = devolverIdAlimento(arrayAlimentos, registroActual.idAlimento);
    if (alimento) {
        // Calcular la cantidad de porciones consumidas
        let cantidadPorciones = registroActual.cantidad / parseFloat(alimento.porcion); // Convertir la porción a un número decimal "le saca el sufijio"
        // Calcular las calorías totales teniendo en cuenta la cantidad de porciones
        contCaloriasTotales += alimento.calorias * cantidadPorciones;
        console.log("registroactual.fecha", registroActual.fecha)
        if (registroActual.fecha === fechaActual) {
            // Calcular las calorías diarias teniendo en cuenta la cantidad de porciones
            contCaloriasDiarias += alimento.calorias * cantidadPorciones;
        }
    }
}
                let colorBadge = "success";
                if (contCaloriasDiarias > usuarioLogueado.caloriasDiarias) {
                    
                    colorBadge = "danger";
                } else if (contCaloriasDiarias < usuarioLogueado.caloriasDiarias * 0.9) {
                    colorBadge = "success";
                } else {
                    colorBadge = "warning";
                }
                let titulo = `<ion-title><ion-text color="">
                <h1>Bienvenido</h1>
            </ion-text></ion-title>`
            let html = `<ion-list>
                            <ion-card-header>
                                    <ion-item color="ligth">
                                    <ion-label>Calroias totales: </ion-label>
                                    <ion-badge color="medium">${contCaloriasTotales}</ion-badge>
                                </ion-item></ion-card-header>
                                <ion-card-header>
                                <ion-item color="ligth">
                                    <ion-label>Calroias diarias: </ion-label>
                                    <ion-badge color="${colorBadge}">${contCaloriasDiarias}</ion-badge>
                                </ion-item>
                                </ion-card-header>
                            </ion-list>`;
                document.querySelector("#mostrarCaloriasInicio").innerHTML = html;
                document.querySelector("#tituloInicioLogueado").innerHTML = titulo;
            }
        })
        .catch((error) => {
            console.log(error);
            document.querySelector("#pCaloriasDiariasInicio").innerHTML = "Ha ocurrido un error";
        });
    } else {
        document.querySelector("#pCaloriasDiariasInicio").innerHTML = "No hay usuario logueado";
    }
}
function registrarAlimento () {
    const idAlimento = document.querySelector("#selectAlimento").value;
    const cantidad = document.querySelector("#cantidadAlimento").value;
    const fecha = document.querySelector("#datetimeCalRegAl").value;
    let fechaFormateada = new Date(fecha);
    let fechaActual = new Date();
    
    if(idAlimento && cantidad && fecha) {
        if(!isNaN(cantidad) && cantidad > 0) {
        if(fechaFormateada <= fechaActual) {
            const url = baseURL + '/registros.php'
            const data = {
                "idAlimento": idAlimento,
                "idUsuario": usuarioLogueado.id,
                "cantidad": cantidad,
                "fecha": fecha
            };
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": usuarioLogueado.apiKey,
                    "idUser": usuarioLogueado.id
                },
                body: JSON.stringify(data)
            })
            .then((response) => {
                console.log(response);
                return response.json();
            })
            .then((data) => {
                console.log(data);
                if(data.codigo === 200) {
                    vaciarCampos();
                    document.querySelector("#pRegistroAlimento").innerHTML = "Registro exitoso.";
                } else {
                    document.querySelector("#pRegistroAlimento").innerHTML = "Registro anulado.";
                }
            })
            .catch((error) => {
                document.querySelector("#pRegistroAlimento").innerHTML = "Ha ocurrido un error al registrar el alimento.";
                console.log(error);
            });
        } else {
            document.querySelector("#pRegistroAlimento").innerHTML = "La fecha no puede ser posterior a la fecha actual.";
        }
    } else {
        document.querySelector("#pRegistroAlimento").innerHTML = "La cantidad debe ser un número mayor a 0.";
    }
}else {
    document.querySelector("#pRegistroAlimento").innerHTML = "Todos los campos son obligatorios.";
}
}
//NOVAAA
function mostrarSelectEliminarRegistro() {
    const url = baseURL + '/registros.php?idUsuario=' + usuarioLogueado.id;
    if (usuarioLogueado) {
        const apikey = usuarioLogueado.apiKey;
        const idUsuer = usuarioLogueado.id;
        fetch(url, {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "apiKey": apikey,
                "iduser": idUsuer
            }
        })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            console.log(data);
            if (data.error) {
                document.querySelector("#pListadoDeRegistro").innerHTML = data.error;
            } else {
                console.log("Registros:", data.registros);
                let slcoptions = "";
                    for (let i = 0; i < data.registros.length; i++) {
                        const registroActual = data.registros[i];
                        console.log("Registro actual:", registroActual);
                        let alimento = devolverIdAlimento(arrayAlimentos, registroActual.idAlimento);
                        console.log("Alimento encontrado:", alimento);
                        console.log("ArrayAlimentos encontrado:", arrayAlimentos);
                        if (alimento) {
                            slcoptions += `
                            <ion-select-option value="${registroActual.id}">${alimento.nombre} Tiene ${alimento.calorias}Calorias</ion-select-option>`;
                        } 
                }
                document.querySelector("#selectListadoRegistro").innerHTML = slcoptions;
            }
        })
        .catch((error) => {
            console.log(error);
            document.querySelector("#pListadoDeRegistro").innerHTML = "Ha ocurrido un error";
        });
    } else {
        document.querySelector("#pListadoDeRegistro").innerHTML = "No hay usuario logueado";
    }
}
//BTN MENU REGISTRO 
function listadoRegistros() {
    cargarAlimentos(arrayAlimentos);
    cerrarMenu();
    BUSCARREGISTRO.style.display = "none";
    ELIMINARREGISTRO.style.display = "none";
    const url = baseURL + '/registros.php?idUsuario=' + usuarioLogueado.id;
    if (usuarioLogueado) {
        const apikey = usuarioLogueado.apiKey;
        const idUsuer = usuarioLogueado.id;
        fetch(url, {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "apiKey": apikey,
                "iduser": idUsuer
            }
        })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            console.log(data);
            if (data.error) {
                document.querySelector("#pListadoDeRegistro").innerHTML = data.error;
            } else {
                console.log("Registros:", data.registros);
                let listaHtml = "";
                let contCalorias = 0;
                    for (let i = 0; i < data.registros.length; i++) {
                        const registroActual = data.registros[i];
                        console.log("Registro actual:", registroActual);
                        let alimento = devolverIdAlimento(arrayAlimentos, registroActual.idAlimento);
                        console.log("Alimento encontrado:", alimento);
                        console.log("ArrayAlimentos encontrado:", arrayAlimentos);
                        if (alimento) {
                            // Obtener la cantidad de porciones del alimento
                        let cantidadPorciones = parseFloat(alimento.porcion);
                        // Calcular las calorías totales del registro
                        let caloriasTotales = (alimento.calorias * registroActual.cantidad) / cantidadPorciones;
                            console.log("Calorías por alimento:", alimento.porcion);
                            contCalorias += caloriasTotales;
                                listaHtml +=`
                                <ion-list-header color="medium">
                                    <ion-label>Registro fecha: ${registroActual.fecha}</ion-label>
                                </ion-list-header>
                                <ion-item> 
                                <img src="${alimento.imagen}">
                                <ion-label>${alimento.nombre} tiene ${alimento.calorias} Calorías por cada porcion de ${alimento.porcion}</ion-label><br>
                                <ion-badge color="ligth"> Calorias por Registro.<br>
                                ${caloriasTotales} 
                                <ion-card>
                                </ion-card>
                                </ion-badge>
                                <ion-button onclick="eliminarRegistro(${registroActual.id})" color="danger">Eliminar</ion-button>
                            </ion-item>
                            </ion-list><br>`;
                        } 
                }
                document.querySelector("#listadoDeRegistro").innerHTML = listaHtml;
                document.querySelector("#pRegistroCalorias").innerHTML = `<ion-badge color="primary">Calorías totales:  ${contCalorias} </ion-badge>`;
            }
        })
        .catch((error) => {
            console.log(error);
            document.querySelector("#pListadoDeRegistro").innerHTML = "Ha ocurrido un error";
        });
    } else {
        document.querySelector("#pListadoDeRegistro").innerHTML = "No hay usuario logueado";
    }
}
function usuariosPorPais(arrayPaises, idPais) {
    for (let i = 0; i < arrayPaises.length; i++) {
        let pais = arrayPaises[i];
        if (pais.id === idPais) {
            return pais;
        }
    }
    return null; 
}

function devolverIdAlimento(arrayAlimentos, idAlimentoRegistro) {
    cargarAlimentos(arrayAlimentos)
    for (let i = 0; i < arrayAlimentos.length; i++) {
        let alimento = arrayAlimentos[i];
        if (alimento.id === idAlimentoRegistro) {
            return alimento;
        }
    }
    console.log("No se encontró ningún alimento con ID", idAlimentoRegistro);
    return null; // Devolver null si no se encuentra el alimento
}
function eliminarRegistro(idRegistro) {
    const url = baseURL + '/registros.php?idRegistro=' + idRegistro;
    if (usuarioLogueado) {
        const apiKey = usuarioLogueado.apiKey;
        const idUser = usuarioLogueado.id;
        fetch(url, {
            method: "DELETE",
            headers: {
                "content-type": "application/json",
                "apiKey": apiKey,
                "iduser": idUser
            }
        })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            if (data.error) {
                document.querySelector("#pListadoDeRegistro").innerHTML = data.error;
            } else {
                console.log(usuarioLogueado);
                document.querySelector("#pListadoDeRegistro").innerHTML = "Registro eliminado.";
                listadoRegistros();
            }
        })
        .catch((error) => {
            console.log(error);
            document.querySelector("#pListadoDeRegistro").innerHTML = "Ha ocurrido un error";
        });
    } else {
        document.querySelector("#pListadoDeRegistro").innerHTML = "Seleccione una opción";
    }
}
function cargarAlimentos(arrayAlimentos) {
    const url = baseURL + '/alimentos.php';
    if (usuarioLogueado) {
        const apikey = usuarioLogueado.apiKey;
        const idUsuario = usuarioLogueado.id;
        return fetch(url, {
            method: "GET",
            headers: {
                "content-type": "application/json",
                "apiKey": apikey,
                "iduser": idUsuario
            }
        })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            if (data.error) {
                document.querySelector("#pListadoDeRegistro").innerHTML = data.error; 
            } else {
                for (let i = 0; i < data.alimentos.length; i++) {
                    let registroActual = data.alimentos[i];
                    arrayAlimentos.push(Alimento.parse(registroActual));
                }
                return arrayAlimentos; 
            }
        })
        .catch((error) => {
            console.log(error);
            document.querySelector("#pListadoDeRegistro").innerHTML = "Ha ocurrido un error";
        });
    } else {
        document.querySelector("#pListadoDeRegistro").innerHTML = "No hay usuario logueado";
    }
} 
// BTN BUSCAR REGISTRO verificar formato fechas y comparacion despues de las 9 no funciona
function filtrarRegistro() {
    cargarAlimentos(arrayAlimentos);
    let fechaInicio = document.querySelector("#datetime").value;
    let fechaFin = document.querySelector("#datetime2").value;
    
    if(fechaInicio && fechaFin) {
        let fechaInicioFormateada = fechaInicio.slice(0, 10);
        let fechaFinFormateada = fechaFin.slice(0, 10);
        if(fechaInicioFormateada <= fechaFinFormateada) {
            const fechaActual = new Date();
            if (new Date(fechaInicio) <= fechaActual && new Date(fechaFin) <= fechaActual) { 
                if(usuarioLogueado) {
                    const url = baseURL + '/registros.php?idUsuario=' + usuarioLogueado.id;
                    const apikey = usuarioLogueado.apiKey;
                    const idUsuario = usuarioLogueado.id;
                    fetch(url, {
                        method: "GET",
                        headers: {
                            "content-type": "application/json",
                            "apiKey": apikey,
                            "iduser": idUsuario
                        }
                    })
                    .then((response) => {
                        return response.json();
                    })
                    .then((data) => {
                        console.log(data);
                        if (data.error) {
                            document.querySelector("#pFiltradoRegistros").innerHTML = data.error;
                        } else {
                            let listaHtml = "";
                            let contCaloriasTotales = 0;
                            for (let i = 0; i < data.registros.length; i++) {
                                const registroActual = data.registros[i];
                                const fechaRegistroString = registroActual.fecha.substring(0, 10);
                                if (fechaRegistroString >= fechaInicioFormateada && fechaRegistroString <= fechaFinFormateada) {
                                    let alimento = devolverIdAlimento(arrayAlimentos, registroActual.idAlimento);
                                    if (alimento) {
                                        listaHtml += `
                                            <ion-list-header color="medium">
                                                <ion-label>Registro fecha: ${registroActual.fecha}</ion-label>
                                            </ion-list-header>
                                            <ion-item>
                                                <img src="${alimento.imagen}">
                                                <ion-label>${alimento.nombre}-"${alimento.calorias}" Calorias</ion-label><br>
                                            </ion-item><br>`;
                                        contCaloriasTotales += alimento.calorias;
                                    }
                                }
                            }
                            document.querySelector("#pFiltradoRegistros").innerHTML = "";
                            document.querySelector("#pRegistroCaloriasTotales").innerHTML = "";
                            document.querySelector("#listaFiltrados").innerHTML = listaHtml;
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        document.querySelector("#pFiltradoRegistros").innerHTML = "Ha ocurrido un error";
                    });
                }
            } else {
                document.querySelector("#pFiltradoRegistros").innerHTML = "Las fechas no pueden ser posteriores a la fecha actual.";
                document.querySelector("#pRegistroCaloriasTotales").innerHTML = "";
                document.querySelector("#pCaloriasDiarias").innerHTML = "";
            }
        } else {
            document.querySelector("#pFiltradoRegistros").innerHTML = "La fecha de inicio no puede ser mayor a la fecha fin.";
            document.querySelector("#pRegistroCaloriasTotales").innerHTML = "";
            document.querySelector("#pCaloriasDiarias").innerHTML = "";
        }
    } else {
        document.querySelector("#pFiltradoRegistros").innerHTML = "Por favor, seleccione ambas fechas.";
        document.querySelector("#pRegistroCaloriasTotales").innerHTML = "";
        document.querySelector("#pCaloriasDiarias").innerHTML = "";
    }
}
