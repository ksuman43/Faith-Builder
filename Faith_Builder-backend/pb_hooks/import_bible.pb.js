$app.rootCmd?.addCommand(new Command({
    use: "import_bible <collection> <filepath>",
    short: "Bulk imports data into a specific collection from a JSON file",
    run: (cmd, args) => {
        const collectionName = args[0];
        const filePath = args[1];

        if (!collectionName || !filePath) {
            console.error("Error: Missing arguments.");
            console.log("Usage: ./pocketbase import_bible <collection> <filepath>");
            return;
        }

        console.log(`Reading ${filePath}...`);
        const rawData = $os.readFile(filePath);
        const dataArray = JSON.parse(rawData.toString());

        // Find the collection in the database
        const collection = $app.findCollectionByNameOrId(collectionName);
        if (!collection) {
            console.error(`❌ Error: Collection '${collectionName}' does not exist!`);
            console.error(`Please create it in the PocketBase Admin UI first.`);
            return;
        }

        console.log(`Importing ${dataArray.length} records into '${collectionName}'...`);

        // Run in a single transaction for speed
        $app.runInTransaction((txApp) => {
            for (let data of dataArray) {
                const record = new Record(collection);
                
                // Dynamically map all JSON keys to the PocketBase record
                for (let key of Object.keys(data)) {
                    record.set(key, data[key]);
                }
                
                txApp.save(record);
            }
        });

        console.log(`✅ Success!`);
    }
}));
