import BPlusTree from "../models/BPlusTree.js";
import BTree from "../models/BTree.js";
import { AnimationController } from "./AnimationController.js";

// Controla tudo relativo a arvore
export default class TreeController {
    constructor(view) {
        this.actualFanout = 4;
        this.actualTreeType = "bplustree";
        this.tree = new BPlusTree(this.actualFanout);
        this.tree.insert(12);
        this.tree.insert(7);
        this.tree.insert(22);
        this.tree.insert(14);
        this.tree.insert(1);
        this.tree.insert(8);
        this.tree.insert(2);
        this.view = view;
        this.view.setTree(this.tree);
        // animator recebe os eventos e chama o animate do view
        this.animator = new AnimationController(view);
        this.tree.onEvent(event => {
            this.animator.enqueue(event);
        })
    }

    // Muda o tipo de arvore de B+tree para Btree e vice versa
    changeTreeType() {
        let newTree;
        if (this.actualTreeType == "bplustree") {
            newTree = new BTree(this.actualFanout);
            this.actualTreeType = "btree";
        }
        else {
            newTree = new BPlusTree(this.actualFanout);
            this.actualTreeType = "bplustree";
        }
        this.tree = newTree;
        this.view.setTree(newTree);
        this.animator = new AnimationController(this.view);
        this.tree.onEvent(event => {
            this.animator.enqueue(event);
        })
        this.view.renderFrame();
        return this.actualTreeType;
    }
    // Chama o insert no model e inicia a animacao
    async insert(key) {
        await this.tree.insert(key);
        await this.animator.start();
    }
    // Chama o delete no model e inicia a animacao
    async delete(key) {
        await this.tree.delete(key);
        await this.animator.start();
    }
    // Chama o find no model e inicia a animacao
    async find(key) {
        await this.tree.find(key);
        await this.animator.start();
    }
    // Remove quantity elementos da arvore
    async removeRandom(quantity) {
        // Retorna todas as chaves da arvore
        const keys = this.tree.getAllKeys()
        // randomiza os valores das chaves
        for (let i = keys.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [keys[i], keys[j]] = [keys[j], keys[i]];
        }
        // se a quantidade for maior que a quantidade de valores
        const times = (quantity > keys.length) ? keys.length : quantity;
        for (let i = 0; i < times; i++) {
            await this.delete(keys[i]);
        }
    }

    // Insert valores aleatorios na arvore baseado nos parametros passados pelo usuario
    async insertRandom(quantity, infValue, supValue) {
        for (let i = 0; i < quantity; i++) {
            const newkey = Math.floor(Math.random() * supValue) + infValue;
            await this.insert(newkey);
        }
    }

    // Muda o grau, o fanout da arvore
    changeFanout(newFanout) {
        this.actualFanout = newFanout;
        let newTree;
        if (this.actualTreeType == "bplustree") {
            newTree = new BPlusTree(this.actualFanout);
        }
        else {
            newTree = new BTree(this.actualFanout);
        }
        this.tree = newTree;
        this.view.setTree(this.tree);
        this.animator = new AnimationController(this.view);
        this.tree.onEvent(event => {
            this.animator.enqueue(event);
        })
        this.view.renderFrame();
    }

    // Atualiza a velocidade de animação no view
    updateAnimationSpeed(ms) {
        this.view.animationSpeed = ms;
    }
}