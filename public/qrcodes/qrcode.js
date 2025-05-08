const QRCode = require('qrcode');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Ensure the directory exists
const dir = path.join(__dirname);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// Check if basket.png exists
const basketPath = path.join(dir, 'basket.png');
if (!fs.existsSync(basketPath)) {
    console.error('Error: basket.png not found in the directory:', dir);
    process.exit(1);
}

// Generate QR code as buffer first
QRCode.toBuffer(
    'https://www.mybidhaa.com',
    {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    },
    async function (err, qrBuffer) {
        if (err) {
            console.error('Error generating QR code:', err);
            return;
        }

        try {
            console.log('Processing basket image from:', basketPath);
            
            // Get basket image dimensions
            const basketMetadata = await sharp(basketPath).metadata();
            console.log('Basket image dimensions:', basketMetadata.width, 'x', basketMetadata.height);
            
            // Calculate QR code size to fit inside basket's container (35% of basket width - half the previous size)
            const qrSize = Math.floor(basketMetadata.width * 0.35);
            
            // Resize QR code and remove white background
            const resizedQR = await sharp(qrBuffer)
                .resize(qrSize, qrSize, {
                    fit: 'contain',
                    background: 'transparent'
                })
                .threshold(128) // Convert to pure black and white
                .toBuffer();

            // Calculate position to center QR code in basket's container
            const left = Math.floor((basketMetadata.width - qrSize) / 2);
            const top = Math.floor((basketMetadata.height - qrSize) / 2) + 20;

            // Create final image with basket background and QR code
            const outputPath = path.join(dir, 'qr-bg.png');
            await sharp(basketPath)
                .composite([{
                    input: resizedQR,
                    blend: 'over',
                    left: left,
                    top: top
                }])
                .toFile(outputPath);

            console.log('QR code placed inside basket container successfully at:', outputPath);
        } catch (error) {
            console.error('Error processing images:', error);
            console.error('Error details:', error.message);
        }
    }
);
