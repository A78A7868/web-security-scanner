// Matrix Rain Animation
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

const columns = Math.floor(width / 20);
const yPositions = Array(columns).fill(0);

function drawMatrix() {
    ctx.fillStyle = 'rgba(7, 9, 19, 0.05)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0f0';
    ctx.font = '15px monospace';

    for (let i = 0; i < yPositions.length; i++) {
        const text = String.fromCharCode(33 + Math.random() * 93);
        const x = i * 20;
        const y = yPositions[i];

        ctx.fillStyle = Math.random() > 0.98 ? '#00f2fe' : '#6366f1';
        ctx.fillText(text, x, y);

        if (y > 100 + Math.random() * 10000) {
            yPositions[i] = 0;
        } else {
            yPositions[i] += 20;
        }
    }
}

let matrixInterval = setInterval(drawMatrix, 50);

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

// Tab Switcher
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
});

// Mitigation Server Switcher
const serverBtns = document.querySelectorAll('.server-btn');
let activeServer = 'nginx';

serverBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        serverBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeServer = btn.dataset.server;
        updateMitigationCode();
    });
});

// Scan Engine Mock Data & Logic
const scanProfiles = document.querySelectorAll('.profile-card');
let activeProfile = 'full';

scanProfiles.forEach(card => {
    card.addEventListener('click', () => {
        scanProfiles.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        activeProfile = card.dataset.profile;
    });
});

const startScanBtn = document.getElementById('start-scan-btn');
const terminalLog = document.getElementById('terminal-log');
const scoreCircle = document.getElementById('score-circle');
const scoreVal = document.getElementById('score-val');

const statCritical = document.getElementById('stat-critical').querySelector('.count');
const statHigh = document.getElementById('stat-high').querySelector('.count');
const statMedium = document.getElementById('stat-medium').querySelector('.count');
const statLow = document.getElementById('stat-low').querySelector('.count');

const headersTbody = document.getElementById('headers-tbody');
const portsGrid = document.getElementById('ports-grid');
const sslDetails = document.getElementById('ssl-details');
const mitigationCode = document.getElementById('mitigation-code');

// Simple hash function to get deterministic but varied results per URL
function getUrlHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

let sslInfo = {
    certDays: 81,
    certAuthority: "Let's Encrypt (R3)",
    keySize: "RSA 2048 bits",
    cipherSuite: "TLS_AES_256_GCM_SHA384"
};

let commonPorts = [
    { port: 21, service: 'FTP', status: 'closed' },
    { port: 22, service: 'SSH', status: 'closed' },
    { port: 80, service: 'HTTP', status: 'open' },
    { port: 443, service: 'HTTPS', status: 'open' },
    { port: 3306, service: 'MySQL', status: 'closed' },
    { port: 8080, service: 'HTTP-Alt', status: 'open' }
];

let headerChecks = [
    { header: 'Content-Security-Policy (CSP)', present: false, value: 'N/A', severity: 'High', details: 'Restricts resource loading (Scripts, Styles, Frames) to prevent XSS attacks.' },
    { header: 'Strict-Transport-Security (HSTS)', present: true, value: 'max-age=63072000; includeSubDomains; preload', severity: 'Secure', details: 'Forces clients to communicate via secure HTTPS only.' },
    { header: 'X-Frame-Options', present: false, value: 'N/A', severity: 'Medium', details: 'Prevents Clickjacking by disallowing framing from external origins.' },
    { header: 'X-Content-Type-Options', present: true, value: 'nosniff', severity: 'Secure', details: 'Prevents browser MIME sniffing vulnerabilities.' },
    { header: 'Referrer-Policy', present: false, value: 'N/A', severity: 'Low', details: 'Controls how much referrer information is sent with requests.' }
];

function logToTerminal(message, type = 'info-msg') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    terminalLog.appendChild(line);
    terminalLog.scrollTop = terminalLog.scrollHeight;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runScan() {
    startScanBtn.disabled = true;
    const url = document.getElementById('target-url').value.trim() || 'example.com';
    const hash = getUrlHash(url);

    // Deterministically generate ports status based on URL hash
    commonPorts = [
        { port: 21, service: 'FTP', status: (hash % 5 === 0) ? 'open' : 'closed' },
        { port: 22, service: 'SSH', status: (hash % 3 === 0) ? 'open' : 'closed' },
        { port: 80, service: 'HTTP', status: 'open' },
        { port: 443, service: 'HTTPS', status: 'open' },
        { port: 3306, service: 'MySQL', status: (hash % 7 === 0) ? 'open' : 'closed' },
        { port: 8080, service: 'HTTP-Alt', status: (hash % 2 === 0) ? 'open' : 'closed' }
    ];

    // Deterministically generate header checks status based on URL hash
    headerChecks = [
        { header: 'Content-Security-Policy (CSP)', present: (hash % 4 !== 0), value: (hash % 4 !== 0) ? "default-src 'self' https:; script-src 'self' 'unsafe-inline'" : 'N/A', severity: 'High', details: 'Restricts resource loading (Scripts, Styles, Frames) to prevent XSS attacks.' },
        { header: 'Strict-Transport-Security (HSTS)', present: (hash % 3 !== 0), value: (hash % 3 !== 0) ? 'max-age=63072000; includeSubDomains; preload' : 'N/A', severity: 'Secure', details: 'Forces clients to communicate via secure HTTPS only.' },
        { header: 'X-Frame-Options', present: (hash % 2 === 0), value: (hash % 2 === 0) ? 'SAMEORIGIN' : 'N/A', severity: 'Medium', details: 'Prevents Clickjacking by disallowing framing from external origins.' },
        { header: 'X-Content-Type-Options', present: (hash % 5 !== 0), value: (hash % 5 !== 0) ? 'nosniff' : 'N/A', severity: 'Secure', details: 'Prevents browser MIME sniffing vulnerabilities.' },
        { header: 'Referrer-Policy', present: (hash % 3 === 0), value: (hash % 3 === 0) ? 'strict-origin-when-cross-origin' : 'N/A', severity: 'Low', details: 'Controls how much referrer information is sent with requests.' }
    ];

    const certDays = (hash % 90) + 10;
    const certAuthority = (hash % 2 === 0) ? "Let's Encrypt (R3)" : ((hash % 3 === 0) ? "DigiCert Global Root G2" : "Cloudflare Inc ECC CA-3");
    const keySize = (hash % 2 === 0) ? "ECDSA 256 bits" : "RSA 2048 bits";
    const cipherSuite = (hash % 2 === 0) ? "TLS_AES_256_GCM_SHA384" : "TLS_CHACHA20_POLY1305_SHA256";
    sslInfo = {
        certDays,
        certAuthority,
        keySize,
        cipherSuite
    };

    terminalLog.innerHTML = '';
    logToTerminal(`Initializing Security Scan on ${url}...`, 'system-msg');
    
    await delay(800);
    logToTerminal(`Resolving host IP addresses for ${url}...`, 'info-msg');
    await delay(600);
    const ipByte2 = 21 + (hash % 10);
    const ipByte3 = 36 + (hash % 50);
    const ipByte4 = 19 + (hash % 100);
    logToTerminal(`Host IP resolved to: 104.${ipByte2}.${ipByte3}.${ipByte4} (Cloudflare Edge Node)`, 'success-msg');
    
    if (activeProfile === 'full' || activeProfile === 'headers') {
        await delay(800);
        logToTerminal(`Fetching HTTP/1.1 and HTTP/2 headers...`, 'info-msg');
        await delay(1000);
        logToTerminal(`Parsing HTTP Response Headers...`, 'success-msg');
        headerChecks.forEach(c => {
            if (!c.present) {
                logToTerminal(`ALERT: ${c.header.split(' ')[0]} header is missing.`, 'warn-msg');
            }
        });
    }

    if (activeProfile === 'full' || activeProfile === 'ports') {
        await delay(800);
        logToTerminal(`Initiating SYN port scan against common TCP ports...`, 'info-msg');
        for (const p of commonPorts) {
            await delay(300);
            logToTerminal(`Port ${p.port} (${p.service}): ${p.status.toUpperCase()}`, p.status === 'open' ? 'warn-msg' : 'success-msg');
        }
    }

    if (activeProfile === 'full') {
        await delay(800);
        logToTerminal(`Initiating TLS 1.3 handshake negotiation...`, 'info-msg');
        await delay(700);
        logToTerminal(`SSL Handshake complete. Cipher: ${sslInfo.cipherSuite}`, 'success-msg');
        logToTerminal(`Certificate Authority: ${sslInfo.certAuthority}`, 'success-msg');
        logToTerminal(`Certificate Validity: ${sslInfo.certDays} days remaining`, 'success-msg');
    }

    await delay(600);
    logToTerminal(`Scan process completed. Generating dashboard reports.`, 'system-msg');
    
    startScanBtn.disabled = false;
    renderResults();
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const val = Math.floor(progress * (end - start) + start);
        obj.innerHTML = val;
        scoreCircle.style.setProperty('--percent', val);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function renderResults() {
    // 1. Calculate Score
    let score = 100;
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    if (activeProfile === 'full' || activeProfile === 'headers') {
        headerChecks.forEach(c => {
            if (!c.present) {
                if (c.severity === 'High') { score -= 20; high++; }
                if (c.severity === 'Medium') { score -= 12; medium++; }
                if (c.severity === 'Low') { score -= 8; low++; }
            }
        });
    }

    if (activeProfile === 'full' || activeProfile === 'ports') {
        // Assume port 8080 open is a medium risk, others open standard
        commonPorts.forEach(p => {
            if (p.port === 8080 && p.status === 'open') {
                score -= 10;
                medium++;
            }
        });
    }

    animateValue(scoreVal, 100, score, 1000);

    statCritical.textContent = critical;
    statHigh.textContent = high;
    statMedium.textContent = medium;
    statLow.textContent = low;

    // 2. Render Headers Table
    headersTbody.innerHTML = '';
    headerChecks.forEach(c => {
        const tr = document.createElement('tr');
        
        let badgeClass = 'secure';
        let badgeText = 'Secure';
        if (!c.present) {
            badgeClass = c.severity === 'High' ? 'missing' : (c.severity === 'Medium' ? 'weak' : 'info');
            badgeText = 'Missing';
        }

        tr.innerHTML = `
            <td style="font-family: var(--font-heading); font-weight: 500;">${c.header}</td>
            <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
            <td style="font-family: var(--font-mono); font-size: 0.8rem;">${c.present ? c.value : '—'}</td>
            <td style="font-size: 0.8rem; color: var(--text-muted);">${c.details}</td>
        `;
        headersTbody.appendChild(tr);
    });

    // 3. Render Ports Grid
    portsGrid.innerHTML = '';
    commonPorts.forEach(p => {
        const div = document.createElement('div');
        div.className = `port-node ${p.status}`;
        div.innerHTML = `
            <span class="port-number">${p.port}</span>
            <span class="port-service">${p.service}</span>
            <span class="port-status-badge">${p.status}</span>
        `;
        portsGrid.appendChild(div);
    });

    // 4. Render SSL Details
    sslDetails.innerHTML = `
        <div class="ssl-row">
            <span class="ssl-label">Protocols Supported</span>
            <span class="ssl-value">TLSv1.2, TLSv1.3</span>
        </div>
        <div class="ssl-row">
            <span class="ssl-label">Selected Cipher Suite</span>
            <span class="ssl-value">${sslInfo.cipherSuite}</span>
        </div>
        <div class="ssl-row">
            <span class="ssl-label">Certificate Authority</span>
            <span class="ssl-value">${sslInfo.certAuthority}</span>
        </div>
        <div class="ssl-row">
            <span class="ssl-label">Signature Algorithm</span>
            <span class="ssl-value">SHA256withRSA</span>
        </div>
        <div class="ssl-row">
            <span class="ssl-label">Key Size</span>
            <span class="ssl-value">${sslInfo.keySize}</span>
        </div>
        <div class="ssl-row">
            <span class="ssl-label">Validity Remaining</span>
            <span class="ssl-value">${sslInfo.certDays} days</span>
        </div>
    `;

    // 5. Update Mitigations Code
    updateMitigationCode();
}

function updateMitigationCode() {
    if (activeServer === 'nginx') {
        mitigationCode.textContent = `# Add security headers in Nginx configuration
server {
    listen 443 ssl;
    server_name example.com;

    # Secure Headers
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}`;
    } else if (activeServer === 'apache') {
        mitigationCode.textContent = `# Add security headers in Apache (.htaccess / httpd.conf)
<IfModule mod_headers.c>
    Header always set Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'"
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>`;
    } else if (activeServer === 'iis') {
        mitigationCode.textContent = `<!-- Web.config Configuration for IIS -->
<system.webServer>
  <httpProtocol>
    <customHeaders>
      <add name="Content-Security-Policy" value="default-src 'self';" />
      <add name="Strict-Transport-Security" value="max-age=63072000;" />
      <add name="X-Frame-Options" value="SAMEORIGIN" />
      <add name="X-Content-Type-Options" value="nosniff" />
      <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
    </customHeaders>
  </httpProtocol>
</system.webServer>`;
    }
}

startScanBtn.addEventListener('click', runScan);
updateMitigationCode();
renderResults();
animateValue(scoreVal, 0, 100, 800);
scoreCircle.style.setProperty('--percent', 100);
logToTerminal("System Ready. Execute a new scan above to audit host security.", "system-msg");
