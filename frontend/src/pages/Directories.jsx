import { useState } from 'react';
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
  Value,
} from '../components/ui';

const directories = {
  owners: {
    title: 'Pet owners',
    description: 'Contact profiles maintained by your veterinary team.',
    singular: 'owner',
    create: '/owners/new',
    headers: ['Owner', 'Contact', 'Owner ID', ''],
    empty: 'No owner profiles available',
  },
  pets: {
    title: 'Pet records',
    description: 'Find an authorized patient and open the medical record.',
    singular: 'pet',
    create: '/pets/new',
    headers: ['Patient', 'Owner', 'Species / breed', ''],
    empty: 'No pet records available',
  },
  visits: {
    title: 'Visits',
    description: 'Upcoming encounters and clinical documentation.',
    singular: 'visit',
    create: '/visits/new',
    headers: ['Patient', 'Date / time', 'Status', ''],
    empty: 'No visits available',
  },
  clinics: {
    title: 'Veterinary clinics',
    description: 'Authorized clinic information and contact details.',
    headers: ['Clinic', 'Address', 'Phone', ''],
    empty: 'No clinics available',
  },
};

export default function Directory({ kind }) {
  const { api } = useWorkspace();
  const definition = directories[kind];
  const resource = useResource(api[kind]);
  const [query, setQuery] = useState('');
  const rows = (resource.data || []).filter((item) =>
    [
      item.name,
      item.pet_name,
      item.owner_name,
      item.email,
      item.phone,
      item.id,
      item.microchip_id,
      item.address,
    ]
      .join(' ')
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  function cells(item) {
    if (kind === 'owners')
      return (
        <>
          <td>
            <strong>{item.name}</strong>
          </td>
          <td>
            <div>
              <Value>{item.email}</Value>
            </div>
            <small>
              <Value>{item.phone}</Value>
            </small>
          </td>
          <td>{item.id}</td>
        </>
      );
    if (kind === 'pets')
      return (
        <>
          <td>
            <strong>{item.name}</strong>
          </td>
          <td>
            <Value>{item.owner_name}</Value>
          </td>
          <td>
            <Value>{item.species}</Value>
            <small>
              <Value>{item.breed}</Value>
            </small>
          </td>
        </>
      );
    if (kind === 'visits')
      return (
        <>
          <td>
            <strong>
              <Value>{item.pet_name}</Value>
            </strong>
          </td>
          <td>
            <DateValue value={item.occurred_at} />
          </td>
          <td>
            <span className="badge">
              <Value>{item.status}</Value>
            </span>
          </td>
        </>
      );
    return (
      <>
        <td>
          <strong>{item.name}</strong>
          <small>Clinic ID: {item.id}</small>
        </td>
        <td>
          <Value>{item.address}</Value>
        </td>
        <td>
          <Value>{item.phone}</Value>
        </td>
      </>
    );
  }
  return (
    <>
      <PageHeading
        title={definition.title}
        description={definition.description}
      >
        {definition.create && (
          <RecordLink className="button" to={definition.create}>
            <Icon name="plus" />
            Create {definition.singular}
          </RecordLink>
        )}
      </PageHeading>
      <ResourceState resource={resource} />
      <Card>
        <Search
          value={query}
          onChange={setQuery}
          label={`Search loaded ${definition.title.toLowerCase()}`}
        />
        {rows.length ? (
          <div className="table-wrap">
            <table>
              <caption className="sr-only">{definition.title}</caption>
              <thead>
                <tr>
                  {definition.headers.map((name, i) => (
                    <th key={i} scope="col">
                      {name || <span className="sr-only">Actions</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    {cells(item)}
                    <td>
                      <RecordLink
                        to={`/${kind}/${item.id}`}
                        className="text-link"
                      >
                        View{' '}
                        <span className="sr-only">
                          {item.name || item.pet_name}
                        </span>
                        <Icon name="arrow" size={16} />
                      </RecordLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={query ? 'No matching records' : definition.empty}>
            {resource.error?.pending
              ? 'The backend record service has not been connected.'
              : 'Try another search, or return when authorized records are available.'}
          </EmptyState>
        )}
        <p className="table-note">
          Search covers loaded authorized records. The backend must provide
          filtering and pagination for larger lists.
        </p>
      </Card>
    </>
  );
}
