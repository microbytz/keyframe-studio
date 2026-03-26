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
  | 'blur'
  | 'blend'
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

export type BlendMode = 'source-over' | 'multiply' | 'overlay' | 'screen' | 'darken' | 'lighten';

export interface SavedBrush {
  id: string;
  name: string;
  data: string;
}

export interface Layer {
  id: string;
  name: string;
  imageData: string;
  visible: boolean;
  locked?: boolean;
  opacity: number;
  blendMode?: BlendMode;
}

export interface Frame {
  id: string;
  layers: Layer[];
  duration?: number; // Number of beats to hold the frame (default 1)
}

export interface FrameGroup {
  id: string;
  name: string;
  startIndex: number;
  endIndex: number;
  fps: number;
  color: string;
}

export interface AudioMetadata {
  duration: number;
  peaks: number[];
  name: string;
}

export interface ProjectVersionMetadata {
  id: string;
  name: string;
  timestamp: number;
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
  scrubWithSound?: boolean;
  autoSaveEnabled?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  snapToAngle?: boolean;
  groups: FrameGroup[];
  savedBrushes: SavedBrush[];
  versions?: ProjectVersionMetadata[];
  audioData?: string; // Data URI for the audio
  audioMetadata?: AudioMetadata;
}

export interface DrawingState {
  isDrawing: boolean;
  color: string;
  brushSize: number;
  currentTool: ToolType;
}
