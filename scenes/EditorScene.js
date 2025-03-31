import { Scene } from './Scene.js';

export class EditorScene extends Scene {
    constructor() {
        super();
        this.selectedTool = 'platform';
        this.grid = { size: 32, visible: true };
        this.elements = [];
    }

    // Methods for adding/removing/moving elements, saving/loading levels
    // ...implement as needed...
}
