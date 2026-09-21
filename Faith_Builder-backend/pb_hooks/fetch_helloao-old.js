// fetch_helloao.js
import fs from 'fs/promises';

// Utility to generate exact 15-character alphanumeric IDs for PocketBase
function makePbId(prefix, number) {
    return (prefix + number.toString().padStart(15 - prefix.length, '0')).toLowerCase();
}

async function downloadBibleData() {
    // We'll use the Berean Standard Bible (BSB) as an example, 
    // but HelloAO has many translations you can fetch.
    const translation = 'BSB'; 
    const baseUrl = 'https://bible.helloao.org/api';

    console.log(`Fetching books for ${translation}...`);
    
    // Fetch the list of books for this translation
    const booksRes = await fetch(`${baseUrl}/${translation}/books.json`);
    const booksData = await booksRes.json();

    const pbBibles = [{
        id: makePbId('bible', 1),
        name: "Berean Standard Bible",
        abbreviation: "BSB",
        language: "en"
    }];

    const pbBooks = [];
    const pbVerses = [];
    
    let bookCounter = 1;
    let verseCounter = 1;

    for (const book of booksData.books) {
        console.log(`Processing ${book.name}...`);
        
        const bookId = makePbId('book', bookCounter);
        pbBooks.push({
            id: bookId,
            name: book.name,
            testament: bookCounter <= 39 ? 'OT' : 'NT', // Standard canonical split
            sort_order: bookCounter
        });

        // Loop through chapters based on HelloAO's chapter count
        for (let chapter = 1; chapter <= book.numberOfChapters; chapter++) {
            
            // HelloAO simplified JSON format is perfect for bulk extraction
            const chapterUrl = `${baseUrl}/${translation}/${book.id}/${chapter}.words.simple.json`;
            const chapRes = await fetch(chapterUrl);
            
            if (!chapRes.ok) continue; // Skip if chapter data is missing
            
            const versesData = await chapRes.json();

            // versesData is keyed by verse number: { "1": ["In", "the", ...], "2": [...] }
            for (const [verseNum, wordsArray] of Object.entries(versesData)) {
                
                pbVerses.push({
                    id: makePbId('verse', verseCounter),
                    bible: pbBibles[0].id,
                    book: bookId,
                    chapter: parseInt(chapter),
                    verse_num: parseInt(verseNum),
                    reference: `${book.name} ${chapter}:${verseNum}`,
                    // HelloAO simple format returns an array of words. Join them into text.
                    text: wordsArray.join(' ')
                });

                verseCounter++;
            }
        }
        bookCounter++;
    }

    console.log(`Done processing! Total verses: ${pbVerses.length}`);

    // Write the output to JSON files for the PocketBase Hook
    await fs.writeFile('bibles.json', JSON.stringify(pbBibles, null, 2));
    await fs.writeFile('books.json', JSON.stringify(pbBooks, null, 2));
    await fs.writeFile('verses.json', JSON.stringify(pbVerses, null, 2));
    
    console.log("✅ Successfully generated bibles.json, books.json, and verses.json!");
}

downloadBibleData();
