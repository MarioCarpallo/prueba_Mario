// API creada con NodeJS y Express que leerá los segundos restantes para que un cohete despegue desde un archivo de configuración.
// Estos serán mostrados en el apartado de /countdown con el nombre de segundos e irá actualizandose cada 1 sec.

const express = require('express')
const bodyParser = require('body-parser');

const cors = require('cors');
let fs = require('fs');
var log4js = require("log4js");

// Configuramos el log4js para los errores.
log4js.configure({
    appenders: { api: { type: "file", filename: "./logs/errors.log" } },
    categories: { default: { appenders: ["api"], level: "error" } }
});

// Iniciamos la libreria log4js.
var logger = log4js.getLogger("api");

// Lo ponemos como Debug.
logger.level = "debug";

const app = express();
const port = 3000;

app.use(cors());

//Levantamos el servidor con el puerto que queremos.
app.listen(port, () => console.log(`API inicializada en el puerto ${port}!`));

// Variable la cual asignaremos los segundos al leer del archivo de configuración.
// Se inicia a 0 automaticamente para prevenir fallos a la hora de conseguir los segundos del archivo. Si hay algun error, automaticamente la API mostrará un 0.
var segundos = 0;

// Hacemos un try catch para leer el archivo.
try {
    var data = fs.readFileSync('variables/segundos.txt', 'utf8');

    // Control de errores al leer el archivo.
    if (data && data > 0) {
        segundos = data;
    } else if (!data) {
        logger.fatal(`¡No hay nada dentro del archivo!`);
    } else if (isNaN(data)) {
        logger.error(`¡En el archivo de configuración no hay números!`);
        segundos = 0;
    }
} catch (err) {
    logger.fatal(`Error al leer el archivo: ${err.stack}`);
}

// Variable que iremos cambiando cada 1 segundo desde que el servidor arranque.
let secactual = segundos;

// Esto es la estructura de lo que mostrará la API.
let apiJSON = [{ "id": "countdown", "segundos": `${secactual}` }];

// Metodo get en la raíz del servidor para informar donde estará la cuenta atrás.
app.get('/', (req, res) => {
    res.send('Para ir a ver la cuenta atrás, dirijete al directorio "/countdown".');

});

// Directorio donde veremos el CountDown (Acceso a la API con el metodo GET).
app.get('/countdown', (req, res) => {
    res.json(apiJSON);
});

// Actualización del segundo para mostrarlo en la API (Metodo post).
app.post('/countdown/:id', (req, res) => {
    //Try para evitar fallos a la hora de actualizar el nuevo segundo.
    try {
        // La id siempre será 'countdown' (Si hubieran más datos escogeríamos la id con req.params.id).
        const id = "countdown";

        // Definimos la estructura con el nuevo segundo.
        const nSegundo = { "id": "countdown", "segundos": `${secactual}` };

        // Reemplazamos el segundo anterior con el nuevo en el objeto apiJSON.
        apiJSON[0] = nSegundo;
        res.send('Segundo bajado');
    } catch (err) {
        logger.error(`Error en el POST al actualizar el segundo: ${err.stack}`);
    }
});

// Try catch para evitar fallos a la hora de bajar el segundo y poner los invervalos.

// Hacemos un intervalo al metodo de editar (cada 1 segundo).
var invervalo = setInterval(editarsec, 1000);

//Función que baja el segundo.
function editarsec() {
    try {
        // Si el segundo es diferente a 0, entonces lo bajamos. Si no lo dejamos tal cual está.
        if (secactual != 0) {
            secactual--;
        }

        var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
        var xhr = new XMLHttpRequest();
        xhr.open("POST", `http://localhost:3000/countdown/1`);
        xhr.send();

        // Si el segundo actual es igual a 0, limpiamos el invervalo para que no se llame más veces.
        if (secactual <= 0) {
            clearInterval(invervalo);
        }
    } catch (err) {
        logger.fatal(`No ha sido posible bajar el segundo: ${err.stack}`);

        // Si hay un fallo limpiamos igualmente el intervalo para que no ocurra un bucle y igualamos el segundo a 0
        secactual = 0;
        clearInterval(invervalo);
    }
}