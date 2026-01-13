export default class ControlsView {
    constructor(controller) {
        this.controller = controller;
        // Elementos do DOM
        this.inputValue = document.getElementById("value")
        this.btnAdicionar = document.getElementById("adicionar")
        this.btnRemover = document.getElementById("remover")
        this.btnBuscar = document.getElementById("buscar")

        this.mudarArvore = document.getElementById("mudarArvore");

        this.fanoutValue = document.getElementById("fanoutValue")
        this.btnFanout = document.getElementById('fanout')

        this.speedSlider = document.getElementById("speed")
        this.speedValue = document.getElementById("speedValue")

        this.infValueElement = document.getElementById("aleatorioInf")
        this.supValueElement = document.getElementById("aleatorioSup")
        this.quantityGenerate = document.getElementById("quantidade")
        this.generateBtnElement = document.getElementById("gerarAleatorio")

        // elementos para remover aleatorio
        this.quantityRemove = document.getElementById("quantidadeARemover")
        this.removeRandom = document.getElementById("removerAleatorio")

        this.addEvents();
    }

    addEvents() {
        // Evento clique no adicionar
        this.btnAdicionar.addEventListener("click", async () => {
            const value = this.inputValue.value.trim()
            if (value === "") {
                alert("Por favor, insira um valor")
                return
            }

            const num = parseInt(value)
            if (isNaN(num)) {
                alert("Por favor, insira um número válido")
                return
            }

            //await t.insert(num)
            await this.controller.insert(num);
            console.log(`Valor ${num} adicionado à árvore`)
            this.inputValue.value = ""
        })

        // Evento clique no remover
        this.btnRemover.addEventListener("click", async () => {
            const value = this.inputValue.value.trim()
            if (value === "") {
                alert("Por favor, insira um valor")
                return
            }

            const num = parseInt(value)
            if (isNaN(num)) {
                alert("Por favor, insira um número válido")
                return
            }

            //await t.delete(num)
            await this.controller.delete(num);
            console.log(`Valor ${num} removido da árvore`)
            this.inputValue.value = ""
        })

        // Evento: Buscar
        this.btnBuscar.addEventListener("click", async () => {
            const value = this.inputValue.value.trim()
            if (value === "") {
                alert("Por favor, insira um valor")
                return
            }

            const num = parseInt(value)
            if (isNaN(num)) {
                alert("Por favor, insira um número válido")
                return
            }

            //const result = await t.find(num)
            await this.controller.find(num);
        })

        // Evento remover aleatorio
        this.removeRandom.addEventListener("click", async () => {
            const q = this.quantityRemove.value.trim()
            if (q === "") {
                alert("Insira um valor inferior!");
                return;
            }
            const value = parseInt(q)
            if (isNaN(value)) {
                alert("Por favor, insira um número válido")
                return;
            }
            await this.controller.removeRandom(value);
        })

        // Evento gerar numeros aleatorios
        this.generateBtnElement.addEventListener("click", async () => {
            const infValue = this.infValueElement.value.trim()
            if (infValue === "") {
                alert("Insira um valor inferior!");
                return;
            }
            const infValueNum = parseInt(infValue)
            if (isNaN(infValueNum)) {
                alert("Por favor, insira um número válido")
                return;
            }

            const supValue = this.supValueElement.value.trim()
            if (supValue === "") {
                alert("Insira um valor superior!");
                return;
            }
            const supValueNum = parseInt(supValue);
            if (isNaN(supValueNum)) {
                alert("Por favor, insira um número válido")
                return;
            }

            const quantityValue = this.quantityGenerate.value.trim()
            if (quantityValue === "") {
                alert("Insira um valor de quantidade!");
                return;
            }
            const quantity = parseInt(quantityValue);
            if (isNaN(quantity)) {
                alert("Por favor, insira um número válido")
                return;
            }
            this.infValueElement.value = "";
            this.supValueElement.value = "";
            this.quantityGenerate.value = "";
            await this.controller.insertRandom(quantity, infValueNum, supValueNum);
            console.log(`${quantity} valores aleatorios adicionados!`);
        })


        // Mudar valor do fanout
        this.btnFanout.addEventListener("click", () => {
            const fanout = this.fanoutValue.value.trim()
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
            this.controller.changeFanout(num);
        })

        // Mudar o tipo de arvore
        this.mudarArvore.addEventListener("click", () => {
            const newType = this.controller.changeTreeType()
            mudarArvore.textContent = "Mudar para árvore " + ((newType == "bplustree") ? "B" : "B+");
        })

    }
}