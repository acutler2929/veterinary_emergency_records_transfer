import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import useResource from '../hooks/useResource';
import {
  Card,
  DateValue,
  EmptyState,
  Icon,
  PageHeading,
  RecordLink,
  ResourceState,
  Search,
} from '../components/ui';

export default function Dashboard() {
  const { api, preview } = useWorkspace();
  const auth = useAuth();
  const resource = useResource(api.dashboard);
  const [query, setQuery] = useState('');
  const data = resource.data;
  const patients = data?.patients || [];
  const matches = patients.filter((pet) =>
    `${pet.name} ${pet.owner_name} ${pet.microchip_id || ''}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const owners = (data?.owners || []).filter((owner) =>
    `${owner.name} ${owner.email || ''} ${owner.phone || ''}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="Care workspace"
        title={`Welcome, ${preview ? 'sample provider' : auth?.user?.name || 'provider'}`}
        description="Find a patient. Review the history. Keep care moving."
      >
        <RecordLink className="button" to="/visits/new">
          <Icon name="plus" />
          Create visit
        </RecordLink>
      </PageHeading>
      <section className="dashboard-banner">
        <div>
          <p className="eyebrow">EVERY PATIENT. A CLEARER PICTURE.</p>
          <h2>
            Your next visit starts
            <br />
            with the record.
          </h2>
          <p>
            Find owner profiles and critical medical information
            <br className="desktop-break" /> from one consistent workspace.
          </p>
        </div>
        <div className="banner-art" aria-hidden="true">
          <span>
            <Icon name="pets" size={64} />
          </span>
          <i className="art-cross">+</i>
        </div>
      </section>
      <ResourceState resource={resource} />
      <div className="stat-grid">
        {[
          ['Current patients', patients.length, 'pets'],
          ['Upcoming visits', data?.upcoming_visits?.length, 'visits'],
          ['Recent records', data?.recent_records?.length, 'owners'],
        ].map(([label, count, icon]) => (
          <div className="stat-card" key={label}>
            <span className="stat-icon">
              <Icon name={icon} />
            </span>
            <div>
              <span className="stat-value">{data ? (count ?? 0) : '—'}</span>
              <p>{label}</p>
              <small>
                {data
                  ? preview
                    ? 'Sample data'
                    : 'Authorized records'
                  : 'Awaiting backend data'}
              </small>
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="stack">
          <Card
            title="Patient & owner lookup"
            action={
              <RecordLink to="/pets" className="text-link">
                All records <Icon name="arrow" size={16} />
              </RecordLink>
            }
          >
            <Search
              value={query}
              onChange={setQuery}
              label="Search loaded pets, owners, or microchip IDs"
            />
            {!data ? (
              <EmptyState title="Your patients will appear here">
                Record lookup is awaiting the authorized Django API.
              </EmptyState>
            ) : matches.length === 0 && owners.length === 0 ? (
              <EmptyState title="No matching profiles">
                Try another name, or create an owner profile.
              </EmptyState>
            ) : (
              <div className="record-list">
                {matches.map((pet) => (
                  <RecordLink
                    key={pet.id}
                    to={`/pets/${pet.id}`}
                    className="patient-row"
                  >
                    <span className="patient-avatar">
                      <Icon name="pets" size={23} />
                    </span>
                    <div>
                      <strong>{pet.name}</strong>
                      <p>
                        {pet.species} · {pet.breed || 'Breed not recorded'}
                      </p>
                    </div>
                    <span className="row-owner">{pet.owner_name}</span>
                    <Icon name="arrow" size={16} />
                  </RecordLink>
                ))}
                {query &&
                  owners.map((owner) => (
                    <RecordLink
                      key={owner.id}
                      to={`/owners/${owner.id}`}
                      className="patient-row"
                    >
                      <Icon name="owners" />
                      <div>
                        <strong>{owner.name}</strong>
                        <p>
                          Owner profile · {owner.email || 'Email not recorded'}
                        </p>
                      </div>
                      <Icon name="arrow" size={16} />
                    </RecordLink>
                  ))}
              </div>
            )}
            <p className="table-note">
              Search covers loaded authorized records. Server search and
              pagination are pending.
            </p>
          </Card>
          <Card title="Recent patient records">
            {data?.recent_records?.length ? (
              <div className="record-list">
                {data.recent_records.map((pet) => (
                  <RecordLink
                    to={`/pets/${pet.id}`}
                    key={pet.id}
                    className="list-row"
                  >
                    <strong>{pet.name}</strong>
                    <span>
                      Review record <Icon name="arrow" size={16} />
                    </span>
                  </RecordLink>
                ))}
              </div>
            ) : (
              <EmptyState title="No recent records available">
                Recent activity will appear when the backend supplies it.
              </EmptyState>
            )}
          </Card>
        </div>
        <div className="stack">
          <Card
            title="Upcoming visits"
            action={
              <RecordLink to="/visits" className="text-link">
                View all
              </RecordLink>
            }
          >
            {data?.upcoming_visits?.length ? (
              data.upcoming_visits.map((visit) => (
                <RecordLink
                  to={`/visits/${visit.id}`}
                  className="visit-card"
                  key={visit.id}
                >
                  <span className="badge">{visit.status}</span>
                  <h3>{visit.pet_name}</h3>
                  <p>
                    <DateValue value={visit.occurred_at} />
                  </p>
                  <small>{visit.clinician_name}</small>
                </RecordLink>
              ))
            ) : (
              <EmptyState title="No upcoming visits available">
                Upcoming visit data is not loaded.
              </EmptyState>
            )}
          </Card>
          <Card title="Quick actions">
            <div className="quick-actions">
              {[
                [
                  '/owners/new',
                  'owners',
                  'Create owner',
                  'Start with a contact profile',
                ],
                [
                  '/pets/new',
                  'pets',
                  'Create pet',
                  'Associate a pet with an owner',
                ],
                [
                  '/visits/new',
                  'visits',
                  'Create visit',
                  'Open a clinical encounter',
                ],
                [
                  '/clinics',
                  'clinics',
                  'Clinic information',
                  'Find clinic contact details',
                ],
              ].map(([to, icon, title, text]) => (
                <RecordLink to={to} key={to}>
                  <Icon name={icon} />
                  <div>
                    <strong>{title}</strong>
                    <small>{text}</small>
                  </div>
                  <Icon name="arrow" size={16} />
                </RecordLink>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
