import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import useResource from '../hooks/useResource';
import { integrated } from '../services/api';
import {
  Card,
  Field,
  Notice,
  PageHeading,
  RecordLink,
  ResourceState,
} from '../components/ui';
import { formDefinitions } from './fields';
import { normalizeValues, validate } from '../utils/validation';

const noRecord = async () => null;
const noOptions = async () => ({});

function initialValues(definition, query) {
  const values = {};
  for (const field of definition.fields)
    values[field.name] = field.defaultValue || '';
  for (const name of ['owner_id', 'pet_id', 'visit_id']) {
    if (query.get(name) && name in values) values[name] = query.get(name);
  }
  return values;
}
function editValues(data, fields) {
  const values = {};
  for (const field of fields)
    values[field.name] = data[field.name] ?? field.defaultValue ?? '';
  for (const key of ['allergies', 'chronic_conditions', 'procedures']) {
    if (data.critical?.[key]) {
      values[`${key}_state`] = data.critical[key].state;
      values[key] = data.critical[key].text || '';
    }
  }
  if (data.occurred_at) {
    const date = new Date(data.occurred_at);
    if (!Number.isNaN(date.getTime())) {
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      values.occurred_at = local.toISOString().slice(0, 16);
    }
  }
  return values;
}

export default function RecordForm({ kind, publicForm = false }) {
  const definition = formDefinitions[kind];
  const { id } = useParams();
  const [query] = useSearchParams();
  const { api, preview, prefix } = useWorkspace();
  const auth = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(() => initialValues(definition, query));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [valid, setValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const summary = useRef(null);
  const resource = useResource(
    id && definition.loader ? api[definition.loader] : noRecord,
    id,
  );
  const options = useResource(
    definition.fields.some((field) => field.source) ? api.options : noOptions,
  );
  useEffect(() => {
    if (resource.data) setValues(editValues(resource.data, definition.fields));
  }, [resource.data, definition.fields]);
  const allowed =
    publicForm ||
    (id
      ? resource.data?.permissions?.update === true
      : auth?.permissions?.[`${definition.capability}_create`] === true);
  const canSave =
    integrated[definition.capability] &&
    allowed &&
    !preview &&
    (!id || Boolean(resource.data)) &&
    !options.loading &&
    !options.error;
  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setMessage('');
    setValid(false);
  }
  function check() {
    const nextErrors = validate(definition.fields, values);
    for (const field of definition.fields) {
      const choices = field.options || options.data?.[field.source];
      if (
        field.type === 'select' &&
        values[field.name] &&
        choices &&
        !choices.some(
          (item) =>
            String(item.value ?? item.id) === String(values[field.name]),
        )
      )
        nextErrors[field.name] = 'Select an authorized option.';
    }
    setErrors(nextErrors);
    const result = Object.keys(nextErrors).length === 0;
    setValid(result);
    setMessage('');
    if (!result) setTimeout(() => summary.current?.focus(), 0);
    return result;
  }
  async function submit(event) {
    event.preventDefault();
    if (!check()) return;
    if (!canSave) {
      setMessage(
        'Nothing was saved. Backend integration or permission is required.',
      );
      return;
    }
    setSaving(true);
    try {
      const payload = normalizeValues(values, definition.fields);
      if (kind === 'reset') payload.token = query.get('token');
      const result = await api[definition.saver](payload, id);
      if (publicForm) {
        if (result.confirmed !== true)
          throw new Error('Django did not confirm this operation.');
        setMessage(
          kind === 'recovery'
            ? 'If this account is eligible, check your email for a reset link.'
            : 'Django confirmed the request. You can return to sign in.',
        );
      } else {
        if (!result.id)
          throw new Error(
            'The backend did not return a saved record. No save was confirmed.',
          );
        navigate(`${prefix}${definition.detailPath}${result.id}`, {
          state: { saved: true },
        });
      }
    } catch (error) {
      setMessage(error.message);
      const fieldErrors = {};
      for (const [name, messages] of Object.entries(error.errors || {})) {
        fieldErrors[name] = Array.isArray(messages)
          ? messages.map((item) => item.message || item).join(' ')
          : String(messages);
      }
      setErrors(fieldErrors);
    } finally {
      setSaving(false);
    }
  }
  const heading = publicForm
    ? definition.title
    : `${id ? 'Edit' : 'Create'} ${definition.title}`;
  return (
    <>
      {!publicForm && (
        <PageHeading
          title={heading}
          description="Required fields are marked with an asterisk. Optional medical information can remain unrecorded."
        />
      )}
      {(!integrated[definition.capability] || preview) && (
        <Notice>
          <strong>Backend integration pending.</strong>{' '}
          {preview ? 'Sample preview is read-only. ' : ''}Saving{' '}
          {definition.title.toLowerCase()} is unavailable until its backend
          contract and permissions are ready. Check form validates your inputs
          only.
        </Notice>
      )}
      {kind === 'registration' && (
        <p className="muted">
          For veterinary providers and approved clinic staff. Pet owner profiles
          do not receive accounts in this MVP.
        </p>
      )}
      {kind === 'reset' && (
        <Notice danger>
          {query.get('token')
            ? 'Reset link validity and expiration cannot be verified until the Django reset integration is connected.'
            : 'This reset link is missing its token. Open the full link from your recovery email.'}
        </Notice>
      )}
      {!publicForm && <ResourceState resource={resource} />}
      <ResourceState resource={options} />
      {!publicForm && !allowed && integrated[definition.capability] && (
        <Notice>You do not have permission to save this record.</Notice>
      )}
      <Card>
        <form noValidate onSubmit={submit}>
          {Object.values(errors).some(Boolean) && (
            <div
              role="alert"
              className="error-summary"
              tabIndex={-1}
              ref={summary}
            >
              Please correct the highlighted fields. Your other entries are
              still here.
            </div>
          )}
          {message && (
            <Notice
              danger={
                !publicForm ||
                (!message.startsWith('If this') &&
                  !message.startsWith('Django confirmed'))
              }
            >
              {message}
            </Notice>
          )}
          {valid && (
            <p role="status" className="validation-success">
              Inputs passed the frontend checks. Nothing has been saved.
            </p>
          )}
          <div className="form-grid">
            {definition.fields.map((field) => (
              <Field
                key={field.name}
                field={{
                  ...field,
                  disabled:
                    field.source && !options.data?.[field.source]?.length,
                }}
                value={values[field.name]}
                error={errors[field.name]}
                onChange={update}
                options={field.options || options.data?.[field.source] || []}
              />
            ))}
          </div>
          <div className="form-actions">
            <button type="button" className="button secondary" onClick={check}>
              Check form
            </button>
            <button
              type="submit"
              className="button"
              disabled={
                !canSave || saving || (kind === 'reset' && !query.get('token'))
              }
            >
              {saving
                ? 'Saving…'
                : publicForm
                  ? kind === 'recovery'
                    ? 'Send reset link'
                    : kind === 'reset'
                      ? 'Reset password'
                      : 'Register'
                  : 'Save record'}
            </button>
            {!publicForm && (
              <RecordLink
                to={id ? `${definition.detailPath}${id}` : '/'}
                className="text-link"
              >
                Cancel
              </RecordLink>
            )}
          </div>
        </form>
      </Card>
    </>
  );
}
