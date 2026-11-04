import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WorkspaceContext } from '../context/WorkspaceContext';
import { recordsApi } from '../services/api';
import { sampleApi } from '../preview/sampleData';
import { Icon, Notice } from './ui';
import Brand from './Brand';
import Navigation from './Navigation';

export default function AppLayout({ preview = false }) {
  const auth = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const location = useLocation();
  const main = useRef(null);
  const prefix = preview ? '/preview' : '';
  const navigationKey = preview
    ? 'vert:navigation:preview'
    : auth?.user?.id != null
      ? `vert:navigation:user:${auth.user.id}`
      : null;
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
  }, [location.pathname]);
  async function logout() {
    setLeaving(true);
    try {
      await auth.logout();
    } catch (error) {
      setLogoutError(error.message);
    } finally {
      setLeaving(false);
    }
  }
  return (
    <WorkspaceContext.Provider
      value={{ api: preview ? sampleApi : recordsApi, preview, prefix }}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="app-shell">
        <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
          <Brand to={`${prefix}/`} />
          <p className="nav-caption">WORKSPACE</p>
          <Navigation
            key={navigationKey}
            prefix={prefix}
            storageKey={navigationKey}
            onNavigate={() => setMenuOpen(false)}
          />
          <div className="sidebar-bottom">
            <div className="security-note">
              <Icon name="shield" />
              <p>
                Provider access
                <small>Medical records require authorization</small>
              </p>
            </div>
            <NavLink
              to={`${prefix}/account`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name="account" />
              Account
            </NavLink>
            {auth?.permissions?.audit_read && !preview && (
              <NavLink to="/audit">Audit history</NavLink>
            )}
            {preview ? (
              <Link to="/login">Exit sample preview</Link>
            ) : (
              <button className="logout" onClick={logout} disabled={leaving}>
                {leaving ? 'Signing out…' : 'Sign out'}
              </button>
            )}
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <button
              className="mobile-menu"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Icon name="menu" />
            </button>
            <div className="topbar-title">
              Veterinary Emergency Records Transfer
            </div>
            <div className="provider">
              <span className="avatar">
                <Icon name="account" size={18} />
              </span>
              <div>
                {preview ? 'Sample provider' : auth?.user?.name}
                <small>
                  {preview
                    ? 'Read-only demonstration'
                    : 'Authenticated account'}
                </small>
              </div>
            </div>
          </header>
          <main id="main-content" tabIndex={-1} ref={main}>
            {preview && (
              <Notice>
                <strong>Sample preview · read-only.</strong> Fictional records
                for UI review. No clinical requests or database saves.
              </Notice>
            )}
            {logoutError && <Notice danger>{logoutError}</Notice>}
            <Outlet />
            <footer className="page-footer">
              VERT <span>Veterinary care, with the record in reach.</span>
            </footer>
          </main>
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}
