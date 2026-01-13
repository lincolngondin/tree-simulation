import { Node } from "./Node.js";

export class BPlusTree {
    constructor(fanout, animate = false, animationSpeed = 500) {
        this.type = "bplustree"
        this.fanout = fanout;
        // folhas devem ter pelo menos ceil((n-1)/2) valores ate n-1 valores
        this.minKeys = Math.ceil((this.fanout - 1) / 2)
        this.maxKeys = this.fanout - 1

        // nos não folhas(ou nos internos) devem ter pelo menos ceil(n/2) -1 valores até n-1 valores
        this.minNonLeafPointersKeys = Math.ceil(this.fanout / 2) - 1;
        this.maxNonLeafPointersKeys = this.fanout - 1;

        this.animationSpeed = 500; // Velocidade da animação em ms
        this.root = null;
        this.animate = animate;
        this.animationSpeed = animationSpeed;
        this.treeDraw = null;
    }

    async insert(key) {
        // Criar raiz se não existir
        if (this.root == null) {
            this.root = new Node();
            this.root.isLeaf = true;
            this.root.searchKeys = [key];
            this.root.pointers = [null, null]; // Ponteiro esquerdo e direito para navegação sequencial
            return;
        }

        // encontra o no de folha L que deve conter K
        const path = this.getPathToLeaf(key);
        const leaf = path[path.length - 1]

        if (this.animate && this.treeDraw) {
            let steps = path.map(node => ({ highlights: new Set([node]) }));
            steps.push({ highlights: new Set([leaf]), delay: this.animationSpeed * 2 });
            await this.treeDraw.animate(steps);
        }

        this.insertInLeaf(leaf, key);

        if (leaf.searchKeys.length > this.maxKeys) {
            let mid = Math.floor(leaf.searchKeys.length / 2);
            let L_ = new Node();
            L_.isLeaf = true;
            L_.searchKeys = leaf.searchKeys.splice(mid);
            L_.pointers = leaf.pointers.splice(mid);
            leaf.pointers.push(L_);
            this.insertInParent(leaf, L_.searchKeys[0], L_);
        }

    }

    insertInLeaf(node, key) {
        let pos = 0;
        for (let i = 0; i < node.searchKeys.length; i++) {
            if (key <= node.searchKeys[i]) {
                pos = i;
                break;
            }
            pos = i + 1;
        }
        node.searchKeys.splice(pos, 0, key);
        node.pointers.splice(pos, 0, null);
    }

    insertInParent(node, keyLine, nodeLine) {
        if (node === this.root) {
            let newRoot = new Node();
            newRoot.isLeaf = false;
            newRoot.searchKeys = [keyLine];
            newRoot.pointers = [node, nodeLine];
            this.root = newRoot;
            return;
        }

        let parent = this._findParent(this.root, node);

        if (parent == null) {
            // shouldn't happen
            return;
        }

        let pos = 0;
        for (let i = 0; i < parent.searchKeys.length; i++) {
            if (keyLine < parent.searchKeys[i]) {
                pos = i;
                break;
            }
            pos = i + 1;
        }

        parent.searchKeys.splice(pos, 0, keyLine);
        parent.pointers.splice(pos + 1, 0, nodeLine);

        if (parent.searchKeys.length > this.maxKeys) {
            let mid = Math.floor(this.maxKeys / 2);
            let P_ = new Node();
            P_.isLeaf = false;
            let promoted = parent.searchKeys[mid];
            P_.searchKeys = parent.searchKeys.splice(mid + 1);
            P_.pointers = parent.pointers.splice(mid + 1);
            parent.searchKeys.pop();
            this.insertInParent(parent, promoted, P_);
        }
    }
    async delete(key) {
        if (!this.root) return;

        let path = this.getPathToLeaf(key);
        let leaf = path[path.length - 1];

        if (this.animate && this.treeDraw) {
            let steps = path.map(node => ({ highlights: new Set([node]) }));
            steps.push({ highlights: new Set([leaf]), delay: this.animationSpeed * 2 });
            await this.treeDraw.animate(steps);
        }

        let found = false;
        let index = -1;
        for (let i = 0; i < leaf.searchKeys.length; i++) {
            if (leaf.searchKeys[i] === key) {
                found = true;
                index = i;
                break;
            }
        }
        if (!found) {
            return null;
        }

        leaf.searchKeys.splice(index, 1);
        leaf.pointers.splice(index, 1);

        if (leaf.searchKeys.length >= this.minKeys || leaf === this.root) return;

        // rebalance leaf
        let parent = path.length > 1 ? path[path.length - 2] : null;
        if (!parent) return;

        let leafIndex = parent.pointers.indexOf(leaf);
        let leftSibling = leafIndex > 0 ? parent.pointers[leafIndex - 1] : null;
        let rightSibling = leafIndex < parent.pointers.length - 1 ? parent.pointers[leafIndex + 1] : null;

        // try borrow from left
        if (leftSibling && leftSibling.searchKeys.length > this.minKeys) {
            leaf.searchKeys.unshift(leftSibling.searchKeys.pop());
            leaf.pointers.unshift(leftSibling.pointers.pop());
            parent.searchKeys[leafIndex - 1] = leaf.searchKeys[0];
            return;
        }

        // try borrow from right
        if (rightSibling && rightSibling.searchKeys.length > this.minKeys) {
            leaf.searchKeys.push(rightSibling.searchKeys.shift());
            leaf.pointers.splice(leaf.pointers.length - 1, 0, rightSibling.pointers.shift());
            parent.searchKeys[leafIndex] = rightSibling.searchKeys[0] || leaf.searchKeys[0];
            return;
        }

        // merge
        if (leftSibling) {
            leftSibling.searchKeys = leftSibling.searchKeys.concat(leaf.searchKeys);
            leftSibling.pointers = leftSibling.pointers.slice(0, leftSibling.searchKeys.length + 1).concat(leaf.pointers.slice(0, leaf.searchKeys.length));
            leftSibling.pointers[leftSibling.pointers.length - 1] = leaf.pointers[leaf.pointers.length - 1];
            parent.searchKeys.splice(leafIndex - 1, 1);
            parent.pointers.splice(leafIndex, 1);
        } else if (rightSibling) {
            leaf.searchKeys = leaf.searchKeys.concat(rightSibling.searchKeys);
            leaf.pointers = leaf.pointers.slice(0, leaf.searchKeys.length + 1).concat(rightSibling.pointers.slice(0, rightSibling.searchKeys.length));
            leaf.pointers[leaf.pointers.length - 1] = rightSibling.pointers[rightSibling.pointers.length - 1];
            parent.searchKeys.splice(leafIndex, 1);
            parent.pointers.splice(leafIndex + 1, 1);
        }

        // if parent underflows
        if (parent.searchKeys.length < this.minNonLeafPointersKeys && parent !== this.root) {
            this.delete_entry(parent);
        }

        // if root empty
        if (this.root.searchKeys.length === 0 && this.root.pointers.length > 0) {
            this.root = this.root.pointers[0];
        }
    }

    delete_entry(node) {
        let parent = this._findParent(this.root, node);
        if (!parent) return;

        let nodeIndex = parent.pointers.indexOf(node);
        let leftSibling = nodeIndex > 0 ? parent.pointers[nodeIndex - 1] : null;
        let rightSibling = nodeIndex < parent.pointers.length - 1 ? parent.pointers[nodeIndex + 1] : null;

        // try borrow from left
        if (leftSibling && leftSibling.searchKeys.length > this.minNonLeafPointersKeys) {
            node.searchKeys.unshift(parent.searchKeys[nodeIndex - 1]);
            node.pointers.unshift(leftSibling.pointers.pop());
            parent.searchKeys[nodeIndex - 1] = leftSibling.searchKeys.pop();
            return;
        }

        // try borrow from right
        if (rightSibling && rightSibling.searchKeys.length > this.minNonLeafPointersKeys) {
            node.searchKeys.push(parent.searchKeys[nodeIndex]);
            node.pointers.push(rightSibling.pointers.shift());
            parent.searchKeys[nodeIndex] = rightSibling.searchKeys.shift();
            return;
        }

        // merge
        if (leftSibling) {
            leftSibling.searchKeys = leftSibling.searchKeys.concat([parent.searchKeys[nodeIndex - 1]], node.searchKeys);
            leftSibling.pointers = leftSibling.pointers.concat(node.pointers);
            parent.searchKeys.splice(nodeIndex - 1, 1);
            parent.pointers.splice(nodeIndex, 1);
        } else if (rightSibling) {
            node.searchKeys = node.searchKeys.concat([parent.searchKeys[nodeIndex]], rightSibling.searchKeys);
            node.pointers = node.pointers.concat(rightSibling.pointers);
            parent.searchKeys.splice(nodeIndex, 1);
            parent.pointers.splice(nodeIndex + 1, 1);
        }

        // if parent underflows
        if (parent.searchKeys.length < this.minNonLeafPointersKeys && parent !== this.root) {
            this.delete_entry(parent);
        }
    }
    setTreeDraw(treeDraw) {
        this.treeDraw = treeDraw;
    }

    // Retorna o caminho até a folha onde a chave deve estar
    getPathToLeaf(key) {
        if (!this.root) return [];
        let path = [];
        let c = this.root;
        path.push(c);
        while (!c.isLeaf) {
            let i = 0;
            for (i = 0; i < c.searchKeys.length; i++) {
                if (key < c.searchKeys[i]) {
                    break;
                }
            }
            c = c.pointers[i];
            path.push(c);
        }
        return path;
    }
    // retorna nulo se não encontrar, se encontrar retorna o no inteiro onde ele está, o no obrigatoriamente tem que ser folha
    async find(key) {
        if (this.animate && this.treeDraw) {
            let path = this.getPathToLeaf(key);
            let steps = path.map(node => ({ highlights: new Set([node]) }));
            // Adicionar um passo final com destaque mais longo na folha
            steps.push({ highlights: new Set([path[path.length - 1]]), delay: this.animationSpeed * 2 });
            await this.treeDraw.animate(steps);
        }

        let c = this.root;
        // Enquanto o no atual não for um no folha
        while (!c.isLeaf) {
            let i = 0;
            for (i = 0; i < c.searchKeys.length; i++) {
                if (key < c.searchKeys[i]) {
                    break;
                }
            }
            c = c.pointers[i];
        }
        // No folha equivalente
        for (let i = 0; i < c.searchKeys.length; i++) {
            if (key === c.searchKeys[i]) {
                return c.searchKeys[i]
            }
        }
        return null;
    }
    getAllKeys() {
        if (!this.root) return [];
        let current = this.root;
        while (!current.isLeaf) {
            current = current.pointers[0];
        }
        let allKeys = [];
        while (current) {
            allKeys = allKeys.concat(current.searchKeys);
            current = current.pointers[current.pointers.length - 1];
        }
        return allKeys;
    }

    _findParent(node, child) {
        if (node.isLeaf) return null;

        for (let i = 0; i < node.pointers.length; i++) {
            if (node.pointers[i] === child) {
                return node;
            }
            let parent = this._findParent(node.pointers[i], child);
            if (parent != null) return parent;
        }

        return null;
    }

}