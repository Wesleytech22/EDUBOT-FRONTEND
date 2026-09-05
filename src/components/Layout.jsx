import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import '../styles/layout.css';

export default function Layout({ title, children, headerAction }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <Topbar title={title} />
        <main className="app-main">
          {headerAction}
          {children}
        </main>
      </div>
    </div>
  );
}
