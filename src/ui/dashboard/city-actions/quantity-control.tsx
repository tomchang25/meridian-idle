type QuantityControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

function boundedWholeNumber(value: number, min: number, max: number): number {
  if (!Number.isSafeInteger(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function QuantityControl({ label, value, min, max, disabled = false, onChange }: QuantityControlProps) {
  const setValue = (nextValue: number) => onChange(boundedWholeNumber(nextValue, min, max));
  const changeFromInput = (rawValue: string) => setValue(Number(rawValue));

  return (
    <div className={styles.quantityControl}>
      <button
        type="button"
        disabled={disabled || value <= min}
        aria-label={`Decrease ${label} by 10`}
        onClick={() => setValue(value - 10)}
      >
        -10
      </button>
      <button
        type="button"
        disabled={disabled || value <= min}
        aria-label={`Decrease ${label} by 1`}
        onClick={() => setValue(value - 1)}
      >
        -1
      </button>
      <input
        aria-label={`${label} range`}
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        disabled={disabled}
        onChange={(event) => changeFromInput(event.currentTarget.value)}
      />
      <input
        aria-label={label}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step="1"
        value={value}
        disabled={disabled}
        onChange={(event) => changeFromInput(event.currentTarget.value)}
      />
      <button
        type="button"
        disabled={disabled || value >= max}
        aria-label={`Increase ${label} by 1`}
        onClick={() => setValue(value + 1)}
      >
        +1
      </button>
      <button
        type="button"
        disabled={disabled || value >= max}
        aria-label={`Increase ${label} by 10`}
        onClick={() => setValue(value + 10)}
      >
        +10
      </button>
    </div>
  );
}
import styles from "../meridian-dashboard.module.css";
