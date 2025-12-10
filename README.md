# AlgoLab – Interactive OS Algorithm Lab

A tabbed React app with simulations for CPU scheduling, synchronization, memory, disks, paging, and file allocation. Each module offers inputs, metrics, and animated visuals to make the concepts concrete.

## Run / Build
- Install deps: `npm install`
- Dev server: `npm start`
- Production build: `npm run build` (output in `build/`)

## Modules & How They Work

### Process Scheduling (`src/components/ProcessScheduling.js`)
- Algorithms: FCFS, SJF (pre/non), Priority (pre/non), Round Robin (quantum), MLFQ (queue quanta).
- Data flow: `processes`, `settings`, and `selectedAlgorithm` live in React state; helpers (`runFcfs`, `runNonPreemptive`, `runPreemptive`, `runRoundRobin`, `runMlfq`) return a schedule enriched with start/finish/wait/turnaround.
- RR/MLFQ logic uses `remaining` time and rotates queues/levels; SJF/Priority share comparator helpers for preemptive and non-preemptive variants. Results are summarized, tabled, and rendered as a Gantt chart (bar width = burst, left offset = start).

### Process Synchronization (`src/components/ProcessSynchronization.js`)
- Concepts: mutexes, semaphores, monitors; classic Producer–Consumer, Readers–Writers, Dining Philosophers cards.
- Simulation: simple Producer–Consumer semaphore model with `bufferSize`, `items`, and derived empty/full; produce/consume handlers log P/V sequences and block when semaphores would be zero.

### Banker's Algorithm (`src/components/BanksAlgorithm.js`)
- State: `maxMatrix`, `allocation`, `available`, derived `need`.
- `checkSafety` runs the standard work/finish loop to find a safe sequence. Requests are validated (need/available), applied tentatively, and only committed if the safety check stays true. Matrices are rendered via a reusable `MatrixTable`.

### Fit Algorithms (`src/components/FitAlgorithm.js`)
- Algorithms: First/Best/Worst/Next Fit. Memory is a list of blocks `{size, free, label}` in state.
- Allocation picks a target hole (strategy-dependent), splits it into an allocated block + optional remainder, then coalesces neighbors on free. Next Fit stores a pointer to resume scanning. Stats compute free total, largest hole, internal/external fragmentation; the memory bar animates allocations.

### Page Replacement (`src/components/PageReplacement.js`)
- Algorithms: FIFO, LRU, MRU, CLOCK, WSClock (window=4), OPT.
- Simulation keeps `frames`, per-frame meta (`ref`, `lastUsed`), and a timeline. Each reference records hit/fault, replacement index, and frame snapshot; CLOCK/WSClock walk a hand flipping/ref-aging bits, OPT looks ahead for farthest future use. A Belady check runs FIFO at n vs n+1 frames to flag anomalies.

### Disk Scheduling (`src/components/DiskScheduling.js`)
- Algorithms: FCFS (as given), SSTF (nearest next), SCAN/CSCAN (sweep with/without jump), LOOK/CLOOK (like SCAN/CSCAN without end cylinders).
- `orderRequests` produces the visit order from head/direction; a timeline stores moves and cumulative seek. A track UI animates the head and request dots; metrics show total/avg seek.

### File Allocation (`src/components/FileAllocations.js`)
- Strategies: Contiguous (find stretch), Linked (random free blocks), Indexed (index + data blocks).
- Disk blocks live in state; allocations mark blocks and animate, frees coalesce for contiguous space. Overhead estimates (metadata/seek) vary by strategy.

### MFT / MVT (`src/components/MftMvt.js`)
- MFT: partitions are prebuilt from memory/partition size; allocation grabs first fitting free partition; internal fragmentation = partition size − requested.
- MVT: memory starts as one free segment; allocation splits a hole, free coalesces neighbors, compaction packs allocated segments and merges all free space; external fragmentation computed from free holes.

## UI Shell (`src/App.js`, `src/App.css`)
- Tabbed nav switches modules; Home hero (AlgoLab brand) links into featured simulators.
- Shared styles cover forms, tables, timelines (Gantt/track), logs, badges, and the compact navbar.
