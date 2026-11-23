/**
 * Dropdown with a checkbox per option; pick any number of them.
 *
 * Props:
 *  - options:     the standard choices, in display order
 *  - value:       array of picked options
 *  - onChange:    (newArray) => void; the array keeps the dropdown order
 *  - placeholder: text shown when nothing is picked
 *  - swatch:      show a small color dot next to each option (for colors)
 *
 * A picked value that is not in `options` (e.g. from an older product) is
 * still listed and stays picked, so saving never drops it silently.
 */
const MultiSelectDropdown = ({ options, value, onChange, placeholder, swatch = false }) => {
  const allOptions = [...options, ...value.filter((v) => !options.includes(v))];

  const toggle = (option) => {
    const picked = value.includes(option)
      ? value.filter((v) => v !== option)
      : [...value, option];
    onChange(allOptions.filter((o) => picked.includes(o)));
  };

  return (
    <div className="dropdown select-has-icon">
      <button
        type="button"
        className="common-input border text-start text-truncate pe-5"
        data-bs-toggle="dropdown"
        data-bs-auto-close="outside"
        aria-expanded="false"
      >
        <span className={value.length ? "" : "text-secondary"}>
          {value.length ? value.join(", ") : placeholder}
        </span>
      </button>
      <ul className="dropdown-menu w-100 p-2" style={{ maxHeight: 260, overflowY: "auto" }}>
        {allOptions.map((option) => (
          <li key={option}>
            <label className="dropdown-item d-flex align-items-center gap-2 rounded">
              <input
                type="checkbox"
                className="form-check-input m-0"
                checked={value.includes(option)}
                onChange={() => toggle(option)}
              />
              {swatch && (
                <span
                  className="rounded-circle border d-inline-block flex-shrink-0"
                  style={{ width: 14, height: 14, background: option.toLowerCase() }}
                />
              )}
              {option}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MultiSelectDropdown;
