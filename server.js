const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory storage (use database in production)
let users = [];
let cryptoAddresses = {
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ETH: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    USDT: 'TYASr8UVgUoSdxMJ5rS8H3dLF9BkTrBw1y',
    USDC: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
};
let aiComplaints = [];

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'stevenlogan362@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-email-password'
    }
});

// Authentication endpoints
app.post('/api/register', (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already registered' });
    }
    
    const newUser = {
        id: Date.now(),
        firstName,
        lastName,
        email,
        password, // In production, hash this
        balance: 0,
        investments: [],
        transactions: [],
        joinDate: new Date().toISOString()
    };
    
    users.push(newUser);
    res.json({ success: true, user: newUser });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    // Admin login
    if (email === 'admin@globaltrade360.com' && password === 'myhandwork2025') {
        return res.json({
            success: true,
            user: {
                email,
                name: 'Administrator',
                isAdmin: true
            }
        });
    }
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        res.json({ success: true, user });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Crypto addresses
app.get('/api/crypto-addresses', (req, res) => {
    res.json(cryptoAddresses);
});

app.post('/api/crypto-addresses', (req, res) => {
    // Check admin authentication in production
    cryptoAddresses = req.body;
    res.json({ success: true });
});

// Investment endpoints
app.post('/api/invest', (req, res) => {
    const { userId, plan, amount } = req.body;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const investment = {
        id: Date.now(),
        plan,
        amount,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        dailyReturn: getDailyReturn(plan),
        status: 'active'
    };
    
    user.investments.push(investment);
    res.json({ success: true, investment });
});

// Withdrawal endpoint
app.post('/api/withdraw', (req, res) => {
    const { userId, amount, walletAddress } = req.body;
    const user = users.find(u => u.id === userId);
    
    if (!user || user.balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    user.balance -= amount;
    user.transactions.push({
        type: 'withdrawal',
        amount,
        walletAddress,
        date: new Date().toISOString(),
        status: 'pending'
    });
    
    res.json({ success: true });
});

// AI chat complaints
app.post('/api/ai-complaint', (req, res) => {
    const { userId, message } = req.body;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const complaint = {
        id: Date.now(),
        userId,
        userEmail: user.email,
        message,
        date: new Date().toISOString(),
        status: 'pending'
    };
    
    aiComplaints.push(complaint);
    
    // Send email to admin
    sendEmailToAdmin(complaint);
    
    res.json({ success: true });
});

// Email sending endpoint
app.post('/api/send-email', (req, res) => {
    const { to, subject, message } = req.body;
    
    const mailOptions = {
        from: 'stevenlogan362@gmail.com',
        to,
        subject,
        text: message
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            res.status(500).json({ error: 'Failed to send email' });
        } else {
            res.json({ success: true, messageId: info.messageId });
        }
    });
});

// Market data endpoint
app.get('/api/market-data', (req, res) => {
    const marketData = {
        btc: 63842.15 + (Math.random() - 0.5) * 100,
        eth: 3215.67 + (Math.random() - 0.5) * 20,
        eur: 1.0824 + (Math.random() - 0.5) * 0.01,
        timestamp: new Date().toISOString()
    };
    
    res.json(marketData);
});

// Helper functions
function getDailyReturn(plan) {
    const returns = {
        basic: 0.032,
        pro: 0.048,
        vip: 0.075
    };
    return returns[plan] || 0.032;
}

function sendEmailToAdmin(complaint) {
    const mailOptions = {
        from: 'stevenlogan362@gmail.com',
        to: 'stevenlogan362@gmail.com',
        subject: `AI Complaint from ${complaint.userEmail}`,
        text: `User: ${complaint.userEmail}\nMessage: ${complaint.message}\nDate: ${complaint.date}`
    };
    
    transporter.sendMail(mailOptions);
}

// Serve HTML
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// WebSocket for live updates
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected');
    
    // Send live updates every 5 seconds
    const interval = setInterval(() => {
        const update = {
            type: 'live_update',
            data: {
                notification: getRandomNotification(),
                timestamp: new Date().toISOString()
            }
        };
        ws.send(JSON.stringify(update));
    }, 5000);
    
    ws.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected');
    });
});

function getRandomNotification() {
    const notifications = [
        "Michael K. just made $5,240 profit from Bitcoin trading!",
        "Sarah J. successfully withdrew $12,500 to her bank account!",
        "David L. earned $3,200 profit from Pro Plan investment!",
        "New user registered with $5,000 initial deposit!"
    ];
    return notifications[Math.floor(Math.random() * notifications.length)];
}
