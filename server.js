const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'stevenlogan362@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-password'
    }
});

// In-memory storage (for demo)
let users = [
    {
        id: 1,
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@globaltrade360.com',
        password: 'demo123',
        balance: 5000,
        investments: [],
        transactions: []
    }
];

let cryptoAddresses = {
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ETH: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    USDT: 'TYASr8UVgUoSdxMJ5rS8H3dLF9BkTrBw1y',
    USDC: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

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
        password,
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
    if (email === 'globaltrade360' && password === 'myhandwork2025') {
        return res.json({
            success: true,
            user: {
                email: 'admin@globaltrade360.com',
                name: 'Administrator',
                isAdmin: true
            }
        });
    }
    
    // Regular user login
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        res.json({ success: true, user });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/crypto-addresses', (req, res) => {
    res.json(cryptoAddresses);
});

app.post('/api/crypto-addresses', (req, res) => {
    const { addresses } = req.body;
    cryptoAddresses = addresses;
    res.json({ success: true });
});

app.post('/api/send-email', async (req, res) => {
    const { to, subject, message } = req.body;
    
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text: message
        };
        
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

app.get('/api/market-data', (req, res) => {
    const marketData = {
        btc: (63842.15 + (Math.random() - 0.5) * 100).toFixed(2),
        eth: (3215.67 + (Math.random() - 0.5) * 20).toFixed(2),
        eur: (1.0824 + (Math.random() - 0.5) * 0.01).toFixed(4),
        timestamp: new Date().toISOString()
    };
    
    res.json(marketData);
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Visit: http://localhost:${PORT}`);
});
