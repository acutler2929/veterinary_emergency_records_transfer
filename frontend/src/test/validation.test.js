import { describe, expect, it } from 'vitest';
import { formDefinitions } from '../forms/fields';
import { normalizeValues, validate } from '../utils/validation';

describe('record input integrity', () => {
  it('requires identity and validates email without changing input', () => {
    const values = { name: '  ', email: 'invalid', phone: '555-0100' };
    expect(validate(formDefinitions.owner.fields, values)).toMatchObject({
      name: 'Owner name is required.',
      email: 'Enter a valid email address.',
    });
    expect(values.phone).toBe('555-0100');
  });
  it.each(['-1', 'NaN', 'Infinity'])('rejects invalid weight %s', (weight) => {
    expect(
      validate(formDefinitions.pet.fields, { weight_lbs: weight }).weight_lbs,
    ).toBeDefined();
  });
  it('accepts zero and leaves optional weight unknown', () => {
    expect(
      validate(formDefinitions.pet.fields, { weight_lbs: '0' }).weight_lbs,
    ).toBeUndefined();
    expect(
      normalizeValues({ weight_lbs: '' }, [
        { name: 'weight_lbs', type: 'number' },
      ]),
    ).toEqual({ weight_lbs: null });
  });
  it.each(['2026-02-30', '3000-01-01', 'not-a-date'])(
    'rejects impossible or future birth date %s',
    (date) => {
      expect(
        validate(formDefinitions.pet.fields, { date_of_birth: date })
          .date_of_birth,
      ).toBeDefined();
    },
  );
  it('checks confirmation without trimming passwords', () => {
    expect(
      validate(formDefinitions.registration.fields, {
        password: 'abc ',
        confirm_password: 'abc',
      }).confirm_password,
    ).toBe('Passwords must match.');
  });
  it('requires descriptions for recorded medical findings', () => {
    expect(
      validate(formDefinitions.pet.fields, {
        allergies_state: 'recorded',
        allergies: '  ',
      }).allergies,
    ).toBeDefined();
    const result = normalizeValues(
      {
        allergies_state: 'unknown',
        allergies: 'old input',
        chronic_conditions_state: 'absent',
        procedures_state: 'recorded',
        procedures: 'Surgery',
      },
      formDefinitions.pet.fields,
    );
    expect(result.critical).toEqual({
      allergies: { state: 'unknown', text: null },
      chronic_conditions: { state: 'absent', text: null },
      procedures: { state: 'recorded', text: 'Surgery' },
    });
  });
  it('requires visit relationships and rejects unsupported image types', () => {
    const errors = validate(formDefinitions.visit.fields, {});
    expect(errors).toHaveProperty('pet_id');
    expect(errors).toHaveProperty('clinic_id');
    expect(errors).toHaveProperty('clinician_id');
    expect(errors).toHaveProperty('status');
    expect(
      validate(formDefinitions.pet.fields, { photo: { type: 'image/svg+xml' } })
        .photo,
    ).toBeDefined();
  });
});
