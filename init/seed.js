const mongoose = require("mongoose");
const Listing = require("../Models/listing.js");
const { data } = require("./data.js"); // 👈 Accessing 'data' property from the exported object

const MANGO_DB = "mongodb://127.0.0.1:27017/visitingworld";

async function seedDB() {
  try {
    await mongoose.connect(MANGO_DB);
    console.log("✅ DB connected");

    await Listing.deleteMany({});
    console.log("🗑️ Old listings removed");

    await Listing.insertMany(data); // 
    console.log("✅ New listings inserted");

    await mongoose.connection.close();
    console.log("🔌 DB connection closed");
  } catch (err) {
    console.error("❌ Error seeding the DB:", err);
  }
}

seedDB();
