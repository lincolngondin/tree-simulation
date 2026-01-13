class Message {
    constructor(message, kind) {
        this.defaultMessageTime = 5000;
        this.messageTime = 0;
        this.message = message;
        this.creationTime = Date.now()
        this.kind = kind;
    }
}

export class TreeDraw {
    constructor(tree, canvasRender, configs) {
        this.tree = tree;
        this.render = canvasRender;

        // Parâmetros configuráveis com valores padrão
        this.configs = configs;
        this.highlights = new Set(); // Nós destacados
        this.infos = new Array();
        this.maxInfos = 5;
    }

    drawInfo() {
        // desenha todas as operacoes executadas na arvore
        for (let i = 0; i < this.infos.length; i++) {
            let messageColor = "blue";
            if (this.infos[i].kind == "SUCCESS") {
                messageColor = "blue";
            }
            else if (this.infos[i].kind == "ERROR") {
                messageColor = "red";
            }

            this.render.drawText(this.infos[i].message, 10, 20 + i * 20, 16, "Monospace", messageColor)
        }
    }
    addInfo(message, kind) {
        if (this.infos.length >= this.maxInfos) {
            this.infos.shift();
        }
        this.infos.push(new Message(message, kind))
    }

    drawTree() {
        // se não há arvore não desenha
        if (this.tree.root == null) {
            return;
        }

        // Limpar canvas
        this.render.clearWindow();
        this.drawInfo()

        // Calcular posições dos nós começando do centro superior do canvas
        const positions = new Map();
        const canvasCenterX = this.render.width / 2;
        const subtreeWidth = this._getSubtreeWidthPixels(this.tree.root);
        this._calculatePositions(this.tree.root, 0, canvasCenterX, positions);

        // Desenhar linhas (arestas) primeiro
        this._drawEdges(this.tree.root, positions);

        // Desenhar nós
        this._drawNodes(this.tree.root, positions);
    }

    _calculatePositions(node, level, centerX, positions) {
        if (node == null) return;

        // Calcular largura total da subárvore
        const subtreeWidth = this._getSubtreeWidthPixels(node);

        // Calcular largura real deste nó
        const nodeWidth = this._getNodeWidth(node);

        // Posição X: centralizar o nó na posição especificada
        const x = centerX - nodeWidth / 2;

        // Posição Y: baseada no nível
        const y = level * this.configs.verticalSpacing + this.configs.canvasPadding;

        positions.set(node, { x, y });

        // Processar filhos
        if (!node.isLeaf && node.pointers.length > 0) {
            const childY = y + this.configs.nodeHeight + 20; // Espaço para as arestas
            let childOffset = centerX - subtreeWidth / 2;

            for (let i = 0; i < node.pointers.length; i++) {
                const childNode = node.pointers[i];
                const childSubtreeWidth = this._getSubtreeWidthPixels(childNode);
                const childCenterX = childOffset + childSubtreeWidth / 2;

                this._calculatePositions(childNode, level + 1, childCenterX, positions);
                childOffset += childSubtreeWidth + this.configs.minNodeSpacing;
            }
        }
    }

    // Retorna a largura total da subárvore em pixels
    _getSubtreeWidthPixels(node) {
        if (node == null) return 0;

        if (node.isLeaf) {
            return this._getNodeWidth(node);
        }

        let totalWidth = 0;
        for (let i = 0; i < node.pointers.length; i++) {
            const childWidth = this._getSubtreeWidthPixels(node.pointers[i]);
            totalWidth += childWidth;
            if (i < node.pointers.length - 1) {
                totalWidth += this.configs.minNodeSpacing;
            }
        }

        // A largura do nó pai deve ser pelo menos a largura da subárvore
        const nodeWidth = this._getNodeWidth(node);
        return Math.max(totalWidth, nodeWidth);
    }

    // retorna o comprimento de um no considera o tipo de arvore *
    _getNodeWidth(node) {
        if (node == null) return 0;
        if (this.tree.type === "bplustree") {
            // Largura = (número de pointers * largura_pointer) + (número de chaves * largura_chave)
            return node.pointers.length * this.configs.nodePointerWidth + node.searchKeys.length * this.configs.nodeWidth;
        }
        else {
            // Largura = (número de pointers * largura_pointer) + (número de chaves * largura_chave) + (numeros de ponteiros para registro * largura ponteiros para registro)
            return node.pointers.length * this.configs.nodePointerWidth + node.searchKeys.length * this.configs.nodeWidth + node.pointerRegisters.length * this.configs.nodePointerRegisterWidth;
        }
    }

    _getSubtreeWidth(node) {
        if (node == null) return 1;

        if (node.isLeaf) {
            return 1;
        }

        let width = 0;
        for (let i = 0; i < node.pointers.length; i++) {
            width += this._getSubtreeWidth(node.pointers[i]);
        }
        return Math.max(width, 1);
    }

    _drawEdges(node, positions) {
        if (node == null || node.isLeaf) return;

        const parentPos = positions.get(node);
        if (!parentPos) return;

        // Desenhar linhas para cada filho
        for (let i = 0; i < node.pointers.length; i++) {
            const childNode = node.pointers[i];
            const childPos = positions.get(childNode);

            if (childPos) {
                // Calcular posição X do ponteiro i no nó pai
                // Layout: P0 | K0 | P1 | K1 | ... | Pk
                const pointerX = parentPos.x + i * (this.configs.nodePointerWidth + this.configs.nodeWidth) + this.configs.nodePointerWidth / 2;

                // Calcular posição X do centro do primeiro ponteiro no nó filho
                const childPointerX = childPos.x + this.configs.nodePointerWidth / 2;

                // Linha do ponteiro do pai para o centro do primeiro ponteiro do filho
                this.render.drawLine(
                    pointerX,
                    parentPos.y + this.configs.nodeHeight,
                    childPointerX,
                    childPos.y,
                    2,
                    "black", true
                );
            }

            // Recursivamente desenhar arestas dos filhos
            this._drawEdges(childNode, positions);
        }
    }

    _drawNodes(node, positions) {
        if (node == null) return;

        const pos = positions.get(node);
        if (!pos) return;

        // Calcular largura total do nó para centralizar
        const totalWidth = node.pointers.length * this.configs.nodePointerWidth + node.searchKeys.length * this.configs.nodeWidth;
        const startX = pos.x; // pos.x já está centralizado pela _calculatePositions

        let currentX = startX;

        for (let i = 0; i < node.pointers.length; i++) {
            // Desenhar pointer
            const isHighlighted = this.highlights.has(node);
            this.render.drawRectangle(currentX, pos.y, this.configs.nodePointerWidth, this.configs.nodeHeight, isHighlighted);
            currentX += this.configs.nodePointerWidth;

            if (this.tree.type == "btree" && !node.isLeaf) {
                // desenha ponteiro para registro se existir
                if (i < node.pointerRegisters.length) {
                    this.render.drawRectangleWithText(currentX, pos.y, this.configs.nodePointerRegisterWidth, this.configs.nodeHeight, node.searchKeys[i].toString(), isHighlighted);
                    currentX += this.configs.nodePointerRegisterWidth;
                }
            }

            // Desenhar chave (se existir para este índice)
            if (i < node.searchKeys.length) {
                this.render.drawRectangleWithText(currentX, pos.y, this.configs.nodeWidth, this.configs.nodeHeight, node.searchKeys[i].toString(), isHighlighted);
                currentX += this.configs.nodeWidth;
            }
        }

        // Recursivamente desenha os filhos
        if (!node.isLeaf) {
            node.pointers.forEach(child => {
                this._drawNodes(child, positions);
            });
        }
    }

    // Método para animar passos
    animate(steps) {
        return new Promise(resolve => {
            let i = 0;
            const next = () => {
                if (i < steps.length) {
                    this.highlights = steps[i].highlights || new Set();
                    this.drawTree();
                    setTimeout(next, steps[i].delay || this.configs.animationSpeed);
                    i++;
                } else {
                    this.highlights.clear();
                    this.drawTree();
                    resolve();
                }
            };
            next();
        });
    }

}