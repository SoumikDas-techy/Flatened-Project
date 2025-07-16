const mongoose = require("mongoose");
const initdata = require("./data.js");
const Listing  =require("../Models/listing.js");

const MANGO_DB = "mongodb://127.0.0.1:27017/visitingworld";
async function main() {
await mongoose.connect(MANGO_DB);
}
main()
.then(()=>{
  console.log("Connected to DB:", mongoose.connection.name);

})
.catch((err)=>{
    console.log(err);
});

const initDB = async () => {
  await Listing.deleteMany({});

  const dataWithOwner = initdata.data.map((obj) => ({
    ...obj,
    owner: "686e26de165b615a6e52126c"
  }));

  await Listing.insertMany(dataWithOwner);
  console.log("Data was initialised");
};

initDB();