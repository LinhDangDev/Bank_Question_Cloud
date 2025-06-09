import { exec } from 'child_process';
import * as path from 'path';
import * as os from 'os';

// Determine the command to open a URL based on the operating system
function getOpenCommand(): string {
    switch (os.platform()) {
        case 'win32':
            return 'start';
        case 'darwin':
            return 'open';
        default:
            return 'xdg-open';
    }
}

// The URL of the Swagger UI
const swaggerUrl = 'http://localhost:3000/api';

// Path to the HTML file
const htmlPath = path.join(__dirname, 'swagger-redirect.html');

// Open the Swagger UI directly
console.log(`Opening Swagger UI at ${swaggerUrl}...`);
exec(`${getOpenCommand()} ${swaggerUrl}`);

// You can also open the HTML file instead if you prefer
// console.log(`Opening HTML file at ${htmlPath}...`);
// exec(`${getOpenCommand()} ${htmlPath}`);

console.log('If the browser does not open automatically, please visit:');
console.log(swaggerUrl);
