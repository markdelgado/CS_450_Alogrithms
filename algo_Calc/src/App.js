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

const navItems = [
  { id: 'process-scheduling', label: 'Process Scheduling' },
  { id: 'process-synchronization', label: 'Process Synchronization' },
  { id: 'banks-algorithm', label: "Bank's Algorithm" },
  { id: 'fit-algorithm', label: 'Fit Algorithm' },
  { id: 'page-replacement', label: 'Page Replacement' },
  { id: 'disk-scheduling', label: 'Disk Scheduling' },
  { id: 'file-allocations', label: 'File Allocations' },
  { id: 'mft-mvt', label: 'MFT / MVT' },
];

function App() {
  return (
    <div className="App">
      <nav className="navbar" aria-label="Algorithm sections">
        <div className="brand">AlgoCalc</div>
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <main>
        <ProcessScheduling />
        <ProcessSynchronization />
        <BanksAlgorithm />
        <FitAlgorithm />
        <PageReplacement />
        <DiskScheduling />
        <FileAllocations />
        <MftMvt />
      </main>
    </div>
  );
}

export default App;
