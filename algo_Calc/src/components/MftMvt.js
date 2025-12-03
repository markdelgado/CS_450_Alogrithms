import { useEffect, useMemo, useState } from 'react';

const modes = [
  { value: 'mft', label: 'MFT (Fixed Partitions)' },
  { value: 'mvt', label: 'MVT (Variable Partitions)' },
];

const defaultMemory = 200;
const defaultPartition = 50;

const MftMvt = () => {
  const [mode, setMode] = useState('mft');
  const [memorySize, setMemorySize] = useState(defaultMemory);
  const [partitionSize, setPartitionSize] = useState(defaultPartition);
  const [processSize, setProcessSize] = useState(40);
  const [segments, setSegments] = useState(buildMft(memorySize, partitionSize));
  const [pidCounter, setPidCounter] = useState(1);
  const [flashIds, setFlashIds] = useState([]);
  const [log, setLog] = useState(['Initialized MFT with 4 partitions of size 50.']);
  const [freeTarget, setFreeTarget] = useState(null);

  useEffect(() => {
    const nextSegments =
      mode === 'mft' ? buildMft(memorySize, partitionSize) : buildMvt(memorySize);
    setSegments(nextSegments);
    setPidCounter(1);
    setFreeTarget(null);
    setLog([
      mode === 'mft'
        ? `Reset to MFT: memory ${memorySize}, partition size ${partitionSize}.`
        : `Reset to MVT: memory ${memorySize}.`,
    ]);
    setFlashIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, memorySize, partitionSize]);

  useEffect(() => {
    if (flashIds.length) {
      const timer = setTimeout(() => setFlashIds([]), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [flashIds]);

  const memoryUsed = useMemo(
    () => segments.filter((seg) => !seg.free).reduce((sum, seg) => sum + seg.size, 0),
    [segments],
  );

  const memoryFree = memorySize - memoryUsed;

  const internalFragmentation = useMemo(() => {
    if (mode !== 'mft') return 0;
    return segments
      .filter((seg) => !seg.free)
      .reduce((sum, seg) => sum + Math.max(seg.size - (seg.requested || 0), 0), 0);
  }, [segments, mode]);

  const externalFragmentation = useMemo(() => {
    if (mode !== 'mvt') return 0;
    const freeSegments = segments.filter((seg) => seg.free);
    if (!freeSegments.length) return 0;
    const totalFree = freeSegments.reduce((sum, seg) => sum + seg.size, 0);
    const largestHole = Math.max(...freeSegments.map((seg) => seg.size));
    return totalFree - largestHole;
  }, [segments, mode]);

  const processes = segments.filter((seg) => !seg.free);

  const addLog = (entry) => setLog((prev) => [entry, ...prev].slice(0, 12));

  const allocate = () => {
    const size = Number(processSize);
    if (!Number.isFinite(size) || size <= 0) {
      addLog('Enter a positive process size.');
      return;
    }

    const pid = `P${pidCounter}`;
    if (mode === 'mft') {
      const idx = segments.findIndex((seg) => seg.free && seg.size >= size);
      if (idx === -1) {
        addLog(`MFT: no free partition fits ${size}.`);
        return;
      }
      const updated = segments.map((seg, i) =>
        i === idx ? { ...seg, free: false, label: pid, requested: size } : seg,
      );
      setSegments(updated);
      setFlashIds([idx]);
      setPidCounter((prev) => prev + 1);
      addLog(`MFT: allocated ${pid} in partition ${idx} (${segments[idx].size} units).`);
    } else {
      const idx = segments.findIndex((seg) => seg.free && seg.size >= size);
      if (idx === -1) {
        addLog(`MVT: no hole large enough for ${size}.`);
        return;
      }
      const target = segments[idx];
      const remaining = target.size - size;
      const updated = [...segments];
      updated.splice(idx, 1, { ...target, size, free: false, label: pid, requested: size });
      if (remaining > 0) {
        updated.splice(idx + 1, 0, {
          id: Date.now(),
          size: remaining,
          free: true,
          label: 'Free',
          requested: 0,
        });
      }
      const coalesced = coalesce(updated);
      setSegments(coalesced);
      setFlashIds([idx]);
      setPidCounter((prev) => prev + 1);
      addLog(`MVT: allocated ${pid} of size ${size}.`);
    }
  };

  const freeProcess = () => {
    if (!freeTarget) {
      addLog('Select a process to free.');
      return;
    }
    const updated = segments.map((seg, idx) =>
      seg.label === freeTarget ? { ...seg, free: true, label: 'Free', requested: 0, id: seg.id || idx + 1 } : seg,
    );
    const coalesced = mode === 'mvt' ? coalesce(updated) : updated;
    setSegments(coalesced);
    const freedIds = coalesced
      .map((seg, idx) => (seg.free && seg.label === 'Free' ? idx : null))
      .filter((idx) => idx !== null);
    setFlashIds(freedIds);
    addLog(`Freed ${freeTarget}.`);
    setFreeTarget(null);
  };

  const compact = () => {
    if (mode !== 'mvt') {
      addLog('Compaction applies to MVT only.');
      return;
    }
    const allocated = segments.filter((seg) => !seg.free);
    const freeTotal = segments.filter((seg) => seg.free).reduce((sum, seg) => sum + seg.size, 0);
    const compacted = [...allocated];
    if (freeTotal > 0) {
      compacted.push({
        id: Date.now(),
        free: true,
        label: 'Free',
        size: freeTotal,
        requested: 0,
      });
    }
    setSegments(compacted);
    const flash = compacted.map((_, idx) => idx);
    setFlashIds(flash);
    addLog('Compacted: moved allocated blocks together, merged free space.');
  };

  return (
    <section id="mft-mvt" className="content-section">
      <h2>MFT &amp; MVT</h2>
      <p>Compare fixed vs variable partitioning. Allocate/free processes, track fragmentation, and compact variable partitions.</p>

      <div className="section-card">
        <div className="scheduler-grid">
          <div>
            <h3>Setup</h3>
            <div className="scheduler-form">
              <label>
                Mode
                <select value={mode} onChange={(event) => setMode(event.target.value)}>
                  {modes.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Memory Size
                <input
                  type="number"
                  min="10"
                  value={memorySize}
                  onChange={(event) => setMemorySize(Number(event.target.value))}
                />
              </label>
              {mode === 'mft' && (
                <label>
                  Partition Size
                  <input
                    type="number"
                    min="1"
                    value={partitionSize}
                    onChange={(event) => setPartitionSize(Number(event.target.value))}
                  />
                </label>
              )}
              <label>
                Process Size
                <input
                  type="number"
                  min="1"
                  value={processSize}
                  onChange={(event) => setProcessSize(Number(event.target.value))}
                />
              </label>
              <div className="button-row">
                <button type="button" className="btn primary" onClick={allocate}>
                  Allocate
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={freeProcess}
                  disabled={!processes.length}
                >
                  Free Selected
                </button>
                <button type="button" className="btn ghost" onClick={compact}>
                  Compact
                </button>
              </div>
              <label>
                Free Target
                <select value={freeTarget || ''} onChange={(event) => setFreeTarget(event.target.value)}>
                  <option value="">Select process</option>
                  {processes.map((seg, idx) => (
                    <option key={`${seg.label}-${idx}`} value={seg.label}>
                      {seg.label} ({seg.requested || seg.size})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div>
            <h3>Metrics</h3>
            <div className="summary-grid">
              <div>
                <p className="summary-label">Memory Used</p>
                <p className="summary-value">{memoryUsed} / {memorySize}</p>
              </div>
              <div>
                <p className="summary-label">Free Memory</p>
                <p className="summary-value">{memoryFree}</p>
              </div>
              <div>
                <p className="summary-label">Internal Fragmentation</p>
                <p className="summary-value">{internalFragmentation}</p>
              </div>
              <div>
                <p className="summary-label">External Fragmentation</p>
                <p className="summary-value">{externalFragmentation}</p>
              </div>
            </div>

            <div className="memory-bar" aria-label="Memory layout">
              {segments.map((seg, idx) => (
                <div
                  key={idx}
                  className={`mem-block ${seg.free ? 'free' : 'allocated'} ${
                    flashIds.includes(idx) ? 'flash' : ''
                  }`}
                  style={{ flexBasis: `${(seg.size / memorySize) * 100}%` }}
                  title={`${seg.free ? 'Free' : seg.label}: ${seg.size}`}
                >
                  <span>{seg.free ? 'Free' : seg.label}</span>
                  <small>{seg.size}</small>
                </div>
              ))}
            </div>

            <div className="log-panel">
              <div className="stat-label">Timeline</div>
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

const buildMft = (memorySize, partitionSize) => {
  const parts = [];
  let remaining = memorySize;
  let id = 1;
  while (remaining > 0) {
    const size = Math.min(partitionSize, remaining);
    parts.push({ id, size, free: true, label: 'Free', requested: 0 });
    remaining -= size;
    id += 1;
  }
  return parts;
};

const buildMvt = (memorySize) => [
  {
    id: 1,
    size: memorySize,
    free: true,
    label: 'Free',
    requested: 0,
  },
];

const coalesce = (segments) => {
  const merged = [];
  segments.forEach((seg) => {
    if (seg.free && merged.length && merged[merged.length - 1].free) {
      merged[merged.length - 1].size += seg.size;
    } else {
      merged.push({ ...seg });
    }
  });
  return merged;
};

export default MftMvt;
