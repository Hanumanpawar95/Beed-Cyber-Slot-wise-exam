const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Set up multer for file upload
const upload = multer({ dest: 'uploads/' });

// Serve static files (like HTML, CSS)
app.use(express.static('public'));

// Handle CSV file upload and parsing
app.post('/upload', upload.single('csvFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    // Parse the uploaded CSV file
    fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => {
            results.push({
                learnerName: data['Learner Name'], // Adjust based on your CSV column names
                learnerCode: data['Learner Code'], // Adjust based on your CSV column names
                BS_CIT: data['BS-CIT'], // Adjust based on your CSV column names
                BS_CLS: data['BS-CLS'], // Adjust based on your CSV column names
                BS_CSS: data['BS-CSS'], // Adjust based on your CSV column names
            });
        })
        .on('end', () => {
            // Send parsed data back to the client
            res.json(results);

            // Optionally, delete the uploaded file after processing
            fs.unlinkSync(filePath);
        })
        .on('error', (err) => {
            console.error(err);
            res.status(500).json({ error: 'Error parsing file' });
        });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
