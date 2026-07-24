import { useState } from 'react';

// A plain <input type="number"> bound directly to a numeric value re-parses
// the DOM's text on every keystroke and writes the result straight back as
// the controlled `value`. Whenever that round-trip doesn't change the
// number (e.g. clearing a field showing "0" re-parses to the same 0, or a
// stray leading zero doesn't change what Number() sees), React sees an
// unchanged prop and skips resyncing the DOM - so the field silently drifts
// from what's actually stored (you can no longer clear it, digits pile up
// in front of a "stuck" leading zero, etc). Tracking the literal typed text
// in local state while focused sidesteps this: the display always mirrors
// what was typed, and only well-formed numbers are ever pushed upstream.
export default function NumberInput({ value, onChange, step = 'any', className, emptyValue = 0, placeholder }) {
  const [draft, setDraft] = useState(null); // null = not currently being edited

  const displayValue = draft !== null ? draft : (value ?? '');

  function handleChange(e) {
    const text = e.target.value;
    setDraft(text);
    if (text === '' || text === '-' || text.endsWith('.')) return; // still mid-edit, nothing valid to commit yet
    const parsed = Number(text);
    if (!Number.isNaN(parsed)) onChange(parsed);
  }

  function handleFocus() {
    setDraft(value == null ? '' : String(value));
  }

  function handleBlur() {
    if (draft === '' || draft === '-') onChange(emptyValue);
    setDraft(null);
  }

  return (
    <input
      type="number"
      step={step}
      placeholder={placeholder}
      className={className}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
