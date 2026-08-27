/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, CheckCircle2, XCircle, HelpCircle, ArrowRight, RotateCcw, Trophy, X } from 'lucide-react';
import { ANATOMY_STRUCTURES, AnatomicalStructure } from '../data/anatomyData';
import { SelectedStructureState } from '../types';
import { extractSideFromName } from '../utils/helpers';

interface StudyModeOverlayProps {
  onSelectStructure: (structureState: SelectedStructureState) => void;
  onExitStudyMode: () => void;
}

export const StudyModeOverlay: React.FC<StudyModeOverlayProps> = ({
  onSelectStructure,
  onExitStudyMode,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [options, setOptions] = useState<AnatomicalStructure[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  // Filter prominent identifiable structures for study quiz
  const studyPool = useMemo(() => {
    return ANATOMY_STRUCTURES.filter((s) => s.type === 'muscle' || s.type === 'bone');
  }, []);

  const loadQuestion = () => {
    if (studyPool.length === 0) return;
    const randomIndex = Math.floor(Math.random() * studyPool.length);
    const target = studyPool[randomIndex];
    setCurrentIndex(randomIndex);

    // Pick 3 random distractors from same or nearby regions
    const distractors: AnatomicalStructure[] = [];
    let attempts = 0;
    while (distractors.length < 3 && attempts < 50) {
      attempts++;
      const d = studyPool[Math.floor(Math.random() * studyPool.length)];
      if (d.id !== target.id && !distractors.some((x) => x.id === d.id)) {
        distractors.push(d);
      }
    }

    // Shuffle options
    const allOptions = [target, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
    setSelectedOptionId(null);
    setIsAnswered(false);

    // Highlight target structure in 3D scene
    onSelectStructure({
      structure: target,
      meshName: target.rawMeshName,
      cleanName: target.name,
      side: extractSideFromName(target.name || target.rawMeshName),
    });
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  const currentTarget = studyPool[currentIndex];

  const handleChooseOption = (optionId: string) => {
    if (isAnswered || !currentTarget) return;
    setSelectedOptionId(optionId);
    setIsAnswered(true);

    const isCorrect = optionId === currentTarget.id;
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  if (!currentTarget) return null;

  return (
    <div
      id="study-mode-card"
      className="absolute bottom-6 right-4 md:right-6 z-30 w-full max-w-sm bg-slate-900/95 border border-sky-500/30 rounded-2xl shadow-2xl p-4 backdrop-blur-md select-none"
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-950 text-sky-400 border border-sky-800">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Anatomy Study Quiz
            </h3>
            <div className="text-[10px] text-slate-400">Identify the highlighted structure</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            <Trophy className="w-3 h-3" />
            <span>
              {score.correct} / {score.total}
            </span>
          </div>
          <button
            onClick={onExitStudyMode}
            className="p-1 text-slate-400 hover:text-slate-200 rounded"
            title="Close Quiz"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Clue Prompt */}
      <div className="mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs">
        <div className="text-[10px] uppercase font-semibold text-slate-400 mb-0.5">
          Region: <span className="text-sky-300 font-bold">{currentTarget.region}</span>
        </div>
        <div className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
          <span className="font-semibold text-slate-400">Action/Function:</span> {currentTarget.action}
        </div>
      </div>

      {/* Multiple Choice Options */}
      <div className="space-y-1.5 mb-3">
        {options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          const isTarget = opt.id === currentTarget.id;

          let btnClass = 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700';

          if (isAnswered) {
            if (isTarget) {
              btnClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
            } else if (isSelected) {
              btnClass = 'bg-rose-950/80 border-rose-500 text-rose-200';
            } else {
              btnClass = 'bg-slate-900/40 text-slate-500 border-slate-800';
            }
          }

          return (
            <button
              key={opt.id}
              id={`quiz-option-${opt.id}`}
              disabled={isAnswered}
              onClick={() => handleChooseOption(opt.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs border flex items-center justify-between transition-all ${btnClass}`}
            >
              <span className="truncate">{opt.name}</span>
              {isAnswered && (
                <span>
                  {isTarget ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isSelected ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  ) : null}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Action Footer */}
      {isAnswered && (
        <button
          id="quiz-next-question-btn"
          onClick={loadQuestion}
          className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-sky-900/30 transition-all"
        >
          <span>Next Structure</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
