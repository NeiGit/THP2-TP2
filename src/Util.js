function inspect(obj) {
    let msg = ""
    for (let index in obj) {
        msg += `\n${index}: ${obj[index]}`
    }
    return msg 
}

export default {
    inspect
}