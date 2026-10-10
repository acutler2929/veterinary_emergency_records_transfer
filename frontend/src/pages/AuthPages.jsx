import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Field, Icon, Notice } from '../components/ui';
import RecordForm from '../forms/RecordForm';
import { validate } from '../utils/validation';

function AuthLayout({ title, description, children }) {
  return (
    <div className="auth-shell">
      <section className="auth-story">
        <Link className="brand" to="/login">
          <span className="brand-symbol">
            <Icon name="pets" size={28} />
          </span>
          <span>
            VERT<small>Veterinary records</small>
          </span>
        </Link>
        <div className="auth-story-content">
          <p className="eyebrow">CONNECTED CARE STARTS HERE</p>
          <h1>
            The right record.
            <br />
            At the right moment.
          </h1>
          <p>
            A clearer view of every patient’s history, so your team can focus on
            the care ahead.
          </p>
          <div className="auth-feature">
            <Icon name="shield" />
            <div>
              Built for veterinary providers
              <small>
                Owner profiles, patient records, and clinical encounters in one
                workspace.
              </small>
            </div>
          </div>
        </div>
        <p className="auth-footnote">Veterinary Emergency Records Transfer</p>
      </section>
      <main className="auth-main">
        <div className="auth-form">
          <p className="eyebrow">PROVIDER ACCESS</p>
          <h2>{title}</h2>
          <p className="muted">{description}</p>
          {children}
        </div>
        <footer>VERT · Veterinary provider workspace</footer>
      </main>
    </div>
  );
}

export function Login() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ login: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [continueUrl, setContinueUrl] = useState('');
  const summary = useRef(null);
  const fields = [
    {
      name: 'login',
      label: auth.loginLabel,
      required: true,
      autoComplete: 'username',
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: true,
      autoComplete: 'current-password',
    },
  ];
  async function submit(event) {
    event.preventDefault();
    const nextErrors = validate(fields, values);
    setErrors(nextErrors);
    setError('');
    setContinueUrl('');
    if (Object.keys(nextErrors).length) {
      summary.current?.focus();
      return;
    }
    setBusy(true);
    try {
      await auth.login(values);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setContinueUrl(err.continueUrl || '');
    } finally {
      setBusy(false);
    }
  }
  if (auth.user) return <Navigate to="/" replace />;
  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your veterinary provider workspace."
    >
      {auth.error && <Notice danger>{auth.error}</Notice>}
      <form noValidate onSubmit={submit}>
        <div ref={summary} tabIndex={-1}>
          {Object.keys(errors).length > 0 && (
            <p role="alert" className="field-error">
              Enter your account identifier and password.
            </p>
          )}
        </div>
        {error && <Notice danger>{error}</Notice>}
        {continueUrl && (
          <p>
            <a href={continueUrl}>Continue sign-in through Django</a>
          </p>
        )}
        {fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            value={values[field.name]}
            error={errors[field.name]}
            onChange={(name, value) => setValues({ ...values, [name]: value })}
          />
        ))}
        <Link className="forgot-link" to="/forgot-password">
          Forgot password?
        </Link>
        <button
          className="button full"
          type="submit"
          disabled={busy || auth.loading}
        >
          {busy
            ? 'Signing in…'
            : auth.loading
              ? 'Checking session…'
              : 'Sign in'}
          <Icon name="arrow" />
        </button>
      </form>
      <p className="auth-switch">
        Joining a clinic? <Link to="/register">Provider registration</Link>
      </p>
      <div className="preview-link">
        <Link to="/preview/">
          Explore a read-only sample preview <Icon name="arrow" size={16} />
        </Link>
        <small>Fictional data · no login or saves</small>
      </div>
    </AuthLayout>
  );
}
export function Register() {
  return (
    <AuthLayout
      title="Provider registration"
      description="Enrollment requires an approved clinic association."
    >
      <RecordForm kind="registration" publicForm />
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
export function ForgotPassword() {
  return (
    <AuthLayout
      title="Forgot password?"
      description="Request an email link to recover your provider account."
    >
      <RecordForm kind="recovery" publicForm />
      <p>
        The existing Django recovery page is available when your backend is
        running: <a href="/accounts/password/reset/">Open account recovery</a>.
      </p>
      <p className="auth-switch">
        <Link to="/login">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
export function ResetPassword() {
  return (
    <AuthLayout
      title="Choose a new password"
      description="Recovery links must be single-use and expire."
    >
      <RecordForm kind="reset" publicForm />
      <p>
        <Link to="/forgot-password">Request a new recovery link</Link>
      </p>
    </AuthLayout>
  );
}
