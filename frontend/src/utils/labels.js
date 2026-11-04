// Identification labels are for display only. Routes and relationships use IDs.
export function ownerLabel(owner = {}) {
  const name = [owner.last_name, owner.first_name].filter(Boolean).join(', ');
  return [name || owner.name || 'Owner not recorded', owner.phone]
    .filter(Boolean)
    .join(', ');
}

export function petOwner(pet = {}, owners = []) {
  const owner =
    owners.find((item) => String(item.id) === String(pet.owner_id)) || pet.owner;
  return {
    first_name: owner?.first_name ?? pet.owner_first_name,
    last_name: owner?.last_name ?? pet.owner_last_name,
    name: owner?.name ?? pet.owner_name,
    phone: owner?.phone ?? pet.owner_phone,
  };
}

export function petLabel(pet = {}, owner = petOwner(pet)) {
  // Legacy full names stay intact; never guess a surname by splitting them.
  return [
    owner.last_name || owner.name || owner.first_name || 'Owner not recorded',
    pet.name || pet.pet_name || 'Pet not recorded',
    owner.phone,
  ]
    .filter(Boolean)
    .join(', ');
}

export function lookupText(record, owner = petOwner(record)) {
  return [
    record.id,
    record.name,
    record.first_name,
    record.last_name,
    record.pet_name,
    record.owner_name,
    record.email,
    record.phone,
    record.microchip_id,
    record.address,
    ownerLabel(owner),
    ...(record.pets || []).map((pet) => petLabel(pet, record)),
  ]
    .join(' ')
    .toLowerCase();
}
