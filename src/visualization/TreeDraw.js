export class TreeDraw {
    constructor(tree, canvasRender) {
        this.tree = tree;
        this.render = canvasRender;

        // Parâmetros configuráveis com valores padrão
        this.nodeWidth = 60;           // Largura de cada chave
        this.nodePointerWidth = 15; // Largura de cada ponteiro
        this.nodeHeight = 35;         // Altura dos nós
        this.horizontalSpacing = 170; // Espaçamento horizontal entre nós
        this.verticalSpacing = 120;     // Espaçamento vertical entre níveis
        this.canvasPadding = 50;   // Padding das bordas do canvas
        this.minNodeSpacing = 20; // Espaçamento mínimo entre nós
    }

    drawTree() {
        // se não há arvore não desenha
        if (this.tree.root == null) {
            return;
        }

        // Limpar canvas
        this.render.clearWindow();

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
        const y = level * this.verticalSpacing + this.canvasPadding;

        positions.set(node, { x, y });

        // Processar filhos
        if (!node.isLeaf && node.pointers.length > 0) {
            const childY = y + this.nodeHeight + 20; // Espaço para as arestas
            let childOffset = centerX - subtreeWidth / 2;

            for (let i = 0; i < node.pointers.length; i++) {
                const childNode = node.pointers[i];
                const childSubtreeWidth = this._getSubtreeWidthPixels(childNode);
                const childCenterX = childOffset + childSubtreeWidth / 2;

                this._calculatePositions(childNode, level + 1, childCenterX, positions);
                childOffset += childSubtreeWidth + this.minNodeSpacing;
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
                totalWidth += this.minNodeSpacing;
            }
        }

        // A largura do nó pai deve ser pelo menos a largura da subárvore
        const nodeWidth = this._getNodeWidth(node);
        return Math.max(totalWidth, nodeWidth);
    }

    // retorna o comprimento de um no
    _getNodeWidth(node) {
        if (node == null) return 0;
        // Largura = (número de pointers * largura_pointer) + (número de chaves * largura_chave)
        return node.pointers.length * this.nodePointerWidth + node.searchkeys.length * this.nodeWidth;
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
                const pointerX = parentPos.x + i * (this.nodePointerWidth + this.nodeWidth) + this.nodePointerWidth / 2;

                // Calcular posição X do centro do primeiro ponteiro no nó filho
                const childPointerX = childPos.x + this.nodePointerWidth / 2;

                // Linha do ponteiro do pai para o centro do primeiro ponteiro do filho
                this.render.drawLine(
                    pointerX,
                    parentPos.y + this.nodeHeight,
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
        const totalWidth = node.pointers.length * this.nodePointerWidth + node.searchkeys.length * this.nodeWidth;
        const startX = pos.x; // pos.x já está centralizado pela _calculatePositions

        let currentX = startX;

        for (let i = 0; i < node.pointers.length; i++) {
            // Desenhar pointer
            this.render.drawRectangle(currentX, pos.y, this.nodePointerWidth, this.nodeHeight);
            currentX += this.nodePointerWidth;

            // Desenhar chave (se existir para este índice)
            if (i < node.searchkeys.length) {
                this.render.drawRectangleWithText(currentX, pos.y, this.nodeWidth, this.nodeHeight, node.searchkeys[i].toString());
                currentX += this.nodeWidth;
            }
        }

        // Recursivamente desenha os filhos
        if (!node.isLeaf) {
            node.pointers.forEach(child => {
                this._drawNodes(child, positions);
            });
        }
    }

}