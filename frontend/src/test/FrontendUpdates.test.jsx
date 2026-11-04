import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';
import { AuthContext } from '../context/AuthContext';
import { initialValues, editValues } from '../forms/RecordForm';
import { formDefinitions } from '../forms/fields';
import { integrated, recordsApi } from '../services/api';
import { normalizeValues, validate } from '../utils/validation';
import { lookupText, ownerLabel, petLabel, petOwner } from '../utils/labels';

function TestApp({ path = '/', user = { id: 1, name: 'Provider' }, permissions = {} }) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <AuthContext.Provider value={{ user, permissions, loading: false }}>
        <App />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}
const defaultOrder = ['Dashboard', 'Pet owners', 'Pet records', 'Visits', 'Veterinary clinics'];
const previewKey = 'vert:navigation:preview';
function menuLabels() {
  return within(screen.getByRole('navigation', { name: 'Main navigation' }))
    .getAllByRole('link').map((link) => link.textContent);
}

describe('shared branding and identification', () => {
  it('shares the full text logo across login and sidebar and uses the exact slogan', async () => {
    const view = render(<TestApp path="/login" user={null} />);
    const brandName = 'VERT Veterinary Emergency Record Transfer';
    expect(screen.getByRole('link', { name: brandName })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('heading', {
      name: 'Immediate remote access so your team can focus on the care ahead.',
    })).toBeInTheDocument();
    expect(screen.queryByText(/A clearer view of every patient/)).not.toBeInTheDocument();
    expect(document.querySelector('.brand-symbol')).toBeNull();
    view.unmount();
    render(<TestApp path="/preview/" user={null} />);
    expect(screen.getByRole('link', { name: brandName })).toHaveAttribute('href', '/preview/');
    await screen.findAllByText('Morgan, Mochi, 555-0104');
  });

  it('formats separate names and preserves legacy full names without guessing', () => {
    const owner = { id: 19, first_name: 'John', last_name: 'Smith', phone: '269-555-1234' };
    expect(ownerLabel(owner)).toBe('Smith, John, 269-555-1234');
    expect(petLabel({ name: 'Buddy' }, owner)).toBe('Smith, Buddy, 269-555-1234');
    expect(ownerLabel({ name: 'Mary Ann Smith' })).toBe('Mary Ann Smith');
    expect(petLabel({ name: 'Buddy', owner_name: 'Mary Ann Smith' }))
      .toBe('Mary Ann Smith, Buddy');
    expect(petLabel({ name: 'Buddy', owner_id: 19 }, petOwner({ owner_id: 19 }, [owner])))
      .toBe('Smith, Buddy, 269-555-1234');
    expect(lookupText({ ...owner, pets: [{ name: 'Buddy' }] })).toContain('buddy');
  });

  it('retains multiple pets under the owner and preselects the owner for Add pet', async () => {
    const user = userEvent.setup();
    render(<TestApp path="/preview/owners/sample-owner" user={null} />);
    await screen.findByRole('heading', { name: 'Morgan, Alex, 555-0104', level: 1 });
    expect(screen.getByRole('link', { name: /Morgan, Mochi, 555-0104 Dog/ }))
      .toHaveAttribute('href', '/preview/pets/sample-pet');
    expect(screen.getByRole('link', { name: /Morgan, Juniper, 555-0104 Cat/ }))
      .toHaveAttribute('href', '/preview/pets/sample-cat');
    await user.click(screen.getByRole('link', { name: 'Add pet' }));
    expect(await screen.findByLabelText(/^Owner/)).toHaveValue('sample-owner');
    expect(screen.getByRole('button', { name: 'Save record' })).toBeDisabled();
  });

  it.each([
    ['/preview/owners', 'Mochi', 'View Morgan, Alex, 555-0104'],
    ['/preview/pets', 'Alex', 'View Morgan, Mochi, 555-0104'],
    ['/preview/pets', '555-0104', 'View Morgan, Mochi, 555-0104'],
  ])('searches loaded relationship data at %s for %s', async (path, query, link) => {
    const user = userEvent.setup();
    render(<TestApp path={path} user={null} />);
    await screen.findByRole('link', { name: link });
    await user.type(screen.getByRole('searchbox'), query);
    expect(screen.getByRole('link', { name: link })).toBeInTheDocument();
  });

  it('joins dashboard owners by ID for phone and name lookup without denormalized pet fields', async () => {
    const user = userEvent.setup();
    vi.spyOn(recordsApi, 'dashboard').mockResolvedValue({
      patients: [{ id: 90, name: 'Buddy', owner_id: 19 }],
      owners: [{ id: 19, first_name: 'John', last_name: 'Smith', phone: '269-555-1234' }],
    });
    render(<TestApp />);
    await screen.findByRole('link', { name: /^Smith, Buddy, 269-555-1234/ });
    await user.type(screen.getByRole('searchbox'), '269-555-1234');
    expect(screen.getByRole('link', { name: /^Smith, Buddy, 269-555-1234/ })).toHaveAttribute('href', '/pets/90');
    expect(screen.getByRole('link', { name: /Smith, John, 269-555-1234/ })).toHaveAttribute('href', '/owners/19');
  });

  it('shows a legacy name intact when editing, with separate fields left empty', async () => {
    vi.spyOn(recordsApi, 'owner').mockResolvedValue({ id: 19, name: 'Mary Ann Smith' });
    render(<TestApp path="/owners/19/edit" />);
    await screen.findByText(/Existing owner name: Mary Ann Smith/);
    expect(screen.getByLabelText(/First name/)).toHaveValue('');
    expect(screen.getByLabelText(/Last name/)).toHaveValue('');
  });
});

describe('dog adoption and photograph handling', () => {
  const fields = formDefinitions.pet.fields;
  it('keeps checkbox initialization, edits, validation, and payloads boolean', () => {
    expect(initialValues(formDefinitions.pet, new URLSearchParams()).adopted).toBe(false);
    for (const species of ['Dog', 'dog', 'DOG', ' dOg ']) {
      for (const adopted of [true, false]) {
        const values = editValues({ species, adopted }, fields);
        expect(values.adopted).toBe(adopted);
        expect(validate(fields, values).adopted).toBeUndefined();
        expect(normalizeValues(values, fields).adopted).toBe(adopted);
      }
    }
    expect(editValues({ species: 'dog' }, fields).adopted).toBe(false);
    expect(editValues({ species: 'dog', adopted: 'false' }, fields).adopted).toBe(false);
    expect(editValues({ species: 'Cat', adopted: true }, fields).adopted).toBe(false);
    expect(normalizeValues({ species: 'Cat', adopted: true }, fields).adopted).toBe(false);
    expect(normalizeValues({ species: 'Dog', adopted: false }, fields).adopted).toBe(false);
    expect(validate(fields, { species: 'Dog', adopted: 'false' }).adopted).toBeDefined();
  });

  it('shows a checkbox only for dogs and clears it when changing species', async () => {
    const user = userEvent.setup();
    render(<TestApp path="/preview/pets/new" user={null} />);
    const species = await screen.findByLabelText(/^Species/);
    await screen.findByRole('option', { name: 'Dog' });
    expect(screen.queryByRole('checkbox', { name: 'Adopted' })).not.toBeInTheDocument();
    await user.selectOptions(species, 'Dog');
    await user.click(screen.getByRole('checkbox', { name: 'Adopted' }));
    expect(screen.getByRole('checkbox', { name: 'Adopted' })).toBeChecked();
    await user.selectOptions(species, 'Cat');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    await user.selectOptions(species, 'Dog');
    expect(screen.getByRole('checkbox', { name: 'Adopted' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Save record' })).toBeDisabled();
    expect(integrated.owners).toBe(false);
    expect(integrated.pets).toBe(false);
  });

  it('loads an existing adopted dog into the checkbox', async () => {
    render(<TestApp path="/preview/pets/sample-pet/edit" user={null} />);
    expect(await screen.findByRole('checkbox', { name: 'Adopted' })).toBeChecked();
  });

  it.each([
    [undefined, 'Not recorded'], [null, 'Not recorded'], [true, 'Yes'], [false, 'No'],
  ])('displays dog adoption %s as %s', async (adopted, expected) => {
    vi.spyOn(recordsApi, 'pet').mockResolvedValue({ id: 90, name: 'Buddy', species: 'dog', adopted });
    render(<TestApp path="/pets/90" />);
    const label = await screen.findByText('Adopted', { selector: 'dt' });
    expect(label.nextElementSibling).toHaveTextContent(expected);
  });

  it('keeps the top photo placeholder and hides adoption for cats', async () => {
    render(<TestApp path="/preview/pets/sample-cat" user={null} />);
    await screen.findByRole('heading', { name: /Juniper/, level: 1 });
    expect(screen.getByRole('img', { name: 'Pet photograph unavailable' }).closest('.patient-summary'))
      .toBeInTheDocument();
    expect(screen.queryByText('Adopted')).not.toBeInTheDocument();
  });

  it('replaces a failed photograph with the existing icon', async () => {
    vi.spyOn(recordsApi, 'pet').mockResolvedValue({ id: 90, name: 'Buddy', photo_url: '/missing-photo.png' });
    render(<TestApp path="/pets/90" />);
    const image = await screen.findByRole('img', { name: 'Buddy, patient photograph' });
    fireEvent.error(image);
    expect(screen.getByRole('img', { name: 'Pet photograph unavailable' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Buddy, patient photograph' })).not.toBeInTheDocument();
  });

  it.each(['//example.test/pet.png', '/\\example.test/pet.png', 'javascript:alert(1)', 'https://example.test/pet.png'])(
    'rejects unsafe photo URL %s', async (photo_url) => {
      vi.spyOn(recordsApi, 'pet').mockResolvedValue({ id: 90, name: 'Buddy', photo_url });
      render(<TestApp path="/pets/90" />);
      await screen.findByRole('heading', { name: /Buddy/, level: 1 });
      expect(document.querySelector('.pet-photo img')).toBeNull();
    },
  );
});

describe('browser navigation preferences', () => {
  it('uses defaults, reorders by drag without navigating, and restores after remount', async () => {
    const view = render(<TestApp path="/preview/" user={null} />);
    expect(menuLabels()).toEqual(defaultOrder);
    const transfer = { setData: vi.fn() };
    fireEvent.dragStart(screen.getByRole('button', { name: 'Drag Pet records to reorder' }), { dataTransfer: transfer });
    const target = screen.getByRole('link', { name: 'Dashboard', exact: true }).closest('.nav-item');
    fireEvent.dragOver(target, { dataTransfer: transfer });
    fireEvent.drop(target, { dataTransfer: transfer });
    expect(menuLabels()[0]).toBe('Pet records');
    expect(JSON.parse(localStorage.getItem(previewKey))).toEqual(['pets', 'dashboard', 'owners', 'visits', 'clinics']);
    await screen.findByRole('heading', { name: 'Welcome, sample provider' });
    view.unmount();
    render(<TestApp path="/preview/" user={null} />);
    expect(menuLabels()[0]).toBe('Pet records');
  });

  it('supports keyboard controls, separates users, and keeps preview preferences independent', async () => {
    const user = userEvent.setup();
    const view = render(<TestApp />);
    const up = screen.getByRole('button', { name: 'Move Pet records up' });
    up.focus();
    await user.keyboard('{Enter}');
    expect(menuLabels()).toEqual(['Dashboard', 'Pet records', 'Pet owners', 'Visits', 'Veterinary clinics']);
    expect(JSON.parse(localStorage.getItem('vert:navigation:user:1'))[1]).toBe('pets');
    expect(screen.getByRole('link', { name: 'Account', exact: true }).closest('nav')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Audit history' })).not.toBeInTheDocument();
    view.rerender(<TestApp user={{ id: 2, name: 'Other provider' }} permissions={{ audit_read: true }} />);
    expect(menuLabels()).toEqual(defaultOrder);
    expect(screen.getByRole('link', { name: 'Audit history' })).toHaveAttribute('href', '/audit');
    await user.click(screen.getByRole('button', { name: 'Move Visits up' }));
    expect(JSON.parse(localStorage.getItem('vert:navigation:user:2'))[2]).toBe('visits');
    view.rerender(<TestApp />);
    expect(menuLabels()[1]).toBe('Pet records');
    view.unmount();
    render(<TestApp path="/preview/" user={null} />);
    expect(menuLabels()).toEqual(defaultOrder);
    await screen.findByRole('heading', { name: 'Welcome, sample provider' });
  });

  it.each(['invalid json', '{}', '["removed","pets","pets"]'])(
    'handles invalid, removed, duplicate and newly added IDs: %s', async (saved) => {
      localStorage.setItem(previewKey, saved);
      render(<TestApp path="/preview/" user={null} />);
      const expected = saved.startsWith('[')
        ? ['Pet records', 'Dashboard', 'Pet owners', 'Visits', 'Veterinary clinics'] : defaultOrder;
      expect(menuLabels()).toEqual(expected);
      await screen.findByRole('heading', { name: 'Welcome, sample provider' });
    },
  );

  it('keeps reordering usable if browser storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
    const user = userEvent.setup();
    render(<TestApp path="/preview/" user={null} />);
    await user.click(screen.getByRole('button', { name: 'Move Pet records up' }));
    expect(menuLabels()[1]).toBe('Pet records');
    expect(screen.getByText(/Browser storage is unavailable/)).toBeInTheDocument();
    await screen.findByRole('heading', { name: 'Welcome, sample provider' });
  });
});
