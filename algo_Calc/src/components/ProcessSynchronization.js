import { useState } from 'react';

const mechanismData = [
  {
    title: 'Mutex',
    summary: 'Binary lock held by a single owner; protects critical sections from concurrent entry.',
    points: ['One owner at a time', 'Deadlock possible with poor ordering', 'Fast path for uncontended locks'],
  },
  {
    title: 'Semaphore',
    summary: 'Counter + queue controlling how many threads may enter; used for resource pools or signaling.',
    points: ['Binary (0/1) or counting (n)', 'wait(P) decrements; signal(V) increments', 'Can model mutex, producer-consumer slots, and barriers'],
  },
  {
    title: 'Monitor',
    summary: 'Encapsulates shared state with implicit mutual exclusion and condition variables for waiting/signaling.',
    points: ['Methods execute with implicit lock', 'Condition variables to await predicates', 'Prevents leaking state outside the abstraction'],
  },
];

const scenarios = [
  {
    name: 'Producer–Consumer',
    goal: 'Producers add items to a bounded buffer while consumers remove them without overflow/underflow.',
    solution: [
      'Mutex protects the buffer.',
      'Counting semaphores: empty = buffer capacity, full = 0.',
      'Producer: wait(empty) → wait(mutex) → produce → signal(mutex) → signal(full).',
      'Consumer: wait(full) → wait(mutex) → consume → signal(mutex) → signal(empty).',
    ],
  },
  {
    name: 'Readers–Writers (Reader Pref.)',
    goal: 'Many readers may enter; writers need exclusive access, but readers are favored.',
    solution: [
      'Mutex protects readerCount.',
      'Writer semaphore ensures exclusivity.',
      'Reader: lock(mutex); if first reader → wait(writerSem); ++readerCount; unlock(mutex); read; lock(mutex); --readerCount; if last → signal(writerSem); unlock(mutex).',
      'Writer: wait(writerSem); write; signal(writerSem).',
    ],
  },
  {
    name: 'Readers–Writers (Writer Pref.)',
    goal: 'Avoid starving writers by blocking new readers when a writer is waiting.',
    solution: [
      'Add a turnstile mutex to queue both readers and writers.',
      'Readers: wait(turnstile); signal(turnstile); then follow reader-pref steps.',
      'Writers: wait(turnstile) before writerSem, signal after writing.',
    ],
  },
  {
    name: 'Dining Philosophers',
    goal: 'Prevent deadlock and starvation while philosophers alternate thinking/eating.',
    solution: [
      'Model forks as mutexes.',
      'To avoid deadlock: pick lower-ID fork first, or allow only 4 philosophers to compete, or introduce a waiter semaphore of size 4.',
      'To reduce starvation: use fair semaphores or waiter ordering.',
    ],
  },
];

const ProcessSynchronization = () => {
  const [bufferSize, setBufferSize] = useState(5);
  const [items, setItems] = useState(2);
  const [log, setLog] = useState(['Initialized buffer with 2 items.']);
  const [step, setStep] = useState(1);

  const empty = Math.max(bufferSize - items, 0);
  const full = items;
  const mutex = 1;

  const appendLog = (entry) => {
    setLog((prev) => [`${step}. ${entry}`, ...prev].slice(0, 12));
    setStep((prev) => prev + 1);
  };

  const handleProduce = () => {
    if (items >= bufferSize) {
      appendLog('Producer blocked: empty=0, waits on empty semaphore.');
      return;
    }
    const next = items + 1;
    setItems(next);
    appendLog(
      `Producer: wait(empty=${empty}) → wait(mutex=${mutex}) → add item → signal(mutex) → signal(full=${
        full + 1
      }).`,
    );
  };

  const handleConsume = () => {
    if (items <= 0) {
      appendLog('Consumer blocked: full=0, waits on full semaphore.');
      return;
    }
    const next = items - 1;
    setItems(next);
    appendLog(
      `Consumer: wait(full=${full}) → wait(mutex=${mutex}) → remove item → signal(mutex) → signal(empty=${
        empty + 1
      }).`,
    );
  };

  const handleReset = () => {
    setBufferSize(5);
    setItems(2);
    setLog(['Initialized buffer with 2 items.']);
    setStep(1);
  };

  const handleSizeChange = (event) => {
    const value = Number(event.target.value);
    if (Number.isNaN(value) || value < 1) return;
    setBufferSize(value);
    setItems(Math.min(items, value));
    appendLog(`Capacity set to ${value}.`);
  };

  return (
    <section id="process-synchronization" className="content-section">
      <h2>Process Synchronization</h2>
      <p>Key primitives (mutexes, semaphores, monitors) and classic coordination problems with standard solutions.</p>

      <div className="section-card sync-grid">
        {mechanismData.map((mechanism) => (
          <div key={mechanism.title} className="sync-card">
            <div className="pill">{mechanism.title}</div>
            <p className="muted-text">{mechanism.summary}</p>
            <ul>
              {mechanism.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="section-card">
        <h3>Classic Problems & Patterns</h3>
        <div className="sync-grid">
          {scenarios.map((scenario) => (
            <div key={scenario.name} className="sync-card">
              <div className="pill ghost-pill">{scenario.name}</div>
              <p className="muted-text">{scenario.goal}</p>
              <ol className="compact-list">
                {scenario.solution.map((stepText) => (
                  <li key={stepText}>{stepText}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card">
        <h3>Producer–Consumer Simulation (Semaphores)</h3>
        <p className="muted-text">
          Observe how empty/full counting semaphores and a mutex coordinate access to a bounded buffer.
        </p>

        <div className="sim-grid">
          <div className="stat-card">
            <div className="stat-label">Buffer Capacity</div>
            <input
              type="number"
              min="1"
              value={bufferSize}
              onChange={handleSizeChange}
              className="stat-input"
            />
          </div>
          <div className="stat-card">
            <div className="stat-label">Items in Buffer</div>
            <div className="stat-value">{items}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Semaphores</div>
            <div className="badge-row">
              <span className="badge">empty = {empty}</span>
              <span className="badge">full = {full}</span>
              <span className="badge">mutex = {mutex}</span>
            </div>
          </div>
        </div>

        <div className="button-row">
          <button type="button" className="btn primary" onClick={handleProduce}>
            Produce (signal full)
          </button>
          <button type="button" className="btn secondary" onClick={handleConsume}>
            Consume (signal empty)
          </button>
          <button type="button" className="btn ghost" onClick={handleReset}>
            Reset
          </button>
        </div>

        <div className="log-panel">
          <div className="stat-label">Execution Trace</div>
          <ul className="log-list">
            {log.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ProcessSynchronization;
