import fs from 'fs' 

function readFile(path) {
    return fs.readFileSync(path, 'utf-8')
}

function writeFile(path, value, isCreationEnabled) {
    if(fs.existsSync(path) || isCreationEnabled){
        fs.writeFileSync(path, value)
    }    
}

function parseJsonFile(path) {
    const jsonFile = readFile(path)
    return JSON.parse(jsonFile)
}

export default {
    readFile,
    writeFile,
    parseJsonFile
}