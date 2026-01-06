let queue = [];
let totalServed = 0;
let occupiedSeats = 0;
let totalTakeout = 0;
let isRunning = false;
let baristas = []; 

function runSimulation() {
    if (isRunning) return; 
    isRunning = true;
    
    // UI Setup
    const startBtn = document.getElementById('startBtn');
    startBtn.disabled = true;
    startBtn.style.opacity = "0.5";
    
    const status = document.getElementById('statusText');
    status.innerText = "STATUS: OPEN (STOCHASTIC)";
    status.style.background = "#fff3e0"; // Soft orange for stochastic mode
    status.style.color = "#e65100";

    const arrivalRate = parseFloat(document.getElementById('arrivalRate').value);
    const serviceRate = parseFloat(document.getElementById('serviceSpeed').value);
    const numBaristas = parseInt(document.getElementById('baristaCount').value);
    const maxSeats = parseInt(document.getElementById('maxSeats').value);

    renderBaristas(numBaristas);
    renderSeats(maxSeats);

    // LOGIC 1: Stochastic Arrivals (Using Exponential Distribution)
    function scheduleNextArrival() {
        if (!isRunning) return;
        
        // Math: -ln(1-u) / rate to get random inter-arrival time
        const meanArrivalInterval = 1000 / arrivalRate;
        const nextArrivalIn = -Math.log(1 - Math.random()) * meanArrivalInterval;

        setTimeout(() => {
            queue.push(Date.now());
            updateUI();
            scheduleNextArrival(); // Recursively call for the next random arrival
        }, nextArrivalIn);
    }

    // LOGIC 2: Multi-Server Service Handling
    // This part stays as an interval to "check" for free baristas
    setInterval(() => {
        if (queue.length > 0) {
            const freeBarista = baristas.find(b => !b.isBusy);
            if (freeBarista) {
                serveCustomer(freeBarista, serviceRate, maxSeats);
            }
        }
    }, 100);

    // Start the arrival chain
    scheduleNextArrival();
}

function renderBaristas(num) {
    const container = document.getElementById('baristaStationContainer');
    container.innerHTML = '';
    baristas = [];
    for (let i = 0; i < num; i++) {
        baristas.push({ id: i, isBusy: false });
        container.innerHTML += `
            <div class="counter-box">
                <div class="barista-id">BARISTA ${i + 1}</div>
                <div class="barista-emoji">👨‍🍳</div>
                <div class="progress-container"><div id="progress-${i}" class="progress-bar"></div></div>
                <div id="label-${i}" class="action-label">IDLE</div>
            </div>
        `;
    }
}

function serveCustomer(barista, avgServiceRate, maxSeats) {
    barista.isBusy = true;
    queue.shift(); 
    updateUI();

    // Stochastic Service Time (Randomized around the average)
    const meanServiceTime = 1000 / avgServiceRate;
    const actualServiceTime = -Math.log(1 - Math.random()) * meanServiceTime;

    const bar = document.getElementById(`progress-${barista.id}`);
    const label = document.getElementById(`label-${barista.id}`);

    bar.style.transition = `width ${actualServiceTime}ms linear`;
    bar.style.width = "100%";
    label.innerText = "BREWING...";

    setTimeout(() => {
        totalServed++;
        barista.isBusy = false;
        bar.style.transition = "none";
        bar.style.width = "0%";
        label.innerText = "IDLE";

        if (occupiedSeats < maxSeats) {
            occupiedSeats++;
            setTimeout(() => {
                occupiedSeats--;
                updateUI();
            }, 5000); 
        } else {
            totalTakeout++;
            triggerFloatingText("+1 Takeout", barista.id);
        }

        updateUI();
    }, actualServiceTime);
}

function renderSeats(max) {
    const grid = document.getElementById('seatingDisplay');
    grid.innerHTML = '';
    for(let i=0; i<max; i++) {
        const seat = document.createElement('div');
        seat.className = 'seat';
        seat.id = `seat-${i}`;
        seat.innerText = 'S';
        grid.appendChild(seat);
    }
}

function updateUI() {
    const display = document.getElementById('queueDisplay');
    display.innerHTML = ''; 
    queue.forEach(() => {
        const div = document.createElement('div');
        div.className = 'customer';
        display.appendChild(div);
    });

    const maxSeats = parseInt(document.getElementById('maxSeats').value);
    for(let i=0; i<maxSeats; i++) {
        const seat = document.getElementById(`seat-${i}`);
        if(seat) {
            if(i < occupiedSeats) seat.classList.add('occupied');
            else seat.classList.remove('occupied');
        }
    }

    document.getElementById('qLen').innerText = queue.length;
    document.getElementById('sOcc').innerText = occupiedSeats;
    document.getElementById('tTakeout').innerText = totalTakeout;
    document.getElementById('tServed').innerText = totalServed;
}

function triggerFloatingText(text, baristaId) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    const allCounters = document.querySelectorAll('.counter-box');
    const bBox = allCounters[baristaId];
    if(bBox) {
        bBox.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }
}