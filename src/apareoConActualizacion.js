// importar lo que sea necesario
import FileManager from './FileManager.js'
import util from './Util.js'

// Constante global, donde se irán guardando los mensajes que genere la función loggerCallback(). Puede ser accedida por todas las funciones del módulo
const mensajes = []

/**
 * ordena (in place) una coleccion de datos segun las claves provistas.
 * @param {Object[]} coleccion el array que quiero ordenar
 * @param {string[]} claves las claves por las que quiero ordenar, por orden de importancia
 */
function ordenar(coleccion, claves) {
    const sorted = coleccion.sort(function(a, b) {
        let result = 0
        let iterator = 0
        // mientras la comparación resulte en equivalencias, sigue comparando hasta agotar las claves
        while (result == 0 && iterator < claves.length) {
            let key = claves[iterator]
            result = a[key] - b[key]
            iterator ++
        }
        return result    
    })
    return sorted
}

/**
 * recibe las rutas del archivo de deudas original, archivo de pagos, archivo de deudas con las actualizaciones, y archivo de log para registrar errores o advertencias.
 * @param {string} rutaDeudasOld
 * @param {string} rutaPagos
 * @param {string} rutaDeudasNew
 * @param {string} rutaLog
 */
function actualizarArchivosDeudas(rutaDeudasOld, rutaPagos, rutaDeudasNew, rutaLog) {
    const deudasOLD = FileManager.parseJsonFile(rutaDeudasOld)
    const pagos = FileManager.parseJsonFile(rutaPagos)

    const deudasOLDOrdenado = ordenar(deudasOLD, ['dni', 'apellido', 'debe'])
    const pagosOrdenado = ordenar(pagos, ['dni', 'apellido', 'pago'])
    //console.log(deudasOLDOrdenado)
    //console.log(pagosOrdenado)

    const deudasActualizadas = actualizarDeudasConApareo(deudasOLDOrdenado, pagosOrdenado, loggerCallback)

    /* const deudasActualizadas = actualizarDeudas(deudasOLD, pagos, loggerCallback) */

    FileManager.writeFile(rutaLog, mensajes)
    FileManager.writeFile(rutaDeudasNew, JSON.stringify(deudasActualizadas, null, 2)) 

}

function actualizarDeudasConApareo(deudas, pagos, logger) {
    const deudasActualizadas = []
    let iDeudas = 0
    let iPagos = 0
    while(iDeudas < deudas.length || iPagos < pagos.length) {
        if (iDeudas >= deudas.length || pagos[iPagos].dni > deudas[iDeudas].dni) {
            logger(armarMsgPagoSinDeudaAsociada(pagos[iPagos]))
            iPagos ++
        } else if (iPagos >= pagos.length || deudas[iDeudas].dni > pagos[iPagos].dni) { iDeudas ++}
            else {
                while (deudas[iDeudas] != null && pagos[iPagos] != null && deudas[iDeudas].dni == pagos[iPagos].dni) {
                    if(deudas[iDeudas].apellido != pagos[iPagos].apellido) {
                        logger(armarMsgPagoConDatosErroneos(deudas[iDeudas], pagos[iPagos]))
                    } else {
                        deudas[iDeudas].debe -= pagos[iPagos].pago
                    }
                    iPagos ++
                }
                if(deudas[iDeudas].debe < 0) {
                    logger(armarMsgPagoDeMas(deudas[iDeudas]))
                } else if(deudas[iDeudas].debe > 0) {   
                    deudasActualizadas.push(deudas[iDeudas])
                }    
                iDeudas ++
            }   
    }
    return deudasActualizadas 
}



/** Almacena el mensaje recibido en la constante mensajes
 * @callback loggerCallback
 * @param {string} error error message to display
 */
 function loggerCallback(msg) { 
    mensajes.push(msg)
 }

/**
 * realiza el apareo con actualizacion entre deudas y pagos, y loguea algunos eventos relevantes.
 * @param {Object[]} deudas las deudas originales
 * @param {Object[]} pagos los pagos a aplicar
 * @param {loggerCallback} logger funcion a la cual llamar en caso de necesitar loguear un evento
 * @returns {Object[]} las deudas actualizadas
 */

function actualizarDeudas(deudas, pagos, logger) {
    // declaramos la colección a devolver
    const deudasActualizadas = []

    // recorremos la lista de pagos
    pagos.forEach(pago => {
        // buscamos una deuda con el dni del pago
        const deuda = buscarEnColeccion(deudas, pago.dni, 'dni')
        // si no existe una deuda con el dni del pago, loggeamos el error usando el callback
        if (deuda == null) {
            logger(armarMsgPagoSinDeudaAsociada(pago))
        // si existe tal deuda, pero el apellido no coincide con el del pago, loggeamos el error    
        } else if (deuda.apellido != pago.apellido) {
            logger(armarMsgPagoConDatosErroneos(deuda, pago))
        // si ambos datos coinciden, procesamos el pago, actualizando la deuda   
        } else {
            deuda.debe -= pago.pago
        }    
    })

    // una vez procesados todos los pagos, recorremos las deudas para saber cuáles debemos guardar en deudasActualizadas
    deudas.forEach(deuda => {
        // si aun hay deuda pendiente, la agregamos a la deudasActualizadas
        if (deuda.debe > 0) {
            deudasActualizadas.push(deuda)
        // si la deuda es negativa, loggeamos el mensaje, y no la agregamos
        } else if (deuda.debe < 0) {
            logger(armarMsgPagoDeMas(deuda))
        }
    })

    return deudasActualizadas
}
/** Devuelve el primer match de una colección comparando el valor dado con el valor del campo de la clave dada
 * @param  {Object[]} coleccion
 * @param  {} valor para comparar
 * @param  {} clave para saber qué atributo de los elementos de la colección hay que comparar
 */
function buscarEnColeccion(coleccion, valor, clave) {
    return coleccion.find(function(elemento){
        return elemento[clave] == valor
    })
}

/**
 * arma un mensaje informando los detalles de un pago que no corresponde a ninguna deuda
 * @param {Object} pago el pago sin deuda correspondiente
 * @returns {string} el mensaje a logguear
 */
function armarMsgPagoSinDeudaAsociada(pago) {
    const logMsg = `
el siguiente pago no corresponde a ninguna deuda:
${util.inspect(pago)}

=================================
`
    return logMsg
}

/**
 * arma un mensaje indicando el dni del sujeto que pagó de más, y cuanto dinero quedó a su favor
 * @param {Object} deuda la deuda con excedente de pago
 * @returns {string} el mensaje a logguear
 */
function armarMsgPagoDeMas(deuda) {
    const logMsg = `
dni: ${deuda.dni} posee $${Math.abs(deuda.debe)} a su favor

=================================
`
    return logMsg
}

/**
 * arma un mensaje mostrando la deuda, y el pago que no se pudo concretar, y notifica que el registro permanece sin cambios.
 * @param {Object} deuda
 * @param {Object} pago
 * @returns {string} el mensaje a logguear
 */
function armarMsgPagoConDatosErroneos(deuda, pago) {
    const logMsg = `
error al querer actualizar esta deuda:
${util.inspect(deuda)}

con este pago:
${util.inspect(pago)}

se mantiene el registro original sin cambios

=================================
`
    return logMsg
}

// no modificar la interfaz pública!
export default {
    actualizarArchivosDeudas
}
