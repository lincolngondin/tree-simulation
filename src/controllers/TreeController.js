import { BPlusTree } from "../models/BPlusTree.js";
import { BTree } from "../models/BTree.js";

export default class TreeController {
    constructor(view) {
        this.animate = true
        this.animationSpeed = 500
        this.actualFanout = 4;
        this.actualTreeType = "bplustree";
        this.tree = new BPlusTree(this.actualFanout, this.animate, this.animationSpeed);
        this.view = view;
        this.view.setTree(this.tree);
    }
    changeTreeType() {
        let newTree;
        if (this.actualTreeType == "bplustree") {
            newTree = new BTree(this.actualFanout, this.animate, this.animationSpeed);
            this.actualTreeType = "btree";
        }
        else {
            newTree = new BPlusTree(this.actualFanout, this.animate, this.animationSpeed);
            this.actualTreeType = "bplustree";
        }
        this.tree = newTree;
        this.view.setTree(newTree);
        this.view.drawTree();
        return this.actualTreeType;
    }
    async insert(key) {
        await this.tree.insert(key);
        this.view.addInfo(`INSERÇÃO: Valor ${key} adicionado!`, "SUCCESS");
        this.view.drawTree();
    }
    async delete(key) {
        const deleteReturn = await this.tree.delete(key);
        if (deleteReturn === null) {
            this.view.addInfo(`REMOÇÃO: Valor ${key} não encontrado!`, "ERROR");
        }
        else {
            this.view.addInfo(`REMOÇÃO: Valor ${key} removido!`, "SUCCESS");
        }
        this.view.drawTree();
    }
    async find(key) {
        const findedValue = await this.tree.find(key);
        if (findedValue === null) {
            this.view.addInfo(`BUSCA: Valor ${key} não encontrado!`, "ERROR");
        }
        else {
            this.view.addInfo(`BUSCA: Valor ${key} encontrado!`, "SUCCESS");
        }
        this.view.drawTree();
    }
    async removeRandom(quantity) {
        const keys = this.tree.getAllKeys()
        // randomiza os valores das chaves
        for (let i = keys.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [keys[i], keys[j]] = [keys[j], keys[i]];
        }
        console.log(keys)
        // se a quantidade for maior que a quantidade de valores
        const times = (quantity > keys.length) ? keys.length : quantity;
        for (let i = 0; i < times; i++) {
            await this.delete(keys[i]);
        }
        this.view.drawTree();
    }

    async insertRandom(quantity, infValue, supValue) {
        for (let i = 0; i < quantity; i++) {
            const newkey = Math.floor(Math.random() * supValue) + infValue;
            await this.insert(newkey);
        }
    }

    changeFanout(newFanout) {
        this.actualFanout = newFanout;
        let newTree;
        if (this.actualTreeType == "bplustree") {
            newTree = new BPlusTree(this.actualFanout, this.animate, this.animationSpeed)
        }
        else {
            newTree = new BTree(this.actualFanout, this.animate, this.animationSpeed)
        }
        this.tree = newTree;
        this.view.setTree(this.tree);
        this.view.drawTree();
    }
}