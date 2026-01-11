const token = localStorage.getItem('wa_api_token');
const user = JSON.parse(localStorage.getItem('wa_api_user') || '{}');

// Check auth
if (!token || user.role !== 'admin') {
    window.location.href = '/login';
}

const api = {
    get: async (endpoint) => {
        const timestamp = new Date().getTime();
        const separator = endpoint.includes('?') ? '&' : '?';
        const res = await fetch(`/api/admin${endpoint}${separator}_=${timestamp}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    },
    post: async (endpoint, body) => {
        const res = await fetch(`/api/admin${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        return res.json();
    },
    delete: async (endpoint) => {
        const res = await fetch(`/api/admin${endpoint}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    }
};

async function refreshData() {
    // Fetch Metrics
    const metricsRes = await api.get('/metrics');
    if (metricsRes.success) {
        renderMetrics(metricsRes.metrics);
    }

    // Fetch Users
    const usersRes = await api.get('/users');
    if (usersRes.success) {
        renderUsers(usersRes.users);
    }
}

function renderMetrics(metrics) {
    const grid = document.getElementById('metricsGrid');
    const usedMemGB = (metrics.usedMemory / 1024 / 1024 / 1024).toFixed(2);
    const totalMemGB = (metrics.totalMemory / 1024 / 1024 / 1024).toFixed(2);

    grid.innerHTML = `
        <div class="metric-card">
            <div class="metric-title">CPU</div>
            <div class="metric-value">${metrics.cpuCount} Cores</div>
            <div class="metric-sub">${metrics.cpuModel}</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">Memory</div>
            <div class="metric-value">${usedMemGB} / ${totalMemGB} GB</div>
            <div class="metric-sub">Free: ${(metrics.freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">Platform</div>
            <div class="metric-value">${metrics.platform}</div>
            <div class="metric-sub">Uptime: ${(metrics.uptime / 3600).toFixed(1)} hrs</div>
        </div>
            <div class="metric-card">
            <div class="metric-title">Total Users</div>
            <div class="metric-value">${metrics.appStats.users}</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">Active Sessions</div>
            <div class="metric-value">${metrics.appStats.sessions}</div>
        </div>
    `;
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = users.map(u => {
        const isVerified = u.is_verified === 1;
        const statusBadge = isVerified
            ? '<span class="badge badge-verified">Verified</span>'
            : '<span class="badge badge-pending">Pending</span>';
        const roleBadge = u.role === 'admin'
            ? '<span class="badge badge-admin">Admin</span>'
            : u.role;

        const verifyBtn = u.role !== 'admin' ? `
            <button class="btn-sm ${isVerified ? 'btn-unverify' : 'btn-verify'}" 
                onclick="toggleVerify(${u.id}, ${!isVerified})">
                ${isVerified ? 'Revoke' : 'Verify'}
            </button>
            <a href="/admin/sessions?userId=${u.id}&username=${u.username}" class="btn-sm" style="background: #3b82f6; color: white; text-decoration: none; display: inline-block;">Sessions</a>
        ` : '';

        const deleteBtn = u.role !== 'admin' && u.id !== user.id ? `
            <button class="btn-sm btn-delete" onclick="deleteUser(${u.id})">Delete</button>
        ` : '';

        return `
            <tr>
                <td>${u.username}</td>
                <td>${roleBadge}</td>
                <td>${statusBadge}</td>
                <td>${new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="actions">
                        ${verifyBtn}
                        ${deleteBtn}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function toggleVerify(id, newStatus) {
    if (!confirm(`Are you sure you want to ${newStatus ? 'verify' : 'revoke verification for'} this user?`)) return;
    await api.post(`/users/${id}/verify`, { is_verified: newStatus });
    refreshData();
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    await api.delete(`/users/${id}`);
    refreshData();
}

function logout() {
    localStorage.removeItem('wa_api_token');
    localStorage.removeItem('wa_api_user');
    window.location.href = '/login';
}

// Initial load
refreshData();
// Auto refresh every 30s
setInterval(refreshData, 30000);
