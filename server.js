const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from current directory
app.use(express.static('./'));

// Endpoint to update user data
app.post('/api/updateUserData', (req, res) => {
    const { pin, userData } = req.body;
    
    // Read the current user_data.json
    const userDataPath = path.join(__dirname, 'data', 'user_data.json');
    fs.readFile(userDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Failed to read user data' });
        }

        try {
            const jsonData = JSON.parse(data);
            // Update or add new user profile
            jsonData.user_profiles[pin] = userData;

            // Write the updated data back to the file
            fs.writeFile(userDataPath, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                    return res.status(500).json({ error: 'Failed to save user data' });
                }
                res.json({ success: true });
            });
        } catch (error) {
            console.error('Error parsing JSON:', error);
            res.status(500).json({ error: 'Failed to process user data' });
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 