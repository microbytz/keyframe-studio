export type ToolType = 'pen' | 'brush' | 'pixel' | 'calligraphy' | 'airbrush' | 'eraser' | 'bucket' | 'lasso';

export interface Frame {
  id: string;
  imageData: string; // Base64 or DataURL of the canvas state
}

export interface AnimationProject {
  id: string;
  name: string;
  frames: Frame[];
  fps: number;
  width: number;
  height: number;
  onionSkinEnabled: boolean;
}

export interface DrawingState {
  isDrawing: boolean;
  color: string;
  brushSize: number;
  currentTool: ToolType;
}
