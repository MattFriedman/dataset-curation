const express = require('express');
const connectLivereload = require('connect-livereload');
const livereload = require('livereload');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const expressLayouts = require('express-ejs-layouts');
const User = require('./models/User');
const { isAuthenticated, roleAccess } = require('./middleware/rbac');
const { stringify } = require('csv-stringify/sync');
const jwtAuth = require('./middleware/jwtAuth');
const { CreationMethod } = require('./shared/enums');

// Create a LiveReload server
const liveReloadServer = livereload.createServer({ port: 35731 });
liveReloadServer.watch(path.join(__dirname, 'views'));
liveReloadServer.watch(path.join(__dirname, 'public'));

const app = express();
app.use(connectLivereload());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/shared', express.static(path.join(__dirname, 'shared')));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Express EJS Layouts setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);


// Session configuration
app.use(session({
    secret: 'your_session_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: 'mongodb://localhost:27017/dataset',
        collectionName: 'sessions' // This is optional, default is 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
require('./config/passport')(passport);

// Make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/dataset', {
    // Remove any deprecated options
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Define a Schema for instruction-output pairs
const Pair = require('./models/Pair');

app.get('/test', (req, res) => {
    res.send('Hello, Test World again!'); // Change this message
    console.log('test route ok');
});

app.post('/pairs/:id/toggle-approval', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const pair = await Pair.findById(id);
        
        if (!pair) {
            return res.status(404).send('Pair not found');
        }

        const approvalIndex = pair.approvals.findIndex(approval => approval.user.equals(userId));
        
        if (approvalIndex > -1) {
            pair.approvals.splice(approvalIndex, 1);
        } else {
            pair.approvals.push({ user: userId });
        }

        await pair.save();
        res.json({ 
            approved: approvalIndex === -1, 
            approvalCount: pair.approvalCount 
        });
    } catch (err) {
        console.error('Error toggling approval:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.put('/pairs/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { instruction, output, creationMethod } = req.body;
        const updatedPair = await Pair.findByIdAndUpdate(id, 
            { instruction, output, creationMethod }, 
            { new: true }
        );
        if (!updatedPair) {
            return res.status(404).send('Pair not found');
        }
        res.status(200).send(updatedPair);
    } catch (err) {
        console.error('Error updating pair:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Route to delete a pair
app.delete('/pairs/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        await Pair.findByIdAndDelete(id);
        res.status(204).send(); // No content
    } catch (err) {
        console.error('Error deleting pair:', err);
        res.status(500).send('Internal Server Error');
    }
});

const marked = require('marked');

// Routes
app.get('/', (req, res) => {
    res.render('landing', { user: req.user });
});

// Authentication routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Login page route
app.get('/login', (req, res) => {
    res.render('login');
});

// Register page route (admin only)
app.get('/register', isAuthenticated, roleAccess(['admin']), (req, res) => {
    res.render('register');
});

app.get('/change-password', isAuthenticated, (req, res) => {
    res.render('change-password', { user: req.user });
});

// Secure routes
app.get('/add', isAuthenticated, (req, res) => {
    res.render('add-pair', { user: req.user });
});

app.post('/pairs', isAuthenticated, async (req, res) => {
    try {
        const { instruction, output, creationMethod } = req.body;
        const newPair = new Pair({ instruction, output, creationMethod });
        await newPair.save();
        res.json({ success: true, message: 'Pair added successfully' });
    } catch (err) {
        console.error('Error adding pair:', err);
        res.status(500).json({ success: false, message: 'Error adding pair: ' + err.message });
    }
});

app.get('/export', async (req, res, next) => {
    // Check if it's an API request
    if (req.headers['accept'] === 'application/json') {
        return jwtAuth(req, res, next);
    }
    // If it's a web request, use session authentication
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    next();
}, async (req, res) => {
    try {
        const pairs = await Pair.find().populate('approvals.user', 'username');
        
        const data = pairs.map(pair => ({
            instruction: pair.instruction,
            output: pair.output,
            createdAt: pair.createdAt.toISOString(),
            updatedAt: pair.updatedAt.toISOString(),
            approvals: JSON.stringify(pair.approvals.map(a => ({
                user: a.user.username,
                approvedAt: a.approvedAt.toISOString()
            })))
        }));

        // For API requests or if JSON is explicitly requested
        if (req.headers['accept'] === 'application/json' || req.query.format === 'json') {
            return res.json(data);
        }

        // For web requests, send CSV
        const csvContent = stringify(data, {
            header: true,
            columns: ['instruction', 'output', 'createdAt', 'updatedAt', 'approvals']
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('dataset.csv');
        res.send(csvContent);
    } catch (err) {
        console.error('Error exporting data:', err);
        res.status(500).send('Internal Server Error');
    }
});

// API routes that require token authentication
app.use('/api', jwtAuth);

// Unsecured health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is up and running' });
});

// Example protected API route
app.get('/api/pairs', async (req, res) => {
  try {
    const pairs = await Pair.find();
    res.json(pairs);
  } catch (err) {
    console.error('Error fetching pairs:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/import', jwtAuth, async (req, res) => {
    try {
        const importData = req.body;
        
        console.log('Received import data:', JSON.stringify(importData, null, 2));

        if (!Array.isArray(importData)) {
            return res.status(400).json({ message: 'Invalid import data format' });
        }

        const importResults = await Promise.all(importData.map(async (item) => {
            try {
                console.log('Processing item:', JSON.stringify(item, null, 2));

                // Create new pair
                let pair = new Pair({
                    instruction: item.instruction,
                    output: item.output,
                    creationMethod: item.creationMethod || null, // Add this line
                    createdAt: new Date(item.createdAt),
                    updatedAt: new Date(item.updatedAt)
                });

                // Handle approvals
                if (item.approvals) {
                    const approvalsData = typeof item.approvals === 'string' ? JSON.parse(item.approvals) : item.approvals;
                    pair.approvals = await Promise.all(approvalsData.map(async approval => {
                        const user = await User.findOne({ username: approval.user });
                        if (!user) {
                            console.warn(`User not found: ${approval.user}. Skipping this approval.`);
                            return null;
                        }
                        if (!approval.approvedAt) {
                            console.warn(`Missing approvedAt for user: ${approval.user}. Using current date.`);
                            return {
                                user: user._id,
                                approvedAt: new Date()
                            };
                        }
                        const approvedAt = new Date(approval.approvedAt);
                        if (isNaN(approvedAt.getTime())) {
                            console.warn(`Invalid date for approvedAt: ${approval.approvedAt}. Using current date.`);
                            return {
                                user: user._id,
                                approvedAt: new Date()
                            };
                        }
                        return {
                            user: user._id,
                            approvedAt: approvedAt
                        };
                    }));
                    pair.approvals = pair.approvals.filter(approval => approval !== null);
                }

                console.log('Processed approvals:', pair.approvals);

                await pair.save();
                return { instruction: item.instruction, status: 'success' };
            } catch (error) {
                console.error('Error importing pair:', error);
                return { instruction: item.instruction, status: 'error', message: error.message };
            }
        }));

        res.json({ results: importResults });
    } catch (err) {
        console.error('Error importing data:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.get('/pairs', isAuthenticated, async (req, res) => {
  try {
    const pairs = await Pair.find();
    
    const formattedPairs = pairs.map(pair => ({
      ...pair.toObject(), // Convert to plain object
      creationMethod: pair.creationMethod ? CreationMethod.getLabel(pair.creationMethod) : 'Unknown',
      isApprovedBy: function(userId) {
        return userId && this.approvals.some(approval => approval.user.toString() === userId);
      }
    }));
    
    // Calculate metrics
    const totalPairs = pairs.length;
    const approvedPairs = pairs.filter(pair => pair.approvals.length > 0).length;
    const unapprovedPairs = totalPairs - approvedPairs;
    const totalApprovals = pairs.reduce((sum, pair) => sum + pair.approvals.length, 0);
    const averageApprovals = totalPairs > 0 ? (totalApprovals / totalPairs).toFixed(2) : '0.00';

    const metrics = {
      totalPairs,
      approvedPairs,
      unapprovedPairs,
      averageApprovals
    };

    // Check if it's an API request
    if (req.headers['accept'] === 'application/json') {
      return res.json({ pairs: formattedPairs, metrics });
    }

    // If it's a web request, render the page
    res.render('pairs', { pairs: formattedPairs, user: req.user, metrics });
  } catch (err) {
    console.error('Error fetching pairs:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Start the Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
