
const $ = id => document.getElementById(id);

let simulation = [];
let step = 0;
let timer = null;
let running = false;
let completed = false;
let initialHead = 53;
let diskSize = 200;
let requestCount = 0;
let currentMovement = 0;
let currentAlgorithm = "FCFS";
let comparisonResults = [];

// Generate seek sequence for all algorithms
function generateSequence(queue, head, size, algorithm, direction) {
    const left = queue.filter(x => x < head).sort((a,b) => b-a);
    const right = queue.filter(x => x >= head).sort((a,b) => a-b);

    let sequence = [head];

    switch (algorithm) {
        case "FCFS":
            sequence.push(...queue);
            break;

        case "SSTF": {
            let remaining = queue.map((value, index) => ({
                value, index
            }));

            let current = head;

            while (remaining.length) {
                let nearest = 0;

                for (let i = 1; i < remaining.length; i++) {
                    if (
                        Math.abs(remaining[i].value - current) <
                        Math.abs(remaining[nearest].value - current)
                    ) {
                        nearest = i;
                    }
                }

                current = remaining[nearest].value;
                sequence.push(current);
                remaining.splice(nearest, 1);
            }
            break;
        }

        case "SCAN":
            if (direction === "right") {
                sequence.push(...right);

                if (sequence.at(-1) !== size - 1)
                    sequence.push(size - 1);

                sequence.push(...left);
            } else {
                sequence.push(...left);

                if (sequence.at(-1) !== 0)
                    sequence.push(0);

                sequence.push(...right.reverse());
            }
            break;

        case "CSCAN":
            if (direction === "right") {
                sequence.push(...right);

                if (sequence.at(-1) !== size - 1)
                    sequence.push(size - 1);

                if (left.length) {
                    sequence.push(0);
                    sequence.push(...left);
                }
            } else {
                sequence.push(...left);

                if (sequence.at(-1) !== 0)
                    sequence.push(0);

                if (right.length) {
                    sequence.push(size - 1);
                    sequence.push(...right.reverse());
                }
            }
            break;

        case "LOOK":
            if (direction === "right") {
                sequence.push(...right, ...left);
            } else {
                sequence.push(...left, ...right.reverse());
            }
            break;

        case "CLOOK":
            if (direction === "right") {
                sequence.push(...right);

                if (left.length) {
                    sequence.push(...left);
                }
            } else {
                sequence.push(...left);

                if (right.length) {
                    sequence.push(...right.reverse());
                }
            }
            break;
    }

    return sequence;
}

// Calculate total movement
function calculateMovement(sequence) {
    let total = 0;

    for (let i = 1; i < sequence.length; i++) {
        total += Math.abs(sequence[i] - sequence[i - 1]);
    }

    return total;
}

// Start a new simulation
function analyzeDisk() {
    pauseSimulation();

    const queueText = $("queue").value.trim();
    const head = Number($("head").value);
    const size = Number($("diskSize").value);
    const direction = $("direction").value;
    const algorithm = $("algorithm").value;

    if (!queueText) {
        alert("Please enter the request queue.");
        return;
    }

    const requests = queueText.split(",").map(x => x.trim());

    if (requests.some(x => x === "" || !/^\d+$/.test(x))) {
        alert("Enter valid comma-separated integer requests.");
        return;
    }

    const queue = requests.map(Number);

    if (
        !Number.isInteger(head) ||
        !Number.isInteger(size) ||
        size < 2 ||
        head < 0 || head >= size ||
        queue.some(x => x < 0 || x >= size)
    ) {
        alert("Invalid head position, disk size or request values.");
        return;
    }

    initialHead = head;
    diskSize = size;
    requestCount = queue.length;
    currentMovement = 0;
    completed = false;
    step = 0;

    const names = ["FCFS", "SSTF", "SCAN", "CSCAN", "LOOK", "CLOOK"];

    comparisonResults = names.map(name => {
        const seq = generateSequence(
            queue, head, size, name, direction
        );

        return {
            name,
            sequence: seq,
            movement: calculateMovement(seq),
            average: calculateMovement(seq) / queue.length
        };
    });

    let selected = algorithm;

    if (algorithm === "ALL") {
        const rankedResults = [...comparisonResults].sort((a,b) =>
            a.movement - b.movement
        );

        selected = rankedResults[0].name;
    }

    showComparison(selected);

    currentAlgorithm = selected;

    simulation = generateSequence(
        queue, head, size, selected, direction
    );

    setupTrack(queue);

    $("currentHead").textContent = head;
    $("totalMovement").textContent = "0";
    $("averageMovement").textContent = "0";
    $("progressBar").style.width = "0%";

    $("sequence").innerHTML = simulation.map((value, i) =>
        `<span data-step="${i}">${value}</span>`
    ).join("");

    $("status").textContent =
        "Ready: " + selected + " algorithm selected.";

    $("playBtn").textContent = "▶ Play";

    drawGraph([head]);

    updateButtons();
}

// Configure disk track
function setupTrack(queue) {
    $("middleLabel").textContent =
        Math.floor((diskSize - 1) / 2);

    $("lastLabel").textContent = diskSize - 1;

    $("requestLabels").innerHTML =
        [...new Set(queue)].sort((a,b) => a-b)
        .map(x => `<span>${x}</span>`).join("");

    moveHead(initialHead);
}

// Move disk head visually
function moveHead(position) {
    const percentage = (position / (diskSize - 1)) * 100;

    $("headMarker").style.left = percentage + "%";
    $("headLabel").textContent = position;
    $("currentHead").textContent = position;
}

// Play simulation
function playSimulation() {
    if (!simulation.length) {
        alert("Generate a simulation first.");
        return;
    }

    if (completed) {
        resetSimulation();
    }

    if (running) return;

    running = true;
    $("playBtn").textContent = "▶ Playing";
    $("status").textContent = "Simulation running...";

    const speed = Number($("speed").value);

    timer = setInterval(() => {
        if (step >= simulation.length - 1) {
            finishSimulation();
            return;
        }

        step++;

        const previous = simulation[step - 1];
        const current = simulation[step];

        currentMovement += Math.abs(current - previous);

        moveHead(current);

        $("totalMovement").textContent = currentMovement;

        $("averageMovement").textContent =
            (currentMovement / requestCount).toFixed(2);

        const percentage =
            (step / (simulation.length - 1)) * 100;

        $("progressBar").style.width = percentage + "%";

        document.querySelectorAll(".sequence span").forEach(el => {
            el.classList.toggle(
                "active",
                Number(el.dataset.step) === step
            );
        });

        $("status").textContent =
            `Step ${step} of ${simulation.length - 1}: ` +
            `${previous} → ${current} | Movement: ` +
            Math.abs(current - previous);

        drawGraph(simulation.slice(0, step + 1));

        if (step >= simulation.length - 1) {
            finishSimulation();
        }
    }, speed);

    updateButtons();
}

// Pause
function pauseSimulation() {
    if (timer !== null) {
        clearInterval(timer);
        timer = null;
    }

    running = false;
    updateButtons();
}

// Finish
function finishSimulation() {
    pauseSimulation();

    completed = true;

    $("status").textContent =
        `Simulation completed! Total head movement: ${currentMovement}`;

    $("progressBar").style.width = "100%";
    $("playBtn").textContent = "▶ Replay";

    updateButtons();
}

// Reset
function resetSimulation() {
    pauseSimulation();

    step = 0;
    currentMovement = 0;
    completed = false;

    if (!simulation.length) return;

    moveHead(initialHead);

    $("totalMovement").textContent = "0";
    $("averageMovement").textContent = "0";
    $("progressBar").style.width = "0%";

    $("sequence").querySelectorAll("span").forEach(el => {
        el.classList.remove("active");
    });

    $("status").textContent = "Simulation reset. Ready to play.";

    $("playBtn").textContent = "▶ Play";

    drawGraph([initialHead]);

    updateButtons();
}

// Update button states
function updateButtons() {
    $("playBtn").disabled = running;
    $("pauseBtn").disabled = !running;
}

// Algorithm comparison
function showComparison(selected) {
    const best = Math.min(
        ...comparisonResults.map(x => x.movement)
    );
    const ranked = [...comparisonResults].sort((a, b) =>
        a.movement - b.movement
    );
    const worst = Math.max(...comparisonResults.map(x => x.movement));

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Algorithm</th>
                    <th>Total Movement</th>
                    <th>Average Movement</th>
                    <th>Seek Sequence</th>
                </tr>
            </thead>
            <tbody>
    `;

    ranked.forEach((result, index) => {
        const barWidth = worst === 0
            ? 100
            : Math.max(8, (1 - (result.movement - best) / (worst - best || 1)) * 100);

        html += `
            <tr>
                <td>${index + 1}</td>
                <td class="${result.movement === best ? "best" : ""}">
                    ${result.name}
                </td>
                <td>
                    <strong>${result.movement}</strong>
                    <div class="movement-bar" aria-label="${result.movement} cylinders">
                        <span style="width:${barWidth}%"></span>
                    </div>
                </td>
                <td>${result.average.toFixed(2)}</td>
                <td class="sequence-cell">${result.sequence.join(" -> ")}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        <p class="best" style="margin-top:15px">
            Best algorithm: ${
                comparisonResults
                    .filter(x => x.movement === best)
                    .map(x => x.name).join(", ")
            } (${best} cylinders)
        </p>
        <p style="margin-top:8px">
            Current simulation: ${selected}.
        </p>
    `;

    $("comparison").innerHTML = html;
}

// Draw head movement graph
function drawGraph(sequence) {
    const canvas = $("movementChart");
    const rect = canvas.getBoundingClientRect();

    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.max(1, rect.width * ratio);
    canvas.height = 320 * ratio;

    const ctx = canvas.getContext("2d");

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const width = rect.width;
    const height = 320;

    const padding = 40;

    ctx.clearRect(0, 0, width, height);

    function getX(i) {
        return padding +
            i * (width - 2 * padding) /
            Math.max(sequence.length - 1, 1);
    }

    function getY(value) {
        return height - padding -
            value / (diskSize - 1) *
            (height - 2 * padding);
    }

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
        const y = padding + i * (height - 2 * padding) / 4;

        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }

    if (sequence.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 3;

        sequence.forEach((value, i) => {
            if (i === 0) {
                ctx.moveTo(getX(i), getY(value));
            } else {
                ctx.lineTo(getX(i), getY(value));
            }
        });

        ctx.stroke();
    }

    sequence.forEach((value, i) => {
        ctx.beginPath();
        ctx.arc(getX(i), getY(value), 5, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444";
        ctx.fill();

        ctx.fillStyle = "#334155";
        ctx.font = "11px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            value,
            getX(i),
            Math.max(12, getY(value) - 10)
        );
    });

    ctx.fillStyle = "#64748b";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        "Request Order",
        width / 2,
        height - 7
    );
}

// Button events
$("analyzeBtn").addEventListener("click", analyzeDisk);

$("playBtn").addEventListener("click", playSimulation);

$("pauseBtn").addEventListener("click", pauseSimulation);

$("resetBtn").addEventListener("click", resetSimulation);

$("speed").addEventListener("change", () => {
    if (running) {
        pauseSimulation();
        playSimulation();
    }
});

window.addEventListener("resize", () => {
    if (simulation.length) {
        drawGraph(simulation.slice(0, step + 1));
    }
});

// Initial display
setupTrack([98, 183, 37, 122, 14, 124, 65, 67]);
drawGraph([53]);
updateButtons();
