const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer));
    });
}

// =============================================================
//               PRINT RESULTS FUNCTION
// =============================================================
function printResults(title, partitions, processes, partAlloc, procAlloc, internalFrag) {
    console.log("\n-------------------------------------------------------");
    console.log(`               ~ ${title} ~`);
    console.log("-------------------------------------------------------");

    let totalMemory = partitions.reduce((a, b) => a + b, 0);
    let totalInternal = internalFrag.reduce((a, b) => a + b, 0);

    let notAllocated = procAlloc.filter(x => x === -1).length;

    console.log(`\nTotal memory: ${totalMemory}`);
    console.log(`Total internal fragmentation: ${totalInternal}`);
    console.log(`Processes NOT allocated: ${notAllocated}\n`);

    console.log("ProcID\tMemRequired\tAllocated\tPartition");
    for (let i = 0; i < processes.length; i++) {
        let alloc = procAlloc[i] !== -1 ? "Yes" : "No";
        let partID = procAlloc[i] !== -1 ? procAlloc[i] + 1 : "-";
        console.log(`${i + 1}\t${processes[i]}\t\t${alloc}\t\t${partID}`);
    }

    console.log("\nPartID\tAllocated\tInterFrag\tProcID");
    for (let i = 0; i < partitions.length; i++) {
        let alloc = partAlloc[i] !== -1 ? "Yes" : "No";
        let pid = partAlloc[i] !== -1 ? partAlloc[i] + 1 : "-";
        console.log(`${i + 1}\t${alloc}\t\t${internalFrag[i]}\t\t${pid}`);
    }

    console.log("-------------------------------------------------------\n");
}


// =============================================================
//               FIRST FIT
// =============================================================
function firstFit(partitions, processes) {
    let partAlloc = Array(partitions.length).fill(-1);
    let procAlloc = Array(processes.length).fill(-1);
    let internalFrag = Array(partitions.length).fill(0);

    for (let i = 0; i < processes.length; i++) {
        for (let j = 0; j < partitions.length; j++) {
            if (partAlloc[j] === -1 && partitions[j] >= processes[i]) {
                procAlloc[i] = j;
                partAlloc[j] = i;
                internalFrag[j] = partitions[j] - processes[i];
                break;
            }
        }
    }

    return { partAlloc, procAlloc, internalFrag };
}


// =============================================================
//               BEST FIT
// =============================================================
function bestFit(partitions, processes) {
    let partAlloc = Array(partitions.length).fill(-1);
    let procAlloc = Array(processes.length).fill(-1);
    let internalFrag = Array(partitions.length).fill(0);

    for (let i = 0; i < processes.length; i++) {
        let bestIndex = -1;

        for (let j = 0; j < partitions.length; j++) {
            if (partAlloc[j] === -1 && partitions[j] >= processes[i]) {
                if (bestIndex === -1 || partitions[j] < partitions[bestIndex]) {
                    bestIndex = j;
                }
            }
        }

        if (bestIndex !== -1) {
            procAlloc[i] = bestIndex;
            partAlloc[bestIndex] = i;
            internalFrag[bestIndex] = partitions[bestIndex] - processes[i];
        }
    }

    return { partAlloc, procAlloc, internalFrag };
}


// =============================================================
//               WORST FIT
// =============================================================
function worstFit(partitions, processes) {
    let partAlloc = Array(partitions.length).fill(-1);
    let procAlloc = Array(processes.length).fill(-1);
    let internalFrag = Array(partitions.length).fill(0);

    for (let i = 0; i < processes.length; i++) {
        let worstIndex = -1;

        for (let j = 0; j < partitions.length; j++) {
            if (partAlloc[j] === -1 && partitions[j] >= processes[i]) {
                if (worstIndex === -1 || partitions[j] > partitions[worstIndex]) {
                    worstIndex = j;
                }
            }
        }

        if (worstIndex !== -1) {
            procAlloc[i] = worstIndex;
            partAlloc[worstIndex] = i;
            internalFrag[worstIndex] = partitions[worstIndex] - processes[i];
        }
    }

    return { partAlloc, procAlloc, internalFrag };
}


// =============================================================
//               NEXT FIT
// =============================================================
function nextFit(partitions, processes) {
    let partAlloc = Array(partitions.length).fill(-1);
    let procAlloc = Array(processes.length).fill(-1);
    let internalFrag = Array(partitions.length).fill(0);

    let lastIndex = 0;

    for (let i = 0; i < processes.length; i++) {
        let count = 0;
        let allocated = false;

        while (count < partitions.length) {
            if (partAlloc[lastIndex] === -1 && partitions[lastIndex] >= processes[i]) {
                procAlloc[i] = lastIndex;
                partAlloc[lastIndex] = i;
                internalFrag[lastIndex] = partitions[lastIndex] - processes[i];
                allocated = true;
                break;
            }

            lastIndex = (lastIndex + 1) % partitions.length;
            count++;
        }

        if (!allocated) procAlloc[i] = -1;
    }

    return { partAlloc, procAlloc, internalFrag };
}


// =============================================================
//               MAIN PROGRAM (INPUT + RUN)
// =============================================================
(async function main() {

    let numPartitions = parseInt(await ask("Enter number of partitions: "));
    let partitions = [];

    console.log("Enter size of each partition:");
    for (let i = 0; i < numPartitions; i++) {
        let size = parseInt(await ask(`Partition ${i + 1} size: `));
        partitions.push(size);
    }

    let numProcesses = parseInt(await ask("Enter number of processes: "));
    let processes = [];

    console.log("Enter memory required for each process:");
    for (let i = 0; i < numProcesses; i++) {
        let req = parseInt(await ask(`Process ${i + 1} memory required: `));
        processes.push(req);
    }

    // ---- RUN ALL ALGORITHMS ----
    let ff = firstFit(partitions, processes);
    printResults("FIRST FIT", partitions, processes, ff.partAlloc, ff.procAlloc, ff.internalFrag);

    let bf = bestFit(partitions, processes);
    printResults("BEST FIT", partitions, processes, bf.partAlloc, bf.procAlloc, bf.internalFrag);

    let wf = worstFit(partitions, processes);
    printResults("WORST FIT", partitions, processes, wf.partAlloc, wf.procAlloc, wf.internalFrag);

    let nf = nextFit(partitions, processes);
    printResults("NEXT FIT", partitions, processes, nf.partAlloc, nf.procAlloc, nf.internalFrag);

    rl.close();
})();