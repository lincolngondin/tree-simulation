import { CanvasRenderer } from "./visualization/CanvasRenderer.js"
import { BPlusTree } from "./tree/BPlusTree.js"
import { BTree } from "./tree/BTree.js"
import { TreeDraw } from "./visualization/TreeDraw.js"
import { VisualizationConfigs } from "./visualization/Config.js"

const c = new CanvasRenderer("canvas")
const configs = new VisualizationConfigs()

let animate = true
let animationSpeed = 500
let actualFanout = 4;

let t = new BPlusTree(actualFanout, animate, animationSpeed)
// let t = new BTree(3, animate, animationSpeed)
t.insert(15)
t.insert(55)
t.insert(5)
t.insert(25)
t.insert(10)
t.insert(45)
t.insert(2)
t.insert(22)
t.delete(22)
t.delete(15)
t.delete(45)
t.delete(5)
/*
t.insert(1)
t.insert(43)
t.insert(90)
t.insert(24)
*/

let td = new TreeDraw(t, c, configs);
t.setTreeDraw(td);

// Função para atualizar visualização
function updateTree() {
    td.drawTree();
}

updateTree();

// Elementos do DOM
const inputValue = document.getElementById("value")
const btnAdicionar = document.getElementById("adicionar")
const btnRemover = document.getElementById("remover")
const btnBuscar = document.getElementById("buscar")

const fanoutValue = document.getElementById("fanoutValue")
const btnFanout = document.getElementById('fanout')

const speedSlider = document.getElementById("speed")
const speedValue = document.getElementById("speedValue")

const infValueElement = document.getElementById("aleatorioInf")
const supValueElement = document.getElementById("aleatorioSup")
const quantityGenerate = document.getElementById("quantidade")
const generateBtnElement = document.getElementById("gerarAleatorio")

// elementos para remover aleatorio
const quantityRemove = document.getElementById("quantidadeARemover")
const removeRandom = document.getElementById("removerAleatorio")

// Função para atualizar configurações de animação
function updateAnimationSettings() {
    t.animationSpeed = parseInt(speedSlider.value)
    td.animationSpeed = t.animationSpeed
    speedValue.textContent = speedSlider.value + "ms"
}

// Eventos para configurações
speedSlider.addEventListener("input", updateAnimationSettings)

// Inicializar configurações
updateAnimationSettings()

removeRandom.addEventListener("click", async () => {
    const q = quantityRemove.value.trim()
    if (q === "") {
        alert("Insira um valor inferior!");
        return;
    }
    const value = parseInt(q)
    if (isNaN(value)) {
        alert("Por favor, insira um número válido")
        return;
    }
    await t.removeRandom(value);
    console.log(t)
    updateTree()
})

generateBtnElement.addEventListener("click", async () => {
    const infValue = infValueElement.value.trim()
    if (infValue === "") {
        alert("Insira um valor inferior!");
        return;
    }
    const infValueNum = parseInt(infValue)
    if (isNaN(infValueNum)) {
        alert("Por favor, insira um número válido")
        return;
    }

    const supValue = supValueElement.value.trim()
    if (supValue === "") {
        alert("Insira um valor superior!");
        return;
    }
    const supValueNum = parseInt(supValue);
    if (isNaN(supValueNum)) {
        alert("Por favor, insira um número válido")
        return;
    }

    const quantityValue = quantityGenerate.value.trim()
    if (quantityValue === "") {
        alert("Insira um valor de quantidade!");
        return;
    }
    const quantity = parseInt(quantityValue);
    if (isNaN(quantity)) {
        alert("Por favor, insira um número válido")
        return;
    }
    infValueElement.value = "";
    supValueElement.value = "";
    quantityGenerate.value = "";
    await t.insertRandom(quantity, infValueNum, supValueNum);
    console.log(`${quantity} valores aleatorios adicionados!`);
    updateTree()
})

// Evento: Adicionar
btnAdicionar.addEventListener("click", async () => {
    const value = inputValue.value.trim()
    if (value === "") {
        alert("Por favor, insira um valor")
        return
    }

    const num = parseInt(value)
    if (isNaN(num)) {
        alert("Por favor, insira um número válido")
        return
    }

    await t.insert(num)
    console.log(`Valor ${num} adicionado à árvore`)
    inputValue.value = ""
    updateTree()
})

// Evento: Remover
btnRemover.addEventListener("click", async () => {
    const value = inputValue.value.trim()
    if (value === "") {
        alert("Por favor, insira um valor")
        return
    }

    const num = parseInt(value)
    if (isNaN(num)) {
        alert("Por favor, insira um número válido")
        return
    }

    await t.delete(num)
    console.log(`Valor ${num} removido da árvore`)
    inputValue.value = ""
    updateTree()
})

// Evento: Buscar
btnBuscar.addEventListener("click", async () => {
    const value = inputValue.value.trim()
    if (value === "") {
        alert("Por favor, insira um valor")
        return
    }

    const num = parseInt(value)
    if (isNaN(num)) {
        alert("Por favor, insira um número válido")
        return
    }

    const result = await t.find(num)
    updateTree()
})

// Mudar valor do fanout
btnFanout.addEventListener("click", () => {
    const fanout = fanoutValue.value.trim()
    if (fanout === "") {
        alert("Por favor, insira um valor")
        return
    }

    const num = parseInt(fanout)
    if (isNaN(num)) {
        alert("Por favor, insira um número válido")
        return
    }
    if (num < 3 || num > 10) {
        alert("Por favor, insira um valor entre 3 e 10")
        return

    }
    console.log(`Novo valor do fanout é ${num}`)
    t = new BPlusTree(num, animate, animationSpeed)
    td = new TreeDraw(t, c, configs);
    t.setTreeDraw(td)
    updateTree()
})