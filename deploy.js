const fs = require('fs');
const path = require('path');

// Create directory structure
const directories = [
  'public_html',
  'public_html/api',
  'public_html/api/routes',
  'public_html/api/controllers',
  'public_html/api/models',
  'public_html/api/config',
  'public_html/uploads',
  'public_html/uploads/avatars',
  'public_html/uploads/prescriptions',
  'public_html/uploads/medicines'
];

// Create directories if they don't exist
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Copy necessary files
const filesToCopy = [
  { src: 'package.json', dest: 'public_html/package.json' },
  { src: 'package-lock.json', dest: 'public_html/package-lock.json' },
  { src: '.env', dest: 'public_html/.env' }
];

filesToCopy.forEach(file => {
  if (fs.existsSync(file.src)) {
    fs.copyFileSync(file.src, file.dest);
    console.log(`Copied: ${file.src} to ${file.dest}`);
  }
});

// Copy dist folder
if (fs.existsSync('dist')) {
  fs.cpSync('dist', 'public_html/dist', { recursive: true });
  console.log('Copied dist folder to public_html/dist');
}

console.log('Deployment structure created successfully!'); 