import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';
import { WorkspaceContext } from '../context/WorkspaceContext';
import { integrated } from '../services/api';
import RecordForm from '../forms/RecordForm';

afterEach(() => {
  integrated.owners = false;
});
function setup(api, permissions = { owners_create: true }) {
  integrated.owners = true;
  render(
    <MemoryRouter initialEntries={['/owners/new']}>
      <AuthContext.Provider value={{ permissions }}>
        <WorkspaceContext.Provider value={{ api, prefix: '', preview: false }}>
          <Routes>
            <Route path="owners/new" element={<RecordForm kind="owner" />} />
            <Route path="owners/:id" element={<p>Saved owner detail</p>} />
          </Routes>
        </WorkspaceContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}
describe('future integration confirmation boundary with test-only service doubles', () => {
  it('navigates only after an actual saved-record response from the service', async () => {
    const user = userEvent.setup();
    const saveOwner = vi.fn().mockResolvedValue({ id: 42 });
    setup({ saveOwner });
    await user.type(screen.getByLabelText(/Owner name/), 'Jamie');
    await user.click(screen.getByRole('button', { name: 'Save record' }));
    expect(await screen.findByText('Saved owner detail')).toBeInTheDocument();
    expect(saveOwner).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Jamie', email: null }),
      undefined,
    );
  });
  it('preserves input on a server field error and does not navigate', async () => {
    const user = userEvent.setup();
    const error = new Error('Validation failed');
    error.errors = { email: ['Email could not be accepted.'] };
    setup({ saveOwner: vi.fn().mockRejectedValue(error) });
    await user.type(screen.getByLabelText(/Owner name/), 'Jamie');
    await user.click(screen.getByRole('button', { name: 'Save record' }));
    expect(
      await screen.findByText('Email could not be accepted.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Owner name/)).toHaveValue('Jamie');
    expect(screen.queryByText('Saved owner detail')).not.toBeInTheDocument();
  });
  it('rejects an unconfirmed response', async () => {
    const user = userEvent.setup();
    setup({ saveOwner: vi.fn().mockResolvedValue({}) });
    await user.type(screen.getByLabelText(/Owner name/), 'Jamie');
    await user.click(screen.getByRole('button', { name: 'Save record' }));
    expect(
      await screen.findByText(/No save was confirmed/),
    ).toBeInTheDocument();
  });
  it('denies saves even when integrated if permission is missing', async () => {
    const saveOwner = vi.fn();
    setup({ saveOwner }, {});
    expect(
      await screen.findByRole('button', { name: 'Save record' }),
    ).toBeDisabled();
    expect(saveOwner).not.toHaveBeenCalled();
  });
});
