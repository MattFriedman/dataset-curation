const express = require('express');
const connectLivereload = require('connect-livereload');
const livereload = require('livereload');
const path = require('path');

// Create a LiveReload server
const liveReloadServer = livereload.createServer({ port: 35731 });
liveReloadServer.watch(path.join(__dirname, 'views'));
liveReloadServer.watch(path.join(__dirname, 'public'));
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


const app = express();
app.use(connectLivereload());
app.use(express.static('public'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/dataset')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Define a Schema for instruction-output pairs
const pairSchema = new mongoose.Schema({
    instruction: String,
    output: String
});

app.get('/test', (req, res) => {
    res.send('Hello, Test World again!'); // Change this message
    console.log('test route ok');
});

app.put('/pairs/:id', async (req, res) => {
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
app.delete('/pairs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Pair.findByIdAndDelete(id);
        res.status(204).send(); // No content
    } catch (err) {
        console.error('Error deleting pair:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Create a Model
const Pair = mongoose.model('Pair', pairSchema);

// Routes
app.get('/', (req, res) => {
    res.render('landing');
});

app.get('/add', (req, res) => {
    res.render('index');
});

app.post('/pairs', async (req, res) => {
    try {
        const { instruction, output } = req.body;
        const newPair = new Pair({ instruction, output });
        await newPair.save();
        res.redirect('/');
    } catch (err) {
        console.error('Error adding pair:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/export', async (req, res) => {
    const pairs = await Pair.find();
    const csv = ['instruction,output', ...pairs.map(pair => `${pair.instruction},${pair.output}`)].join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('dataset.csv');
    res.send(csv);
});


// Route to display all instruction-output pairs
app.get('/pairs', async (req, res) => {
    try {
        const pairs = await Pair.find();
        res.render('pairs', { pairs });
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
