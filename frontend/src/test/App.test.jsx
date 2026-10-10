import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';
import { AuthContext } from '../context/AuthContext';
import { recordsApi } from '../services/api';

function renderApp(path, auth = {}) {
  const value = {
    loading: false,
    user: { id: 1, name: 'Test provider', username: 'test' },
    permissions: {},
    loginLabel: 'Username',
    login: vi.fn(),
    logout: vi.fn(),
    ...auth,
  };
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthContext.Provider value={value}>
        <App />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
  return value;
}
describe('provider navigation and integration states', () => {
  it('keeps supplied active medications prominent even if the finding flag is missing', async () => {
    vi.spyOn(recordsApi, 'pet').mockResolvedValue({ id: 42, name: 'Test patient', medications: [{ id: 12, name: 'Recorded medicine', active: true }] });
    renderApp('/pets/42');
    await screen.findByRole('heading', { name: 'Test patient', level: 1 });
    const critical = screen.getByRole('heading', { name: 'Active medications' }).parentElement;
    expect(within(critical).getByText('Recorded medicine')).toBeInTheDocument();
    expect(within(critical).queryByText('Not recorded')).not.toBeInTheDocument();
  });
  it('redirects unauthenticated record requests to sign in', async () => {
    renderApp('/pets/42', { user: null });
    expect(
      await screen.findByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Critical Medical Information'),
    ).not.toBeInTheDocument();
  });
  it('keeps protected data hidden while checking the session', () => {
    renderApp('/', { loading: true, user: null });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Checking your Django session',
    );
  });
  it('validates login, handles auth failures, and never stores credentials', async () => {
    const user = userEvent.setup();
    const auth = renderApp('/login', {
      user: null,
      login: vi.fn().mockRejectedValue(new Error('Invalid credentials')),
    });
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(auth.login).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText(/Username/), 'provider');
    await user.type(screen.getByLabelText(/Password/), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(localStorage.length).toBe(0);
  });
  it('shows pending dashboard without fake counts', async () => {
    renderApp('/');
    expect(
      await screen.findByText(
        /Backend integration pending — loading the dashboard/,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(3);
  });
  it('keeps form input on failure and disables unsaved backend actions', async () => {
    const user = userEvent.setup();
    renderApp('/owners/new');
    await user.type(screen.getByLabelText(/Owner name/), 'Jamie');
    await user.type(screen.getByLabelText(/^Email/), 'broken');
    await user.click(screen.getByRole('button', { name: 'Check form' }));
    expect(
      await screen.findByText('Enter a valid email address.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Owner name/)).toHaveValue('Jamie');
    expect(screen.getByRole('button', { name: 'Save record' })).toBeDisabled();
    expect(
      screen.queryByText(/confirmed this record was saved/),
    ).not.toBeInTheDocument();
  });
  it('distinguishes unknown findings from confirmed absence', async () => {
    renderApp('/preview/pets/sample-pet', { user: null });
    expect(
      await screen.findByRole('heading', {
        name: 'Critical Medical Information',
      }),
    ).toBeInTheDocument();
    const chronic = screen.getByRole('heading', {
      name: 'Chronic conditions',
    }).parentElement;
    expect(within(chronic).getByText('Not recorded')).toBeInTheDocument();
    const procedures = screen.getByRole('heading', {
      name: 'Recent major procedures',
    }).parentElement;
    expect(
      within(procedures).getByText('Confirmed absence'),
    ).toBeInTheDocument();
    expect(screen.getByText('Sample preview · read-only.')).toBeInTheDocument();
  });
  it('navigates owner → pet → visit → medication in the separate sample preview', async () => {
    const user = userEvent.setup();
    renderApp('/preview/owners/sample-owner', { user: null });
    await user.click(await screen.findByRole('link', { name: /Mochi Dog/ }));
    await user.click(
      await screen.findByRole('link', { name: /Sample scheduled.*Oct/ }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Visit documentation' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Add medication' }));
    expect(
      await screen.findByRole('heading', { name: 'Create medication' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save record' })).toBeDisabled();
  });
  it('filters sample owner lists and shows empty search results', async () => {
    const user = userEvent.setup();
    renderApp('/preview/owners', { user: null });
    expect(
      await screen.findByRole('link', { name: 'View Alex Morgan' }),
    ).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), 'missing');
    expect(screen.getByText('No matching records')).toBeInTheDocument();
  });
  it('handles denied API reads and exposes retry', async () => {
    vi.spyOn(recordsApi, 'owners').mockRejectedValue(
      new Error('Access denied'),
    );
    renderApp('/owners');
    expect(await screen.findByText('Access denied')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
  });
  it('does not call the audit API without administrator permission', async () => {
    const audit = vi.spyOn(recordsApi, 'audit');
    renderApp('/audit');
    expect(
      screen.getByText(/Administrator permission is required/),
    ).toBeInTheDocument();
    await act(async () => {});
    expect(audit).not.toHaveBeenCalled();
  });
  it.each(['/register', '/forgot-password', '/reset-password'])(
    'public flow %s cannot claim an unconfirmed save',
    async (path) => {
      renderApp(path, { user: null });
      expect(
        await screen.findByText('Backend integration pending.'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: /Register|Send reset link|Reset password/,
        }),
      ).toBeDisabled();
    },
  );
  it.each([
    '/pets/new',
    '/visits/new',
    '/medications/new',
    '/owners/1/edit',
    '/pets/1/edit',
    '/visits/1/edit',
    '/medications/1/edit',
    '/clinics/1/edit',
  ])('form %s renders without an operational save', async (path) => {
    renderApp(path);
    expect(
      await screen.findByRole('button', { name: 'Save record' }),
    ).toBeDisabled();
  });
});
