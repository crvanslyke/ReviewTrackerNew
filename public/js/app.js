const API_BASE = '/api'; // Relative path for Vercel, can adjust for local dev if needed

// State
let items = [];
let sortCol = 'due_date';
let sortAsc = true;

// DOM Elements
const tableBody = document.getElementById('reviewsTableBody');
const modal = document.getElementById('itemModal');
const itemForm = document.getElementById('itemForm');
const newItemBtn = document.getElementById('newItemBtn');
const refreshBtn = document.getElementById('refreshBtn');
const closeBtn = document.querySelector('.close-btn');
const cancelBtn = document.querySelector('.cancel-btn');
const modalTitle = document.getElementById('modalTitle');
const statsElements = {
    active: document.getElementById('count-active'),
    pending: document.getElementById('count-pending'),
    completed: document.getElementById('count-completed')
};

// Config
const STATUS_BADGE_MAP = {
    'Invited': 'badge-invited',
    'Active': 'badge-active',
    'In Review': 'badge-in-review',
    'Pending Decision': 'badge-pending-decision',
    'Completed': 'badge-completed',
    'Accepted': 'badge-accepted',
    'Rejected': 'badge-rejected'
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    fetchItems();
    fetchStats();

    // Event Listeners
    newItemBtn.addEventListener('click', () => openModal());
    refreshBtn.addEventListener('click', () => {
        fetchItems();
        fetchStats();
    });
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    itemForm.addEventListener('submit', handleFormSubmit);

    // Sorting headers
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (sortCol === field) {
                sortAsc = !sortAsc;
            } else {
                sortCol = field;
                sortAsc = true;
            }
            renderTable();
        });
    });
});

// API Calls
async function fetchItems() {
    try {
        const res = await fetch(`${API_BASE}/items`);
        if (!res.ok) throw new Error('Failed to fetch items');
        items = await res.json();
        // Extract venues for datalist
        updateVenueDatalist();
        renderTable();
    } catch (err) {
        console.error(err);
        // Fallback for demo if API fails (e.g. no DB yet)
        if (items.length === 0) {
            // Optional: Provide visual feedback
        }
    }
}

async function fetchStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        statsElements.active.textContent = data.active;
        statsElements.pending.textContent = data.pending;
        statsElements.completed.textContent = data.completed;
    } catch (err) {
        console.error(err);
    }
}

// Rendering
function renderTable() {
    tableBody.innerHTML = '';

    // Sort
    const sortedItems = [...items].sort((a, b) => {
        let valA = a[sortCol];
        let valB = b[sortCol];

        // Handle nulls
        if (valA === null) valA = '';
        if (valB === null) valB = '';

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
    });

    sortedItems.forEach(item => {
        const tr = document.createElement('tr');

        const badgeClass = STATUS_BADGE_MAP[item.status] || 'badge-invited';
        const displayDate = item.due_date ? new Date(item.due_date).toLocaleDateString() : '-';

        tr.innerHTML = `
            <td>
                <div style="font-weight: 500;">${item.title}</div>
                ${item.manuscript_id ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${item.manuscript_id}</div>` : ''}
            </td>
            <td>${item.venue || '-'}</td>
            <td>${item.role}</td>
            <td><span class="badge ${badgeClass}">${item.status}</span></td>
            <td>${displayDate}</td>
            <td>
                <button class="action-btn edit" onclick="editItem(${item.id})">
                    <i data-lucide="pencil" style="width: 16px; height: 16px;"></i>
                </button>
                <button class="action-btn delete" onclick="deleteItem(${item.id})">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Re-init icons for new rows
    lucide.createIcons();
}

function updateVenueDatalist() {
    const venues = [...new Set(items.map(i => i.venue).filter(v => v))];
    const datalist = document.getElementById('venueList');
    datalist.innerHTML = venues.map(v => `<option value="${v}">`).join('');
}

// Modal Actions
function openModal(item = null) {
    modal.classList.add('open');
    if (item) {
        modalTitle.textContent = 'Edit Entry';
        document.getElementById('itemId').value = item.id;
        document.getElementById('title').value = item.title;
        document.getElementById('manuscript_id').value = item.manuscript_id || '';
        document.getElementById('venue').value = item.venue || '';
        document.getElementById('role').value = item.role;
        document.getElementById('status').value = item.status;
        document.getElementById('due_date').value = item.due_date || '';
        document.getElementById('notes').value = item.notes || '';
    } else {
        modalTitle.textContent = 'New Entry';
        itemForm.reset();
        document.getElementById('itemId').value = '';
    }
}

function closeModal() {
    modal.classList.remove('open');
}

// CRUD Operations
window.editItem = (id) => {
    const item = items.find(i => i.id === id);
    if (item) openModal(item);
};

window.deleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        const res = await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');

        await fetchItems(); // Refresh local list and table
        await fetchStats();
    } catch (err) {
        alert('Error deleting item: ' + err.message);
    }
};

async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(itemForm);
    const data = Object.fromEntries(formData.entries());

    // Cleanup empty strings
    if (!data.manuscript_id) delete data.manuscript_id;
    if (!data.venue) delete data.venue;
    if (!data.due_date) delete data.due_date;
    if (!data.notes) delete data.notes;
    else if (data.notes.trim() === '') delete data.notes;

    const id = document.getElementById('itemId').value;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/items/${id}` : `${API_BASE}/items`;

    // ID should not be in body for simple cases unless required by Schema (SQLModel handles exclusion usually)
    if (id) delete data.id;

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error('Save failed: ' + errorText);
        }

        closeModal();
        await fetchItems();
        await fetchStats();
    } catch (err) {
        alert('Error saving item: ' + err.message);
    }
}
