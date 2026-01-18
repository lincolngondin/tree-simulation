// Representa um no em uma arvore B e B+
export class Node {
    constructor() {
        // valores das chaves de pesquisa
        this.searchKeys = new Array();
        // Ponteiros para filhos
        this.pointers = new Array();
        // Ponteiros de registro do bucket em nós não folhas, na pratica serão sempre nulos apenas para preencher
        this.pointerRegisters = new Array();
        // Se o no atual é uma folha
        this.isLeaf = false;
        this.isRoot = false;
        this.id = Math.floor(Math.random() * 1000000000);
    }
}