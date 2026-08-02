import { PawPrint } from './PawIcons';

interface Props {
  checked: boolean;
  onToggle?: () => void;
  readOnly?: boolean;
  size?: number;
}

// A checklist box rendered as a cat paw. In kid mode it's read-only.
export function PawCheck({ checked, onToggle, readOnly, size = 22 }: Props) {
  return (
    <button
      type="button"
      onClick={readOnly ? undefined : onToggle}
      disabled={readOnly}
      aria-pressed={checked}
      className={`paw-check grid place-items-center rounded-xl border-2 shrink-0 transition-colors ${
        checked
          ? 'bg-emerald-500 border-emerald-500 text-white'
          : 'bg-cream-50 border-charcoal-300 text-charcoal-300 hover:border-ginger-400'
      } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
      style={{ width: size + 10, height: size + 10 }}
    >
      <PawPrint style={{ width: size, height: size }} />
    </button>
  );
}
