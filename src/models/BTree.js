import { Node } from "./Node.js";

export default class BTree {
    constructor(fanout) {
        this.type = "btree"
        this.fanout = fanout;
        // Relativos aos nos folhas
        this.minKeys = Math.ceil((this.fanout - 1) / 2);
        this.maxKeys = this.fanout - 1;
        // Relativos aos nos nao folhas, m vai ser o fanout
        this.root = null;
        this.listeners = new Array();
    }

    // cadastrar listeners para ouvir os eventos emitidos
    onEvent(listener) {
        this.listeners.push(listener);
    }
    // emite eventos que serão usados pelos view
    emit(event) {
        this.listeners.forEach(l => l(event))
    }

    // Busca uma chave na árvore
    async find(key) {
        if (this.root == null) return null;
        this.emit({ type: "search:start", key: key });

        let current = this.root;
        this.emit({ type: "search:visit_node", nodeId: current.id });
        while (true) {
            let i = 0;
            for (i = 0; i < current.searchKeys.length; i++) {
                this.emit({ type: "search:visit_key", nodeId: current.id, pos: i });
                if (key === current.searchKeys[i]) {
                    this.emit({ type: "search:end", nodeId: current.id, key: key, success: true });
                    return current.searchKeys[i];
                }
                if (key < current.searchKeys[i]) {
                    break;
                }
            }
            if (current.isLeaf) {
                this.emit({ type: "search:end", nodeId: current.id, key: key, success: false });
                return null;
            }
            current = current.pointers[i];
            this.emit({ type: "search:visit_node", nodeId: current.id });
        }
    }

    // Insere uma chave na árvore
    async insert(key) {
        this.emit({ type: "insert:start", key: key })
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

        // Se raiz cheia, dividir antes de inserir
        if (this.root.searchKeys.length === this.maxKeys) {
            let newRoot = new Node();
            newRoot.isLeaf = false;
            newRoot.pointers = [this.root];
            this._splitChild(newRoot, 0);
            this.root = newRoot;
        }

        this._insertNonFull(this.root, key);
        this.emit({ type: "insert:end", key: key })
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
            this.emit({ type: "leaf:insert_key", nodeId: node.id, key: key, pos: i });
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

    async delete(key) {
        this.emit({ type: "remove:start", key: key });
        if (!this.root) return;

        this._deleteRecursive(this.root, key);

        // Ajuste da raiz
        if (!this.root.isLeaf && this.root.searchKeys.length === 0) {
            this.root = this.root.pointers[0];
            this.root.isRoot = true;
        }

        if (this.root.searchKeys.length === 0 && this.root.isLeaf) {
            this.root = null;
        }
    }

    _deleteRecursive(node, key) {
        let idx = 0;
        while (idx < node.searchKeys.length && key > node.searchKeys[idx]) {
            idx++;
        }

        // CASO 1: chave encontrada neste nó
        if (idx < node.searchKeys.length && node.searchKeys[idx] === key) {
            if (node.isLeaf) {
                // Remove direto
                node.searchKeys.splice(idx, 1);
                node.pointerRegisters.splice(idx, 1);
                node.pointers.splice(idx, 1);
            } else {
                // Substituir por predecessor
                let predNode = node.pointers[idx];
                while (!predNode.isLeaf) {
                    predNode = predNode.pointers[predNode.pointers.length - 1];
                }
                let predKey = predNode.searchKeys[predNode.searchKeys.length - 1];
                node.searchKeys[idx] = predKey;
                this._deleteRecursive(node.pointers[idx], predKey);
            }
            this.emit({ type: "remove:end", key: key, success: true });
            return;
        }

        // CASO 2: chave não está aqui
        if (node.isLeaf) {
            this.emit({ type: "remove:end", key: key, success: false });
            return; // chave não existe
        }
        // Antes de descer, garantir tamanho
        let originalIdx = idx;

        // Garantir que o filho tenha chaves suficientes
        this._fixChildSize(node, idx);

        // Se houve merge com o irmão esquerdo,
        // o filho correto agora é idx - 1
        if (originalIdx > node.searchKeys.length) {
            idx--;
        }
        // Pode ter mudado após fix
        this._deleteRecursive(node.pointers[idx], key);
    }

    _fixChildSize(parent, idx) {
        let child = parent.pointers[idx];

        if (child.searchKeys.length > this.minKeys) return;

        // Tenta pegar do irmão esquerdo
        if (idx > 0 && parent.pointers[idx - 1].searchKeys.length > this.minKeys) {
            this._borrowFromLeft(parent, idx);
            return;
        }

        // Tenta pegar do irmão direito
        if (idx < parent.pointers.length - 1 &&
            parent.pointers[idx + 1].searchKeys.length > this.minKeys) {
            this._borrowFromRight(parent, idx);
            return;
        }

        // Senão, merge
        if (idx > 0) {
            this._merge(parent, idx - 1);
        } else {
            this._merge(parent, idx);
        }
    }

    _borrowFromLeft(parent, idx) {
        let child = parent.pointers[idx];
        let left = parent.pointers[idx - 1];

        // Move chave do pai para o filho
        child.searchKeys.unshift(parent.searchKeys[idx - 1]);
        child.pointerRegisters.unshift(null);

        parent.searchKeys[idx - 1] = left.searchKeys.pop();
        left.pointerRegisters.pop();

        if (!child.isLeaf) {
            child.pointers.unshift(left.pointers.pop());
        }
        else {
            child.pointers = new Array(child.searchKeys.length + 1).fill(null);
        }
    }

    _borrowFromRight(parent, idx) {
        let child = parent.pointers[idx];
        let right = parent.pointers[idx + 1];

        child.searchKeys.push(parent.searchKeys[idx]);
        child.pointerRegisters.push(null);

        parent.searchKeys[idx] = right.searchKeys.shift();
        right.pointerRegisters.shift();

        if (!child.isLeaf) {
            child.pointers.push(right.pointers.shift());
        }
        else {
            child.pointers = new Array(child.searchKeys.length + 1).fill(null);
        }
    }

    _merge(parent, idx) {
        let left = parent.pointers[idx];
        let right = parent.pointers[idx + 1];

        // Chave do pai desce
        left.searchKeys.push(parent.searchKeys[idx]);
        left.pointerRegisters.push(null);

        // Junta tudo
        left.searchKeys = left.searchKeys.concat(right.searchKeys);
        left.pointerRegisters = left.pointerRegisters.concat(right.pointerRegisters);

        if (!left.isLeaf) {
            left.pointers = left.pointers.concat(right.pointers);
        } else {
            left.pointers = new Array(left.searchKeys.length + 1).fill(null);
        }

        parent.searchKeys.splice(idx, 1);
        parent.pointerRegisters.splice(idx, 1);
        parent.pointers.splice(idx + 1, 1);
    }

    getAllKeys() {
        const result = [];
        function traverse(node) {
            if (!node) return;

            for (let i = 0; i < node.searchKeys.length; i++) {
                if (!node.isLeaf) {
                    traverse(node.pointers[i]);
                }
                result.push(node.searchKeys[i]);
            }

            if (!node.isLeaf) {
                traverse(node.pointers[node.searchKeys.length]);
            }
        }
        traverse(this.root);
        return result;
    }

}