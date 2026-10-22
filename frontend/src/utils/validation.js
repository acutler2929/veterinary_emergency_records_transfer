export function validate(fields, values) {
  const errors = {};
  for (const field of fields) {
    const value = values[field.name];
    const text = typeof value === 'string' ? value.trim() : value;
    if (
      field.required &&
      (text === '' || text === null || text === undefined)
    ) {
      errors[field.name] = `${field.label} is required.`;
      continue;
    }
    if (text === '' || text === null || text === undefined) continue;
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))
      errors[field.name] = 'Enter a valid email address.';
    if (
      field.type === 'number' &&
      (!Number.isFinite(Number(text)) || Number(text) < 0)
    )
      errors[field.name] = 'Enter a number of zero or greater.';
    if (field.name === 'confirm_password' && value !== values.password)
      errors[field.name] = 'Passwords must match.';
    if (field.type === 'date' || field.type === 'datetime-local') {
      const date = new Date(field.type === 'date' ? `${text}T12:00:00` : text);
      const parts = text.slice(0, 10).split('-').map(Number);
      if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== parts[0] ||
        date.getMonth() + 1 !== parts[1] ||
        date.getDate() !== parts[2]
      )
        errors[field.name] = 'Enter a valid date.';
      else if (field.name === 'date_of_birth' && date > new Date())
        errors[field.name] = 'Date of birth cannot be in the future.';
    }
    if (
      field.type === 'file' &&
      !['image/jpeg', 'image/png', 'image/webp'].includes(value.type)
    )
      errors[field.name] = 'Choose a JPEG, PNG, or WebP image.';
  }
  for (const key of ['allergies', 'chronic_conditions', 'procedures']) {
    if (values[`${key}_state`] === 'recorded' && !values[key]?.trim())
      errors[key] = 'Describe the recorded finding.';
  }
  return errors;
}

export function normalizeValues(values, fields) {
  const result = {};
  for (const field of fields) {
    let value = values[field.name];
    if (typeof value === 'string' && field.type !== 'password')
      value = value.trim();
    if (value === '' || value === undefined) value = null;
    if (field.type === 'number' && value !== null) value = Number(value);
    result[field.name] = value;
  }
  if (result.occurred_at)
    result.occurred_at = new Date(result.occurred_at).toISOString();
  if (fields.some((field) => field.name === 'allergies_state')) {
    result.critical = {};
    for (const key of ['allergies', 'chronic_conditions', 'procedures']) {
      result.critical[key] = {
        state: values[`${key}_state`] || 'unknown',
        text: values[`${key}_state`] === 'recorded' ? values[key].trim() : null,
      };
      delete result[key];
      delete result[`${key}_state`];
    }
  }
  return result;
}
