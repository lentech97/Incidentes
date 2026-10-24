const datos = [];
for (let i = 0; i < 100000; i++) {
    datos.push({ id: i, nombre: `item${i}` });
}

const idBuscado = 99999;

console.time('bucle for');
let encontradoFor;
for (let i = 0; i < datos.length; i++) {
    if (datos[i].id === idBuscado) {
        encontradoFor = datos[i];
        break;
    }
}
console.timeEnd('bucle for');

console.time('find');
const encontradoFind = datos.find((item) => item.id === idBuscado);
console.timeEnd('find');

console.log('Resultado bucle for:', encontradoFor);
console.log('Resultado find:', encontradoFind);
