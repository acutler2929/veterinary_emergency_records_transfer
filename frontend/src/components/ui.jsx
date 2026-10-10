import { Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';

const paths = {
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  owners:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  pets: 'M12 21c-6 0-8-5-4-8l4-3 4 3c4 3 2 8-4 8M5 8a2 3 0 1 0 0-6 2 3 0 0 0 0 6M19 8a2 3 0 1 0 0-6 2 3 0 0 0 0 6M9 7V4M15 7V4',
  visits:
    'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',
  clinics: 'M4 22V4h16v18M9 22v-6h6v6M9 8h6M12 5v6',
  search: 'M21 21l-6-6M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  alert: 'M12 3L2 21h20L12 3M12 9v5M12 17v1',
  account: 'M20 21v-2a7 7 0 0 0-14 0v2M13 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  menu: 'M3 6h18M3 12h18M3 18h18',
  shield: 'M12 2l8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4M8 12l3 3 5-6',
};
export function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.pets} />
    </svg>
  );
}
export function RecordLink({ to, children, ...props }) {
  const { prefix } = useWorkspace();
  return (
    <Link to={`${prefix}${to}`} {...props}>
      {children}
    </Link>
  );
}
export function PageHeading({
  eyebrow = 'Provider workspace',
  title,
  description,
  children,
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      <div className="actions">{children}</div>
    </header>
  );
}
export function Card({ title, children, action, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card-heading">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Notice({ children, danger = false }) {
  return (
    <div
      className={`notice ${danger ? 'danger' : ''}`}
      role={danger ? 'alert' : 'status'}
    >
      <Icon name={danger ? 'alert' : 'shield'} />
      <div>{children}</div>
    </div>
  );
}
export function EmptyState({ title, children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name="pets" size={28} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function ResourceState({ resource }) {
  if (resource.loading)
    return (
      <p className="loading" role="status">
        Loading records…
      </p>
    );
  if (!resource.error) return null;
  return (
    <Notice danger={!resource.error.pending}>
      {resource.error.message}
      {!resource.error.pending && (
        <button className="button small secondary" onClick={resource.retry}>
          Try again
        </button>
      )}
    </Notice>
  );
}
export function Field({ field, value, error, onChange, options = [] }) {
  const { name, label, type = 'text', required, hint } = field;
  const props = {
    id: name,
    name,
    required,
    value: value ?? '',
    onChange: (event) => onChange(name, event.target.value),
    'aria-invalid': Boolean(error),
    'aria-describedby': `${name}-help${error ? ` ${name}-error` : ''}`,
  };
  return (
    <div className={`field ${field.wide ? 'wide' : ''}`}>
      <label htmlFor={name}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {type === 'textarea' ? (
        <textarea {...props} rows={4} />
      ) : type === 'select' ? (
        <select {...props} disabled={field.disabled}>
          <option value="">
            {field.disabled
              ? 'Backend choices unavailable'
              : field.placeholder || 'Select an option'}
          </option>
          {value &&
            !options.some(
              (item) => String(item.value ?? item.id) === String(value),
            ) && (
              <option value={value} disabled>
                {value} (recorded value; choices pending)
              </option>
            )}
          {options.map((item) => (
            <option key={item.value ?? item.id} value={item.value ?? item.id}>
              {item.label ?? item.name}
            </option>
          ))}
        </select>
      ) : type === 'file' ? (
        <input
          id={name}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => onChange(name, event.target.files[0] || null)}
          aria-describedby={`${name}-help${error ? ` ${name}-error` : ''}`}
          aria-invalid={Boolean(error)}
        />
      ) : (
        <input
          {...props}
          type={type}
          autoComplete={field.autoComplete}
          min={field.min}
          max={field.max}
          step={field.step}
        />
      )}
      <small id={`${name}-help`}>
        {hint || (required ? 'Required' : 'Optional')}
      </small>
      {error && (
        <p id={`${name}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function Value({ children }) {
  return children === null || children === undefined || children === ''
    ? 'Not recorded'
    : children;
}
export function Search({ value, onChange, label }) {
  return (
    <div className="search-field">
      <Icon name="search" />
      <label className="sr-only" htmlFor="record-search">
        {label}
      </label>
      <input
        id="record-search"
        type="search"
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
export function DateValue({ value }) {
  if (!value) return 'Not recorded';
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    ...(value.length > 10 ? { timeStyle: 'short' } : {}),
  });
}
