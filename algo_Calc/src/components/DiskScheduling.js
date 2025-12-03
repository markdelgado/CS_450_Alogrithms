import { useEffect, useMemo, useState } from 'react';

const algorithmOptions = [
  { value: 'fcfs', label: 'FCFS' },
  { value: 'sstf', label: 'SSTF' },
  { value: 'scan', label: 'SCAN' },
  { value: 'cscan', label: 'CSCAN' },
  { value: 'look', label: 'LOOK' },
  { value: 'clook', label: 'CLOOK' },
];

const defaultRequests = '98 183 37 122 14 124 65 67';
const maxCyl = 199;

const DiskScheduling = () => {
  const [requestsInput, setRequestsInput] = useState(defaultRequests);
  const [head, setHead] = useState(53);
  const [direction, setDirection] = useState('right');
  const [algorithm, setAlgorithm] = useState('fcfs');
  const [result, setResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const requests = useMemo(() => parseRequests(requestsInput, maxCyl), [requestsInput]);

  useEffect(() => {
    let timer;
    if (autoPlay && result?.path.length) {
      timer = setInterval(() => {
        setStepIndex((prev) => {
          const next = prev + 1;
          if (next >= result.timeline.length) {
            setAutoPlay(false);
            return prev;
          }
          return next;
        });
      }, 700);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoPlay, result]);

  const runSimulation = () => {
    const sim = simulate(algorithm, head, direction, requests);
    setResult(sim);
    setStepIndex(0);
    setAutoPlay(false);
  };

  useEffect(() => {
    runSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestsInput, head, direction, algorithm]);

  const currentStep = result?.timeline?.[stepIndex];

  return (
    <section id="disk-scheduling" className="content-section">
      <h2>Disk Scheduling</h2>
      <p>Visualize FCFS, SSTF, SCAN/CSCAN, LOOK/CLOOK. Step through head movement and track total seek distance.</p>

      <div className="section-card">
        <div className="scheduler-grid">
          <div>
            <h3>Setup</h3>
            <div className="scheduler-form">
              <label>
                Requests (0-{maxCyl})
                <textarea
                  value={requestsInput}
                  onChange={(event) => setRequestsInput(event.target.value)}
                  rows={3}
                />
              </label>
              <label>
                Head Start
                <input
                  type="number"
                  min="0"
                  max={maxCyl}
                  value={head}
                  onChange={(event) => setHead(Number(event.target.value))}
                />
              </label>
              <label>
                Direction
                <select value={direction} onChange={(event) => setDirection(event.target.value)}>
                  <option value="right">Increasing (right)</option>
                  <option value="left">Decreasing (left)</option>
                </select>
              </label>
              <label>
                Algorithm
                <select value={algorithm} onChange={(event) => setAlgorithm(event.target.value)}>
                  {algorithmOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="button-row">
                <button type="button" className="btn primary" onClick={runSimulation}>
                  Run
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setAutoPlay((prev) => !prev)}
                  disabled={!result}
                >
                  {autoPlay ? 'Pause' : 'Play'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3>Metrics</h3>
            <div className="summary-grid">
              <div>
                <p className="summary-label">Total Seek</p>
                <p className="summary-value">{result?.total ?? 0}</p>
              </div>
              <div>
                <p className="summary-label">Average Seek</p>
                <p className="summary-value">
                  {result ? (result.total / result.served).toFixed(2) : '0.00'}
                </p>
              </div>
              <div>
                <p className="summary-label">Served Requests</p>
                <p className="summary-value">{result?.served ?? 0}</p>
              </div>
            </div>

            <div className="timeline-controls">
              <button
                type="button"
                className="btn ghost small"
                onClick={() => setStepIndex((idx) => Math.max(idx - 1, 0))}
                disabled={!result || stepIndex === 0}
              >
                Prev
              </button>
              <span className="muted-text">
                Step {result ? stepIndex + 1 : 0} / {result?.timeline?.length ?? 0}
              </span>
              <button
                type="button"
                className="btn ghost small"
                onClick={() =>
                  setStepIndex((idx) => Math.min(idx + 1, (result?.timeline?.length || 1) - 1))
                }
                disabled={!result || stepIndex >= (result?.timeline?.length || 1) - 1}
              >
                Next
              </button>
            </div>

            {currentStep && (
              <div className="track">
                <div className="track-line">
                  <div
                    className="track-head flash"
                    style={{ left: `${(currentStep.position / maxCyl) * 100}%` }}
                    title={`Head at ${currentStep.position}`}
                  />
                  {requests.map((req) => (
                    <div
                      key={`${req}-${currentStep.index}`}
                      className={`track-dot ${currentStep.position === req ? 'hit' : ''}`}
                      style={{ left: `${(req / maxCyl) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="stat-label">
                  {currentStep.index + 1}. Move to {currentStep.position} (Δ = {currentStep.move})
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="section-card">
        <h3>Path Timeline</h3>
        <div className="table-wrapper">
          <table className="process-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Position</th>
                <th>Move</th>
                <th>Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {result?.timeline?.map((step) => (
                <tr key={step.index} className={step.index === stepIndex ? 'active-row' : ''}>
                  <td>{step.index + 1}</td>
                  <td>{step.position}</td>
                  <td>{step.move}</td>
                  <td>{step.cumulative}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

const parseRequests = (input, max) =>
  input
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => Number(token))
    .filter((num) => Number.isFinite(num) && num >= 0 && num <= max);

const simulate = (algorithm, head, direction, requests) => {
  const order = orderRequests(algorithm, head, direction, requests);
  const path = [head, ...order];
  const timeline = [];
  let total = 0;

  for (let i = 1; i < path.length; i += 1) {
    const move = Math.abs(path[i] - path[i - 1]);
    total += move;
    timeline.push({
      index: i - 1,
      position: path[i],
      move,
      cumulative: total,
    });
  }

  return { path, timeline, total, served: order.length };
};

const orderRequests = (algorithm, head, direction, reqs) => {
  const left = reqs.filter((r) => r < head).sort((a, b) => a - b);
  const right = reqs.filter((r) => r >= head).sort((a, b) => a - b);

  switch (algorithm) {
    case 'fcfs':
      return reqs;
    case 'sstf':
      return sstf(head, reqs);
    case 'scan':
      return direction === 'right'
        ? [...right, maxCyl, ...left.reverse()]
        : [...left.reverse(), 0, ...right];
    case 'cscan':
      return direction === 'right'
        ? [...right, maxCyl, 0, ...left]
        : [...left.reverse(), 0, maxCyl, ...right.reverse()];
    case 'look':
      return direction === 'right' ? [...right, ...left.reverse()] : [...left.reverse(), ...right];
    case 'clook':
      return direction === 'right' ? [...right, ...left] : [...left.reverse(), ...right.reverse()];
    default:
      return reqs;
  }
};

const sstf = (head, reqs) => {
  const pending = [...reqs];
  let current = head;
  const order = [];
  while (pending.length) {
    let bestIdx = 0;
    let bestDist = Math.abs(pending[0] - current);
    for (let i = 1; i < pending.length; i += 1) {
      const dist = Math.abs(pending[i] - current);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    const [next] = pending.splice(bestIdx, 1);
    order.push(next);
    current = next;
  }
  return order;
};

export default DiskScheduling;
