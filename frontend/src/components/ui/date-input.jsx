import { useState, useEffect } from 'react';

// Native <input type="date"> displays in the browser/OS locale format (often
// MM/DD/YYYY), which we can't override via HTML/CSS. This is a plain text
// input that always displays and accepts DD/MM/YYYY, regardless of the
// viewer's locale, while still calling onChange with a plain ISO YYYY-MM-DD
// string so every existing consumer (state, API calls) is unaffected.
const toDisplay = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export default function DateInput({ value, onChange, min, max, className, disabled, required, id, name, ...props }) {
  const [text, setText] = useState(toDisplay(value));

  useEffect(() => { setText(toDisplay(value)); }, [value]);

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setText(formatted);

    if (digits.length !== 8) {
      onChange('');
      return;
    }
    const day = digits.slice(0, 2), month = digits.slice(2, 4), year = digits.slice(4, 8);
    const iso = `${year}-${month}-${day}`;
    const parsed = new Date(`${iso}T00:00:00`);
    const isValid = !isNaN(parsed.getTime()) && parsed.getDate() === parseInt(day, 10) && (parsed.getMonth() + 1) === parseInt(month, 10);
    if (isValid && (!min || iso >= min) && (!max || iso <= max)) onChange(iso);
    else onChange('');
  };

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      placeholder="DD/MM/YYYY"
      maxLength={10}
      value={text}
      onChange={handleChange}
      className={className}
      disabled={disabled}
      required={required}
      {...props}
    />
  );
}
