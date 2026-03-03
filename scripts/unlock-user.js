const mongoose = require('mongoose');

async function unlockUser() {
    try {
        // try to connect to the database (assuming default local url)
        await mongoose.connect('mongodb://127.0.0.1:27017/accountia');
        console.log('Connected to MongoDB');

        // we define a quick schema to interact with users
        const userSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.model('User', userSchema);

        // clear the lock limits
        const result = await User.updateOne(
            { email: 'hkh304171@gmail.com' },
            { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: "" } }
        );

        console.log(`Matched ${result.matchedCount} document(s) and modified ${result.modifiedCount} document(s).`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

unlockUser();
