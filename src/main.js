import { CanvasRenderer } from "./views/CanvasRenderer.js"
import { TreeDraw } from "./views/TreeDrawView.js"
import { VisualizationConfigs } from "./views/VisualizationConfigs.js";
import TreeController from "./controllers/TreeController.js"
import ControlsView from "./views/ControlsView.js"


const startApp = () => {
    const canvasRenderer = new CanvasRenderer("canvas")
    const configs = new VisualizationConfigs()
    const canvasView = new TreeDraw(canvasRenderer, configs);
    const treeController = new TreeController(canvasView);
    new ControlsView(treeController)
}

startApp();


// Função para atualizar configurações de animação
/*
function updateAnimationSettings() {
    t.animationSpeed = parseInt(speedSlider.value)
    td.animationSpeed = t.animationSpeed
    speedValue.textContent = speedSlider.value + "ms"
}
*/

// Eventos para configurações
//speedSlider.addEventListener("input", updateAnimationSettings)

// Inicializar configurações
// updateAnimationSettings()

/*
const changeTreeType = () => {
    if (actualTreeType == "bplustree") {
        t = new BTree(actualFanout, animate, animationSpeed);
        actualTreeType = "btree";
    }
    else {
        t = new BPlusTree(actualFanout, animate, animationSpeed);
        actualTreeType = "bplustree";
    }
    td = new TreeDraw(t, c, configs);
    t.setTreeDraw(td)
    updateTree()
    return actualTreeType;
}

*/