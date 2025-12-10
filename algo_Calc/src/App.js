import { useState } from 'react';
import './App.css';
import {
  ProcessScheduling,
  ProcessSynchronization,
  BanksAlgorithm,
  FitAlgorithm,
  PageReplacement,
  DiskScheduling,
  FileAllocations,
  MftMvt,
} from './components';

const views = [
  { id: 'home', label: 'Home' },
  { id: 'process-scheduling', label: 'Process Scheduling', component: ProcessScheduling },
  { id: 'process-synchronization', label: 'Process Sync', component: ProcessSynchronization },
  { id: 'banks-algorithm', label: "Bank's Algorithm", component: BanksAlgorithm },
  { id: 'fit-algorithm', label: 'Fit Algorithm', component: FitAlgorithm },
  { id: 'page-replacement', label: 'Page Replacement', component: PageReplacement },
  { id: 'disk-scheduling', label: 'Disk Scheduling', component: DiskScheduling },
  { id: 'file-allocations', label: 'File Allocations', component: FileAllocations },
  { id: 'mft-mvt', label: 'MFT / MVT', component: MftMvt },
];

const featured = views.filter((view) => view.id !== 'home');

function App() {
  const [active, setActive] = useState('home');
  const ActiveComponent = views.find((view) => view.id === active)?.component;

  return (
    <div className="App">
      <nav className="navbar" aria-label="Algorithm sections">
        <div className="brand" role="button" tabIndex={0} onClick={() => setActive('home')} onKeyDown={() => setActive('home')}>
          <span className="brand-mark">A</span>
          AlgoLab
        </div>
        <ul>
          {views.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`nav-btn ${active === item.id ? 'active' : ''}`}
                onClick={() => setActive(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main>
        {active === 'home' ? (
          <section className="content-section home-hero">
            <div className="hero-grid">
              <div>
                <div className="pill ghost-pill">Algo Toolkit</div>
                <h2>Algorithm Command Center</h2>
                <p className="muted-text">
                  Jump into guided, animated simulations for CPU scheduling, synchronization, memory, disks, and more.
                  Each module includes visuals, metrics, and step-through controls so you can learn by doing.
                </p>
                <div className="hero-actions">
                  <button type="button" className="btn primary" onClick={() => setActive('process-scheduling')}>
                    Start with Scheduling
                  </button>
                  <button type="button" className="btn secondary" onClick={() => setActive('page-replacement')}>
                    Explore Paging
                  </button>
                </div>
              </div>
              <div className="hero-panel">
                <div className="glow" />
                <div className="hero-card">
                  <div className="stat-label">Modules</div>
                  <div className="stat-value">{featured.length}</div>
                  <p className="muted-text small-text">All interactive, all in one place.</p>
                  <div className="hero-badges">
                    <span className="badge">Live Charts</span>
                    <span className="badge">Animations</span>
                    <span className="badge">Step Control</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-grid">
              {featured.map((item) => (
                <div key={item.id} className="home-card">
                  <div className="pill">{item.label}</div>
                  <p className="muted-text small-text">
                    Explore the {item.label} simulator with visuals, metrics, and timelines.
                  </p>
                  <button type="button" className="btn primary" onClick={() => setActive(item.id)}>
                    Open
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : (
          ActiveComponent && <ActiveComponent />
        )}
      </main>
    </div>
  );
}

export default App;
