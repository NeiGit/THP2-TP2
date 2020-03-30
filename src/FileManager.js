import fs from 'fs' 

/** Lee un archivo de texto y devuelve su valor
 * @param  {} path
 */
function readFile(path) {
    return fs.readFileSync(path, 'utf-8')
}


/** Sobreescribe el contenido de un archivo de texto o crea uno nuevo en caso de que no exista.
 * @param  {} path ruta del archivo destino
 * @param  {} value valor a escribir
 * @param  {} isCreationEnabled=true habilita la creación del archivo si este no existe
 */
function writeFile(path, value, isCreationEnabled = true) {
    if(fs.existsSync(path) || isCreationEnabled){
        fs.writeFileSync(path, value)
    }    
}

/**
 * Lee un archivo json, y lo devuelve transformado en objeto javascript
 * @param  {} path ruta del archivo json
 */
function parseJsonFile(path) {
    const jsonFile = readFile(path)
    return JSON.parse(jsonFile)
}

export default {
    readFile,
    writeFile,
    parseJsonFile
}