//NO MODIFICAR EL TEST!
import ap from '../src/apareoConActualizacion.js'

const rutaDeudasOld = './in/deudasOLD.json'
const rutaPagos = './in/pagos.json'
const rutaDeudasNew = './out/deudasNEW2.json'
const rutaLog = './out/notificaciones2.log'

ap.actualizarArchivosDeudas(rutaDeudasOld, rutaPagos, rutaDeudasNew, rutaLog)
