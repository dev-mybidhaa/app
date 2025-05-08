const mysql = require('mysql2/promise');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// MySQL Database Connection
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'bidhaa_db'
};

async function downloadImages() {
    const connection = await mysql.createConnection(dbConfig);

    try {
        // Fetch BookID and imageURL where imageURL is not NULL
        const [rows] = await connection.execute("SELECT BookID, imageURL FROM books WHERE imageURL IS NOT NULL");

        // Create folder if it doesn't exist
        const imageFolder = path.join(__dirname, 'downloaded_images');
        if (!fs.existsSync(imageFolder)) {
            fs.mkdirSync(imageFolder);
        }

        // Process each book entry
        for (const book of rows) {
            const { BookID, imageURL } = book;
            const filename = `${BookID}.jpg`;  // Naming the file as BookID.jpg
            const imagePath = path.join(imageFolder, filename);

            try {
                // Download and save the image
                const response = await axios({
                    method: 'get',
                    url: imageURL,
                    responseType: 'stream'
                });

                // Pipe the image stream to the local file
                const writer = fs.createWriteStream(imagePath);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                console.log(`✅ Downloaded: ${imageURL} → ${imagePath}`);

                // Update database with the local file path
                await connection.execute("UPDATE books SET local_image_path = ? WHERE BookID = ?", [imagePath, BookID]);

            } catch (error) {
                console.error(`❌ Failed to download: ${imageURL} | Error: ${error.message}`);
            }
        }

    } catch (error) {
        console.error("Database error:", error);
    } finally {
        await connection.end();
    }
}

// Run the function
downloadImages();
