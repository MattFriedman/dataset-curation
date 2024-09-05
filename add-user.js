const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// MongoDB connection string - update this if needed
const mongoURI = 'mongodb://localhost:27017/dataset';

// User model - make sure this matches your User model in the main application
const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    roles: [String]
});

const User = mongoose.model('User', UserSchema);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function addUser() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        rl.question('Enter new username: ', async (username) => {
            rl.question('Enter password: ', async (password) => {
                rl.question('Enter roles (comma-separated, e.g., admin,user): ', async (rolesInput) => {
                    try {
                        const hashedPassword = await bcrypt.hash(password, 10);
                        const roles = rolesInput.split(',').map(role => role.trim());

                        const newUser = new User({
                            username: username,
                            password: hashedPassword,
                            roles: roles
                        });

                        await newUser.save();
                        console.log('User added successfully');
                    } catch (error) {
                        console.error('Error adding user:', error);
                    } finally {
                        mongoose.connection.close();
                        rl.close();
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        rl.close();
    }
}

addUser();
