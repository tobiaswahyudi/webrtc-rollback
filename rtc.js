const connId = document.getElementById("connId");
const connectButton = document.getElementById("connect");
const messageInput = document.getElementById("message");
const messages = document.getElementById("messages");

let peer = null;
let conn = null;

function log(message) {
    console.log(message);
    messages.innerHTML += `<div>${new Date().toLocaleTimeString()}: ${message}</div>`;
    messages.scrollTop = messages.scrollHeight;
}

function makeRandomString() {
    return Math.random().toString(36).substring(2, 10).padEnd(8, '0');
}

function makeRandomId() {
    return makeRandomString() + '-' + makeRandomString()+ '-' + makeRandomString();
}

function setupConnection(connection) {
    conn = connection;
    
    conn.on('open', () => {
        log('✅ Connected! Ready to chat');
        messageInput.disabled = false;
        messageInput.placeholder = 'Type a message...';
    });
    
    conn.on('data', (data) => {
        log(`📨 Received: ${data}`);
    });
    
    conn.on('close', () => {
        log('❌ Connection closed');
        messageInput.disabled = true;
        messageInput.placeholder = 'Connection closed';
    });

    messageInput.disabled = false;
    messageInput.placeholder = 'Type a message...';
}

async function connect(roomId) {
    // Create peer with room ID
    peer = new Peer(roomId);
    
    peer.on('open', (id) => {
        log(`🚀 Waiting for peer to join room: ${id}`);
        connectButton.textContent = 'Waiting for peer...';
    });
    
    peer.on('connection', (connection) => {
        log('📡 Peer connected to us');
        setupConnection(connection);
        connectButton.textContent = 'Connected';
    });
    
    peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
            // make random string
            const randomString = makeRandomId();
            peer = new Peer(randomString);
            // Room exists, try to connect to it
            log(`🔗 Joining room: ${roomId}`);
            const connection = peer.connect(roomId);
            setupConnection(connection);
            connectButton.textContent = 'Connected';
        } else {
            log(`❌ Error: ${err.message}`);
        }
    });
}

function sendMessage() {
    if (conn && conn.open) {
        const message = messageInput.value.trim();
        if (message) {
            conn.send(message);
            log(`📤 Sent: ${message}`);
            messageInput.value = '';
        }
    }
}

// Event listeners
connectButton.addEventListener('click', () => {
    const roomId = connId.value.trim();
    if (roomId) {
        connect(roomId);
        connectButton.disabled = true;
        connId.disabled = true;
    }
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initialize
messageInput.disabled = true;
messageInput.placeholder = 'Connect first...';

log('Enter a room ID and click Connect to start chatting!');