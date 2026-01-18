// classe para controlas as animacoes
export class AnimationController {
    constructor(view) {
        // as animacoes são criadas a partir de eventos emitidos pelas arvores
        this.events = new Array();
        this.view = view;
    }
    // Adiciona um evento
    enqueue(event) {
        this.events.push(event);
    }

    // Começa a executar a animação e esperar ela terminar
    async start() {
        const e = this.events;
        this.events = new Array();
        await this.animate(e);
    }

    // Apenas chama a funcao que anima na view
    async animate(eventos) {
        await this.view.animate(eventos);
    }
}