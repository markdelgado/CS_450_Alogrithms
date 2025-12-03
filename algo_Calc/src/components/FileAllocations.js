import { useEffect, useMemo, useState } from 'react';

const strategies = [
  { value: 'contiguous', label: 'Contiguous' },
  { value: 'linked', label: 'Linked' },
  { value: 'indexed', label: 'Indexed (1-level)' },
];

const totalBlocks = 48;

const FileAllocations = () => {
  const [disk, setDisk] = useState(buildInitialDisk());
  const [strategy, setStrategy] = useState('contiguous');
  const [fileSize, setFileSize] = useState(6);
  const [indexBlockSize, setIndexBlockSize] = useState(1);
  const [log, setLog] = useState(['Initialized disk with some blocks in use.']);
  const [flashIds, setFlashIds] = useState([]);

  const freeBlocks = useMemo(() => disk.filter((b) => b.free).length, [disk]);
  const usedBlocks = totalBlocks - freeBlocks;

  const reset = () => {
    setDisk(buildInitialDisk());
    setLog(['Reset disk to initial state.']);
    setFlashIds([]);
  };

  const addLog = (entry) => setLog((prev) => [entry, ...prev].slice(0, 12));

  const animateFlash = (ids) => {
    setFlashIds(ids);
  };

  const allocate = () => {
    const size = Number(fileSize);
    if (!Number.isFinite(size) || size <= 0) {
      addLog('Enter a positive file size (blocks).');
      return;
    }

    switch (strategy) {
      case 'contiguous':
        allocateContiguous(size);
        break;
      case 'linked':
        allocateLinked(size);
        break;
      case 'indexed':
        allocateIndexed(size);
        break;
      default:
        break;
    }
  };

  const allocateContiguous = (size) => {
    const stretch = findStretch(disk, size);
    if (!stretch) {
      addLog(`Contiguous allocation failed: no stretch of ${size} free blocks.`);
      return;
    }
    const updated = disk.map((block, idx) =>
      idx >= stretch.start && idx < stretch.start + size
        ? { ...block, free: false, label: `F${block.id}` }
        : block,
    );
    setDisk(updated);
    setFlashIds(range(stretch.start, stretch.start + size));
    animateFlash(range(stretch.start, stretch.start + size));
    addLog(`Contiguous: placed file in blocks ${stretch.start}-${stretch.start + size - 1}.`);
  };

  const allocateLinked = (size) => {
    if (size > freeBlocks) {
      addLog('Linked allocation failed: not enough free blocks.');
      return;
    }
    const picked = pickRandomFreeBlocks(disk, size);
    const updated = disk.map((block, idx) =>
      picked.includes(idx) ? { ...block, free: false, label: `F${block.id}` } : block,
    );
    setDisk(updated);
    animateFlash(picked);
    addLog(`Linked: allocated ${size} scattered blocks with next pointers.`);
  };

  const allocateIndexed = (size) => {
    const dataBlocksNeeded = size;
    const idxBlocksNeeded = Number(indexBlockSize) || 1;
    const totalNeeded = dataBlocksNeeded + idxBlocksNeeded;
    if (totalNeeded > freeBlocks) {
      addLog('Indexed allocation failed: insufficient free blocks for index + data.');
      return;
    }

    const picked = pickRandomFreeBlocks(disk, totalNeeded);
    const indexBlocks = picked.slice(0, idxBlocksNeeded);
    const dataBlocks = picked.slice(idxBlocksNeeded);

    const updated = disk.map((block, idx) => {
      if (indexBlocks.includes(idx)) return { ...block, free: false, label: 'Index' };
      if (dataBlocks.includes(idx)) return { ...block, free: false, label: `F${block.id}` };
      return block;
    });

    setDisk(updated);
    animateFlash(picked);
    addLog(
      `Indexed: reserved ${idxBlocksNeeded} index block(s) and ${dataBlocksNeeded} data block(s).`,
    );
  };

  const clearRandomFile = () => {
    const allocated = disk.filter((block) => !block.free);
    if (!allocated.length) {
      addLog('Nothing to free.');
      return;
    }
    const targetLabel = allocated[0].label;
    const updated = disk.map((block, idx) =>
      block.label === targetLabel ? { ...block, free: true, label: 'Free', id: idx + 1 } : block,
    );
    const freedIds = updated
      .map((block, idx) => (block.label === 'Free' && block.id === idx + 1 ? idx : null))
      .filter((idx) => idx !== null);
    setDisk(updated);
    animateFlash(freedIds);
    addLog(`Freed blocks labeled ${targetLabel}.`);
  };

  const overhead = useMemo(() => {
    switch (strategy) {
      case 'contiguous':
        return { seek: 1, metadata: 1 };
      case 'linked':
        return { seek: 2, metadata: fileSize };
      case 'indexed':
        return { seek: 2, metadata: Number(indexBlockSize) || 1 };
      default:
        return { seek: 1, metadata: 1 };
    }
  }, [strategy, fileSize, indexBlockSize]);

  useEffect(() => {
    if (flashIds.length) {
      const timer = setTimeout(() => setFlashIds([]), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [flashIds]);

  return (
    <section id="file-allocations" className="content-section">
      <h2>File Allocations</h2>
      <p>Simulate contiguous, linked, and indexed (1-level) allocation. Visualize placement and compare overhead.</p>

      <div className="section-card">
        <div className="scheduler-grid">
          <div>
            <h3>Setup</h3>
            <div className="scheduler-form">
              <label>
                Strategy
                <select value={strategy} onChange={(event) => setStrategy(event.target.value)}>
                  {strategies.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                File Size (blocks)
                <input
                  type="number"
                  min="1"
                  value={fileSize}
                  onChange={(event) => setFileSize(Number(event.target.value))}
                />
              </label>
              {strategy === 'indexed' && (
                <label>
                  Index Blocks (1-level)
                  <input
                    type="number"
                    min="1"
                    value={indexBlockSize}
                    onChange={(event) => setIndexBlockSize(Number(event.target.value))}
                  />
                </label>
              )}
              <div className="button-row">
                <button type="button" className="btn primary" onClick={allocate}>
                  Allocate
                </button>
                <button type="button" className="btn secondary" onClick={clearRandomFile}>
                  Free a File
                </button>
                <button type="button" className="btn ghost" onClick={reset}>
                  Reset
                </button>
              </div>
            </div>
            <p className="muted-text small-text">
              Linked/Indexed pick free blocks randomly to mimic non-contiguous placement.
            </p>
          </div>

          <div>
            <h3>Metrics</h3>
            <div className="summary-grid">
              <div>
                <p className="summary-label">Free Blocks</p>
                <p className="summary-value">{freeBlocks}</p>
              </div>
              <div>
                <p className="summary-label">Used Blocks</p>
                <p className="summary-value">{usedBlocks}</p>
              </div>
              <div>
                <p className="summary-label">Seek Overhead</p>
                <p className="summary-value">{overhead.seek} seeks</p>
              </div>
              <div>
                <p className="summary-label">Metadata Blocks</p>
                <p className="summary-value">{overhead.metadata}</p>
              </div>
            </div>

            <div className="disk-grid">
              {disk.map((block, idx) => (
                <div
                  key={block.id}
                  className={`disk-block ${block.free ? 'free' : 'used'} ${
                    flashIds.includes(idx) ? 'flash' : ''
                  }`}
                  title={`Block ${idx} - ${block.label}`}
                >
                  <span>{block.free ? '•' : block.label}</span>
                </div>
              ))}
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

const buildInitialDisk = () =>
  Array.from({ length: totalBlocks }, (_, idx) => ({
    id: idx + 1,
    free: Math.random() > 0.3,
    label: 'Free',
  }));

const findStretch = (disk, size) => {
  let count = 0;
  let start = 0;
  for (let i = 0; i < disk.length; i += 1) {
    if (disk[i].free) {
      if (count === 0) start = i;
      count += 1;
      if (count >= size) return { start };
    } else {
      count = 0;
    }
  }
  return null;
};

const pickRandomFreeBlocks = (disk, count) => {
  const free = disk
    .map((block, idx) => ({ block, idx }))
    .filter((item) => item.block.free)
    .map((item) => item.idx);
  const picked = [];
  const copy = [...free];
  while (picked.length < count && copy.length) {
    const r = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(r, 1)[0]);
  }
  return picked;
};

const range = (start, end) => Array.from({ length: end - start }, (_, i) => start + i);

export default FileAllocations;
