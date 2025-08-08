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
    // ICE servers configuration with both STUN and TURN
    const iceServers = [
        // Google STUN servers (for discovering public IP)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        
        // Open Relay TURN servers (for NAT traversal)
        {
            urls: 'turn:staticauth.openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:staticauth.openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        
        // Additional fallback TURN server
        {
            urls: 'turn:numb.viagenie.ca',
            username: 'webrtc@live.com',
            credential: 'muazkh'
        }
    ];

    // Create peer with room ID and TURN server configuration
    peer = new Peer(roomId, {
        config: {
            iceServers: iceServers
        },
        debug: 2  // Enable debug logs to see ICE negotiation
    });
    
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
            // Room exists, try to connect to it
            const randomString = makeRandomId();
            
            // Create new peer with random ID
            peer = new Peer(randomString, {
                config: {
                    iceServers: iceServers
                },
                debug: 2
            });
            
            peer.on('open', () => {
                log(`🔗 Joining room: ${roomId}`);
                const connection = peer.connect(roomId);
                setupConnection(connection);
                connectButton.textContent = 'Connected';
            });
            
            peer.on('error', (error) => {
                log(`❌ Connection error: ${error.message}`);
                log('💡 Tip: Make sure both devices are using the same room ID');
            });
        } else {
            log(`❌ Error: ${err.message}`);
        }
    });
    
    // Log ICE connection state changes for debugging
    peer.on('call', (call) => {
        // Handle incoming calls if needed in the future
        log('📞 Incoming call detected');
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

log('🌐 WebRTC P2P Chat Ready!');
log('💡 Enter the same room ID on both devices to connect');
log('🔧 Using STUN + TURN servers for NAT traversal');