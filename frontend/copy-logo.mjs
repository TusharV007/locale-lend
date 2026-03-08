import { copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, '..', 'local-share-logo.png');
const dest = join(__dirname, 'public', 'logo.png');

copyFileSync(src, dest);
console.log('Logo copied successfully:', dest);
