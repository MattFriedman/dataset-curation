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

async function updatePassword() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        rl.question('Enter username: ', async (username) => {
            rl.question('Enter new password: ', async (newPassword) => {
                try {
                    const hashedPassword = await bcrypt.hash(newPassword, 10);
                    const result = await User.findOneAndUpdate(
                        { username: username },
                        { $set: { password: hashedPassword } },
                        { new: true }
                    );

                    if (result) {
                        console.log('Password updated successfully');
                    } else {
                        console.log('User not found');
                    }
                } catch (error) {
                    console.error('Error updating password:', error);
                } finally {
                    mongoose.connection.close();
                    rl.close();
                }
            });
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        rl.close();
    }
}

updatePassword();
