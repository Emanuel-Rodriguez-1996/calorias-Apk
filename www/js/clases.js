
class Usuario {
    constructor() {
        this.codigo = null
        this.apiKey = null
        this.id = null
        this.caloriasDiarias = null
    }

    static parse(data) {
        let instancia = new Usuario();

        if(data.codigo) {
            instancia.codigo = data.codigo;
        }
        if(data.apiKey) {
            instancia.apiKey = data.apiKey;
        }
        if(data.id) {
            instancia.id = data.id;
        }
        if(data.caloriasDiarias) {
            instancia.caloriasDiarias = data.caloriasDiarias;
        }
        return instancia;
    
    }
}

class Alimento {
    constructor() {
        this.id = null;
        this.nombre = null;
        this.calorias = null;
        this.proteinas = null;
        this.grasas = null;
        this.carbohidratos = null;
        this.porcion = null;
        this.imagen = null;
    }
    static parse(data) {
        let instancia = new Alimento();

        if(data.id) {
            instancia.id = data.id;
        }
        if(data.nombre) {
            instancia.nombre = data.nombre;
        }
        if(data.calorias) {
            instancia.calorias = data.calorias;
        }
        if(data.proteinas) {
            instancia.proteinas = data.proteinas;
        }
        if(data.grasas) {
            instancia.grasas = data.grasas;
        }
        if(data.carbohidratos) {
            instancia.carbohidratos = data.carbohidratos;
        }
        if(data.porcion) {
            instancia.porcion = data.porcion;
        }
        if(data.imagen) {
            instancia.imagen = "https://calcount.develotion.com/imgs/"+data.imagen+".png";
        }
        return instancia;
    }

}

class RegistroAlimento {
    constructor() {
        this.id = null;
        this.idAlimento = null;
        this.idUsuario = null;
        this.cantidad = null;
        this.fecha = null;
    }
    static parse(data) {
        let instancia = new RegistroAlimento();

        if(data.id) {
            instancia.id = data.id;
        }
        if(data.idAlimento) {
            instancia.idAlimento = data.idAlimento
        }
        if(data.idUsuario) {
            instancia.idUsuario = data.idUsuario;
        }
        if(data.cantidad) {
            instancia.cantidad = data.cantidad;
        }
        if(data.fecha) {
            instancia.fecha = data.fecha;
}
return instancia;
}
}


class Pais {
    constructor() {
        this.id = null;
        this.name = null;
        this.currency =  null;
        this.latitude = null;
        this.longitude = null;
    }
    static parse(data) {
        let instancia = new Pais();

        if(data.id) {
            instancia.id = data.id;
        }
        if(data.name) {
            instancia.name = data.name
        }
        if(data.currency) {
            instancia.currency = data.currency;
        }
        if(data.latitude) {
            instancia.latitude = data.latitude;
        }
        if(data.longitude) {
            instancia.longitude = data.longitude;
}
return instancia;
}
}
class PaisUsu {
    constructor() {
        this.id = null;
        this.name = null;
        this.cantidadDeUsuarios =  null;
    }
    static parse(data) {
        let instancia = new Pais();

        if(data.id) {
            instancia.id = data.id;
        }
        if(data.name) {
            instancia.name = data.name
        }
        if(data.cantidadDeUsuarios) {
            instancia.cantidadDeUsuarios = data.cantidadDeUsuarios;
        }
return instancia;
} 
}
