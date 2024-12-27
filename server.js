const express = require("express");
const multer = require("multer");
const Papa = require("papaparse");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" }); // Uploaded files will go here

app.use(express.static("public")); // Serve static files

// Endpoint to handle file upload
app.post("/upload", upload.single("csvFile"), (req, res) => {
    const filePath = path.join(__dirname, req.file.path);

    // Read and parse the CSV file
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error reading file");
        }

        // Log raw CSV data to inspect it
        console.log("Raw CSV Data:", data);

        // Use PapaParse to parse CSV
        const parsedData = Papa.parse(data, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true // Ensure numeric values are parsed as numbers
        });

        // Log parsed data for debugging
        console.log("Parsed CSV Data:", parsedData);

        // Clean up the uploaded file
        fs.unlink(filePath, (err) => {
            if (err) console.error("Error deleting file:", err);
        });

        // If parsing was successful, format the data
        if (parsedData.errors.length === 0) {
            // Initialize an object to store learner information with course-specific exam slots
            const learnerData = {};

            // Loop through each row in the parsed data
            parsedData.data.forEach((row) => {
                const learnerCode = String(row["Learner Code"]).trim();
                const learnerName = row["Name"].trim();
                const course = row["Course"].trim();
                const examSlot = row["Exam Slot"] || "-";

                // Create a learner entry if not already present
                if (!learnerData[learnerCode]) {
                    learnerData[learnerCode] = {
                        learnerName: learnerName,
                        learnerCode: learnerCode,
                        BS_CIT: "-",
                        BS_CLS: "-",
                        BS_CSS: "-"
                    };
                }

                // Set the exam slot for the respective course
                if (course === "BS-CIT") {
                    learnerData[learnerCode].BS_CIT = examSlot;
                } else if (course === "BS-CLS") {
                    learnerData[learnerCode].BS_CLS = examSlot;
                } else if (course === "BS-CSS") {
                    learnerData[learnerCode].BS_CSS = examSlot;
                }
            });

            // Convert learner data object to array
            const formattedData = Object.values(learnerData);

            // Send the formatted data as a response
            res.json(formattedData);
        } else {
            console.error("Error parsing CSV:", parsedData.errors);
            res.status(400).send("Error parsing CSV file");
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
