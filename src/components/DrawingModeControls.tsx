/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Palette, Eye, Tag, X, RotateCcw } from 'lucide-react';
import { CameraView } from '../types';

interface DrawingModeControlsProps {
  canvasBg: string;
  onCanvasBgChange: (bg: string) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  onSelectView: (view: CameraView) => void;
  onExitDrawingMode: () => void;
  shadingMode: 'anatomical' | 'clay' | 'silhouette' | 'wireframe';
  onShadingModeChange: (mode: 'anatomical' | 'clay' | 'silhouette' | 'wireframe') => void;
}

export const DrawingModeControls: React.FC<DrawingModeControlsProps> = ({
  canvasBg,
  onCanvasBgChange,
  showLabels,
  onToggleLabels,
  onSelectView,
  onExitDrawingMode,
  shadingMode,
  onShadingModeChange,
}) => {
  const backgrounds = [
    { id: 'bg-slate-950', color: '#020617', name: 'Dark Slate' },
    { id: 'bg-neutral-800', color: '#262626', name: 'Charcoal' },
    { id: 'bg-stone-300', color: '#d6d3d1', name: 'Warm Clay' },
    { id: 'bg-slate-100', color: '#f1f5f9', name: 'Studio White' },
  ];

  return (
    <div
      id="drawing-mode-toolbar"
      className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-2 rounded-2xl shadow-2xl backdrop-blur-md select-none"
    >
      <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700">
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Drawing Reference
        </span>
      </div>

      {/* Shading Style */}
      <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-800 text-xs">
        <button
          onClick={() => onShadingModeChange('anatomical')}
          className={`px-2 py-1 rounded-md transition-all ${
            shadingMode === 'anatomical'
              ? 'bg-slate-700 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Anatomy
        </button>
        <button
          onClick={() => onShadingModeChange('clay')}
          className={`px-2 py-1 rounded-md transition-all ${
            shadingMode === 'clay'
              ? 'bg-slate-700 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Clay
        </button>
        <button
          onClick={() => onShadingModeChange('silhouette')}
          className={`px-2 py-1 rounded-md transition-all ${
            shadingMode === 'silhouette'
              ? 'bg-slate-700 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Rim Light
        </button>
        <button
          onClick={() => onShadingModeChange('wireframe')}
          className={`px-2 py-1 rounded-md transition-all ${
            shadingMode === 'wireframe'
              ? 'bg-slate-700 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Mesh
        </button>
      </div>

      {/* Canvas Tone Palette */}
      <div className="flex items-center gap-1.5 px-2 border-l border-slate-700">
        {backgrounds.map((bg) => (
          <button
            key={bg.id}
            onClick={() => onCanvasBgChange(bg.id)}
            title={`Background: ${bg.name}`}
            className={`w-5 h-5 rounded-full border transition-transform ${
              canvasBg === bg.id
                ? 'scale-125 border-sky-400 ring-2 ring-sky-400/40'
                : 'border-slate-600 hover:scale-110'
            }`}
            style={{ backgroundColor: bg.color }}
          />
        ))}
      </div>

      {/* Quick Camera Pivots */}
      <div className="flex items-center gap-1 border-l border-slate-700 pl-2 text-xs">
        <button
          onClick={() => onSelectView('FRONT')}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-medium"
        >
          Front
        </button>
        <button
          onClick={() => onSelectView('BACK')}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-medium"
        >
          Back
        </button>
        <button
          onClick={() => onSelectView('LEFT')}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-medium"
        >
          Side
        </button>
      </div>

      {/* Exit Button */}
      <button
        onClick={onExitDrawingMode}
        className="p-1.5 ml-1 text-slate-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors"
        title="Exit Reference Mode"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
