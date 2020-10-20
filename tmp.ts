async function fn() {
    console.log("start fn")

    new Promise((res, rej) => {
        setTimeout(rej, 1000)
    })
    
    console.log("end fn")
}

try {

    console.log("start script")

    fn();
    
    console.log("end script")
} catch(e) {
    console.log("handled", e)
}