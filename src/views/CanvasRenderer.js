export class CanvasRenderer {
    constructor(idElement) {
        const canvas = document.getElementById(idElement);

        // Obter device pixel ratio para telas de alta densidade
        const dpr = window.devicePixelRatio || 1;

        // Obter tamanho CSS do canvas
        const rect = canvas.getBoundingClientRect();
        const cssWidth = rect.width;
        const cssHeight = rect.height;

        // Definir tamanho interno do canvas considerando DPR para evitar borrão
        this.width = cssWidth * dpr;
        this.height = cssHeight * dpr;

        // Ajustar tamanho interno do canvas
        canvas.width = this.width;
        canvas.height = this.height;

        // Manter tamanho CSS original
        canvas.style.width = cssWidth + 'px';
        canvas.style.height = cssHeight + 'px';

        // Obter contexto e configurar para alta qualidade
        this.ctx = canvas.getContext("2d");

        // Escalar contexto para corresponder ao DPR
        this.ctx.scale(dpr, dpr);

        // Configurações para renderização nítida
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.textBaseline = "top";

        // Armazenar DPR para uso futuro
        this.dpr = dpr;
        this.cssWidth = cssWidth;
        this.cssHeight = cssHeight;
    }
    clearWindow() {
        // Limpar usando as dimensões CSS (não as internas com DPR)
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);
    }
    drawRectangle(x, y, width, height, highlighted = false) {
        // Desenhar retângulo preenchido
        this.ctx.fillStyle = highlighted ? "#ffeb3b" : "#c8ebfb";
        this.ctx.fillRect(x, y, width, height);

        // Desenhar borda com linha mais fina para nitidez
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
    }
    drawRectangleWithText(x, y, width, height, text, highlighted = false) {
        // Definir fonte com tamanho apropriado baseado na altura
        const fontSize = Math.min(height * 0.6, width * 0.3);
        this.ctx.font = `bold ${Math.floor(fontSize)}px Arial`;

        // Medir largura do texto
        const textWidth = this.ctx.measureText(text).width;

        // Se texto for muito largo, reduzir fonte ou truncar
        if (textWidth > width - 4) {
            const newFontSize = Math.floor(fontSize * (width - 4) / textWidth);
            this.ctx.font = `bold ${newFontSize}px Arial`;
        }

        // Desenhar retângulo de fundo
        this.ctx.fillStyle = highlighted ? "#ffeb3b" : "#c8ebfb";
        this.ctx.fillRect(x, y, width, height);

        // Desenhar borda
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 1; // Linha mais fina para nitidez
        this.ctx.strokeRect(x, y, width, height);

        // Configurar texto
        this.ctx.fillStyle = "black";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        // Desenhar texto centralizado
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }

    drawLine(xa, ya, xb, yb, strokeWidth = 2, strokeColor = "black", directed = false) {
        // Salvar estado do contexto
        this.ctx.save();

        // Configurar linha
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeWidth;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";

        // Desenhar linha principal
        this.ctx.beginPath();
        this.ctx.moveTo(xa, ya);
        this.ctx.lineTo(xb, yb);
        this.ctx.stroke();

        if (directed) {
            // Desenhar seta no final da linha
            const headlen = Math.max(8, strokeWidth * 3); // Tamanho da seta proporcional à largura da linha
            const angle = Math.atan2(yb - ya, xb - xa);

            this.ctx.beginPath();
            this.ctx.moveTo(xb, yb);
            this.ctx.lineTo(
                xb - headlen * Math.cos(angle - Math.PI / 6),
                yb - headlen * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.moveTo(xb, yb);
            this.ctx.lineTo(
                xb - headlen * Math.cos(angle + Math.PI / 6),
                yb - headlen * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.stroke();
        }

        // Restaurar estado do contexto
        this.ctx.restore();
    }

    drawText(text, x, y, size, fontFamily, color) {
        this.ctx.fillStyle = color;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.font = `${size}px ${fontFamily}`;
        const textMetrics = this.ctx.measureText(text)
        this.ctx.fillText(text, x + (textMetrics.width / 2), y);
    }

    // Método para redimensionar o canvas
    resize(newWidth, newHeight) {
        const canvas = this.ctx.canvas;
        const dpr = window.devicePixelRatio || 1;

        // Atualizar dimensões CSS
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';

        // Atualizar dimensões internas
        this.cssWidth = newWidth;
        this.cssHeight = newHeight;
        this.width = newWidth * dpr;
        this.height = newHeight * dpr;

        canvas.width = this.width;
        canvas.height = this.height;

        // Reaplicar escala
        this.ctx.scale(dpr, dpr);

        // Reaplicar configurações
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.textBaseline = "top";
    }

}