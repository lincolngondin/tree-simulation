// TreeDrawView é a classe principal que desenha a arvore e as animações
export default class TreeDrawView {
    constructor(canvasRender, configs) {
        this.render = canvasRender;

        // Parâmetros configuráveis com valores padrão
        this.configs = configs;
        // Armazena as informações de status na tela
        this.infos = new Array();
        // Qantidade maxima que pode ser exibida em um dado momento
        this.maxInfos = 7;
        this.visualState = new VisualState();
        this.animationSpeed = 500;
    }

    // Muda a arvore atual
    setTree(tree) {
        // reseta as informaçoes
        this.infos = new Array();
        this.visualState.reset();
        this.tree = tree;
        this.renderFrame();
    }

    // Renderiza o frame atual
    renderFrame() {
        // Limpar canvas
        this.render.clearWindow();
        this.drawTreeStructure();
        this.drawInfo();
    }

    // Exibe todas as informações que há
    drawInfo() {
        // desenha o titulo com as informacoes da arvore atual
        this.render.drawText(`Àrvore ${this.tree.type == "bplustree" ? "B+" : "B"} Grau/Fanout: ${this.tree.fanout}`, this.render.width - 310, 20, 20, "Monospace", "black");
        // desenha todas as operacoes executadas na arvore
        for (let i = 0; i < this.infos.length; i++) {
            let messageColor = "blue";
            if (this.infos[i].kind == "SUCCESS") {
                messageColor = "blue";
            }
            else if (this.infos[i].kind == "ERROR") {
                messageColor = "red";
            }
            else if (this.infos[i].kind == "INFO") {
                messageColor = "gray";
            }

            this.render.drawText(this.infos[i].message, 10, 20 + i * 20, 16, "Monospace", messageColor)
        }
    }

    // Adiciona uma mensagem de estado
    addInfo(message, kind) {
        if (this.infos.length >= this.maxInfos) {
            this.infos.shift();
        }
        this.infos.push(new Message(message, kind))
    }

    // Desenha toda a estrutura da arvore
    drawTreeStructure() {
        if (this.tree.root == null) {
            return;
        }

        // Calcular posições dos nós começando do centro superior do canvas
        const positions = new Map();
        const canvasCenterX = this.render.width / 2;
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

    // Retorna o comprimento de um no considera o tipo de arvore
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

        // if o no atual deve ser marcado
        const isHighlighted = this.visualState.highlightedNodes.has(node.id);
        if (isHighlighted) {
            const color = this.visualState.highlightedNodes.get(node.id).color;
            this.render.drawStrokeRectangle(currentX - 4, pos.y - 4, totalWidth + 8, this.configs.nodeHeight + 8, 2, color);
        }

        for (let i = 0; i < node.pointers.length; i++) {
            // Desenhar pointer
            this.render.drawRectangle(currentX, pos.y, this.configs.nodePointerWidth, this.configs.nodeHeight, false);
            currentX += this.configs.nodePointerWidth;

            if (this.tree.type == "btree" && !node.isLeaf) {
                // desenha ponteiro para registro se existir
                if (i < node.pointerRegisters.length) {
                    this.render.drawRectangleWithText(currentX, pos.y, this.configs.nodePointerRegisterWidth, this.configs.nodeHeight, node.searchKeys[i].toString(), false);
                    currentX += this.configs.nodePointerRegisterWidth;
                }
            }

            // Desenhar chave (se existir para este índice)
            if (i < node.searchKeys.length) {
                const nodeHasHiddenKey = this.visualState.hiddenKeys.has(node.id);
                if (nodeHasHiddenKey && i === this.visualState.hiddenKeys.get(node.id)) {
                    this.render.drawStrokeRectangle(currentX, pos.y, this.configs.nodeWidth, this.configs.nodeHeight, 1, "red");
                }
                else {
                    this.render.drawRectangleWithText(currentX, pos.y, this.configs.nodeWidth, this.configs.nodeHeight, node.searchKeys[i].toString(), false);

                }

                // Marca a chave que esta sendo visitada em dado momento
                const isKeyHighlighted = this.visualState.highlightedKeys.has(node.id + i)
                if (isKeyHighlighted) {
                    const color = this.visualState.highlightedKeys.get(node.id + i).color;
                    this.render.drawStrokeRectangle(currentX + 2, pos.y + 2, this.configs.nodeWidth - 4, this.configs.nodeHeight - 4, 4, color);
                }
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

    delay = ms => new Promise(res => setTimeout(res, ms))

    // funcao que anima
    async animate(eventos) {
        if (eventos.length == 0) {
            this.renderFrame();
            return;
        };
        // é um evento de inserção
        if (eventos[0].type == "insert:start") {
            for (const e of eventos) {
                if (e.type == "leaf:insert_key") {
                    this.visualState.hiddenKeys.set(e.nodeId, e.pos);
                }
            }
            for (const e of eventos) {
                console.log(e)
                switch (e.type) {
                    case "insert:start":
                        this.addInfo(`INSERÇÃO: Inserindo valor ${e.key}`, "INFO")
                        break;
                    case "leaf:insert_key":
                        this.visualState.hiddenKeys.delete(e.nodeId);
                        break;
                    case "insert:end":
                        this.addInfo(`INSERÇÃO: Inserido ${e.key} com sucesso!`, "SUCCESS")
                        this.visualState.reset();
                        break;
                    default:
                        this.renderFrame();
                        continue;
                }
                this.renderFrame();
                await this.delay(this.animationSpeed);
            }
        }

        // BUSCA
        else if (eventos[0].type == "search:start") {
            for (const e of eventos) {
                console.log(e);
                switch (e.type) {
                    case "search:start":
                        this.visualState.reset();
                        this.addInfo(`BUSCA: Buscando ${e.key}...`, "INFO");
                        break;
                    case "search:visit_node":
                        this.visualState.highlightedNodes.clear();
                        this.visualState.highlightedNodes.set(e.nodeId, new HighLight("VISITING_NODE"));
                        break;
                    case "search:visit_key":
                        this.visualState.highlightedKeys.clear();
                        this.visualState.highlightedKeys.set(e.nodeId + e.pos, new HighLight("VISITING_KEY"));
                        break;
                    case "search:end":
                        if (e.success) {
                            this.addInfo(`BUSCA: ${e.key} encontrado!`, "SUCCESS");
                        }
                        else {
                            this.addInfo(`BUSCA: ${e.key} não encontrado!`, "ERROR");
                        }
                        this.visualState.reset();
                        break;
                    default:
                        this.renderFrame();
                        continue;
                }
                this.renderFrame();
                await this.delay(this.animationSpeed);
            }
        }


        // remoção
        else if (eventos[0].type == "remove:start") {
            for (const e of eventos) {
                if (e.type == "leaf:remove_key") {
                    this.visualState.hiddenKeys.set(e.nodeId, e.pos);
                    this.visualState.highlightedNodes.set(e.nodeId, new HighLight("REMOVED_NODE"))
                }
            }

            for (const e of eventos) {
                console.log(e);
                switch (e.type) {
                    case "remove:start":
                        this.addInfo(`REMOÇÃO: Removendo valor ${e.key}...`, "INFO")
                        break;
                    case "remove:end":
                        if (e.success) {
                            this.addInfo(`REMOÇÃO: Removido ${e.key}!`, "SUCCESS");
                        }
                        else {
                            this.addInfo(`REMOÇÃO: ${e.key} não encontrado!`, "ERROR");
                        }
                        this.visualState.reset();
                        break;
                    case "leaf:remove_key":
                        this.visualState.hiddenKeys.delete(e.nodeId, e.pos);
                        break;
                    default:
                        this.renderFrame();
                        continue;
                }
                this.renderFrame();
                await this.delay(this.animationSpeed);
            }
        }
        else {
            this.renderFrame();
        }

    }

}

// Estado visual da arvore difere da arvore no model
class VisualState {
    constructor() {
        // Nós e chaves que devem ser destacados na animação
        this.highlightedNodes = new Map();
        this.highlightedKeys = new Map();
        // a chave que deve ser escondida antes de inserir na animação key = nodeId value = {pos}
        this.hiddenKeys = new Map();
    }
    reset() {
        this.highlightedNodes.clear();
        this.highlightedKeys.clear();
        this.hiddenKeys.clear();
    }
}

// Classe relativa as mensagens de status que aparecem no canvas
class Message {
    constructor(message, kind) {
        this.message = message;
        this.kind = kind;
    }
}

// Classe relativa aos tipos de destaque que os nos podem receber
class HighLight {
    constructor(kind) {
        this.kind = kind;
        this.color = this._getColor();
    }
    _getColor() {
        let color;
        switch (this.kind) {
            case "VISITING_NODE":
                color = "blue";
                break;
            case "VISITING_KEY":
                color = "orange";
                break;
            case "NEW_NODE":
                color = "yellow";
                break;
            case "PROMOTED_KEY":
                color = "yellow";
                break;
            case "LEAF_FOUNDED":
                color = "green";
                break;
            case "REMOVED_NODE":
                color = "red";
                break;
        }
        return color;
    }
}