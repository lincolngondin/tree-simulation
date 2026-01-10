class Node {
    constructor() {
        // valores das chaves de pesquisa
        this.searchkeys = [];
        // Ponteiros para filhos
        this.pointers = [];
        // Se o no atual é uma folha
        this.isLeaf = false;
    }
}

export class BPlusTree {
    constructor(fanout) {
        this.fanout = fanout;
        this.minkeys = Math.ceil(this.fanout / 2) - 1
        this.maxkeys = this.fanout - 1
        this.root = null;
    }
    // retorna nulo se não encontrar, se encontrar retorna o no inteiro onde ele está, o no obrigatoriamente tem que ser folha
    find(key) {
        let c = this.root;
        // Enquanto o no atual não for um no folha
        while (!c.isLeaf) {
            for (let i = 0; i < c.searchkeys.length; i++) {
                if (c.searchkeys[i] >= key) {
                    if (c.searchkeys[i] === key) {
                        // Ponteiro a direita(i para a esquerda)
                        c = c.pointers[i + 1]
                    }
                    else {
                        c = c.pointers[i]
                    }
                    break;
                }
            }
        }
        // No folha equivalente
        for (let i = 0; i < c.searchkeys.length; i++) {
            if (key === c.searchkeys[i]) {
                return c.searchkeys[i]
            }
        }
        return null;

    }
    insert(key) {
        // Criar raiz se não existir
        if (this.root == null) {
            this.root = new Node();
            this.root.isLeaf = true;
            this.root.searchkeys = [key];
            this.root.pointers = [null, null]; // Ponteiro esquerdo e direito para navegação sequencial
            return;
        }

        // Encontrar nó folha onde inserir
        let leaf = this._findLeaf(key);

        // Inserir chave mantendo ordem (permite duplicatas)
        let insertPos = 0;
        for (let i = 0; i < leaf.searchkeys.length; i++) {
            if (key <= leaf.searchkeys[i]) {
                insertPos = i;
                break;
            }
            insertPos = i + 1;
        }

        leaf.searchkeys.splice(insertPos, 0, key);
        leaf.pointers.splice(insertPos, 0, null); // Inserir ponteiro nulo na posição correspondente

        // Se nó folha transbordou, fazer split
        if (leaf.searchkeys.length > this.maxkeys) {
            this._splitLeaf(leaf);
        }
    }

    delete(key) {
        if (this.root == null) return;

        let leaf = this._findLeaf(key);
        console.log(leaf)

        // Encontrar e remover a chave
        let found = false;
        let removedIndex = -1;
        for (let i = 0; i < leaf.searchkeys.length; i++) {
            if (leaf.searchkeys[i] === key) {
                leaf.searchkeys.splice(i, 1);
                leaf.pointers.splice(i, 1); // Remover ponteiro correspondente
                found = true;
                removedIndex = i;
                break;
            }
        }

        if (!found) return;
        // parece correto ate aqui

        // Se a chave removida era a primeira da folha, atualizar separadores nos nós internos
        if (removedIndex === 0 && leaf.searchkeys.length > 0 && leaf !== this.root) {
            this._updateSeparator(leaf, leaf.searchkeys[0]);
        }

        // Se nó folha ficou com menos de minkeys, fazer merge/borrow
        if (leaf.searchkeys.length < this.minkeys && leaf !== this.root) {
            this._rebalanceLeaf(leaf);
        }

        // Se raiz ficou vazia, atualizar raiz
        if (this.root.searchkeys.length === 0 && this.root.pointers.length > 0) {
            this.root = this.root.pointers[0];
        }
    }

    // Encontra e retorna a folha onde o elemento pode está
    _findLeaf(key) {
        let current = this.root;

        while (!current.isLeaf) {
            let i = 0;
            for (i = 0; i < current.searchkeys.length; i++) {
                if (key < current.searchkeys[i]) {
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
        newLeaf.searchkeys = leaf.searchkeys.splice(mid);
        newLeaf.pointers = leaf.pointers.splice(mid);

        // Ajustar ponteiros de navegação sequencial
        // newLeaf.pointers[0] deve apontar para a próxima folha (que era leaf.pointers[mid])
        // leaf.pointers[mid] deve apontar para newLeaf
        let nextLeaf = leaf.pointers[mid];
        leaf.pointers[mid] = newLeaf;
        newLeaf.pointers[newLeaf.pointers.length - 1] = nextLeaf;

        // Se raiz, criar nova raiz
        if (leaf === this.root) {
            let newRoot = new Node();
            newRoot.isLeaf = false;
            newRoot.searchkeys = [newLeaf.searchkeys[0]];
            newRoot.pointers = [leaf, newLeaf];
            this.root = newRoot;
        } else {
            // Propagar split para cima
            this._insertNonLeaf(newLeaf.searchkeys[0], leaf, newLeaf);
        }
    }

    _insertNonLeaf(key, leftChild, rightChild) {
        let parent = this._findParent(this.root, leftChild);

        if (parent == null) {
            // Criar nova raiz
            let newRoot = new Node();
            newRoot.isLeaf = false;
            newRoot.searchkeys = [key];
            newRoot.pointers = [leftChild, rightChild];
            this.root = newRoot;
            return;
        }

        // Encontrar posição de inserção
        let i = 0;
        for (i = 0; i < parent.searchkeys.length; i++) {
            if (key < parent.searchkeys[i]) {
                break;
            }
        }

        parent.searchkeys.splice(i, 0, key);
        parent.pointers.splice(i + 1, 0, rightChild);

        // Se transbordou, fazer split do nó interno
        if (parent.searchkeys.length > this.maxkeys) {
            this._splitInternal(parent);
        }
    }

    _splitInternal(node) {
        let mid = Math.floor(this.maxkeys / 2);
        let newNode = new Node();
        newNode.isLeaf = false;

        // Chave promovida
        let promotedKey = node.searchkeys[mid];

        newNode.searchkeys = node.searchkeys.splice(mid + 1);
        newNode.pointers = node.pointers.splice(mid + 1);
        node.searchkeys.pop(); // Remove chave promovida

        if (node === this.root) {
            let newRoot = new Node();
            newRoot.isLeaf = false;
            newRoot.searchkeys = [promotedKey];
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
            if (rightSibling.searchkeys.length > this.minkeys) {
                // Mover primeira chave do irmão direito para o final da folha atual
                leaf.searchkeys.push(rightSibling.searchkeys.shift());
                leaf.pointers.push(rightSibling.pointers.shift());

                // Atualizar chave do pai
                parent.searchkeys[leafIndex] = rightSibling.searchkeys[0] || leaf.searchkeys[0];
                return;
            }
        }

        // Tentar pegar emprestado do irmão esquerdo
        if (leafIndex > 0) {
            let leftSibling = parent.pointers[leafIndex - 1];
            if (leftSibling.searchkeys.length > this.minkeys) {
                // Mover última chave do irmão esquerdo para o início da folha atual
                leaf.searchkeys.unshift(leftSibling.searchkeys.pop());
                leaf.pointers.unshift(leftSibling.pointers.pop());

                // Atualizar chave do pai
                parent.searchkeys[leafIndex - 1] = leaf.searchkeys[0];
                return;
            }
        }

        // Fazer merge com irmão
        if (leafIndex < parent.pointers.length - 1) {
            let rightSibling = parent.pointers[leafIndex + 1];
            // Concatenar chaves
            leaf.searchkeys = leaf.searchkeys.concat(rightSibling.searchkeys);
            // Concatenar ponteiros removendo o ponteiro intermediário
            leaf.pointers = leaf.pointers.slice(0, -1).concat(rightSibling.pointers.slice(1));

            // Remover entrada do pai
            parent.searchkeys.splice(leafIndex, 1);
            parent.pointers.splice(leafIndex + 1, 1);
        } else if (leafIndex > 0) {
            let leftSibling = parent.pointers[leafIndex - 1];
            // Concatenar chaves
            leftSibling.searchkeys = leftSibling.searchkeys.concat(leaf.searchkeys);
            // Concatenar ponteiros removendo o ponteiro intermediário
            leftSibling.pointers = leftSibling.pointers.slice(0, -1).concat(leaf.pointers.slice(1));

            // Remover entrada do pai
            parent.searchkeys.splice(leafIndex - 1, 1);
            parent.pointers.splice(leafIndex, 1);
        }

        // Se pai ficou desequilibrado
        if (parent.searchkeys.length < this.minkeys && parent !== this.root) {
            this._rebalanceLeaf(parent);
        }
    }

    _updateSeparator(node, newMin) {
        let parent = this._findParent(this.root, node);
        if (!parent) return;

        let index = parent.pointers.indexOf(node);
        if (index > 0) {
            parent.searchkeys[index - 1] = newMin;
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