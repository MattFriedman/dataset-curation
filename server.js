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

// Create a LiveReload server
const liveReloadServer = livereload.createServer({ port: 35731 });
liveReloadServer.watch(path.join(__dirname, 'views'));
liveReloadServer.watch(path.join(__dirname, 'public'));

const app = express();
app.use(connectLivereload());
app.use(express.static(path.join(__dirname, 'public')));

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
        const { instruction, output } = req.body;
        const updatedPair = await Pair.findByIdAndUpdate(id, { instruction, output }, { new: true });
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
        const { instruction, output } = req.body;
        const newPair = new Pair({ instruction, output });
        await newPair.save();
        res.render('index', { user: req.user });
    } catch (err) {
        console.error('Error adding pair:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/export', isAuthenticated, async (req, res) => {
    try {
        const pairs = await Pair.find().populate('approvals.user', 'username');
        const data = pairs.map(pair => {
            const approvedBy = pair.approvals.map(approval => approval.user.username).join(', ');
            return [pair.instruction, pair.output, approvedBy];
        });
        
        const csvContent = stringify(data, {
            header: true,
            columns: ['instruction', 'output', 'approved_by']
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('dataset.csv');
        res.send(csvContent);
    } catch (err) {
        console.error('Error exporting CSV:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/pairs', isAuthenticated, async (req, res) => {
    try {
        const pairs = await Pair.find();
        res.render('pairs', { pairs, user: req.user });
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
