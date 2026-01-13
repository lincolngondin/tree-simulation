export class VisualizationConfigs {
    constructor() {
        this.nodeWidth = 50;           // Largura de cada chave
        this.nodePointerWidth = 30; // Largura de cada ponteiro
        this.nodePointerRegisterWidth = 10; // Largura de cada ponteiro para registro para arvores B
        this.nodeHeight = 25;         // Altura dos nós
        this.horizontalSpacing = 170; // Espaçamento horizontal entre nós
        this.verticalSpacing = 120;     // Espaçamento vertical entre níveis
        this.canvasPadding = 50;   // Padding das bordas do canvas
        this.minNodeSpacing = 20; // Espaçamento mínimo entre nós
        this.animationSpeed = 500; // Velocidade da animação em ms
    }
}