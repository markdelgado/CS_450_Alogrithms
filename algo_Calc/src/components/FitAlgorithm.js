import { useMemo, useState } from 'react';

const algorithms = [
  { value: 'first', label: 'First Fit' },
  { value: 'best', label: 'Best Fit' },
  { value: 'worst', label: 'Worst Fit' },
  { value: 'next', label: 'Next Fit' },
];

const initialBlocks = [{ id: 1, label: 'Free', size: 200, free: true, requested: 0 }];

const FitAlgorithm = () => {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [requestSize, setRequestSize] = useState(30);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('first');
  const [nextFitStart, setNextFitStart] = useState(0);
  const [log, setLog] = useState(['Initialized memory with 200 units free.']);
  const [flashId, setFlashId] = useState(null);
  const [pidCounter, setPidCounter] = useState(1);
  const [freeTarget, setFreeTarget] = useState(null);

  const totalMemory = useMemo(() => blocks.reduce((sum, block) => sum + block.size, 0), [blocks]);
  const allocatedBlocks = blocks.filter((block) => !block.free);

  const freeBlocks = blocks.filter((block) => block.free);
  const totalFree = freeBlocks.reduce((sum, block) => sum + block.size, 0);
  const largestHole = freeBlocks.length ? Math.max(...freeBlocks.map((block) => block.size)) : 0;
  const internalFragmentation = allocatedBlocks.reduce(
    (sum, block) => sum + Math.max(block.size - (block.requested || 0), 0),
    0,
  );
  const externalFragmentation = totalFree - largestHole;

  const addLog = (entry) => {
    setLog((prev) => [entry, ...prev].slice(0, 12));
  };

  const coalesce = (list) => {
    const merged = [];
    for (let i = 0; i < list.length; i += 1) {
      const current = list[i];
      if (current.free && merged.length && merged[merged.length - 1].free) {
        merged[merged.length - 1].size += current.size;
      } else {
        merged.push({ ...current });
      }
    }
    return merged.map((block, idx) => ({ ...block, id: block.id || idx + 1 }));
  };

  const findBlockIndex = (size) => {
    const indices = blocks.map((_, idx) => idx);
    switch (selectedAlgorithm) {
      case 'best': {
        const best = indices
          .filter((i) => blocks[i].free && blocks[i].size >= size)
          .sort((a, b) => blocks[a].size - blocks[b].size);
        return best.length ? best[0] : -1;
      }
      case 'worst': {
        const worst = indices
          .filter((i) => blocks[i].free && blocks[i].size >= size)
          .sort((a, b) => blocks[b].size - blocks[a].size);
        return worst.length ? worst[0] : -1;
      }
      case 'next': {
        const n = blocks.length;
        for (let offset = 0; offset < n; offset += 1) {
          const idx = (nextFitStart + offset) % n;
          if (blocks[idx].free && blocks[idx].size >= size) {
            return idx;
          }
        }
        return -1;
      }
      case 'first':
      default:
        return indices.find((i) => blocks[i].free && blocks[i].size >= size) ?? -1;
    }
  };

  const allocate = () => {
    const size = Number(requestSize);
    if (!Number.isFinite(size) || size <= 0) {
      addLog('Enter a positive request size.');
      return;
    }

    const index = findBlockIndex(size);
    if (index === -1) {
      addLog(`Request ${size} denied: no suitable hole.`);
      return;
    }

    const pid = `P${pidCounter}`;
    setPidCounter((prev) => prev + 1);

    const target = blocks[index];
    const remaining = target.size - size;
    const newBlock = {
      id: Date.now(),
      label: pid,
      size,
      free: false,
      requested: size,
    };

    const updated = [...blocks];
    updated.splice(index, 1, newBlock);
    if (remaining > 0) {
      updated.splice(index + 1, 0, {
        id: Date.now() + 1,
        label: 'Free',
        size: remaining,
        free: true,
        requested: 0,
      });
    }

    const coalesced = coalesce(updated);
    setBlocks(coalesced);
    setFlashId(newBlock.id);
    setTimeout(() => setFlashId(null), 600);
    setLog((prev) => [`Allocated ${size} to ${pid} via ${labelFor(selectedAlgorithm)}.`, ...prev].slice(0, 12));

    if (selectedAlgorithm === 'next') {
      const nextIndex = coalesced.findIndex((block) => block.free);
      setNextFitStart(nextIndex === -1 ? 0 : nextIndex);
    }
  };

  const freeProcess = () => {
    if (!freeTarget) {
      addLog('Select a process to free.');
      return;
    }

    const updated = blocks.map((block) =>
      block.id === Number(freeTarget) ? { ...block, free: true, label: 'Free', requested: 0 } : block,
    );

    const coalesced = coalesce(updated);
    setBlocks(coalesced);
    setFlashId(Number(freeTarget));
    setTimeout(() => setFlashId(null), 600);
    setLog((prev) => [`Freed ${freeTarget}. Coalesced adjacent holes.`, ...prev].slice(0, 12));
    setFreeTarget(null);
  };

  const reset = () => {
    setBlocks(initialBlocks);
    setRequestSize(30);
    setSelectedAlgorithm('first');
    setNextFitStart(0);
    setLog(['Reset memory to single free block of 200 units.']);
    setFlashId(null);
    setPidCounter(1);
    setFreeTarget(null);
  };

  return (
    <section id="fit-algorithm" className="content-section">
      <h2>Fit Algorithms</h2>
      <p>
        Allocate variable partitions using First, Best, Worst, or Next Fit. Watch free/allocated blocks
        split, merge, and report fragmentation as you simulate allocations and frees.
      </p>

      <div className="section-card">
        <div className="scheduler-grid">
          <div>
            <h3>Request Memory</h3>
            <div className="scheduler-form">
              <label>
                Algorithm
                <select
                  value={selectedAlgorithm}
                  onChange={(event) => setSelectedAlgorithm(event.target.value)}
                >
                  {algorithms.map((alg) => (
                    <option key={alg.value} value={alg.value}>
                      {alg.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Request Size
                <input
                  type="number"
                  min="1"
                  value={requestSize}
                  onChange={(event) => setRequestSize(event.target.value)}
                />
              </label>
              <div className="button-row">
                <button type="button" className="btn primary" onClick={allocate}>
                  Allocate
                </button>
                <button type="button" className="btn ghost" onClick={reset}>
                  Reset
                </button>
              </div>
            </div>
            <p className="muted-text small-text">
              Next Fit remembers the last hole scanned; others always scan from the start.
            </p>

            <h4>Free a Block</h4>
            <div className="scheduler-form">
              <label>
                Choose Process
                <select
                  value={freeTarget || ''}
                  onChange={(event) => setFreeTarget(event.target.value)}
                >
                  <option value="">Select allocated block</option>
                  {allocatedBlocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.label} ({block.size})
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="btn secondary" onClick={freeProcess} disabled={!allocatedBlocks.length}>
                Free Selected
              </button>
            </div>
          </div>

          <div>
            <h3>Memory Layout</h3>
            <div className="memory-bar" aria-label="Memory layout">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className={`mem-block ${block.free ? 'free' : 'allocated'} ${
                    flashId === block.id ? 'flash' : ''
                  }`}
                  style={{ flexBasis: `${(block.size / totalMemory) * 100}%` }}
                  title={`${block.label}: ${block.size}`}
                >
                  <span>{block.label}</span>
                  <small>{block.size}</small>
                </div>
              ))}
            </div>

            <div className="summary-grid">
              <div>
                <p className="summary-label">Total Free</p>
                <p className="summary-value">{totalFree} units</p>
              </div>
              <div>
                <p className="summary-label">Largest Hole</p>
                <p className="summary-value">{largestHole || 0} units</p>
              </div>
              <div>
                <p className="summary-label">External Fragmentation</p>
                <p className="summary-value">{externalFragmentation} units</p>
              </div>
              <div>
                <p className="summary-label">Internal Fragmentation</p>
                <p className="summary-value">{internalFragmentation} units</p>
              </div>
            </div>

            <div className="log-panel">
              <div className="stat-label">Actions</div>
              <ul className="log-list">
                {log.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const labelFor = (value) => {
  const item = algorithms.find((alg) => alg.value === value);
  return item ? item.label : value;
};

export default FitAlgorithm;
