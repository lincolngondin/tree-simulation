import { CanvasRenderer } from "./visualization/CanvasRenderer.js"
import { BPlusTree } from "./tree/BPlusTree.js"
import { TreeDraw } from "./visualization/TreeDraw.js"

const c = new CanvasRenderer("canvas")

let t = new BPlusTree(5)
t.insert(15)
t.insert(55)
t.insert(5)
t.insert(25)
t.insert(10)
t.insert(45)
t.insert(2)
t.insert(22)
t.insert(1)
t.insert(43)
t.insert(90)
t.insert(24)

let td = new TreeDraw(t, c)
td.drawTree()

// Elementos do DOM
const inputValue = document.getElementById("value")
const btnAdicionar = document.getElementById("adicionar")
const btnRemover = document.getElementById("remover")
const btnBuscar = document.getElementById("buscar")

const fanoutValue = document.getElementById("fanoutValue")
const btnFanout = document.getElementById('fanout')

// Função para atualizar visualização
function updateTree() {
    td.drawTree()
}

// Evento: Adicionar
btnAdicionar.addEventListener("click", () => {
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

    t.insert(num)
    console.log(`Valor ${num} adicionado à árvore`)
    inputValue.value = ""
    updateTree()
})

// Evento: Remover
btnRemover.addEventListener("click", () => {
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

    t.delete(num)
    console.log(`Valor ${num} removido da árvore`)
    inputValue.value = ""
    updateTree()
})

// Evento: Buscar
btnBuscar.addEventListener("click", () => {
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

    const result = t.find(num)
    if (result !== null) {
        alert(`Valor ${num} encontrado na árvore!`)
    } else {
        alert(`Valor ${num} não encontrado na árvore`)
    }
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
    t = new BPlusTree(fanout)
    td = new TreeDraw(t, c);
    updateTree()
})