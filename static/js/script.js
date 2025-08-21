// Global Variables
let sections = JSON.parse(localStorage.getItem('networkSections') || '{}');
let pinnedSections = JSON.parse(localStorage.getItem('pinnedSections') || '[]');
let agents = JSON.parse(localStorage.getItem('agents') || '{"hamad": {"name": "حمد", "devices": []}, "ali": {"name": "علي", "devices": []}, "ahmed": {"name": "أحمد", "devices": []}}');
let credentialsVisible = true;
let currentDeviceId = null;

// Telegram Configuration
const TELEGRAM_BOT_TOKEN = '8226837720:AAGbaDJM1RqqZDA17cv6zwkb1hCrZAv-Jzk';
const TELEGRAM_CHAT_ID = '-1002939755592';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize default sections if empty
    if (Object.keys(sections).length === 0) {
        sections = {
            'repository-repeater': {
                name: 'مكرر المستودع',
                icon: 'fas fa-wifi',
                agent: 'hamad',
                devices: {
                    'cisco-switch': {
                        id: 'cisco-switch',
                        name: 'Cisco Switch Main',
                        type: 'cisco',
                        ip: '192.168.1.1',
                        username: 'admin',
                        password: 'admin123',
                        status: 'online'
                    },
                    'mikrotik-group-a': {
                        id: 'mikrotik-group-a',
                        name: 'MIT Group A',
                        type: 'mikrotik',
                        ip: '10.42.85.2',
                        username: 'alaraby',
                        password: 'sf,vj',
                        status: 'online'
                    }
                }
            },
            'residential-repeater': {
                name: 'مكرر سكني',
                icon: 'fas fa-home',
                agent: 'ali',
                devices: {}
            }
        };
        localStorage.setItem('networkSections', JSON.stringify(sections));
    }

    loadSections();
    updateStatistics();
    loadAgents();
    populateDeviceSectionSelect();
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('[id$="-section"]').forEach(section => {
        section.style.display = 'none';
    });

    // Show selected section
    document.getElementById(sectionName + '-section').style.display = 'block';

    // Update active nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');

    // Load specific section data
    if (sectionName === 'agents') {
        loadAgents();
    } else if (sectionName === 'statistics') {
        updateStatistics();
        renderAdvancedStats();
        drawNetworkChart();
    }
}

function loadSections() {
    const pinnedContainer = document.getElementById('pinnedSections');
    const regularContainer = document.getElementById('regularSections');

    pinnedContainer.innerHTML = '';
    regularContainer.innerHTML = '';

    // Sort sections - pinned first
    const sortedSections = Object.entries(sections).sort((a, b) => {
        const aPinned = pinnedSections.includes(a[0]);
        const bPinned = pinnedSections.includes(b[0]);

        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
    });

    sortedSections.forEach(([sectionId, section]) => {
        const sectionCard = createSectionCard(sectionId, section);

        if (pinnedSections.includes(sectionId)) {
            pinnedContainer.appendChild(sectionCard);
        } else {
            regularContainer.appendChild(sectionCard);
        }
    });
}

function createSectionCard(sectionId, section) {
    const card = document.createElement('div');
    // The columns classes are now on the card element itself
    card.className = `col-xl-4 col-lg-6 col-md-6 mb-4`;

    const isPinned = pinnedSections.includes(sectionId);
    const totalDevices = section.devices ? Object.keys(section.devices).length : 0;
    const mockTx = (Math.random() * 500).toFixed(2);
    const mockRx = (Math.random() * 800).toFixed(2);

    card.innerHTML = `
        <div class="section-card h-100 ${isPinned ? 'pinned' : ''}">
            <button class="btn btn-sm ${isPinned ? 'btn-warning' : 'btn-outline-warning'} pin-btn"
                    onclick="togglePin('${sectionId}')">
                <i class="fas fa-thumbtack"></i>
            </button>

            <div class="section-header">
                <h4><i class="${section.icon}"></i> ${section.name}</h4>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" onclick="editSection('${sectionId}')">
                            <i class="fas fa-edit fa-fw"></i> تعديل القسم</a></li>
                        <li><a class="dropdown-item" href="#" onclick="deleteSection('${sectionId}')">
                            <i class="fas fa-trash fa-fw"></i> حذف القسم</a></li>
                    </ul>
                </div>
            </div>

            <div class="mb-3">
                <small class="text-muted">
                    <i class="fas fa-user fa-fw"></i> الوكيل: <strong>${agents[section.agent]?.name || 'غير محدد'}</strong>
                </small>
                <br>
                <small class="text-muted">
                    <i class="fas fa-router fa-fw"></i> الأجهزة: <strong>${totalDevices}</strong>
                </small>
            </div>

            <div class="mb-3 p-2 rounded" style="background-color: #f1f5f9;">
                <div class="d-flex justify-content-between">
                    <span><i class="fas fa-arrow-up text-success"></i> TX: ${mockTx} Mbps</span>
                    <span><i class="fas fa-arrow-down text-danger"></i> RX: ${mockRx} Mbps</span>
                </div>
                <div class="progress mt-2" style="height: 5px;">
                    <div class="progress-bar bg-success" role="progressbar" style="width: ${mockTx / 10}%" ></div>
                    <div class="progress-bar bg-danger" role="progressbar" style="width: ${mockRx / 10}%" ></div>
                </div>
            </div>

            <div class="devices-container" style="max-height: 200px; overflow-y: auto;">
                ${createDevicesHTML(section.devices)}
            </div>

            <div class="mt-auto pt-3 text-center">
                <button class="btn btn-outline-primary btn-sm" onclick="showAddDeviceModal('${sectionId}')">
                    <i class="fas fa-plus"></i> إضافة جهاز
                </button>
            </div>
        </div>
    `;

    return card;
}

function createDevicesHTML(devices) {
    if (!devices || Object.keys(devices).length === 0) {
        return '<p class="text-muted text-center">لا توجد أجهزة</p>';
    }

    return Object.entries(devices).map(([deviceId, device]) => {
        const statusClass = device.status === 'online' ? 'status-online' : 'status-offline';

        return `
            <div class="device-card card device-${device.type}">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">
                                <i class="${getDeviceIcon(device.type)}"></i>
                                ${device.name}
                                <span class="status-indicator ${statusClass}"></span>
                            </h6>
                            <small class="text-muted">
                                <span class="${credentialsVisible ? '' : 'hide-credentials'}">
                                    ${device.ip} | ${device.username}
                                </span>
                            </small>
                        </div>
                        <div class="btn-group-vertical btn-group-sm">
                            <button class="btn btn-connect btn-sm" onclick="connectToDevice('${deviceId}')">
                                <i class="fas fa-plug"></i> اتصال
                            </button>
                            <button class="btn btn-info btn-sm" onclick="showDeviceDetails('${deviceId}')">
                                <i class="fas fa-list"></i> التفاصيل
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="editDevice('${deviceId}')">
                                <i class="fas fa-edit"></i> تعديل
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getDeviceIcon(type) {
    const icons = {
        mikrotik: 'fas fa-wifi',
        ubiquiti: 'fas fa-broadcast-tower',
        memosa: 'fas fa-satellite-dish',
        cisco: 'fas fa-network-wired'
    };
    return icons[type] || 'fas fa-router';
}

function togglePin(sectionId) {
    const index = pinnedSections.indexOf(sectionId);
    if (index > -1) {
        pinnedSections.splice(index, 1);
    } else {
        pinnedSections.push(sectionId);
    }

    localStorage.setItem('pinnedSections', JSON.stringify(pinnedSections));
    loadSections();
}

function showAddSectionModal() {
    const modal = new bootstrap.Modal(document.getElementById('addSectionModal'));
    modal.show();
}

function addNewSection() {
    const name = document.getElementById('sectionName').value;
    const icon = document.getElementById('sectionIcon').value;
    const agent = document.getElementById('sectionAgent').value;

    if (!name) return;

    const sectionId = name.toLowerCase().replace(/\s+/g, '-');
    sections[sectionId] = {
        name: name,
        icon: icon,
        agent: agent,
        devices: {}
    };

    localStorage.setItem('networkSections', JSON.stringify(sections));
    loadSections();
    populateDeviceSectionSelect();

    bootstrap.Modal.getInstance(document.getElementById('addSectionModal')).hide();
    document.getElementById('addSectionForm').reset();
}

function showAddDeviceModal(sectionId = null) {
    populateDeviceSectionSelect();
    if (sectionId) {
        document.getElementById('deviceSection').value = sectionId;
    }

    const modal = new bootstrap.Modal(document.getElementById('addDeviceModal'));
    modal.show();
}

function populateDeviceSectionSelect() {
    const select = document.getElementById('deviceSection');
    select.innerHTML = '<option value="">اختر القسم</option>';

    Object.entries(sections).forEach(([sectionId, section]) => {
        select.innerHTML += `<option value="${sectionId}">${section.name}</option>`;
    });
}

function updateCredentials() {
    const deviceType = document.getElementById('deviceType').value;
    const usernameInput = document.getElementById('deviceUsername');
    const passwordInput = document.getElementById('devicePassword');

    const defaults = {
        mikrotik: { username: 'admin', password: '' },
        ubiquiti: { username: 'ubnt', password: 'ubnt' },
        memosa: { username: 'admin', password: 'admin' },
        cisco: { username: 'admin', password: 'cisco' }
    };

    if (defaults[deviceType]) {
        usernameInput.value = defaults[deviceType].username;
        passwordInput.value = defaults[deviceType].password;
    }
}

function addNewDevice() {
    const name = document.getElementById('deviceName').value;
    const ip = document.getElementById('deviceIP').value;
    const type = document.getElementById('deviceType').value;
    const username = document.getElementById('deviceUsername').value;
    const password = document.getElementById('devicePassword').value;
    const sectionId = document.getElementById('deviceSection').value;

    if (!name || !ip || !type || !sectionId) return;

    const deviceId = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    if (!sections[sectionId].devices) {
        sections[sectionId].devices = {};
    }

    sections[sectionId].devices[deviceId] = {
        id: deviceId,
        name: name,
        type: type,
        ip: ip,
        username: username,
        password: password,
        status: 'online'
    };

    localStorage.setItem('networkSections', JSON.stringify(sections));
    loadSections();

    bootstrap.Modal.getInstance(document.getElementById('addDeviceModal')).hide();
    document.getElementById('addDeviceForm').reset();
}

function editDevice(deviceId) {
    const device = findDeviceById(deviceId);
    if (!device) return;

    document.getElementById('editDeviceId').value = deviceId;
    document.getElementById('editDeviceName').value = device.name;
    document.getElementById('editDeviceIP').value = device.ip;
    document.getElementById('editDeviceUsername').value = device.username;
    document.getElementById('editDevicePassword').value = device.password;

    const modal = new bootstrap.Modal(document.getElementById('editDeviceModal'));
    modal.show();
}

function saveDeviceChanges() {
    const deviceId = document.getElementById('editDeviceId').value;
    const device = findDeviceById(deviceId);
    if (!device) return;

    device.name = document.getElementById('editDeviceName').value;
    device.ip = document.getElementById('editDeviceIP').value;
    device.username = document.getElementById('editDeviceUsername').value;
    device.password = document.getElementById('editDevicePassword').value;

    localStorage.setItem('networkSections', JSON.stringify(sections));
    loadSections();

    bootstrap.Modal.getInstance(document.getElementById('editDeviceModal')).hide();
}

function deleteDevice() {
    const deviceId = document.getElementById('editDeviceId').value;

    for (let sectionId in sections) {
        if (sections[sectionId].devices && sections[sectionId].devices[deviceId]) {
            delete sections[sectionId].devices[deviceId];
            break;
        }
    }

    localStorage.setItem('networkSections', JSON.stringify(sections));
    loadSections();

    bootstrap.Modal.getInstance(document.getElementById('editDeviceModal')).hide();
}

function findDeviceById(deviceId) {
    for (let sectionId in sections) {
        if (sections[sectionId].devices && sections[sectionId].devices[deviceId]) {
            return sections[sectionId].devices[deviceId];
        }
    }
    return null;
}

function connectToDevice(deviceId) {
    const device = findDeviceById(deviceId);
    if (!device) return;

    if (device.type === 'ubiquiti') {
        // NOTE: Bypassing the 'net::ERR_CERT_AUTHORITY_INVALID' warning is not possible
        // from client-side JavaScript due to browser security policies. This is a
        // standard security feature to protect against man-in-the-middle attacks.
        // The best approach is to open the device's IP in a new tab and have the
        // user manually accept the self-signed certificate.
        const url = `https://${device.ip}`;

        // The auto-login form is a best-effort attempt but may not work on all firmware versions.
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;
        form.target = '_blank';

        const usernameField = document.createElement('input');
        usernameField.type = 'hidden';
        usernameField.name = 'username';
        usernameField.value = device.username;

        const passwordField = document.createElement('input');
        passwordField.type = 'hidden';
        passwordField.name = 'password';
        passwordField.value = device.password;

        form.appendChild(usernameField);
        form.appendChild(passwordField);
        document.body.appendChild(form);

        // Open in new window and try to auto-login
        const newWindow = window.open(url, '_blank');
        setTimeout(() => {
            try {
                form.submit();
            } catch (e) {
                console.warn("Auto-login form submission failed. This might be due to cross-origin restrictions or the page not being ready.", e);
            } finally {
                document.body.removeChild(form);
            }
        }, 1500);

    } else if (device.type === 'cisco') {
        // Open the CLI in a modal
        const modalTitle = document.getElementById('cliModalTitle');
        const cliPrompt = document.getElementById('cliPrompt');
        const terminalOutput = document.getElementById('terminalOutput');

        modalTitle.innerHTML = `<i class="fas fa-terminal"></i> CLI: ${device.name}`;
        cliPrompt.textContent = `${device.name}#`;
        terminalOutput.innerHTML = `<div>Connecting to ${device.ip}...</div><div><span class="text-success">Connected!</span> Type 'help' for commands.</div>`;
        document.getElementById('cliInput').value = '';

        const modal = new bootstrap.Modal(document.getElementById('ciscoCliModal'));
        modal.show();

    } else {
        // For MikroTik and Memosa - simulate SSH/Telnet
        alert(`اتصال إلى ${device.name} (${device.ip})\nاسم المستخدم: ${device.username}\nكلمة المرور: ${device.password}`);
    }
}

function showDeviceDetails(deviceId) {
    const device = findDeviceById(deviceId);
    if (!device) return;

    currentDeviceId = deviceId;
    document.getElementById('deviceDetailsTitle').textContent = `تفاصيل ${device.name}`;

    const tableBody = document.getElementById('subscribersTable');
    tableBody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">جاري تحميل بيانات المشتركين...</p>
            </td>
        </tr>
    `;

    const modal = new bootstrap.Modal(document.getElementById('deviceDetailsModal'));
    modal.show();

    // Simulate network delay
    setTimeout(() => {
        loadSubscribersData(device);
    }, 1500);
}

function loadSubscribersData(device) {
    // Simulate loading subscribers data
    const subscribers = generateMockSubscribers(device);
    const tableBody = document.getElementById('subscribersTable');

    if (subscribers.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center">لا يوجد مشتركين لعرضهم.</td></tr>`;
        return;
    }

    tableBody.innerHTML = subscribers.map(subscriber => `
        <tr class="subscriber-row">
            <td><strong>${subscriber.username}</strong></td>
            <td>${subscriber.ip}</td>
            <td><span class="signal-indicator ${getSignalClass(subscriber.ccq)}">${subscriber.ccq}%</span></td>
            <td><span class="signal-indicator ${getSignalClass(subscriber.tx)}">${subscriber.tx} dBm</span></td>
            <td><span class="signal-indicator ${getSignalClass(subscriber.rx)}">${subscriber.rx} dBm</span></td>
            <td>
                <div>${subscriber.dataUsage} GB</div>
                <div class="data-usage-bar">
                    <div class="data-usage-fill" style="width: ${subscriber.dataUsage}%"></div>
                </div>
            </td>
            <td>${subscriber.lastSeen}</td>
            <td>
                <button class="btn btn-telegram btn-sm" onclick="sendSubscriberToTelegram('${subscriber.username}', '${subscriber.ip}', ${subscriber.ccq}, ${subscriber.tx}, ${subscriber.rx})">
                    <i class="fab fa-telegram"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function generateMockSubscribers(device) {
    const subscriberCount = Math.floor(Math.random() * 50) + 10;
    const subscribers = [];

    for (let i = 1; i <= subscriberCount; i++) {
        const baseIP = device.ip.split('.').slice(0, 3).join('.');
        subscribers.push({
            username: `user${i.toString().padStart(3, '0')}`,
            ip: `${baseIP}.${100 + i}`,
            ccq: Math.floor(Math.random() * 40) + 60,
            tx: Math.floor(Math.random() * 30) - 65,
            rx: Math.floor(Math.random() * 30) - 65,
            dataUsage: Math.floor(Math.random() * 80) + 20,
            lastSeen: new Date(Date.now() - Math.random() * 3600000).toLocaleString('ar-EG')
        });
    }

    return subscribers.sort((a, b) => b.ccq - a.ccq);
}

function getSignalClass(value) {
    if (value >= 80) return 'signal-excellent';
    if (value >= 60) return 'signal-good';
    if (value >= 40) return 'signal-fair';
    return 'signal-poor';
}

function toggleCredentials() {
    credentialsVisible = !credentialsVisible;
    const icon = document.getElementById('toggleIcon');

    if (credentialsVisible) {
        icon.className = 'fas fa-eye';
        document.querySelectorAll('.hide-credentials').forEach(el => {
            el.classList.remove('hide-credentials');
        });
    } else {
        icon.className = 'fas fa-eye-slash';
        document.querySelectorAll('small.text-muted span').forEach(el => {
            el.classList.add('hide-credentials');
        });
    }

    loadSections();
}

function refreshDeviceData() {
    const device = findDeviceById(currentDeviceId);
    if (device) {
        loadSubscribersData(device);
        showNotification('تم تحديث البيانات', 'success');
    }
}

// Telegram Functions
async function sendToTelegram(message) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });

        if (response.ok) {
            showNotification('تم إرسال التقرير إلى التلغرام', 'success');
        } else {
            showNotification('فشل في إرسال التقرير', 'error');
        }
    } catch (error) {
        console.error('Telegram error:', error);
        showNotification('خطأ في الاتصال بالتلغرام', 'error');
    }
}

async function sendSubscriberToTelegram(username, ip, ccq, tx, rx) {
    const device = findDeviceById(currentDeviceId);
    const message = `
🔸 <b>تقرير مشترك فردي</b>
📡 الجهاز: ${device.name}
👤 المشترك: ${username}
🌐 IP: ${ip}
📊 CCQ: ${ccq}%
📶 TX: ${tx} dBm
📶 RX: ${rx} dBm
🕐 الوقت: ${new Date().toLocaleString('ar-EG')}
            `.trim();

    await sendToTelegram(message);
}

async function sendAllToTelegram() {
    const device = findDeviceById(currentDeviceId);
    const subscribers = generateMockSubscribers(device);

    const message = `
📡 <b>تقرير شامل - ${device.name}</b>
🌐 IP: ${device.ip}
📊 عدد المشتركين: ${subscribers.length}

<b>أفضل 10 مشتركين (CCQ):</b>
${subscribers.slice(0, 10).map((s, i) =>
    `${i + 1}. ${s.username} - CCQ: ${s.ccq}% - IP: ${s.ip}`
).join('\n')}

🕐 وقت التقرير: ${new Date().toLocaleString('ar-EG')}
            `.trim();

    await sendToTelegram(message);
}

// Agents Section
function loadAgents() {
    const container = document.getElementById('agentsContainer');
    container.innerHTML = '';

    Object.entries(agents).forEach(([agentId, agent]) => {
        const agentDevices = getAgentDevices(agentId);

        const agentCardWrapper = document.createElement('div');
        agentCardWrapper.className = 'col-md-6 col-lg-4 mb-4';

        agentCardWrapper.innerHTML = `
            <div class="agent-card text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <h4 class="mb-0"><i class="fas fa-user-shield"></i> ${agent.name}</h4>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-light" onclick="showAgentDetailsModal('${agentId}')"><i class="fas fa-info-circle"></i></button>
                        <button class="btn btn-sm btn-outline-light" onclick="showAddEditAgentModal('${agentId}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteAgent('${agentId}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <hr style="border-color: rgba(255,255,255,0.5);">
                <div class="mt-3">
                    <p class="mb-2"><strong><i class="fas fa-phone fa-fw"></i> الهاتف:</strong> ${agent.phone || 'غير محدد'}</p>
                    <p class="mb-2"><strong><i class="fas fa-map-marker-alt fa-fw"></i> الموقع:</strong> ${agent.location || 'غير محدد'}</p>
                </div>
                <div class="mt-3 text-center">
                     <button class="btn btn-light w-100" onclick="showAgentDeviceDetails('${agentId}')">
                        <i class="fas fa-network-wired"></i> عرض أجهزة الوكيل (${agentDevices.length})
                    </button>
                </div>
            </div>
        `;

        container.appendChild(agentCardWrapper);
    });
}

function getAgentDevices(agentId) {
    const devices = [];
    Object.entries(sections).forEach(([sectionId, section]) => {
        if (section.agent === agentId && section.devices) {
            devices.push(...Object.values(section.devices));
        }
    });
    return devices;
}

function getAgentSections(agentId) {
    return Object.entries(sections).filter(([_, section]) => section.agent === agentId);
}

function showAgentDeviceDetails(agentId) {
    const agent = agents[agentId];
    const agentSections = getAgentSections(agentId);

    // Create a temporary section to show agent's devices
    const agentSection = document.createElement('div');
    agentSection.className = 'modal fade';
    agentSection.id = `agent-devices-modal-${agentId}`;
    agentSection.innerHTML = `
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">أجهزة الوكيل: ${agent.name}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        ${agentSections.length > 0 ? agentSections.map(([sectionId, section]) => `
                            <div class="col-md-6 mb-4">
                                <div class="section-card">
                                    <h5><i class="${section.icon}"></i> ${section.name}</h5>
                                    ${createDevicesHTML(section.devices)}
                                </div>
                            </div>
                        `).join('') : '<p class="text-center">لا توجد أقسام أو أجهزة معينة لهذا الوكيل.</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(agentSection);
    const modal = new bootstrap.Modal(agentSection);
    modal.show();

    agentSection.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(agentSection);
    });
}

function showAddEditAgentModal(agentId = null) {
    const form = document.getElementById('addEditAgentForm');
    form.reset();
    document.getElementById('agentId').value = '';

    const modalTitle = document.getElementById('agentModalTitle');
    if (agentId) {
        modalTitle.textContent = 'تعديل بيانات الوكيل';
        const agent = agents[agentId];
        document.getElementById('agentId').value = agentId;
        document.getElementById('agentName').value = agent.name;
        document.getElementById('agentPhone').value = agent.phone || '';
        document.getElementById('agentLocation').value = agent.location || '';
    } else {
        modalTitle.textContent = 'إضافة وكيل جديد';
    }

    const modal = new bootstrap.Modal(document.getElementById('addEditAgentModal'));
    modal.show();
}

function saveAgent() {
    const agentId = document.getElementById('agentId').value;
    const agentName = document.getElementById('agentName').value;
    const agentPhone = document.getElementById('agentPhone').value;
    const agentLocation = document.getElementById('agentLocation').value;

    if (!agentName) {
        showNotification('اسم الوكيل مطلوب.', 'danger');
        return;
    }

    if (agentId) {
        // Update existing agent
        agents[agentId].name = agentName;
        agents[agentId].phone = agentPhone;
        agents[agentId].location = agentLocation;
    } else {
        // Add new agent
        const newAgentId = `agent-${Date.now()}`;
        agents[newAgentId] = {
            name: agentName,
            phone: agentPhone,
            location: agentLocation,
            devices: [] // Kept for legacy compatibility, though not used in new structure
        };
    }

    localStorage.setItem('agents', JSON.stringify(agents));
    loadAgents();
    showNotification('تم حفظ بيانات الوكيل بنجاح.', 'success');
    bootstrap.Modal.getInstance(document.getElementById('addEditAgentModal')).hide();
}

function deleteAgent(agentId) {
    if (confirm(`هل أنت متأكد من حذف الوكيل "${agents[agentId].name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
        // Optional: Check if agent is assigned to any sections and handle it
        const isAssigned = Object.values(sections).some(s => s.agent === agentId);
        if (isAssigned) {
            if (!confirm("هذا الوكيل معين لبعض الأقسام. هل تريد المتابعة وحذفه؟ (ستحتاج لتعيين وكلاء جدد لهذه الأقسام)")) {
                return;
            }
        }

        delete agents[agentId];
        localStorage.setItem('agents', JSON.stringify(agents));
        loadAgents();
        showNotification('تم حذف الوكيل.', 'success');
    }
}

function showAgentDetailsModal(agentId) {
    const agent = agents[agentId];
    document.getElementById('detailAgentName').textContent = agent.name;
    document.getElementById('detailAgentPhone').textContent = agent.phone || 'غير محدد';
    document.getElementById('detailAgentLocation').textContent = agent.location || 'غير محدد';
    const modal = new bootstrap.Modal(document.getElementById('agentDetailsModal'));
    modal.show();
}

// Discovery Section
let lastDiscoveredDevices = []; // Store the last discovery results

function startNetworkDiscovery() {
    const ipRange = document.getElementById('ipRangeInput').value;
    if (!ipRange || !ipRange.includes('/')) {
        showNotification('الرجاء إدخال نطاق IP صحيح (e.g., 192.168.1.0/24)', 'danger');
        return;
    }

    const resultsContainer = document.getElementById('discoveryResults');
    resultsContainer.innerHTML = `
        <div class="section-card text-center">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2">جاري البحث في النطاق: ${ipRange}...</p>
        </div>
    `;

    setTimeout(() => {
        const discoveredDevices = generateDiscoveryResults(ipRange);
        lastDiscoveredDevices = discoveredDevices; // Save for bulk add
        displayDiscoveryResults(discoveredDevices);
    }, 3000);
}

function generateDiscoveryResults(ipRange) {
    const devices = [];
    const baseIp = ipRange.split('/')[0].split('.').slice(0, 3).join('.');
    const deviceCount = Math.floor(Math.random() * 20) + 5;

    for (let i = 1; i <= deviceCount; i++) {
        const ip = `${baseIp}.${i + 1}`;
        const types = ['mikrotik', 'ubiquiti', 'memosa', 'cisco'];
        const type = types[Math.floor(Math.random() * types.length)];

        devices.push({
            ip: ip,
            type: type,
            name: `${type.charAt(0).toUpperCase()}${type.slice(1)}-${ip.replace(/\./g, '-')}`,
            status: Math.random() > 0.2 ? 'online' : 'offline',
            mac: Array.from({length: 6}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':').toUpperCase()
        });
    }

    return devices;
}

function displayDiscoveryResults(devices) {
    const resultsContainer = document.getElementById('discoveryResults');
    if (devices.length === 0) {
        resultsContainer.innerHTML = `<div class="section-card"><p class="text-center">لم يتم العثور على أجهزة في هذا النطاق.</p></div>`;
        return;
    }

    // Create dropdown with sections
    let sectionOptions = Object.entries(sections).map(([sectionId, section]) =>
        `<option value="${sectionId}">${section.name}</option>`
    ).join('');

    resultsContainer.innerHTML = `
        <div class="section-card">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>نتائج الاستكشاف - ${devices.length} جهاز</h4>
                <div class="input-group w-50">
                    <select class="form-select" id="bulkAddSectionSelect">
                        <option value="">اختر قسماً للإضافة إليه...</option>
                        ${sectionOptions}
                    </select>
                    <button class="btn btn-success" onclick="addAllDiscoveredToSection()">
                        <i class="fas fa-plus-circle"></i> إضافة الكل للقسم
                    </button>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>IP Address</th>
                            <th>النوع</th>
                            <th>MAC Address</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${devices.map(device => `
                            <tr class="discovery-device">
                                <td><strong>${device.ip}</strong></td>
                                <td>
                                    <i class="${getDeviceIcon(device.type)}"></i>
                                    ${device.type.charAt(0).toUpperCase() + device.type.slice(1)}
                                </td>
                                <td><code>${device.mac}</code></td>
                                <td>
                                    <span class="status-indicator ${device.status === 'online' ? 'status-online' : 'status-offline'}"></span>
                                    ${device.status === 'online' ? 'متصل' : 'غير متصل'}
                                </td>
                                <td>
                                    <button class="btn btn-success btn-sm" onclick="addDiscoveredDevice('${device.ip}', '${device.type}', '${device.name}')">
                                        <i class="fas fa-plus"></i> إضافة
                                    </button>
                                    <button class="btn btn-info btn-sm" onclick="pingDevice('${device.ip}')">
                                        <i class="fas fa-wifi"></i> اختبار
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function addAllDiscoveredToSection() {
    const sectionId = document.getElementById('bulkAddSectionSelect').value;
    if (!sectionId) {
        showNotification('الرجاء اختيار قسم أولاً.', 'warning');
        return;
    }

    if (lastDiscoveredDevices.length === 0) {
        showNotification('لا توجد أجهزة مكتشفة لإضافتها.', 'warning');
        return;
    }

    let addedCount = 0;
    lastDiscoveredDevices.forEach(device => {
        // Avoid adding duplicates
        const alreadyExists = Object.values(sections[sectionId].devices || {}).some(d => d.ip === device.ip);
        if (!alreadyExists) {
            const deviceId = `${device.type}-${device.ip.replace(/\./g, '-')}`;
            sections[sectionId].devices[deviceId] = {
                id: deviceId,
                name: device.name,
                type: device.type,
                ip: device.ip,
                username: 'auto-added',
                password: 'password',
                status: device.status
            };
            addedCount++;
        }
    });

    localStorage.setItem('networkSections', JSON.stringify(sections));
    loadSections(); // Refresh the main dashboard
    showNotification(`تمت إضافة ${addedCount} جهاز جديد إلى قسم "${sections[sectionId].name}".`, 'success');
}

function addDiscoveredDevice(ip, type, name) {
    document.getElementById('deviceName').value = name;
    document.getElementById('deviceIP').value = ip;
    document.getElementById('deviceType').value = type;
    updateCredentials();

    showAddDeviceModal();
}

function pingDevice(ip) {
    showNotification(`اختبار الاتصال بـ ${ip}...`, 'info');

    setTimeout(() => {
        const success = Math.random() > 0.3;
        if (success) {
            showNotification(`✅ الجهاز ${ip} يرد على الاتصال`, 'success');
        } else {
            showNotification(`❌ لا يمكن الوصول للجهاز ${ip}`, 'error');
        }
    }, 2000);
}

// Statistics Functions
function updateStatistics() {
    let totalDevices = 0;
    let onlineDevices = 0;
    let totalSubscribers = 0;

    Object.values(sections).forEach(section => {
        if (section.devices) {
            const devices = Object.values(section.devices);
            totalDevices += devices.length;
            onlineDevices += devices.filter(d => d.status === 'online').length;
            totalSubscribers += devices.length * 25; // Approximate
        }
    });

    document.getElementById('totalDevices').textContent = totalDevices;
    document.getElementById('onlineDevices').textContent = onlineDevices;
    document.getElementById('totalSubscribers').textContent = totalSubscribers;
    document.getElementById('totalSections').textContent = Object.keys(sections).length;
}

function drawNetworkChart() {
    const ctx = document.getElementById('networkChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
            datasets: [{
                label: 'المشتركين المتصلين',
                data: [120, 135, 142, 138, 155, 148, 162],
                borderColor: 'rgb(37, 99, 235)',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4
            }, {
                label: 'استخدام البيانات (GB)',
                data: [2400, 2650, 2800, 2750, 3100, 2950, 3200],
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// CLI Functions
const cliCommands = {
    'help': () => `
Available commands:
- show version: Display system version
- show interfaces status: Show interface status
- show ip route: Display routing table
- show running-config: Show current configuration
- show mac address-table: Display MAC address table
- ping [ip]: Ping an IP address
- traceroute [ip]: Trace route to destination
- clear: Clear the terminal screen
            `,
    'show version': () => `
SuperCell-Switch uptime is 45 days, 12 hours, 32 minutes
System returned to ROM by power-on
System image file is "c2960-lanbasek9-mz.150-2.SE11.bin"
cisco WS-C2960-24TT-L (PowerPC405) processor
    `,
    'show interfaces status': () => `
Port      Name               Status       Vlan       Duplex  Speed Type
Fa0/1                        connected    1          a-full  a-100 10/100BaseTX
Fa0/2                        connected    1          a-full  a-100 10/100BaseTX
Fa0/3                        notconnect   1            auto   auto 10/100BaseTX
Gi0/1                        connected    trunk      a-full a-1000 1000BaseTX
    `,
    'show ip route': () => `
Codes: C - connected, S - static, R - RIP, M - mobile, B - BGP
Gateway of last resort is 192.168.1.1 to network 0.0.0.0
C    192.168.1.0/24 is directly connected, Vlan1
S*   0.0.0.0/0 [1/0] via 192.168.1.1
    `,
    'show running-config': () => `
Building configuration...
!
hostname SuperCell-Switch
!
enable secret 5 $1$mERr$hx5rVt7rPNoS4wqbXKX7m0
!
interface Vlan1
 ip address 192.168.1.10 255.255.255.0
!
end
    `,
    'show mac address-table': () => `
          Mac Address Table
-------------------------------------------
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    0050.56c0.0001    DYNAMIC     Fa0/1
   1    0050.56c0.0002    DYNAMIC     Fa0/2
Total Mac Addresses for this criterion: 2
    `,
    'clear': () => {
        document.getElementById('terminalOutput').innerHTML = '';
        return '';
    }
};

function handleCLIInput(event) {
    if (event.key === 'Enter') {
        const input = event.target;
        const command = input.value.trim();
        if (command) {
            const output = document.getElementById('terminalOutput');
            const prompt = document.getElementById('cliPrompt').textContent;

            output.innerHTML += `<div>${prompt} ${command}</div>`;

            const result = executeCliCommand(command);
            if (result) {
                // Use pre to preserve formatting
                output.innerHTML += `<div class="text-info" style="white-space: pre-wrap;">${result}</div>`;
            }

            input.value = '';
            document.getElementById('terminal').scrollTop = document.getElementById('terminal').scrollHeight;
        }
    }
}

function executeCliCommand(command) {
    const lowerCommand = command.toLowerCase();

    if (cliCommands[lowerCommand]) {
        return cliCommands[lowerCommand]();
    } else if (lowerCommand.startsWith('ping ')) {
        const ip = command.split(' ')[1];
        return `
PING ${ip} (${ip}): 56 data bytes
64 bytes from ${ip}: icmp_seq=0 ttl=64 time=1.234 ms
64 bytes from ${ip}: icmp_seq=1 ttl=64 time=1.456 ms
--- ${ip} ping statistics ---
2 packets transmitted, 2 packets received, 0.0% packet loss
        `;
    } else if (lowerCommand.startsWith('traceroute ')) {
        const ip = command.split(' ')[1];
        return `
traceroute to ${ip} (${ip}), 30 hops max, 60 byte packets
 1  192.168.1.1 (192.168.1.1)  0.456 ms
 2  ${ip} (${ip})  2.678 ms
        `;
    } else {
        return `% Invalid input detected at '^' marker.`;
    }
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span>${message}</span>
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function editSection(sectionId) {
    const section = sections[sectionId];
    if (!section) return;

    const newName = prompt('اسم القسم الجديد:', section.name);
    if (newName && newName !== section.name) {
        section.name = newName;
        localStorage.setItem('networkSections', JSON.stringify(sections));
        loadSections();
    }
}

function deleteSection(sectionId) {
    if (confirm('هل أنت متأكد من حذف هذا القسم وجميع أجهزته؟')) {
        delete sections[sectionId];

        // Remove from pinned sections
        const pinnedIndex = pinnedSections.indexOf(sectionId);
        if (pinnedIndex > -1) {
            pinnedSections.splice(pinnedIndex, 1);
            localStorage.setItem('pinnedSections', JSON.stringify(pinnedSections));
        }

        localStorage.setItem('networkSections', JSON.stringify(sections));
        loadSections();
    }
}

// Auto-refresh data every 30 seconds
setInterval(() => {
    if (currentDeviceId) {
        refreshDeviceData();
    }
    updateStatistics();
}, 30000);

function renderAdvancedStats() {
    // 1. Top 5 Sections by Device Count
    const topSections = Object.entries(sections)
        .map(([sectionId, section]) => ({
            name: section.name,
            deviceCount: Object.keys(section.devices || {}).length
        }))
        .sort((a, b) => b.deviceCount - a.deviceCount)
        .slice(0, 5);

    const topSectionsTable = document.getElementById('topSectionsTable');
    topSectionsTable.innerHTML = topSections.map(s => `
        <tr>
            <td>${s.name}</td>
            <td><span class="badge bg-primary rounded-pill">${s.deviceCount}</span></td>
        </tr>
    `).join('');

    // 2. Device Count by Type
    const deviceTypes = {
        mikrotik: { name: 'MikroTik', count: 0, icon: 'fa-wifi' },
        ubiquiti: { name: 'Ubiquiti', count: 0, icon: 'fa-broadcast-tower' },
        memosa: { name: 'Memosa', count: 0, icon: 'fa-satellite-dish' },
        cisco: { name: 'Cisco', count: 0, icon: 'fa-network-wired' }
    };

    Object.values(sections).forEach(section => {
        Object.values(section.devices || {}).forEach(device => {
            if (deviceTypes[device.type]) {
                deviceTypes[device.type].count++;
            }
        });
    });

    const deviceTypeTable = document.getElementById('deviceTypeTable');
    deviceTypeTable.innerHTML = Object.values(deviceTypes).map(t => `
        <tr>
            <td><i class="fas ${t.icon} fa-fw text-muted"></i> ${t.name}</td>
            <td><span class="badge bg-secondary rounded-pill">${t.count}</span></td>
        </tr>
    `).join('');
}

// Handle window resize for responsive charts
window.addEventListener('resize', () => {
    if (Chart.instances.length > 0) {
        Chart.instances.forEach(chart => chart.resize());
    }
});

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
