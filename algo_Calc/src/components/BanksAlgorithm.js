import { useMemo, useState } from 'react';

const sampleMax = [
  [7, 5, 3],
  [3, 2, 2],
  [9, 0, 2],
  [2, 2, 2],
  [4, 3, 3],
];

const sampleAllocation = [
  [0, 1, 0],
  [2, 0, 0],
  [3, 0, 2],
  [2, 1, 1],
  [0, 0, 2],
];

const sampleAvailable = [3, 3, 2];

const BanksAlgorithm = () => {
  const [maxMatrix, setMaxMatrix] = useState(sampleMax);
  const [allocation, setAllocation] = useState(sampleAllocation);
  const [available, setAvailable] = useState(sampleAvailable);
  const [request, setRequest] = useState({ process: 0, resources: [0, 1, 0] });
  const [message, setMessage] = useState('');

  const need = useMemo(
    () =>
      maxMatrix.map((row, i) => row.map((value, j) => Math.max(value - allocation[i][j], 0))),
    [maxMatrix, allocation],
  );

  const safetyResult = useMemo(
    () => checkSafety(available, allocation, need),
    [available, allocation, need],
  );

  const handleRequestChange = (index, value) => {
    const amount = Number(value);
    if (Number.isNaN(amount) || amount < 0) return;
    setRequest((prev) => {
      const updated = [...prev.resources];
      updated[index] = amount;
      return { ...prev, resources: updated };
    });
  };

  const handleProcessChange = (event) => {
    setRequest((prev) => ({ ...prev, process: Number(event.target.value) }));
  };

  const handleReset = () => {
    setMaxMatrix(sampleMax);
    setAllocation(sampleAllocation);
    setAvailable(sampleAvailable);
    setRequest({ process: 0, resources: [0, 1, 0] });
    setMessage('');
  };

  const handleSubmitRequest = () => {
    setMessage('');
    const { process: pid, resources: req } = request;

    if (pid < 0 || pid >= allocation.length) {
      setMessage('Select a valid process.');
      return;
    }

    const needRow = need[pid];
    if (!req.every((r, i) => r <= needRow[i])) {
      setMessage('Request exceeds process need. Denied.');
      return;
    }

    if (!req.every((r, i) => r <= available[i])) {
      setMessage('Request exceeds available resources. Denied.');
      return;
    }

    const newAvailable = available.map((a, i) => a - req[i]);
    const newAllocation = allocation.map((row, i) =>
      i === pid ? row.map((a, j) => a + req[j]) : row,
    );
    const newNeed = need.map((row, i) =>
      i === pid ? row.map((n, j) => n - req[j]) : row,
    );

    const tentative = checkSafety(newAvailable, newAllocation, newNeed);
    if (!tentative.safe) {
      setMessage('Request would lead to an unsafe state. Denied.');
      return;
    }

    setAvailable(newAvailable);
    setAllocation(newAllocation);
    setMessage(
      `Request granted. Safe sequence: ${tentative.sequence.map((p) => `P${p}`).join(' → ')}`,
    );
  };

  return (
    <section id="banks-algorithm" className="content-section">
      <h2>Bank&apos;s Algorithm</h2>
      <p>Evaluate system safety and handle resource requests using Banker&apos;s Algorithm.</p>

      <div className="section-card">
        <h3>Current State</h3>
        <div className="bank-grid">
          <MatrixTable title="Available" headers={['A', 'B', 'C']} rows={[available]} />
          <MatrixTable title="Max" headers={['A', 'B', 'C']} rows={maxMatrix} />
          <MatrixTable title="Allocation" headers={['A', 'B', 'C']} rows={allocation} />
          <MatrixTable title="Need (Max - Allocation)" headers={['A', 'B', 'C']} rows={need} />
        </div>

        <div className="summary-grid">
          <div>
            <p className="summary-label">System Safety</p>
            <p className="summary-value">
              {safetyResult.safe ? 'Safe' : 'Unsafe'}
            </p>
          </div>
          <div>
            <p className="summary-label">Safe Sequence</p>
            <p className="summary-value">
              {safetyResult.safe
                ? safetyResult.sequence.map((p) => `P${p}`).join(' → ')
                : 'No safe ordering'}
            </p>
          </div>
        </div>
      </div>

      <div className="section-card">
        <h3>Request Resources</h3>
        <p className="muted-text">
          Enter a request vector. It will be granted only if it does not exceed the process Need or
          current Available and leaves the system in a safe state.
        </p>
        <div className="bank-request">
          <label>
            Process
            <select value={request.process} onChange={handleProcessChange}>
              {allocation.map((_, idx) => (
                <option key={idx} value={idx}>{`P${idx}`}</option>
              ))}
            </select>
          </label>

          <div className="request-row">
            {request.resources.map((value, index) => (
              <label key={index}>
                {String.fromCharCode(65 + index)}
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(event) => handleRequestChange(index, event.target.value)}
                />
              </label>
            ))}
          </div>

          <div className="button-row">
            <button type="button" className="btn primary" onClick={handleSubmitRequest}>
              Submit Request
            </button>
            <button type="button" className="btn ghost" onClick={handleReset}>
              Reset Sample Data
            </button>
          </div>

          {message && <p className="form-error">{message}</p>}
        </div>
      </div>
    </section>
  );
};

const MatrixTable = ({ title, headers, rows }) => (
  <div>
    <div className="matrix-title">{title}</div>
    <table className="matrix-table">
      <thead>
        <tr>
          <th />
          {headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={`${title}-${rowIndex}`}>
            <td className="row-label">{row.length === headers.length ? `P${rowIndex}` : ''}</td>
            {row.map((value, colIndex) => (
              <td key={colIndex}>{value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const checkSafety = (available, allocation, need) => {
  const work = [...available];
  const finish = allocation.map(() => false);
  const sequence = [];

  let progress = true;
  while (progress) {
    progress = false;
    for (let i = 0; i < allocation.length; i += 1) {
      if (finish[i]) continue;
      const canFinish = need[i].every((required, idx) => required <= work[idx]);
      if (canFinish) {
        work.forEach((_, idx) => {
          work[idx] += allocation[i][idx];
        });
        finish[i] = true;
        sequence.push(i);
        progress = true;
      }
    }
  }

  const safe = finish.every(Boolean);
  return { safe, sequence };
};

export default BanksAlgorithm;
