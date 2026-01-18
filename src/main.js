import CanvasRenderer from "./views/CanvasRenderer.js"
import TreeDrawView from "./views/TreeDrawView.js"
import VisualizationConfigs from "./views/VisualizationConfigs.js";
import TreeController from "./controllers/TreeController.js"
import ControlsView from "./views/ControlsView.js"

// Função principal que inicia todo o app
const startApp = () => {
    const canvasRenderer = new CanvasRenderer("canvas")
    const configs = new VisualizationConfigs()
    const canvasView = new TreeDrawView(canvasRenderer, configs);
    const treeController = new TreeController(canvasView);
    new ControlsView(treeController)
}

startApp();