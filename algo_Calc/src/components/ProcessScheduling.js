import { useState } from 'react';

const algorithmOptions = [
  { value: 'fcfs', label: 'First-Come, First-Served (FCFS)' },
  { value: 'sjfNonPreemptive', label: 'Shortest Job First (Non-Preemptive)' },
  { value: 'sjfPreemptive', label: 'Shortest Job First (Preemptive)' },
  { value: 'priorityNonPreemptive', label: 'Priority Scheduling (Non-Preemptive)' },
  { value: 'priorityPreemptive', label: 'Priority Scheduling (Preemptive)' },
  { value: 'roundRobin', label: 'Round Robin' },
  { value: 'mlfq', label: 'Multi-Level Feedback Queue (MLFQ)' },
];

const initialProcesses = [
  { id: 1, name: 'P1', arrival: 0, burst: 4, priority: 2 },
  { id: 2, name: 'P2', arrival: 1, burst: 3, priority: 1 },
  { id: 3, name: 'P3', arrival: 2, burst: 5, priority: 3 },
];

const defaultForm = { name: '', arrival: '', burst: '', priority: '1' };
const defaultSettings = { rrQuantum: '2', mlfqLevels: '2,4,8' };

const ProcessScheduling = () => {
  const [processes, setProcesses] = useState(initialProcesses);
  const [formData, setFormData] = useState(defaultForm);
  const [settings, setSettings] = useState(defaultSettings);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('fcfs');
  const [results, setResults] = useState(null);
  const [formError, setFormError] = useState('');
  const [runError, setRunError] = useState('');

  const processCount = processes.length;
  const algorithmLabel =
    algorithmOptions.find((option) => option.value === selectedAlgorithm)?.label || 'Selected Algorithm';

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (event) => {
    const { name, value } = event.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
    setResults(null);
    setRunError('');
  };

  const handleAddProcess = (event) => {
    event.preventDefault();
    setFormError('');
    setRunError('');

    const arrival = Number(formData.arrival);
    const burst = Number(formData.burst);
    const priority = Number(formData.priority || 1);

    if ([arrival, burst, priority].some((value) => Number.isNaN(value))) {
      setFormError('Arrival, burst, and priority must be numeric values.');
      return;
    }

    if (burst <= 0) {
      setFormError('Burst time must be greater than zero.');
      return;
    }

    const name = formData.name.trim() || `P${processCount + 1}`;
    const newProcess = {
      id: Date.now(),
      name,
      arrival,
      burst,
      priority,
    };

    setProcesses((prev) => [...prev, newProcess]);
    setFormData(defaultForm);
    setResults(null);
  };

  const handleRemoveProcess = (id) => {
    setProcesses((prev) => prev.filter((process) => process.id !== id));
    setResults(null);
    setRunError('');
  };

  const handleReset = () => {
    setProcesses(initialProcesses);
    setFormData(defaultForm);
    setSettings(defaultSettings);
    setResults(null);
    setFormError('');
    setRunError('');
    setSelectedAlgorithm('fcfs');
  };

  const handleAlgorithmChange = (event) => {
    setSelectedAlgorithm(event.target.value);
    setResults(null);
    setRunError('');
  };

  const runSelectedAlgorithm = () => {
    setRunError('');
    if (!processes.length) {
      setResults(null);
      return;
    }

    const strategy = schedulingStrategies[selectedAlgorithm];
    if (!strategy) {
      setRunError('Selected algorithm is not available yet.');
      return;
    }

    try {
      const schedule = strategy(processes, settings);
      const orderedSchedule = [...schedule].sort((a, b) => {
        if (a.startTime === b.startTime) {
          if (a.arrival === b.arrival) {
            return a.id - b.id;
          }
          return a.arrival - b.arrival;
        }
        return a.startTime - b.startTime;
      });

      const { averageWaiting, averageTurnaround } = computeAverages(orderedSchedule);
      setResults({
        schedule: orderedSchedule,
        averageWaiting,
        averageTurnaround,
        algorithmLabel,
      });
    } catch (error) {
      setRunError(error.message || 'Unable to execute the selected algorithm.');
      setResults(null);
    }
  };

  return (
    <section id="process-scheduling" className="content-section">
      <h2>Process Scheduling</h2>
      <p>
        Compare CPU scheduling strategies by entering process metadata, selecting an algorithm, and
        reviewing the resulting waiting and turnaround times. Lower priority numbers indicate higher priority.
      </p>

      <div className="section-card scheduler-grid">
        <div>
          <h3>Process Input</h3>
          <form className="scheduler-form" onSubmit={handleAddProcess}>
            <div className="form-row">
              <label>
                Process Name
                <input
                  name="name"
                  type="text"
                  placeholder={`e.g. P${processCount + 1}`}
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Arrival Time
                <input
                  name="arrival"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.arrival}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Burst Time
                <input
                  name="burst"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.burst}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Priority
                <input
                  name="priority"
                  type="number"
                  step="1"
                  value={formData.priority}
                  onChange={handleInputChange}
                />
              </label>
            </div>
            {formError && <p className="form-error">{formError}</p>}
            <div className="button-row">
              <button type="submit" className="btn primary">
                Add Process
              </button>
              <button type="button" className="btn secondary" onClick={handleReset}>
                Reset Sample Data
              </button>
            </div>
          </form>
        </div>

        <div>
          <h3>Ready Queue ({processCount})</h3>
          {processCount === 0 ? (
            <p className="muted-text">Add at least one process to test an algorithm.</p>
          ) : (
            <div className="table-wrapper">
              <table className="process-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Arrival</th>
                    <th>Burst</th>
                    <th>Priority</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {processes.map((process) => (
                    <tr key={process.id}>
                      <td>{process.name}</td>
                      <td>{process.arrival}</td>
                      <td>{process.burst}</td>
                      <td>{process.priority}</td>
                      <td>
                        <button
                          type="button"
                          className="btn ghost small"
                          onClick={() => handleRemoveProcess(process.id)}
                          aria-label={`Remove ${process.name}`}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="algorithm-controls">
            <label>
              Algorithm
              <select value={selectedAlgorithm} onChange={handleAlgorithmChange}>
                {algorithmOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {selectedAlgorithm === 'roundRobin' && (
              <label>
                Time Quantum
                <input
                  name="rrQuantum"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={settings.rrQuantum}
                  onChange={handleSettingsChange}
                />
              </label>
            )}

            {selectedAlgorithm === 'mlfq' && (
              <label>
                Queue Quantums
                <input
                  name="mlfqLevels"
                  type="text"
                  value={settings.mlfqLevels}
                  onChange={handleSettingsChange}
                  placeholder="e.g. 2,4,8"
                />
                <span className="helper-text">Comma-separated time slices for successive queues.</span>
              </label>
            )}
          </div>

          {selectedAlgorithm.includes('priority') && (
            <p className="muted-text helper-text">Lower numbers represent higher priority.</p>
          )}

          {runError && <p className="form-error">{runError}</p>}

          <button
            type="button"
            className="btn primary"
            onClick={runSelectedAlgorithm}
            disabled={processCount === 0}
          >
            Run {algorithmLabel}
          </button>
        </div>
      </div>

      {results && (
        <div className="section-card scheduler-results">
          <h3>{results.algorithmLabel}</h3>
          <div className="summary-grid">
            <div>
              <p className="summary-label">Average Waiting Time</p>
              <p className="summary-value">{results.averageWaiting.toFixed(2)} units</p>
            </div>
            <div>
              <p className="summary-label">Average Turnaround Time</p>
              <p className="summary-value">{results.averageTurnaround.toFixed(2)} units</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="process-table">
              <thead>
                <tr>
                  <th>Process</th>
                  <th>Arrival</th>
                  <th>Burst</th>
                  <th>Priority</th>
                  <th>Start</th>
                  <th>Finish</th>
                  <th>Waiting</th>
                  <th>Turnaround</th>
                </tr>
              </thead>
              <tbody>
                {results.schedule.map((process) => (
                  <tr key={process.id}>
                    <td>
                      <span className="tag">{process.name}</span>
                    </td>
                    <td>{process.arrival}</td>
                    <td>{process.burst}</td>
                    <td>{process.priority}</td>
                    <td>{process.startTime}</td>
                    <td>{process.completionTime}</td>
                    <td>{process.waitingTime}</td>
                    <td>{process.turnaroundTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

const prepareProcesses = (processes) =>
  processes.map((process, index) => ({
    ...process,
    order: index,
    arrival: Number(process.arrival),
    burst: Number(process.burst),
    priority: Number(
      process.priority !== undefined && process.priority !== null ? process.priority : 0,
    ),
  }));

const sortByArrival = (a, b) => {
  if (a.arrival === b.arrival) {
    return a.order - b.order;
  }
  return a.arrival - b.arrival;
};

const compareByBurst = (a, b) => {
  if (a.burst === b.burst) {
    return sortByArrival(a, b);
  }
  return a.burst - b.burst;
};

const compareByPriority = (a, b) => {
  if (a.priority === b.priority) {
    return sortByArrival(a, b);
  }
  return a.priority - b.priority;
};

const compareByRemaining = (a, b) => {
  if (a.remaining === b.remaining) {
    return sortByArrival(a, b);
  }
  return a.remaining - b.remaining;
};

const computeAverages = (schedule) => {
  if (!schedule.length) {
    return { averageWaiting: 0, averageTurnaround: 0 };
  }

  const totals = schedule.reduce(
    (acc, process) => {
      acc.waiting += process.waitingTime;
      acc.turnaround += process.turnaroundTime;
      return acc;
    },
    { waiting: 0, turnaround: 0 },
  );

  return {
    averageWaiting: totals.waiting / schedule.length,
    averageTurnaround: totals.turnaround / schedule.length,
  };
};

const runFcfs = (processes) => {
  const sorted = prepareProcesses(processes).sort(sortByArrival);
  let currentTime = 0;

  return sorted.map((process) => {
    const startTime = Math.max(process.arrival, currentTime);
    const completionTime = startTime + process.burst;
    currentTime = completionTime;
    const turnaroundTime = completionTime - process.arrival;
    const waitingTime = turnaroundTime - process.burst;
    return { ...process, startTime, completionTime, waitingTime, turnaroundTime };
  });
};

const runNonPreemptive = (processes, comparator) => {
  const pending = prepareProcesses(processes).sort(sortByArrival);
  const schedule = [];
  let time = pending.length ? pending[0].arrival : 0;

  while (pending.length) {
    const currentTime = time;
    const available = pending.filter((process) => process.arrival <= currentTime);
    if (!available.length) {
      time = pending[0].arrival;
      continue;
    }

    available.sort(comparator);
    const nextProcess = available[0];
    const removalIndex = pending.indexOf(nextProcess);
    pending.splice(removalIndex, 1);

    const startTime = Math.max(currentTime, nextProcess.arrival);
    const completionTime = startTime + nextProcess.burst;
    const turnaroundTime = completionTime - nextProcess.arrival;
    const waitingTime = turnaroundTime - nextProcess.burst;

    schedule.push({
      ...nextProcess,
      startTime,
      completionTime,
      waitingTime,
      turnaroundTime,
    });

    time = completionTime;
  }

  return schedule;
};

const runPreemptive = (processes, comparator) => {
  const data = prepareProcesses(processes).map((process) => ({
    ...process,
    remaining: process.burst,
    startTime: null,
    completionTime: null,
  }));

  let time = data.length ? Math.min(...data.map((process) => process.arrival)) : 0;

  while (data.some((process) => process.remaining > 0)) {
    const currentTime = time;
    const available = data.filter(
      (process) => process.arrival <= currentTime && process.remaining > 0,
    );

    if (!available.length) {
      const nextArrival = data
        .filter((process) => process.remaining > 0)
        .reduce((min, process) => Math.min(min, process.arrival), Infinity);
      if (!Number.isFinite(nextArrival)) {
        break;
      }
      time = nextArrival;
      continue;
    }

    available.sort(comparator);
    const current = available[0];
    if (current.startTime === null) {
      current.startTime = currentTime;
    }

    const nextArrival = data
      .filter((process) => process.arrival > currentTime && process.remaining > 0)
      .reduce((min, process) => Math.min(min, process.arrival), Infinity);

    const finishTime = currentTime + current.remaining;
    const nextTime =
      Number.isFinite(nextArrival) && nextArrival < finishTime ? nextArrival : finishTime;
    const elapsed = nextTime - currentTime;

    current.remaining -= elapsed;
    time = nextTime;

    if (current.remaining === 0) {
      current.completionTime = time;
    }
  }

  return data.map((process) => {
    const completionTime =
      process.completionTime ?? process.arrival + Math.max(process.remaining, 0);
    const turnaroundTime = completionTime - process.arrival;
    const waitingTime = turnaroundTime - process.burst;
    return {
      ...process,
      startTime: process.startTime ?? process.arrival,
      completionTime,
      waitingTime,
      turnaroundTime,
    };
  });
};

const runRoundRobin = (processes, settings) => {
  const quantum = Number(settings?.rrQuantum);
  if (!Number.isFinite(quantum) || quantum <= 0) {
    throw new Error('Provide a positive time quantum for Round Robin.');
  }

  const data = prepareProcesses(processes).map((process) => ({
    ...process,
    remaining: process.burst,
    startTime: null,
    completionTime: null,
  }));

  const pending = [...data].sort(sortByArrival);
  const ready = [];
  let time = pending.length ? pending[0].arrival : 0;

  while (ready.length || pending.length) {
    while (pending.length && pending[0].arrival <= time) {
      ready.push(pending.shift());
    }

    if (!ready.length) {
      time = pending[0].arrival;
      continue;
    }

    const current = ready.shift();
    if (current.startTime === null) {
      current.startTime = time;
    }

    const runTime = Math.min(quantum, current.remaining);
    current.remaining -= runTime;
    time += runTime;

    while (pending.length && pending[0].arrival <= time) {
      ready.push(pending.shift());
    }

    if (current.remaining > 0) {
      ready.push(current);
    } else {
      current.completionTime = time;
    }
  }

  return data.map((process) => {
    const completionTime = process.completionTime ?? process.arrival + process.burst;
    const turnaroundTime = completionTime - process.arrival;
    const waitingTime = turnaroundTime - process.burst;
    return {
      ...process,
      startTime: process.startTime ?? process.arrival,
      completionTime,
      waitingTime,
      turnaroundTime,
    };
  });
};

const runMlfq = (processes, settings) => {
  const levels = parseMlfqLevels(settings?.mlfqLevels);
  if (!levels.length) {
    throw new Error('Enter at least one time quantum for MLFQ (e.g. 2,4,8).');
  }

  const quantums = [...levels, Infinity];
  const queues = quantums.map(() => []);

  const data = prepareProcesses(processes).map((process) => ({
    ...process,
    remaining: process.burst,
    level: 0,
    startTime: null,
    completionTime: null,
  }));

  const pending = [...data].sort(sortByArrival);
  let time = pending.length ? pending[0].arrival : 0;

  const hasWork = () => pending.length || queues.some((queue) => queue.length);

  while (hasWork()) {
    while (pending.length && pending[0].arrival <= time) {
      const arriving = pending.shift();
      arriving.level = 0;
      queues[0].push(arriving);
    }

    const queueIndex = queues.findIndex((queue) => queue.length);
    if (queueIndex === -1) {
      if (pending.length) {
        time = pending[0].arrival;
      }
      continue;
    }

    const current = queues[queueIndex].shift();
    if (current.startTime === null) {
      current.startTime = time;
    }

    const quantum = quantums[queueIndex];
    const runTime = Math.min(quantum, current.remaining);
    current.remaining -= runTime;
    time += runTime;

    while (pending.length && pending[0].arrival <= time) {
      const arriving = pending.shift();
      arriving.level = 0;
      queues[0].push(arriving);
    }

    if (current.remaining > 0) {
      const nextLevel = Math.min(queueIndex + 1, queues.length - 1);
      current.level = nextLevel;
      queues[nextLevel].push(current);
    } else {
      current.completionTime = time;
    }
  }

  return data.map((process) => {
    const completionTime = process.completionTime ?? process.arrival + process.burst;
    const turnaroundTime = completionTime - process.arrival;
    const waitingTime = turnaroundTime - process.burst;
    return {
      ...process,
      startTime: process.startTime ?? process.arrival,
      completionTime,
      waitingTime,
      turnaroundTime,
    };
  });
};

const parseMlfqLevels = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((token) => Number(token.trim()))
    .filter((number) => Number.isFinite(number) && number > 0);
};

const schedulingStrategies = {
  fcfs: (processes) => runFcfs(processes),
  sjfNonPreemptive: (processes) => runNonPreemptive(processes, compareByBurst),
  sjfPreemptive: (processes) => runPreemptive(processes, compareByRemaining),
  priorityNonPreemptive: (processes) => runNonPreemptive(processes, compareByPriority),
  priorityPreemptive: (processes) => runPreemptive(processes, compareByPriority),
  roundRobin: (processes, settings) => runRoundRobin(processes, settings),
  mlfq: (processes, settings) => runMlfq(processes, settings),
};

export default ProcessScheduling;
