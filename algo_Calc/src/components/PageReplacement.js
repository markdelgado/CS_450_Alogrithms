import { useEffect, useMemo, useState } from 'react';

const algorithmOptions = [
  { value: 'fifo', label: 'FIFO' },
  { value: 'lru', label: 'LRU' },
  { value: 'mru', label: 'MRU' },
  { value: 'clock', label: 'CLOCK' },
  { value: 'wsclock', label: 'WSClock (window=4)' },
  { value: 'opt', label: 'Optimal (OPT)' },
];

const defaultRef = '7 0 1 2 0 3 0 4 2 3 0 3 2';

const PageReplacement = () => {
  const [referenceInput, setReferenceInput] = useState(defaultRef);
  const [framesCount, setFramesCount] = useState(3);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('fifo');
  const [results, setResults] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const referenceString = useMemo(() => parseReference(referenceInput), [referenceInput]);

  useEffect(() => {
    let timer;
    if (autoPlay && results?.timeline?.length) {
      timer = setInterval(() => {
        setStepIndex((prev) => {
          const next = prev + 1;
          if (next >= results.timeline.length) {
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
  }, [autoPlay, results]);

  const runSimulation = () => {
    if (!framesCount || framesCount <= 0) {
      return;
    }
    const sim = simulate(selectedAlgorithm, framesCount, referenceString);
    const belady = detectBelady(referenceString, framesCount);
    setResults({ ...sim, belady });
    setStepIndex(0);
    setAutoPlay(false);
  };

  useEffect(() => {
    runSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAlgorithm, framesCount, referenceInput]);

  const currentStep = results?.timeline?.[stepIndex];

  return (
    <section id="page-replacement" className="content-section">
      <h2>Page Replacement</h2>
      <p>Simulate FIFO, LRU, MRU, CLOCK, WSClock, and OPT. Step through references, see faults, and spot Belady&apos;s anomaly.</p>

      <div className="section-card">
        <div className="scheduler-grid">
          <div>
            <h3>Setup</h3>
            <div className="scheduler-form">
              <label>
                Reference String
                <textarea
                  value={referenceInput}
                  onChange={(event) => setReferenceInput(event.target.value)}
                  rows={3}
                />
              </label>
              <label>
                Frames
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={framesCount}
                  onChange={(event) => setFramesCount(Number(event.target.value))}
                />
              </label>
              <label>
                Algorithm
                <select
                  value={selectedAlgorithm}
                  onChange={(event) => setSelectedAlgorithm(event.target.value)}
                >
                  {algorithmOptions.map((alg) => (
                    <option key={alg.value} value={alg.value}>
                      {alg.label}
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
                  disabled={!results}
                >
                  {autoPlay ? 'Pause' : 'Play'}
                </button>
              </div>
            </div>
            {results?.belady && (
              <div className="notice warning">
                Belady&apos;s anomaly: FIFO faults with {framesCount + 1} frames ({results.belady.larger})
                exceeded faults with {framesCount} frames ({results.belady.smaller}).
              </div>
            )}
          </div>

          <div>
            <h3>Metrics</h3>
            <div className="summary-grid">
              <div>
                <p className="summary-label">Page Faults</p>
                <p className="summary-value">{results?.faults ?? 0}</p>
              </div>
              <div>
                <p className="summary-label">Hit Ratio</p>
                <p className="summary-value">
                  {results ? ((results.hits / results.references) * 100).toFixed(1) : '0.0'}%
                </p>
              </div>
              <div>
                <p className="summary-label">Frames</p>
                <p className="summary-value">{framesCount}</p>
              </div>
              <div>
                <p className="summary-label">References</p>
                <p className="summary-value">{results?.references ?? referenceString.length}</p>
              </div>
            </div>

            <div className="timeline-controls">
              <button
                type="button"
                className="btn ghost small"
                onClick={() => setStepIndex((idx) => Math.max(idx - 1, 0))}
                disabled={!results || stepIndex === 0}
              >
                Prev
              </button>
              <span className="muted-text">
                Step {results ? stepIndex + 1 : 0} / {results?.timeline?.length ?? 0}
              </span>
              <button
                type="button"
                className="btn ghost small"
                onClick={() =>
                  setStepIndex((idx) => Math.min(idx + 1, (results?.timeline?.length || 1) - 1))
                }
                disabled={!results || stepIndex >= (results?.timeline?.length || 1) - 1}
              >
                Next
              </button>
            </div>

            {currentStep && (
              <div className="frames-visual">
                <div className="stat-label">
                  Ref {currentStep.index + 1}: page {currentStep.page}{' '}
                  {currentStep.fault ? <span className="badge fault">Fault</span> : <span className="badge">Hit</span>}
                </div>
                <div className="frames-grid">
                  {currentStep.frames.map((frame, idx) => (
                    <div
                      key={idx}
                      className={`frame-cell ${frame === null ? 'empty' : ''} ${
                        currentStep.fault && currentStep.replacedIndex === idx ? 'flash' : ''
                      }`}
                    >
                      {frame === null ? '—' : frame}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="section-card">
        <h3>Timeline</h3>
        <div className="table-wrapper">
          <table className="process-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Page</th>
                <th>Result</th>
                <th>Frames</th>
              </tr>
            </thead>
            <tbody>
              {results?.timeline?.map((step) => (
                <tr key={step.index} className={step.index === stepIndex ? 'active-row' : ''}>
                  <td>{step.index + 1}</td>
                  <td>{step.page}</td>
                  <td>
                    {step.fault ? <span className="badge fault">Fault</span> : <span className="badge">Hit</span>}
                  </td>
                  <td>
                    <span className="frame-seq">
                      {step.frames.map((frame, idx) => (
                        <span key={idx} className={idx === step.replacedIndex && step.fault ? 'underline' : ''}>
                          {frame === null ? '—' : frame}
                          {idx < step.frames.length - 1 ? ' | ' : ''}
                        </span>
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

const parseReference = (input) =>
  input
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => Number(token))
    .filter((num) => Number.isFinite(num));

const simulate = (algorithm, framesCount, refs) => {
  const frames = Array(framesCount).fill(null);
  const timeline = [];
  let pointer = 0;
  let hits = 0;
  let faults = 0;
  const meta = frames.map(() => ({ ref: 0, lastUsed: -1 }));

  const now = () => timeline.length;

  refs.forEach((page, index) => {
    const hitIndex = frames.indexOf(page);
    let replacedIndex = -1;
    let fault = hitIndex === -1;

    if (!fault) {
      hits += 1;
      meta[hitIndex].ref = 1;
      meta[hitIndex].lastUsed = now();
    } else {
      faults += 1;
      switch (algorithm) {
        case 'fifo': {
          replacedIndex = findFifo(frames, pointer);
          pointer = (replacedIndex + 1) % frames.length;
          break;
        }
        case 'lru': {
          replacedIndex = findLRU(frames, meta);
          break;
        }
        case 'mru': {
          replacedIndex = findMRU(frames, meta);
          break;
        }
        case 'clock': {
          const result = findClock(frames, meta, pointer);
          replacedIndex = result.index;
          pointer = result.nextPointer;
          break;
        }
        case 'wsclock': {
          const result = findWSClock(frames, meta, pointer, now());
          replacedIndex = result.index;
          pointer = result.nextPointer;
          break;
        }
        case 'opt': {
          replacedIndex = findOPT(frames, refs, index + 1);
          break;
        }
        default:
          replacedIndex = findFifo(frames, pointer);
          pointer = (replacedIndex + 1) % frames.length;
      }

      frames[replacedIndex] = page;
      meta[replacedIndex] = { ref: 1, lastUsed: now() };
    }

    timeline.push({
      index,
      page,
      frames: [...frames],
      fault,
      replacedIndex,
    });
  });

  return { timeline, hits, faults, references: refs.length };
};

const findFifo = (frames, pointer) => {
  const empty = frames.indexOf(null);
  if (empty !== -1) return empty;
  return pointer;
};

const findLRU = (frames, meta) => {
  const empty = frames.indexOf(null);
  if (empty !== -1) return empty;
  let oldest = 0;
  let idx = 0;
  meta.forEach((info, i) => {
    if (info.lastUsed < oldest || i === 0) {
      oldest = info.lastUsed;
      idx = i;
    }
  });
  return idx;
};

const findMRU = (frames, meta) => {
  const empty = frames.indexOf(null);
  if (empty !== -1) return empty;
  let newest = -Infinity;
  let idx = 0;
  meta.forEach((info, i) => {
    if (info.lastUsed > newest) {
      newest = info.lastUsed;
      idx = i;
    }
  });
  return idx;
};

const findClock = (frames, meta, pointer) => {
  let p = pointer;
  while (true) {
    if (frames[p] === null) {
      return { index: p, nextPointer: (p + 1) % frames.length };
    }
    if (meta[p].ref === 0) {
      return { index: p, nextPointer: (p + 1) % frames.length };
    }
    meta[p].ref = 0;
    p = (p + 1) % frames.length;
  }
};

const findWSClock = (frames, meta, pointer, currentTime) => {
  const tau = 4;
  let p = pointer;
  while (true) {
    if (frames[p] === null) {
      return { index: p, nextPointer: (p + 1) % frames.length };
    }
    if (meta[p].ref === 1) {
      meta[p].ref = 0;
      meta[p].lastUsed = currentTime;
    } else if (currentTime - meta[p].lastUsed > tau) {
      return { index: p, nextPointer: (p + 1) % frames.length };
    }
    p = (p + 1) % frames.length;
  }
};

const findOPT = (frames, refs, startIndex) => {
  const empty = frames.indexOf(null);
  if (empty !== -1) return empty;
  let farthest = -1;
  let idx = 0;
  frames.forEach((page, i) => {
    const nextUse = refs.indexOf(page, startIndex);
    if (nextUse === -1) {
      idx = i;
      farthest = Infinity;
    } else if (nextUse > farthest) {
      farthest = nextUse;
      idx = i;
    }
  });
  return idx;
};

const detectBelady = (refs, frames) => {
  const base = simulate('fifo', frames, refs);
  const larger = simulate('fifo', frames + 1, refs);
  if (larger.faults > base.faults) {
    return { smaller: base.faults, larger: larger.faults };
  }
  return null;
};

export default PageReplacement;
