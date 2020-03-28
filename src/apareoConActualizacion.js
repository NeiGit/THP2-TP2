// importar lo que sea necesario
import FileManager from './FileManager.js'
import util from './Util.js'
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
        while (result == 0 && iterator < claves.length) {
            let key = claves[iterator]
            result = a[key] - b[key]
            iterator ++
        }
        return result    
    })
    return sorted
}
function log(e) {
    console.log(e.dni, e.debe)
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
    const deudasNEW = FileManager.parseJsonFile(rutaDeudasNew)
    actualizarDeudas(deudasOLD, pagos, loggerCallback)
}

/**
 * @callback loggerCallback
 * @param {string} error error message to display
 */

 function loggerCallback(msg) {
    console.log(msg)
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
    const deudasActualizadas = []

    // Inválidos. No hay deuda para ese dni
    const pagosSinDeuda = pagos.filter(p => deudas.every(d => d.dni != p.dni))
    pagosSinDeuda.forEach(p => {
        logger(armarMsgPagoSinDeudaAsociada(p))
    }) 

    // PagoConDatosErroneos
    const pagosConDatosErroneos = pagos.filter(p => deudas.some(d => d.dni == p.dni && d.apellido != p.apellido))
    pagosConDatosErroneos.forEach(p => {
        logger(armarMsgPagoConDatosErroneos(deudas[0], p))
    })

    // Deudas sin pagos asociados
    const deudasSinPagosAsociados = deudas.filter(d => pagos.every(p => d.dni != p.dni))

    // Guardamos dos colecciones con las deudas válidas y los pagos válidos
    const deudasConPagos = ordenar(deudas.filter(d => !deudasSinPagosAsociados.includes(d)), ['dni', 'debe'])

    const pagosValidos = ordenar(pagos.filter(p => !pagosConDatosErroneos.includes(p) && !pagosSinDeuda.includes(p)), ['dni', 'pago'])

    // Agregamos las deudas a la lista de deudas actualizadas. Si hay más de una para el mismo dni se suman sus montos('debe')
    deudasConPagos.forEach(d => {
        const deudaExistente = buscarEnColeccion(deudasActualizadas, d.dni, 'dni')
        if (deudaExistente != null) {
            actualizarDeuda(deudaExistente, (debe) => debe + d.debe)
        } else {
            deudasActualizadas.push(d)
        }
    })

    // Recorremos los pagos válidos y por cada uno actualizamos la deuda que corresponda.
    pagosValidos.forEach(p => {
        const deudaExistente = buscarEnColeccion(deudasActualizadas, p.dni, 'dni')
        if (deudaExistente != null) {
            //log(deudaExistente)
            //console.log("Pago: ", p.pago)
            actualizarDeuda(deudaExistente, (debe) => debe - p.pago)
            //log(deudaExistente)
        }    
    })

    deudasActualizadas.forEach(log)

    /* TODO: Ya están las deudas actualizadas, falta registrarlas en el archivo y después mejorar la performance de todo:
    - Recorrer menos veces las colecciones para la actualización
    - Ver realmente para qué sirve el ordenar
    - Mejorar el callback actualizarDeuda
    */
}

function buscarEnColeccion(coleccion, valor, clave) {
    return coleccion.find(function(elemento){
        return elemento[clave] == valor
    })
}

function actualizarDeuda(deuda, accion) {
    deuda.debe = accion(deuda.debe)
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
