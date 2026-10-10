import { useLocation, useParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import useResource from '../hooks/useResource';
import {
  Card,
  DateValue,
  EmptyState,
  Icon,
  Notice,
  PageHeading,
  RecordLink,
  ResourceState,
  Value,
} from '../components/ui';

function SavedNotice() {
  const location = useLocation();
  return location.state?.saved ? (
    <Notice>The backend confirmed this record was saved.</Notice>
  ) : null;
}
function Facts({ entries }) {
  return (
    <dl className="facts">
      {entries.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>
            <Value>{value}</Value>
          </dd>
        </div>
      ))}
    </dl>
  );
}
export function OwnerDetail() {
  const { id } = useParams();
  const { api } = useWorkspace();
  const resource = useResource(api.owner, id);
  const owner = resource.data;
  return (
    <>
      <PageHeading
        title={owner?.name || 'Owner profile'}
        description={`Owner ID: ${id}`}
      >
        <RecordLink className="button secondary" to={`/owners/${id}/edit`}>
          Edit owner
        </RecordLink>
        <RecordLink className="button" to={`/pets/new?owner_id=${id}`}>
          <Icon name="plus" />
          Add pet
        </RecordLink>
      </PageHeading>
      <SavedNotice />
      <ResourceState resource={resource} />
      <div className="detail-grid">
        <Card title="Contact information">
          <Facts
            entries={[
              ['Email', owner?.email],
              ['Phone', owner?.phone],
              ['Address', owner?.address],
              ['Emergency contact', owner?.emergency_contact_name],
              ['Emergency phone', owner?.emergency_contact_phone],
            ]}
          />
          <p className="clinical-text">
            <Value>{owner?.notes}</Value>
          </p>
        </Card>
        <Card title="Associated pets">
          {owner?.pets?.length ? (
            owner.pets.map((pet) => (
              <RecordLink
                className="patient-row"
                key={pet.id}
                to={`/pets/${pet.id}`}
              >
                <span className="patient-avatar">
                  <Icon name="pets" />
                </span>
                <div>
                  <strong>{pet.name}</strong>
                  <p>
                    {pet.species} · {pet.breed || 'Breed not recorded'}
                  </p>
                </div>
                <Icon name="arrow" size={18} />
              </RecordLink>
            ))
          ) : (
            <EmptyState title="Associated pets unavailable">
              This owner’s pet list has not been loaded.
            </EmptyState>
          )}
        </Card>
      </div>
    </>
  );
}
export function ClinicDetail() {
  const { id } = useParams();
  const { api } = useWorkspace();
  const resource = useResource(api.clinic, id);
  const clinic = resource.data;
  return (
    <>
      <PageHeading
        title={clinic?.name || 'Clinic information'}
        description={`Clinic ID: ${id}`}
      >
        <RecordLink to={`/clinics/${id}/edit`} className="button secondary">
          Edit clinic
        </RecordLink>
      </PageHeading>
      <SavedNotice />
      <ResourceState resource={resource} />
      {clinic && !clinic.permissions?.update && (
        <Notice>
          Clinic information is read-only. Edit access has not been granted.
        </Notice>
      )}
      <Card title="Clinic contact details">
        <Facts
          entries={[
            ['Clinic identifier', id],
            ['Name', clinic?.name],
            ['Address', clinic?.address],
            ['Phone', clinic?.phone],
          ]}
        />
      </Card>
    </>
  );
}

export function MedicalFinding({ title, finding, children }) {
  let stateLabel = 'Not recorded';
  if (finding?.state === 'absent') stateLabel = 'Confirmed absence';
  if (finding?.state === 'recorded')
    stateLabel = finding.text || 'Recorded — see entries';
  return (
    <section
      className={`critical-item ${finding?.state === 'recorded' ? 'recorded' : ''}`}
    >
      <h3>{title}</h3>
      <p>{stateLabel}</p>
      {finding?.state === 'recorded' && children}
    </section>
  );
}

export function PetDetail() {
  const { id } = useParams();
  const { api } = useWorkspace();
  const resource = useResource(api.pet, id);
  const pet = resource.data;
  const activeMedications =
    pet?.medications?.filter((item) => item.active === true) || [];
  const medicationFinding = activeMedications.length
    ? { state: 'recorded', text: pet?.critical?.medications?.text }
    : pet?.critical?.medications;
  return (
    <>
      <PageHeading
        eyebrow="Patient medical record"
        title={pet?.name || 'Pet medical record'}
        description={`Patient ID: ${id}`}
      >
        <RecordLink to={`/pets/${id}/edit`} className="button secondary">
          Edit pet
        </RecordLink>
        <RecordLink to={`/visits/new?pet_id=${id}`} className="button">
          <Icon name="plus" />
          Create visit
        </RecordLink>
      </PageHeading>
      <SavedNotice />
      <ResourceState resource={resource} />
      <section className="patient-summary">
        <div className="pet-photo">
          {pet?.photo_url?.startsWith('/') &&
          !pet.photo_url.startsWith('//') ? (
            <img src={pet.photo_url} alt={`${pet.name}, patient photograph`} />
          ) : (
            <Icon name="pets" size={48} />
          )}
        </div>
        <div>
          <h2>{pet?.name || 'Patient information unavailable'}</h2>
          <p>
            <Value>{pet?.species}</Value> · <Value>{pet?.breed}</Value>
          </p>
          {pet?.owner_id && (
            <RecordLink to={`/owners/${pet.owner_id}`} className="text-link">
              Owner: {pet.owner_name || pet.owner_id}{' '}
              <Icon name="arrow" size={16} />
            </RecordLink>
          )}
        </div>
        <div className="summary-facts">
          <span>
            Weight
            <strong>
              {pet?.weight_lbs === undefined || pet?.weight_lbs === null
                ? 'Not recorded'
                : `${pet.weight_lbs} lb`}
            </strong>
          </span>
          <span>
            Date of birth
            <strong>
              <DateValue value={pet?.date_of_birth} />
            </strong>
          </span>
        </div>
      </section>
      <Card
        className="critical-card"
        title={
          <>
            <Icon name="alert" />
            Critical Medical Information
          </>
        }
      >
        <p className="critical-intro">
          Recorded findings are shown below. “Not recorded” does not confirm the
          absence of a condition.
        </p>
        <div className="critical-grid">
          <MedicalFinding
            title="Allergies"
            finding={pet?.critical?.allergies}
          />
          <MedicalFinding
            title="Active medications"
            finding={medicationFinding}
          >
            {activeMedications.map((item) => (
              <RecordLink
                key={item.id}
                to={`/medications/${item.id}`}
                className="medication-entry"
              >
                <strong>{item.name}</strong>
                <small>{item.directions}</small>
              </RecordLink>
            ))}
          </MedicalFinding>
          <MedicalFinding
            title="Chronic conditions"
            finding={pet?.critical?.chronic_conditions}
          />
          <MedicalFinding
            title="Recent major procedures"
            finding={pet?.critical?.procedures}
          />
        </div>
      </Card>
      <div className="detail-grid">
        <div className="stack">
          <Card title="Patient information">
            <Facts
              entries={[
                ['Species', pet?.species],
                ['Breed', pet?.breed],
                ['Sex', pet?.sex],
                ['Age when date is unknown', pet?.age],
                ['Color / markings', pet?.color_markings],
                ['Microchip ID', pet?.microchip_id],
              ]}
            />
          </Card>
          <Card title="Medical notes">
            <p className="clinical-text">
              <Value>{pet?.notes}</Value>
            </p>
          </Card>
        </div>
        <div className="stack">
          <Card
            title="Visit history"
            action={
              <RecordLink to={`/visits/new?pet_id=${id}`} className="text-link">
                Create visit
              </RecordLink>
            }
          >
            {pet?.visits?.length ? (
              pet.visits.map((visit) => (
                <RecordLink
                  to={`/visits/${visit.id}`}
                  key={visit.id}
                  className="visit-card"
                >
                  <span className="badge">
                    <Value>{visit.status}</Value>
                  </span>
                  <h3>
                    <DateValue value={visit.occurred_at} />
                  </h3>
                  <p>
                    <Value>{visit.presenting_concern}</Value>
                  </p>
                  <small>
                    <Value>{visit.clinician_name}</Value>
                  </small>
                </RecordLink>
              ))
            ) : (
              <EmptyState title="Visit history unavailable">
                No visit history has been supplied for this record.
              </EmptyState>
            )}
          </Card>
          <Card
            title="Medication entries"
            action={
              <RecordLink
                to={`/medications/new?pet_id=${id}`}
                className="text-link"
              >
                Add medication
              </RecordLink>
            }
          >
            {pet?.medications?.length ? (
              pet.medications.map((med) => (
                <RecordLink
                  to={`/medications/${med.id}`}
                  key={med.id}
                  className="list-row"
                >
                  <div>
                    <strong>{med.name}</strong>
                    <small>{med.directions}</small>
                  </div>
                  <span className="badge">{med.status || 'Not recorded'}</span>
                </RecordLink>
              ))
            ) : (
              <EmptyState title="Medication history unavailable">
                Missing medication data is not a confirmed absence.
              </EmptyState>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
export function VisitDetail() {
  const { id } = useParams();
  const { api } = useWorkspace();
  const resource = useResource(api.visit, id);
  const visit = resource.data;
  return (
    <>
      <PageHeading title="Visit documentation" description={`Visit ID: ${id}`}>
        <RecordLink to={`/visits/${id}/edit`} className="button secondary">
          Edit documentation
        </RecordLink>
        <RecordLink
          to={`/medications/new?visit_id=${id}${visit?.pet_id ? `&pet_id=${visit.pet_id}` : ''}`}
          className="button"
        >
          <Icon name="plus" />
          Add medication
        </RecordLink>
      </PageHeading>
      <SavedNotice />
      <ResourceState resource={resource} />
      <Card title="Encounter">
        <Facts
          entries={[
            [
              'Pet',
              visit?.pet_id ? (
                <RecordLink to={`/pets/${visit.pet_id}`}>
                  {visit.pet_name || visit.pet_id}
                </RecordLink>
              ) : null,
            ],
            ['Clinic', visit?.clinic_name],
            ['Clinician', visit?.clinician_name],
            [
              'Date and time',
              <DateValue key="date" value={visit?.occurred_at} />,
            ],
            ['Status', visit?.status],
            ['Author', visit?.author],
            [
              'Last updated',
              <DateValue key="updated" value={visit?.updated_at} />,
            ],
          ]}
        />
      </Card>
      <div className="documentation-grid">
        {[
          ['presenting_concern', 'Presenting concern'],
          ['examination_findings', 'Examination findings'],
          ['diagnostic_results', 'Diagnostic results'],
          ['assessment', 'Assessment / diagnosis'],
          ['treatment', 'Treatment'],
          ['follow_up', 'Follow-up recommendations'],
          ['notes', 'Additional clinical notes'],
        ].map(([key, title]) => (
          <Card title={title} key={key}>
            <p className="clinical-text">
              <Value>{visit?.[key]}</Value>
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}
export function MedicationDetail() {
  const { id } = useParams();
  const { api } = useWorkspace();
  const resource = useResource(api.medication, id);
  const medication = resource.data;
  return (
    <>
      <PageHeading
        title={medication?.name || 'Medication entry'}
        description={`Medication ID: ${id}`}
      >
        <RecordLink to={`/medications/${id}/edit`} className="button secondary">
          Edit medication
        </RecordLink>
      </PageHeading>
      <SavedNotice />
      <ResourceState resource={resource} />
      <Card title="Medication details">
        <Facts
          entries={[
            ['Name', medication?.name],
            ['Status', medication?.status],
            [
              'Pet',
              medication?.pet_id ? (
                <RecordLink to={`/pets/${medication.pet_id}`}>
                  Open pet record
                </RecordLink>
              ) : null,
            ],
            [
              'Associated visit',
              medication?.visit_id ? (
                <RecordLink to={`/visits/${medication.visit_id}`}>
                  Open visit
                </RecordLink>
              ) : null,
            ],
          ]}
        />
        <h3>Dosage / directions</h3>
        <p className="clinical-text">
          <Value>{medication?.directions}</Value>
        </p>
      </Card>
    </>
  );
}
