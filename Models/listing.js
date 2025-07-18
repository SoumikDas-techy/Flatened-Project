const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingschema = new Schema({
    title:
    {
        type:String,
        required:true,
    },

    description:String,

image: {
  filename: String,
  url: {
    type: String,
    default: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1025&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  }
},




    price:Number,

    location:String,

    country:String,
    reviews:[{
      type: Schema.Types.ObjectId,
      ref:"Review",

    }],
    owner:{
      type: Schema.Types.ObjectId,
      ref:"User",

    }
});

// listingschema.index(
//  { title: "text", description: "text", location: "text", country: "text" },
//   { default_language: "english" }
// );

const Listing = mongoose.model("Listing",listingschema );
module.exports = Listing;




