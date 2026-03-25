export type ToolType = 
  | 'pen' 
  | 'pencil'
  | 'brush' 
  | 'pixel' 
  | 'calligraphy' 
  | 'airbrush' 
  | 'highlighter' 
  | 'marker' 
  | 'charcoal' 
  | 'crayon' 
  | 'watercolor' 
  | 'ink'
  | 'spray'
  | 'chalk'
  | 'technical'
  | 'eraser' 
  | 'bucket' 
  | 'lasso'
  | 'move'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'triangle';

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
