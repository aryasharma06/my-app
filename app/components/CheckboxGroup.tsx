'use client';

interface Props {
  options: string[];
  value: string; // comma-separated, e.g. "spring, casual"
  onChange: (value: string) => void;
}

export default function CheckboxGroup({ options, value, onChange }: Props) {
  const selected = value.split(',').map(s => s.trim()).filter(Boolean);

  function toggle(opt: string) {
    const next = selected.includes(opt)
      ? selected.filter(s => s !== opt)
      : [...selected, opt];
    onChange(next.join(', '));
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className="px-3 py-1 rounded-sm text-xs font-medium tracking-wider uppercase transition-colors"
            style={{
              background: on ? '#2D5016' : '#EFF3EC',
              color: on ? '#F9F9F7' : '#6B8F5E',
              border: `0.5px solid ${on ? '#2D5016' : '#D4DDD0'}`,
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
