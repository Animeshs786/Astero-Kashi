// for the backup db
// mongodump --uri="mongodb+srv://sidaka9643:TOnCpjFawNk7yPav@cluster0.cxlcwna.mongodb.net/CosmicWedding" --out="C:\mondodb backup\cosmicWedding"

// // for restore
// mongorestore --uri="mongodb+srv://cosmicweddingofficial:sVot26XTZU2n26qk@cluster0.fdous.mongodb.net/cosmicWedding" --dir="C:\\mondodb backup\\cosmicWedding\\CosmicWedding" --nsInclude="cosmicWedding.*"
const { MongoClient } = require("mongodb");

//Ajay Code Start
// Source and target database URIs
const sourceUri =
  "mongodb+srv://DRM:yq2K5yl2ST6564no@cluster0.gnnticj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const targetUri =
  "mongodb+srv://teknikodatabase:hvbZS08mWShzxjo3@med-exam.e3j6uab.mongodb.net/iptv";

// Database names
const sourceDbName = "test";
const targetDbName = "iptv";

async function copyDatabase() {
  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUri);

  try {
    // Connect to both databases
    await sourceClient.connect();
    await targetClient.connect();
    console.log("Connected to both databases.");

    const sourceDb = sourceClient.db(sourceDbName);
    const targetDb = targetClient.db(targetDbName);

    // Fetch all collection names from the source database
    const collections = await sourceDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections in source database.`);

    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`Copying collection: ${collectionName}`);

      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);

      // Fetch all documents from the source collection
      const documents = await sourceCollection.find().toArray();

      if (documents.length > 0) {
        // Insert documents into the target collection
        const result = await targetCollection.insertMany(documents);
        console.log(
          `Copied ${result.insertedCount} documents into ${collectionName}`
        );
      } else {
        console.log(`Collection ${collectionName} is empty. Skipping.`);
      }
    }

    console.log("Database copy completed successfully.");
  } catch (error) {
    console.error("Error occurred during database copy:", error);
  } finally {
    // Close the connections
    await sourceClient.close();
    await targetClient.close();
    console.log("Connections closed.");
  }
}

module.exports = copyDatabase;
