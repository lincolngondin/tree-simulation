class Node {
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
    }
}

export class BTree {
    constructor(fanout, animate = false, animationSpeed = 500) {
        this.type = "btree"
        this.fanout = fanout;
        // Relativos aos nos folhas
        this.minKeys = Math.ceil((this.fanout - 1) / 2);
        this.maxKeys = this.fanout - 1;

        // nos não folhas(ou nos internos) devem ter pelo menos ceil(n/2) -1 valores até n-1 valores
        this.minNonLeafPointersKeys = Math.ceil(this.fanout / 2) - 1;
        this.maxNonLeafPointersKeys = this.fanout - 1;
        // Relativos aos nos nao folhas, m vai ser o fanout
        this.root = null;
        this.animate = animate;
        this.animationSpeed = animationSpeed;
        this.treeDraw = null;
    }

    setTreeDraw(treeDraw) {
        this.treeDraw = treeDraw;
    }

    // Retorna o caminho até o nó onde a chave está ou deveria estar
    getPathToKey(key) {
        let path = [];
        let current = this.root;
        path.push(current);
        while (!current.isLeaf) {
            let i = 0;
            for (i = 0; i < current.searchKeys.length; i++) {
                if (key <= current.searchKeys[i]) {
                    break;
                }
            }
            current = current.pointers[i];
            path.push(current);
        }
        return path;
    }

    // Busca uma chave na árvore
    async find(key) {
        if (this.animate && this.treeDraw) {
            let path = this.getPathToKey(key);
            let steps = path.map(node => ({ highlights: new Set([node]) }));
            steps.push({ highlights: new Set([path[path.length - 1]]), delay: this.animationSpeed * 2 });
            await this.treeDraw.animate(steps);
        }

        if (this.root == null) return null;

        let current = this.root;
        while (true) {
            let i = 0;
            for (i = 0; i < current.searchKeys.length; i++) {
                if (key === current.searchKeys[i]) {
                    return current.searchKeys[i];
                }
                if (key < current.searchKeys[i]) {
                    break;
                }
            }
            if (current.isLeaf) {
                return null;
            }
            current = current.pointers[i];
        }
    }

    async insertRandom(quantity, infValue, supValue) {
        for (let i = 0; i < quantity; i++) {
            const newkey = Math.floor(Math.random() * supValue) + infValue;
            await this.insert(newkey);
        }
    }
    // Insere uma chave na árvore
    async insert(key) {

        // Arvore vazia
        if (this.root == null) {
            this.root = new Node();
            this.root.isLeaf = true;
            this.root.isRoot = true;
            this.root.searchKeys = [key];
            this.root.pointers = [null, null];
            this.root.pointerRegisters = [null];
            return;
        }

        if (this.animate && this.treeDraw) {
            let path = this.getPathToKey(key);
            let steps = path.map(node => ({ highlights: new Set([node]) }));
            steps.push({ highlights: new Set([path[path.length - 1]]), delay: this.animationSpeed * 2 });
            await this.treeDraw.animate(steps);
        }

        // Se raiz cheia, dividir antes de inserir
        if (this.root.searchKeys.length === this.maxKeys) {
            let newRoot = new Node();
            newRoot.isLeaf = false;
            newRoot.pointers = [this.root];
            this._splitChild(newRoot, 0);
            this.root = newRoot;
        }

        this._insertNonFull(this.root, key);
    }

    _insertNonFull(node, key) {
        let i = node.searchKeys.length - 1;

        // no folha tem ponteiro e valor apenas
        if (node.isLeaf) {
            // Inserir na folha
            while (i >= 0 && key < node.searchKeys[i]) {
                i--;
            }
            i++;
            // adiciona a chave e o ponteiro
            node.searchKeys.splice(i, 0, key);
            node.pointers.splice(i, 0, null)
        } else {
            // Encontrar filho correto
            while (i >= 0 && key < node.searchKeys[i]) {
                i--;
            }
            i++;

            // Se filho cheio, dividir
            if (node.pointers[i].searchKeys.length === this.maxKeys) {
                this._splitChild(node, i);
                if (key > node.searchKeys[i]) {
                    i++;
                }
            }

            this._insertNonFull(node.pointers[i], key);
        }
    }

    _splitChild(parent, i) {
        let y = parent.pointers[i];
        let z = new Node();
        z.isLeaf = y.isLeaf;

        let mid = Math.floor(this.maxKeys / 2);
        let promotedKey = y.searchKeys[mid];

        z.searchKeys = y.searchKeys.slice(mid + 1);
        // Chaves que permanecem no nó original (esquerda)
        y.searchKeys = y.searchKeys.slice(0, mid);

        if (y.pointerRegisters.length > 0) {
            z.pointerRegisters = y.pointerRegisters.slice(mid + 1);
            y.pointerRegisters = y.pointerRegisters.slice(0, mid);
        } else {
            // Garantir alinhamento estrutural
            z.pointerRegisters = new Array(z.searchKeys.length).fill(null);
            y.pointerRegisters = new Array(y.searchKeys.length).fill(null);
        }

        // divide ponteiros de filhos
        if (!y.isLeaf) {
            z.pointers = y.pointers.slice(mid + 1);
            y.pointers = y.pointers.slice(0, mid + 1);
        } else {
            // Folhas também precisam manter k+1 ponteiros
            z.pointers = new Array(z.searchKeys.length + 1).fill(null);
            y.pointers = new Array(y.searchKeys.length + 1).fill(null);
        }

        // Insere no nó pai
        parent.searchKeys.splice(i, 0, promotedKey);
        parent.pointerRegisters.splice(i, 0, null);
        parent.pointers.splice(i + 1, 0, z);

    }

    // Remove uma chave da árvore
    async delete(key) {
        if (this.animate && this.treeDraw) {
            let path = this.getPathToKey(key);
            let steps = path.map(node => ({ highlights: new Set([node]) }));
            steps.push({ highlights: new Set([path[path.length - 1]]), delay: this.animationSpeed * 2 });
            await this.treeDraw.animate(steps);
        }

        if (this.root == null) return;

        this._delete(this.root, key);

        // Se raiz ficou vazia, ajustar
        if (this.root.searchKeys.length === 0) {
            if (this.root.isLeaf) {
                this.root = null;
            } else {
                this.root = this.root.pointers[0];
            }
        }
    }

    _delete(node, key) {
        let i = 0;
        while (i < node.searchKeys.length && key > node.searchKeys[i]) {
            i++;
        }

        if (node.isLeaf) {
            // Remover da folha
            if (i < node.searchKeys.length && node.searchKeys[i] === key) {
                node.searchKeys.splice(i, 1);
            }
            return;
        }

        // Se chave está neste nó
        if (i < node.searchKeys.length && node.searchKeys[i] === key) {
            return this._deleteInternalNode(node, i);
        }

        // Chave deve estar no filho
        let child = node.pointers[i];
        if (child.searchKeys.length === this.minKeys) {
            this._fillChild(node, i);
            // Após preencher, o filho pode ter mudado
            child = node.pointers[i];
        }

        this._delete(child, key);
    }

    _deleteInternalNode(node, i) {
        let k = node.searchKeys[i];

        if (node.pointers[i].searchKeys.length > this.minKeys) {
            // Substituir por predecessor
            let pred = this._getPredecessor(node.pointers[i]);
            node.searchKeys[i] = pred;
            this._delete(node.pointers[i], pred);
        } else if (node.pointers[i + 1].searchKeys.length > this.minKeys) {
            // Substituir por sucessor
            let succ = this._getSuccessor(node.pointers[i + 1]);
            node.searchKeys[i] = succ;
            this._delete(node.pointers[i + 1], succ);
        } else {
            // Mesclar filhos
            this._mergeChildren(node, i);
            this._delete(node.pointers[i], k);
        }
    }

    _getPredecessor(node) {
        while (!node.isLeaf) {
            node = node.pointers[node.pointers.length - 1];
        }
        return node.searchKeys[node.searchKeys.length - 1];
    }

    _getSuccessor(node) {
        while (!node.isLeaf) {
            node = node.pointers[0];
        }
        return node.searchKeys[0];
    }

    _fillChild(node, i) {
        if (i > 0 && node.pointers[i - 1].searchKeys.length > this.minKeys) {
            // Pegar emprestado do irmão esquerdo
            this._borrowFromLeft(node, i);
        } else if (i < node.pointers.length - 1 && node.pointers[i + 1].searchKeys.length > this.minKeys) {
            // Pegar emprestado do irmão direito
            this._borrowFromRight(node, i);
        } else {
            // Mesclar
            if (i > 0) {
                this._mergeChildren(node, i - 1);
            } else {
                this._mergeChildren(node, i);
            }
        }
    }

    _borrowFromLeft(node, i) {
        let child = node.pointers[i];
        let sibling = node.pointers[i - 1];

        // Mover chave do pai para o filho
        child.searchKeys.unshift(node.searchKeys[i - 1]);
        node.searchKeys[i - 1] = sibling.searchKeys.pop();

        if (!child.isLeaf) {
            child.pointers.unshift(sibling.pointers.pop());
        }
    }

    _borrowFromRight(node, i) {
        let child = node.pointers[i];
        let sibling = node.pointers[i + 1];

        // Mover chave do pai para o filho
        child.searchKeys.push(node.searchKeys[i]);
        node.searchKeys[i] = sibling.searchKeys.shift();

        if (!child.isLeaf) {
            child.pointers.push(sibling.pointers.shift());
        }
    }

    _mergeChildren(node, i) {
        let child = node.pointers[i];
        let sibling = node.pointers[i + 1];

        // Mover chave do pai para o filho
        child.searchKeys.push(node.searchKeys[i]);
        node.searchKeys.splice(i, 1);

        // Concatenar chaves e ponteiros do irmão
        child.searchKeys = child.searchKeys.concat(sibling.searchKeys);
        if (!child.isLeaf) {
            child.pointers = child.pointers.concat(sibling.pointers);
        }

        // Remover ponteiro do irmão
        node.pointers.splice(i + 1, 1);
    }
}