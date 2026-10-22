import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import useResource from '../hooks/useResource';
import {
  Card,
  DateValue,
  EmptyState,
  Notice,
  PageHeading,
  ResourceState,
  Value,
} from '../components/ui';

export function Account() {
  const auth = useAuth();
  const { preview } = useWorkspace();
  return (
    <>
      <PageHeading
        title="Your account"
        description="Provider identity and access information."
      />
      <Card title="Profile">
        <dl className="facts">
          <div>
            <dt>Name</dt>
            <dd>{preview ? 'Sample provider' : auth?.user?.name}</dd>
          </div>
          <div>
            <dt>Account identifier</dt>
            <dd>{preview ? 'Sample account' : auth?.user?.username}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <Value>
                {preview ? 'provider@example.test' : auth?.user?.email}
              </Value>
            </dd>
          </div>
        </dl>
        <Link to="/forgot-password" className="button secondary">
          Password recovery
        </Link>
      </Card>
      <Notice>
        Provider approval, clinic membership, and record permissions are pending
        backend integration. An authenticated account does not establish
        clinical access.
      </Notice>
    </>
  );
}
export function AuditHistory() {
  const auth = useAuth();
  const { api } = useWorkspace();
  if (!auth?.permissions?.audit_read)
    return (
      <>
        <PageHeading title="Audit history" />
        <Notice danger>
          Administrator permission is required to review audit history.
        </Notice>
      </>
    );
  return <AuditRecords api={api} />;
}
function AuditRecords({ api }) {
  const resource = useResource(api.audit);
  return (
    <>
      <PageHeading
        title="Audit history"
        description="Administrative review of protected record activity. Read-only."
      />
      <ResourceState resource={resource} />
      <Card title="Record activity">
        {resource.data?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {['Actor', 'Action', 'Target', 'Timestamp'].map((name) => (
                    <th key={name} scope="col">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resource.data.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.actor}</td>
                    <td>{entry.action}</td>
                    <td>{entry.target}</td>
                    <td>
                      <DateValue value={entry.timestamp} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Audit service unavailable">
            The backend audit review contract has not been implemented.
          </EmptyState>
        )}
      </Card>
    </>
  );
}
