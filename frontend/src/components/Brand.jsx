import { Link } from 'react-router-dom';

export default function Brand({ to }) {
  return (
    <Link to={to} className="brand">
      <strong>VERT</strong>{' '}
      <small>Veterinary Emergency Record Transfer</small>
    </Link>
  );
}
