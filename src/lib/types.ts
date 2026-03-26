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
  | 'triangle'
  | 'custom';

export type MoveMode = 'translate' | 'scale' | 'rotate' | 'skew';

export interface Layer {
  id: string;
  name: string;
  imageData: string;
  visible: boolean;
  locked?: boolean;
}

export interface Frame {
  id: string;
  layers: Layer[];
}

export interface FrameGroup {
  id: string;
  name: string;
  startIndex: number;
  endIndex: number;
  fps: number;
  color: string;
}

export interface AnimationProject {
  id: string;
  name: string;
  frames: Frame[];
  fps: number;
  width: number;
  height: number;
  onionSkinEnabled: boolean;
  advancedOnionSkinEnabled?: boolean;
  onionSkinBefore?: number;
  onionSkinAfter?: number;
  groups: FrameGroup[];
}

export interface DrawingState {
  isDrawing: boolean;
  color: string;
  brushSize: number;
  currentTool: ToolType;
}
