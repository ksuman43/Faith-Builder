// fetch_helloao.js
import fs from 'fs/promises';

function makePbId(prefix, number) {
    return (prefix + number.toString().padStart(15 - prefix.length, '0')).toLowerCase();
}

async function downloadBibleData() {
    const translation = 'BSB';
    const baseUrl = 'https://bible.helloao.org/api';

    console.log(`Fetching books for ${translation}...`);
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
            testament: bookCounter <= 39 ? 'OT' : 'NT',
            sort_order: bookCounter
        });

        let chapter = 1;

        while (true) {
            // Using the standard .json endpoint which is guaranteed to exist
            const chapterUrl = `${baseUrl}/${translation}/${book.id}/${chapter}.json`;
            const chapRes = await fetch(chapterUrl);

            if (!chapRes.ok) {
                break; // Hit the end of the book (404)
            }

            const rawData = await chapRes.json();

            // HelloAO standard format splits chapters into an array of content blocks
            // We use a Map to combine text in case a single verse is split by poetry breaks
            const chapterVerses = {};

            if (rawData.chapter && rawData.chapter.content) {
                for (const block of rawData.chapter.content) {
                    if (block.type === 'verse') {
                        const vNum = block.number;
                        let blockText = "";

                        // Extract text safely, ignoring complex footnote objects
                        for (const item of block.content) {
                            if (typeof item === 'string') {
                                blockText += item;
                            } else if (item && item.text) {
                                blockText += item.text;
                            }
                        }

                        if (!chapterVerses[vNum]) chapterVerses[vNum] = "";
                        chapterVerses[vNum] += " " + blockText.trim();
                    }
                }
            }

            // Push our cleaned verses into the PocketBase array
            for (const [verseNum, text] of Object.entries(chapterVerses)) {
                pbVerses.push({
                    id: makePbId('verse', verseCounter),
                              bible: pbBibles[0].id,
                              book: bookId,
                              chapter: parseInt(chapter),
                              verse_num: parseInt(verseNum),
                              reference: `${book.name} ${chapter}:${verseNum}`,
                              text: text.trim()
                });
                verseCounter++;
            }

            chapter++;
        }
        bookCounter++;
    }

    console.log(`Done processing! Total verses extracted: ${pbVerses.length}`);

    await fs.writeFile('bibles.json', JSON.stringify(pbBibles, null, 2));
    await fs.writeFile('books.json', JSON.stringify(pbBooks, null, 2));
    await fs.writeFile('verses.json', JSON.stringify(pbVerses, null, 2));

    console.log("✅ Successfully generated bibles.json, books.json, and verses.json!");
}

downloadBibleData();
