/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Compass, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';
import { CameraView } from '../types';

interface ViewControlsProps {
  onSelectView: (view: CameraView) => void;
  activeView: CameraView | null;
}

export const ViewControls: React.FC<ViewControlsProps> = ({ onSelectView, activeView }) => {
  const views: { id: CameraView; label: string; subLabel: string }[] = [
    { id: 'FRONT', label: 'Anterior', subLabel: 'Front' },
    { id: 'BACK', label: 'Posterior', subLabel: 'Back' },
    { id: 'LEFT', label: 'Lateral L', subLabel: 'Left' },
    { id: 'RIGHT', label: 'Lateral R', subLabel: 'Right' },
    { id: 'TOP', label: 'Superior', subLabel: 'Top' },
    { id: 'BOTTOM', label: 'Inferior', subLabel: 'Bottom' },
  ];

  return (
    <div
      id="view-controls-panel"
      className="absolute bottom-5 left-4 md:left-6 z-20 flex flex-col gap-1.5 bg-slate-900/90 p-2 rounded-xl border border-slate-800 shadow-xl backdrop-blur-md select-none"
    >
      <div className="flex items-center justify-between px-1.5 pb-1 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
        <span className="flex items-center gap-1">
          <Compass className="w-3 h-3 text-sky-400" />
          <span>Camera Views</span>
        </span>
        <button
          id="view-reset-btn"
          onClick={() => onSelectView('RESET')}
          title="Reset Camera Position"
          className="text-slate-400 hover:text-sky-300 p-0.5"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1 pt-0.5">
        {views.map((v) => (
          <button
            key={v.id}
            id={`camera-view-btn-${v.id.toLowerCase()}`}
            onClick={() => onSelectView(v.id)}
            className={`px-2 py-1.5 rounded-lg text-center transition-all ${
              activeView === v.id
                ? 'bg-sky-600 text-white font-semibold shadow-md'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-slate-100'
            }`}
          >
            <div className="text-[11px] font-medium leading-tight">{v.subLabel}</div>
            <div className="text-[9px] text-slate-400 uppercase tracking-tighter">{v.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
