const fs = require('fs');
const path = require('path');

const MD_DIR = './notes'; // <-- Your markdown directory

function getMarkdownFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getMarkdownFiles(filePath, fileList);
        } else if (filePath.endsWith('.md')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

function batchAddFrontmatter() {
    if (!fs.existsSync(MD_DIR)) {
        console.error(`❌ Directory not found: ${MD_DIR}`);
        return;
    }

    const files = getMarkdownFiles(MD_DIR);
    console.log(`Found ${files.length} markdown files. Processing frontmatter insertion...\n`);

    for (const filePath of files) {
        const rawText = fs.readFileSync(filePath, 'utf-8');

        // Skip if frontmatter already exists
        if (rawText.trim().startsWith('---')) {
            console.log(`⏩ Skipped (already has frontmatter): ${filePath}`);
            continue;
        }

        // Extract title from first line if it's a markdown header, otherwise use filename
        const fileName = path.basename(filePath, '.md');
        let title = fileName.replace(/-/g, ' '); // Clean up hyphens if used in filenames
        
        const lines = rawText.split('\n');
        if (lines.length > 0 && lines[0].trim().startsWith('# ')) {
            title = lines[0].trim().substring(2).trim();
        }

        // Generate standard frontmatter template
        const frontmatter = `---\ntitle: "${title}"\ntags: []\nverses: []\n---\n\n`;
        const newContent = frontmatter + rawText;

        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`✅ Added frontmatter to: ${filePath} (Title: "${title}")`);
    }

    console.log('\nBatch frontmatter generation complete!');
}

batchAddFrontmatter();