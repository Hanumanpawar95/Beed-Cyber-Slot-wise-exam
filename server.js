const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Set up multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Serve static files (like index.html)
app.use(express.static(path.join(__dirname)));

// API endpoint to handle CSV file upload
app.post('/upload', upload.single('csvFile'), (req, res) => {
    const filePath = req.file.path;
    const results = [];

    // Read the uploaded CSV file and process it
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            // For each course, we want to map the corresponding Exam Slot
            const course = data.Course;
            const examSlot = data['Exam Slot'];

            // Initialize an object for the row if it doesn't exist yet
            let existingRow = results.find(row => row['Learner Code'] === data['Learner Code']);

            if (!existingRow) {
                existingRow = {
                    'Learner Name': data.Name,  // Ensure 'Name' column is used for Learner Name
                    'Learner Code': data['Learner Code'],
                    'BS-CIT': 'N/A',
                    'BS-CLS': 'N/A',
                    'BS-CSS': 'N/A',
                };
                results.push(existingRow);
            }

            // Assign the Exam Slot to the right course column
            if (course === 'BS-CIT') {
                existingRow['BS-CIT'] = examSlot;
            } else if (course === 'BS-CLS') {
                existingRow['BS-CLS'] = examSlot;
            } else if (course === 'BS-CSS') {
                existingRow['BS-CSS'] = examSlot;
            }
        })
        .on('end', () => {
            // Send the processed data as JSON response
            res.json(results);
        })
        .on('error', (err) => {
            console.error("Error reading CSV:", err);
            res.status(500).json({ error: "Error processing CSV file" });
        });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
