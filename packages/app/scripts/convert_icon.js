import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.join(__dirname, '../assets/logo_dark.svg');
const iconPath = path.join(__dirname, '../assets/icon.png');
const logoPath = path.join(__dirname, '../assets/logo.png');
// Also update electron copy if possible
const electronIconPath = path.join(__dirname, '../../electron/assets/icon.png');

async function convert() {
    console.log('Converting SVG to PNG...');
    try {
        const buffer = await sharp(svgPath)
            .resize(1024, 1024)
            .png()
            .toBuffer();

        await sharp(buffer).toFile(iconPath);
        console.log(`Updated ${iconPath}`);

        await sharp(buffer).toFile(logoPath);
        console.log(`Updated ${logoPath}`);

        try {
            await sharp(buffer).toFile(electronIconPath);
            console.log(`Updated ${electronIconPath}`);
        } catch (e) {
            console.warn('Could not update electron icon (directory might not exist or verify path):', e.message);
        }

        console.log('Icon conversion complete.');
    } catch (err) {
        console.error('Error converting icon:', err);
        process.exit(1);
    }
}

convert();
