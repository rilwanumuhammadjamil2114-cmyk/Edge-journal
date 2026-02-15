// ---------- Data Management ----------
let trades = [];
let logs = [];

const STORAGE_KEYS = {
    TRADES: 'trading_journal_trades',
    LOGS: 'trading_journal_logs'
};

// Load data from localStorage
function loadData() {
    const storedTrades = localStorage.getItem(STORAGE_KEYS.TRADES);
    const storedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    trades = storedTrades ? JSON.parse(storedTrades) : [];
    logs = storedLogs ? JSON.parse(storedLogs) : [];
}

// Save data to localStorage
function saveData() {
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
}

// Generate a simple unique ID
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// Add a log entry
function addLog(action, tradeId, instrument, details) {
    const log = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action: action,
        tradeId: tradeId,
        instrument: instrument,
        details: details
    };
    logs.push(log);
    saveData();
}

// ---------- Routing ----------
function navigate(view, param) {
    // Update active nav link (optional)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.view === view) {
            link.classList.add('active');
        }
    });

    // Render the appropriate view
    if (view === 'dashboard') showDashboard();
    else if (view === 'add') showAddForm();
    else if (view === 'edit') showAddForm(param); // param = trade id
    else if (view === 'logs') showLogs();
}

// ---------- View Rendering ----------
function showDashboard() {
    const app = document.getElementById('app');
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.profitLoss > 0).length;
    const losingTrades = totalTrades - winningTrades;
    const winRate = totalTrades ? (winningTrades / totalTrades * 100).toFixed(1) : 0;
    const totalPnl = trades.reduce((sum, t) => sum + t.profitLoss, 0).toFixed(2);

    let html = `
        <h2>Dashboard</h2>
        <div class="row mb-4">
            <div class="col-md-2"><div class="card text-white bg-primary card-stat"><div class="card-body"><h5>Total Trades</h5><p class="display-6">${totalTrades}</p></div></div></div>
            <div class="col-md-2"><div class="card text-white bg-success card-stat"><div class="card-body"><h5>Winning</h5><p class="display-6">${winningTrades}</p></div></div></div>
            <div class="col-md-2"><div class="card text-white bg-danger card-stat"><div class="card-body"><h5>Losing</h5><p class="display-6">${losingTrades}</p></div></div></div>
            <div class="col-md-3"><div class="card text-white bg-info card-stat"><div class="card-body"><h5>Win Rate</h5><p class="display-6">${winRate}%</p></div></div></div>
            <div class="col-md-3"><div class="card text-white bg-warning card-stat"><div class="card-body"><h5>Total P&L</h5><p class="display-6">$${totalPnl}</p></div></div></div>
        </div>
        <h3>Recent Trades</h3>
        <table class="table table-striped table-hover">
            <thead><tr><th>Date</th><th>Instrument</th><th>Direction</th><th>Entry</th><th>Exit</th><th>Stop Loss</th><th>Take Profit</th><th>P&L</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>
    `;

    if (trades.length === 0) {
        html += `<tr><td colspan="10" class="text-center">No trades yet. <a href="#" data-view="add">Add one</a>.</td></tr>`;
    } else {
        trades.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(trade => {
            const pnlClass = trade.profitLoss > 0 ? 'profit' : 'loss';
            html += `
                <tr>
                    <td>${new Date(trade.date).toLocaleDateString()}</td>
                    <td>${trade.instrument}</td>
                    <td>${trade.direction}</td>
                    <td>${trade.entryPrice}</td>
                    <td>${trade.exitPrice}</td>
                    <td>${trade.stopLoss || '-'}</td>
                    <td>${trade.takeProfit || '-'}</td>
                    <td class="${pnlClass}">$${trade.profitLoss.toFixed(2)}</td>
                    <td>${trade.notes ? (trade.notes.length > 30 ? trade.notes.substring(0,30)+'...' : trade.notes) : ''}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editTrade('${trade.id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTrade('${trade.id}')">Delete</button>
                    </td>
                </tr>
            `;
        });
    }

    html += `</tbody></table>`;
    app.innerHTML = html;

    // Re-attach navigation events to any links inside dynamic content
    document.querySelectorAll('[data-view]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(link.dataset.view);
        });
    });
}

function showAddForm(editId = null) {
    const app = document.getElementById('app');
    const trade = editId ? trades.find(t => t.id == editId) : null;

    const title = trade ? 'Edit Trade' : 'Add New Trade';
    const buttonText = trade ? 'Update Trade' : 'Save Trade';
    const date = trade ? trade.date.split('T')[0] : new Date().toISOString().split('T')[0];
    const instrument = trade ? trade.instrument : '';
    const direction = trade ? trade.direction : 'LONG';
    const entryPrice = trade ? trade.entryPrice : '';
    const exitPrice = trade ? trade.exitPrice : '';
    const stopLoss = trade ? trade.stopLoss : '';
    const takeProfit = trade ? trade.takeProfit : '';
    const profitLoss = trade ? trade.profitLoss : '';
    const notes = trade ? trade.notes : '';

    const html = `
        <h2>${title}</h2>
        <form id="tradeForm">
            <input type="hidden" id="tradeId" value="${editId || ''}">
            <div class="mb-3">
                <label for="date" class="form-label">Date</label>
                <input type="date" class="form-control" id="date" value="${date}" required>
            </div>
            <div class="mb-3">
                <label for="instrument" class="form-label">Instrument</label>
                <input type="text" class="form-control" id="instrument" value="${instrument}" required>
            </div>
            <div class="mb-3">
                <label for="direction" class="form-label">Direction</label>
                <select class="form-select" id="direction">
                    <option value="LONG" ${direction === 'LONG' ? 'selected' : ''}>Long</option>
                    <option value="SHORT" ${direction === 'SHORT' ? 'selected' : ''}>Short</option>
                </select>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="entryPrice" class="form-label">Entry Price</label>
                    <input type="number" step="0.00001" class="form-control" id="entryPrice" value="${entryPrice}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="exitPrice" class="form-label">Exit Price</label>
                    <input type="number" step="0.00001" class="form-control" id="exitPrice" value="${exitPrice}" required>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="stopLoss" class="form-label">Stop Loss</label>
                    <input type="number" step="0.00001" class="form-control" id="stopLoss" value="${stopLoss}">
                </div>
                <div class="col-md-6 mb-3">
                    <label for="takeProfit" class="form-label">Take Profit</label>
                    <input type="number" step="0.00001" class="form-control" id="takeProfit" value="${takeProfit}">
                </div>
            </div>
            <div class="mb-3">
                <label for="profitLoss" class="form-label">Profit / Loss</label>
                <input type="number" step="0.01" class="form-control" id="profitLoss" value="${profitLoss}" required>
            </div>
            <div class="mb-3">
                <label for="notes" class="form-label">Notes</label>
                <textarea class="form-control" id="notes" rows="3">${notes}</textarea>
            </div>
            <button type="submit" class="btn btn-primary">${buttonText}</button>
            <button type="button" class="btn btn-secondary" onclick="navigate('dashboard')">Cancel</button>
        </form>
    `;
    app.innerHTML = html;

    // Attach submit handler
    document.getElementById('tradeForm').addEventListener('submit', handleTradeSubmit);
}

function showLogs() {
    const app = document.getElementById('app');
    let html = `
        <h2>Activity Log</h2>
        <table class="table table-striped table-hover">
            <thead><tr><th>Timestamp</th><th>Action</th><th>Trade ID</th><th>Instrument</th><th>Details</th></tr></thead>
            <tbody>
    `;

    if (logs.length === 0) {
        html += `<tr><td colspan="5" class="text-center">No logs yet.</td></tr>`;
    } else {
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach(log => {
            const badgeClass = log.action === 'ADD' ? 'badge-add' : (log.action === 'EDIT' ? 'badge-edit' : 'badge-delete');
            html += `
                <tr>
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                    <td><span class="badge ${badgeClass}">${log.action}</span></td>
                    <td>${log.tradeId || '-'}</td>
                    <td>${log.instrument || '-'}</td>
                    <td>${log.details || ''}</td>
                </tr>
            `;
        });
    }

    html += `</tbody></table>
        <button class="btn btn-secondary" onclick="navigate('dashboard')">Back to Dashboard</button>
    `;
    app.innerHTML = html;
}

// ---------- Trade CRUD ----------
function handleTradeSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('tradeId').value;
    const tradeData = {
        date: document.getElementById('date').value,
        instrument: document.getElementById('instrument').value,
        direction: document.getElementById('direction').value,
        entryPrice: parseFloat(document.getElementById('entryPrice').value),
        exitPrice: parseFloat(document.getElementById('exitPrice').value),
        stopLoss: document.getElementById('stopLoss').value ? parseFloat(document.getElementById('stopLoss').value) : null,
        takeProfit: document.getElementById('takeProfit').value ? parseFloat(document.getElementById('takeProfit').value) : null,
        profitLoss: parseFloat(document.getElementById('profitLoss').value),
        notes: document.getElementById('notes').value
    };

    if (id) {
        // Edit existing trade
        const index = trades.findIndex(t => t.id == id);
        if (index !== -1) {
            const oldTrade = trades[index];
            tradeData.id = id; // keep same id
            trades[index] = tradeData;
            addLog('EDIT', id, tradeData.instrument, `Edited ${tradeData.direction} ${tradeData.instrument}`);
        }
    } else {
        // Add new trade
        tradeData.id = generateId();
        trades.push(tradeData);
        addLog('ADD', tradeData.id, tradeData.instrument, `Added ${tradeData.direction} ${tradeData.instrument} @ ${tradeData.entryPrice}`);
    }

    saveData();
    navigate('dashboard');
}

function editTrade(id) {
    navigate('edit', id);
}

function deleteTrade(id) {
    if (!confirm('Delete this trade?')) return;
    const trade = trades.find(t => t.id == id);
    if (trade) {
        addLog('DELETE', id, trade.instrument, `Deleted ${trade.direction} ${trade.instrument}`);
        trades = trades.filter(t => t.id != id);
        saveData();
        navigate('dashboard');
    }
}

// ---------- Initialization ----------
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    // Set up navigation clicks on static nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(link.dataset.view);
        });
    });
    // Default view
    navigate('dashboard');
});