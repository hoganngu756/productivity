import { PHASES, PHASE_LABELS, type Phase } from '../logic/phases';

interface Props {
  current: Phase;
  onSelect: (phase: Phase) => void;
}

export function PhaseTabs({ current, onSelect }: Props) {
  return (
    <div className="phase-tabs" role="tablist" aria-label="Timer phase">
      {PHASES.map((phase) => (
        <button
          key={phase}
          type="button"
          role="tab"
          aria-selected={phase === current}
          className="phase-tabs__tab"
          onClick={() => onSelect(phase)}
        >
          {PHASE_LABELS[phase]}
        </button>
      ))}
    </div>
  );
}
