import { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from './ui';

const navigation = [
  { id: 'dashboard', to: '/', icon: 'dashboard', label: 'Dashboard' },
  { id: 'owners', to: '/owners', icon: 'owners', label: 'Pet owners' },
  { id: 'pets', to: '/pets', icon: 'paw', label: 'Pet records' },
  { id: 'visits', to: '/visits', icon: 'visits', label: 'Visits' },
  { id: 'clinics', to: '/clinics', icon: 'clinics', label: 'Veterinary clinics' },
];

function loadOrder(key) {
  const defaults = navigation.map((item) => item.id);
  try {
    const saved = key ? JSON.parse(localStorage.getItem(key)) : null;
    if (Array.isArray(saved)) {
      const known = saved.filter((id) => defaults.includes(id));
      return [...new Set([...known, ...defaults])];
    }
  } catch {
    // Browser storage may be blocked or contain an invalid preference.
  }
  return defaults;
}

export default function Navigation({ prefix, storageKey, onNavigate }) {
  const [order, setOrder] = useState(() => loadOrder(storageKey));
  const [announcement, setAnnouncement] = useState('');
  const dragged = useRef(null);

  function move(id, targetIndex) {
    const next = order.filter((item) => item !== id);
    next.splice(targetIndex, 0, id);
    setOrder(next);
    const label = navigation.find((item) => item.id === id).label;
    let message = `${label} moved to position ${targetIndex + 1} of ${order.length}.`;
    try {
      // Only stable menu IDs are stored, under this browser's user preference.
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      message += ' Browser storage is unavailable; this order will last until reload.';
    }
    setAnnouncement(message);
  }

  return (
    <>
      <p className="nav-help">Reorder with the drag handles or arrow buttons.</p>
      <nav aria-label="Main navigation">
        {order.map((id, index) => {
          const { to, icon, label } = navigation.find((item) => item.id === id);
          return (
            <div
              className="nav-item"
              key={id}
              onDragOver={(event) => {
                if (dragged.current) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragged.current && dragged.current !== id)
                  move(dragged.current, index);
                dragged.current = null;
              }}
            >
              <button
                type="button"
                className="nav-drag"
                draggable
                aria-label={`Drag ${label} to reorder`}
                title={`Drag ${label} to reorder`}
                onDragStart={(event) => {
                  dragged.current = id;
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', id);
                }}
                onDragEnd={() => {
                  dragged.current = null;
                }}
              >
                <span aria-hidden="true">⠿</span>
              </button>
              <NavLink
                to={`${prefix}${to}`}
                end={to === '/'}
                draggable={false}
                onClick={(event) => {
                  if (dragged.current) event.preventDefault();
                  else onNavigate();
                }}
              >
                <Icon name={icon} />
                {label}
              </NavLink>
              <div className="nav-moves">
                <button
                  type="button"
                  aria-label={`Move ${label} up`}
                  disabled={index === 0}
                  onClick={() => move(id, index - 1)}
                >
                  <span aria-hidden="true">↑</span>
                </button>
                <button
                  type="button"
                  aria-label={`Move ${label} down`}
                  disabled={index === order.length - 1}
                  onClick={() => move(id, index + 1)}
                >
                  <span aria-hidden="true">↓</span>
                </button>
              </div>
            </div>
          );
        })}
      </nav>
      <p role="status" className="sr-only">{announcement}</p>
    </>
  );
}
