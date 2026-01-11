class Node {
    constructor() {
        // valores das chaves de pesquisa
        this.searchKeys = [];
        // Ponteiros para filhos
        this.pointers = [];
        // Se o no atual é uma folha
        this.isLeaf = false;
    }
}

export class BPlusTree {
    constructor(fanout, animate = false, animationSpeed = 500) {
        this.fanout = fanout;
        this.minkeys = Math.ceil(this.fanout / 2) - 1
        this.maxkeys = this.fanout - 1
        this.animationSpeed = 500; // Velocidade da animação em ms
        this.root = null;
        this.animate = animate;
        this.animationSpeed = animationSpeed;
        this.treeDraw = null;
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
                this.treeDraw?.addInfo(`BUSCA: Valor ${key} encontrado!`, "SUCCESS");
                return c.searchKeys[i]
            }
        }
        this.treeDraw?.addInfo(`BUSCA: Valor ${key} não encontrado!`, "ERROR");
        return null;
    }
    async insertRandom(quantity, infValue, supValue) {
        for (let i = 0; i < quantity; i++) {
            const newkey = Math.floor(Math.random() * supValue) + infValue;
            await this.insert(newkey);
        }
    }
    async removeRandom(quantity) {
        const keys = this.getAllKeys()
        // randomiza os valores das chaves
        console.log(keys)
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
    async insert(key) {
        // Criar raiz se não existir
        if (this.root == null) {
            this.root = new Node();
            this.root.isLeaf = true;
            this.root.searchKeys = [key];
            this.root.pointers = [null, null]; // Ponteiro esquerdo e direito para navegação sequencial
            return;
        }

        // Encontrar nó folha onde inserir
        let path = this.getPathToLeaf(key);
        let leaf = path[path.length - 1];

        if (this.animate && this.treeDraw) {
            let steps = path.map(node => ({ highlights: new Set([node]) }));
            steps.push({ highlights: new Set([leaf]), delay: this.animationSpeed * 2 });
            await this.treeDraw.animate(steps);
        }

        // Inserir chave mantendo ordem permitindo valores iguais
        let insertPos = 0;
        for (let i = 0; i < leaf.searchKeys.length; i++) {
            if (key <= leaf.searchKeys[i]) {
                insertPos = i;
                break;
            }
            insertPos = i + 1;
        }

        leaf.searchKeys.splice(insertPos, 0, key);
        leaf.pointers.splice(insertPos, 0, null); // Inserir ponteiro nulo na posição correspondente
        // Se nó folha transbordou, fazer split
        if (leaf.searchKeys.length > this.maxkeys) {
            this._splitLeaf(leaf);
        }
        this.treeDraw?.addInfo(`INSERÇÃO: Valor ${key} adicionado!`, "SUCCESS");
    }

    async delete(key) {
        if (this.root === null) return;

        let path = this.getPathToLeaf(key);
        let leaf = path[path.length - 1];

        if (this.animate && this.treeDraw) {
            let steps = path.map(node => ({ highlights: new Set([node]) }));
            steps.push({ highlights: new Set([leaf]), delay: this.animationSpeed * 2 });
            await this.treeDraw.animate(steps);
        }

        // Encontrar e remover a chave
        let found = false;
        let removedIndex = -1;
        for (let i = 0; i < leaf.searchKeys.length; i++) {
            if (leaf.searchKeys[i] === key) {
                leaf.searchKeys.splice(i, 1);
                leaf.pointers.splice(i, 1); // Remover ponteiro correspondente
                found = true;
                removedIndex = i;
                break;
            }
        }

        if (!found) {
            this.treeDraw?.addInfo(`REMOÇÃO: Valor ${key} não encontrado!`, "ERROR");
            return;
        }
        this.treeDraw?.addInfo(`REMOÇÃO: Valor ${key} removido!`, "SUCCESS");
        // parece correto ate aqui

        // Se a chave removida era a primeira da folha, atualizar separadores nos nós internos
        if (removedIndex === 0 && leaf.searchKeys.length > 0 && leaf !== this.root) {
            this._updateSeparator(leaf, leaf.searchKeys[0]);
        }

        // Se nó folha ficou com menos de minkeys, fazer merge/borrow
        if (leaf.searchKeys.length < this.minkeys && leaf !== this.root) {
            this._rebalanceLeaf(leaf);
        }

        // Se raiz ficou vazia, atualizar raiz
        if (this.root.searchKeys.length === 0 && this.root.pointers.length > 0) {
            this.root = this.root.pointers[0];
        }
    }

    // Encontra e retorna a folha onde o elemento pode está
    _findLeaf(key) {
        let current = this.root;

        while (!current.isLeaf) {
            let i = 0;
            for (i = 0; i < current.searchKeys.length; i++) {
                if (key < current.searchKeys[i]) {
                    break;
                }
            }
            current = current.pointers[i];
        }

        return current;
    }

    _splitLeaf(leaf) {
        let mid = Math.floor(this.maxkeys / 2);
        let newLeaf = new Node();
        newLeaf.isLeaf = true;

        // Dividir chaves
        newLeaf.searchKeys = leaf.searchKeys.splice(mid);
        newLeaf.pointers = leaf.pointers.splice(mid);

        // Ajustar ponteiros de navegação sequencial
        leaf.pointers.push(newLeaf);

        // Se raiz, criar nova raiz
        if (leaf === this.root) {
            let newRoot = new Node();
            newRoot.isLeaf = false;
            newRoot.searchKeys = [newLeaf.searchKeys[0]];
            newRoot.pointers = [leaf, newLeaf];
            this.root = newRoot;
        } else {
            // Propagar split para cima
            this._insertNonLeaf(newLeaf.searchKeys[0], leaf, newLeaf);
        }
    }

    _insertNonLeaf(key, leftChild, rightChild) {
        let parent = this._findParent(this.root, leftChild);

        if (parent == null) {
            // Criar nova raiz
            let newRoot = new Node();
            newRoot.isLeaf = false;
            newRoot.searchKeys = [key];
            newRoot.pointers = [leftChild, rightChild];
            this.root = newRoot;
            return;
        }

        // Encontrar posição de inserção
        let i = 0;
        for (i = 0; i < parent.searchKeys.length; i++) {
            if (key < parent.searchKeys[i]) {
                break;
            }
        }

        parent.searchKeys.splice(i, 0, key);
        parent.pointers.splice(i + 1, 0, rightChild);

        // Se transbordou, fazer split do nó interno
        if (parent.searchKeys.length > this.maxkeys) {
            this._splitInternal(parent);
        }
    }

    _splitInternal(node) {
        let mid = Math.floor(this.maxkeys / 2);
        let newNode = new Node();
        newNode.isLeaf = false;

        // Chave promovida
        let promotedKey = node.searchKeys[mid];

        newNode.searchKeys = node.searchKeys.splice(mid + 1);
        newNode.pointers = node.pointers.splice(mid + 1);
        node.searchKeys.pop(); // Remove chave promovida

        if (node === this.root) {
            let newRoot = new Node();
            newRoot.isLeaf = false;
            newRoot.searchKeys = [promotedKey];
            newRoot.pointers = [node, newNode];
            this.root = newRoot;
        } else {
            let parent = this._findParent(this.root, node);
            this._insertNonLeaf(promotedKey, node, newNode);
        }
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

    _rebalanceLeaf(leaf) {
        let parent = this._findParent(this.root, leaf);
        if (parent == null) return;

        // Encontrar índice da folha no pai
        let leafIndex = parent.pointers.indexOf(leaf);

        // Tentar pegar emprestado do irmão direito
        if (leafIndex < parent.pointers.length - 1) {
            let rightSibling = parent.pointers[leafIndex + 1];
            if (rightSibling.searchKeys.length > this.minkeys) {
                // Mover primeira chave do irmão direito para o final da folha atual
                leaf.searchKeys.push(rightSibling.searchKeys.shift());
                leaf.pointers.splice(leaf.pointers.length - 1, 0, rightSibling.pointers.shift());

                // Atualizar chave do pai
                parent.searchKeys[leafIndex] = rightSibling.searchKeys[0] || leaf.searchKeys[0];
                return;
            }
        }

        // Tentar pegar emprestado do irmão esquerdo
        if (leafIndex > 0) {
            let leftSibling = parent.pointers[leafIndex - 1];
            if (leftSibling.searchKeys.length > this.minkeys) {
                // Mover última chave do irmão esquerdo para o início da folha atual
                leaf.searchKeys.unshift(leftSibling.searchKeys.pop());
                leaf.pointers.unshift(leftSibling.pointers.pop());

                // Atualizar chave do pai
                parent.searchKeys[leafIndex - 1] = leaf.searchKeys[0];
                return;
            }
        }

        // Fazer merge com irmão
        if (leafIndex < parent.pointers.length - 1) {
            let rightSibling = parent.pointers[leafIndex + 1];
            // Concatenar chaves
            leaf.searchKeys = leaf.searchKeys.concat(rightSibling.searchKeys);
            // Concatenar ponteiros removendo o ponteiro intermediário
            leaf.pointers = leaf.pointers.slice(0, -1).concat(rightSibling.pointers.slice(1));

            // Remover entrada do pai
            parent.searchKeys.splice(leafIndex, 1);
            parent.pointers.splice(leafIndex + 1, 1);
        } else if (leafIndex > 0) {
            let leftSibling = parent.pointers[leafIndex - 1];
            // Concatenar chaves
            leftSibling.searchKeys = leftSibling.searchKeys.concat(leaf.searchKeys);
            // Concatenar ponteiros removendo o ponteiro intermediário
            leftSibling.pointers = leftSibling.pointers.slice(0, -1).concat(leaf.pointers.slice(1));

            // Remover entrada do pai
            parent.searchKeys.splice(leafIndex - 1, 1);
            parent.pointers.splice(leafIndex, 1);
        }

        // Se pai ficou desequilibrado
        if (parent.searchKeys.length < this.minkeys && parent !== this.root) {
            this._rebalanceLeaf(parent);
        }
    }

    _updateSeparator(node, newMin) {
        let parent = this._findParent(this.root, node);
        if (!parent) return;

        let index = parent.pointers.indexOf(node);
        if (index > 0) {
            parent.searchKeys[index - 1] = newMin;
            // Se este é o primeiro filho, pode afetar o separador do pai
            if (index === 1 && parent !== this.root) {
                this._updateSeparator(parent, newMin);
            }
        } else if (index === 0) {
            // Se é o primeiro filho, o mínimo do pai pode mudar
            if (parent !== this.root) {
                this._updateSeparator(parent, newMin);
            }
        }
    }

}