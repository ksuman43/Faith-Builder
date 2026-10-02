// upload_to_pb.js
import fs from 'fs/promises';

// --- UPDATE THESE WITH YOUR POCKETBASE ADMIN CREDENTIALS ---
const ADMIN_EMAIL = 'aaron.grimm66@gmail.com';
const ADMIN_PASSWORD = 'fBWgwJL5iOxH';
const BASE_URL = 'http://127.0.0.1:8090';

async function uploadData() {
    console.log("Authenticating with PocketBase...");
    
    // 1. Authenticate as Admin to get a tokento get a token
    const authRes = await fetch(`${BASE_URL}/api/collections/_superusers/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    
    if (!authRes.ok) {
        console.error("Authentication failed! Check your email/password.");
        return;
    }
    
    const { token } = await authRes.json();
    const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
    };

    // Helper function to upload an array in batches
    async function uploadCollection(collectionName, fileName) {
        console.log(`\nReading ${fileName}...`);
        const data = JSON.parse(await fs.readFile(fileName, 'utf8'));
        
        console.log(`Uploading ${data.length} records to '${collectionName}'...`);
        
        // We upload in chunks of 500 so we don't overwhelm the local server
        const chunkSize = 500;
        let successCount = 0;

        for (let i = 0; i < data.length; i += chunkSize) {
            const batch = data.slice(i, i + chunkSize);
            
            // Fire off 500 POST requests concurrently
            await Promise.all(batch.map(async (record) => {
                const res = await fetch(`${BASE_URL}/api/collections/${collectionName}/records`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(record)
                });
                
                // If a record already exists (e.g., you run the script twice), we can ignore the 400 error
                if (res.ok) successCount++;
            }));
            
            // Log progress for large collections (like Verses)
            if (data.length > 100) {
                console.log(`  Progress: ${Math.min(i + chunkSize, data.length)} / ${data.length}`);
            }
        }
        
        console.log(`✅ Finished ${collectionName}. Successfully inserted: ${successCount}`);
    }

    // 2. Upload in strict relational order
    await uploadCollection('bibles', './bibles.json');
    await uploadCollection('books', './books.json');
    await uploadCollection('verses', './verses.json');
    
    console.log("\n🎉 All imports complete! Check your PocketBase Admin UI.");
}

uploadData();
