const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Configuration
const PB_URL = 'http://127.0.0.1:8090';
const EMAIL = 'aaron.grimm66@gmail.com';       // <-- Update this
const PASSWORD = 'fBWgwJL5iOxH';        // <-- Update this
const MD_DIR = './notes';                // <-- Root folder containing your .md files

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

async function ingestMarkdown() {
    console.log('Authenticating with PocketBase...');
    
    // 1. Authenticate
    const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: EMAIL, password: PASSWORD })
    });
    
    const authData = await authRes.json();
    const token = authData.token;

    if (!token) {
        console.error("❌ Authentication failed. Check your credentials.");
        return;
    }

    const files = getMarkdownFiles(MD_DIR);
    console.log(`Found ${files.length} markdown files. Beginning sync...\n`);
    
    // 2. Process each file
    for (const filePath of files) {
        const rawText = fs.readFileSync(filePath, 'utf-8');
        const parsed = matter(rawText);
        
        const fileName = path.basename(filePath, '.md');
        const title = parsed.data.title || fileName;
        
        // Format Tags
        let tags = '';
        if (Array.isArray(parsed.data.tags)) {
            tags = parsed.data.tags.join(', ');
        } else if (typeof parsed.data.tags === 'string') {
            tags = parsed.data.tags;
        }

        // Format Verses for Cross-Referencing
        let verses = [];
        if (Array.isArray(parsed.data.verses)) {
            verses = parsed.data.verses;
        } else if (typeof parsed.data.verses === 'string') {
            verses = parsed.data.verses.split(',').map(v => v.trim());
        }

        // 3. Search for existing material record
        const encodedTitle = encodeURIComponent(`title="${title.replace(/"/g, '\\"')}"`);
        const searchRes = await fetch(`${PB_URL}/api/collections/materials/records?filter=${encodedTitle}`, {
            headers: { 'Authorization': token }
        });
        const searchData = await searchRes.json();
        const existingRecord = searchData.items && searchData.items.length > 0 ? searchData.items[0] : null;

        // 4. Update or Create Material
        const method = existingRecord ? 'PATCH' : 'POST';
        const endpoint = existingRecord 
            ? `${PB_URL}/api/collections/materials/records/${existingRecord.id}`
            : `${PB_URL}/api/collections/materials/records`;

        const res = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ 
                title: title, 
                content: parsed.content.trim(),
                tags: tags 
            })
        });

        if (res.ok) {
            const action = existingRecord ? 'Updated' : 'Created';
            console.log(`✅ ${action}: ${title}`);

            // 5. Sync Cross-References
            for (const verse of verses) {
                const crFilter = encodeURIComponent(`reference="${title.replace(/"/g, '\\"')}" && related_verse="${verse.replace(/"/g, '\\"')}"`);
                const crRes = await fetch(`${PB_URL}/api/collections/cross_references/records?filter=${crFilter}`, {
                    headers: { 'Authorization': token }
                });
                const crData = await crRes.json();

                if (crData.items && crData.items.length === 0) {
                    await fetch(`${PB_URL}/api/collections/cross_references/records`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token
                        },
                        body: JSON.stringify({
                            reference: title,
                            related_verse: verse
                        })
                    });
                    console.log(`  -> Linked to verse: ${verse}`);
                }
            }
        } else {
            const errData = await res.json();
            console.error(`❌ Failed: ${title} -`, errData.message);
        }
    }
    
    console.log('\nSync and cross-reference mapping complete!');
}

ingestMarkdown();