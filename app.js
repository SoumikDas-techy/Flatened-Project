//Points
//1.) Hashing password

//password like
//papan@2004 - is not stored in the db like papan@2004
//rather it is passed through a hashing function where it changes the password to unreadable code which is difficult to steal or hack
//this is the work of hashing function
//a hashing function converts a password to hashed for(unreadabe string) and then it stores in the db
//now when a user wants to login again he enters the same password if the password matches the string in db it allows the user
//password -> [hashing function] -> unreadable string


// 2.)one way function

//in one way function the output is same for several inputs so inputs cannot be guessed 
//example - 12%3=0  , 6%3=0, 9%3=0   so the output is 0 but input from several case - this is one way function

//3.) salting

//adding extra 2 to 3 strings in hashed form of pass so as to make it more secure
//for ex let salt ="@#$"  so after each hashed form it will be added to make it more secure



// await require("./models/listing").syncIndexes();


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./Models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./util/wrapAsync.js");
const ExpressError = require("./util/ExpressError.js"); 
const {listingSchema,reviewSchema} = require("./schema.js");
const Review = require("./Models/review.js"); 
const session = require("express-session");
const flash = require("connect-flash");
const passport =  require("passport");
const LocalStrategy = require("passport-local");
const User = require("./Models/user.js");



app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const sessionOption = {
    secret:"mysecretcode",
    resave: false,
    saveUninitialized: true,
    cookie:{
        expries: Date.now() + 7 * 24 * 60 *60*1000,
        maxAge:  7 * 24 * 60 *60*1000,
        httpOnly: true,
    }
};

app.use(session(sessionOption));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;   
    next();
});

// app.get("/demo", async(req,res)=>{
//     let fakeUser = new User({
//         email: "dassoumik53@gmail.com",
//         username:"delta-student",
//     });
//     let registeredUser = await User.register(fakeUser,"Helloworld");
//     res.send(registeredUser);

// })


app.listen(8080,()=>{
    console.log("server is listening");
});

// app.get("/", (req,res)=>{
//     res.send("Visting world");
// });


//creating database

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





//testing the model
// app.get("/testingListing", async (req, res) => {
//     try {
//         let sampleListing = new Listing({
//             title: "Home sweet Home",
//             description: "Kolkata behala",
//             price: 2000,
//             location: "India",
//             country: "USA",
//         });

//         const result = await sampleListing.save();
//         console.log("Sample was saved:", result);
//         res.send("Successful");
//     } catch (err) {
//         console.error("Error saving listing:", err);
//         res.status(500).send("Failed to save listing");
//     }
// });

//middlewaress

const validateListing = (req,res,next)=>{
    let {error} = listingSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    else{
        next();
    }

}

const validateReview = (req,res,next)=>{
    let {error} = reviewSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    else{
        next();
    }

}
const isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You don't have permission to do that");
        return res.redirect(`/listings/${id}`);
    }

    // ✅ Call next if everything is fine
    next();
};

const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to do that");
        return res.redirect("/login");
    }
    next();
};

const isAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let foundReview = await Review.findById(reviewId);

    if (!foundReview || !foundReview.author.equals(res.locals.currUser._id)) {
        req.flash("error", "You don’t have permission to do that");
        return res.redirect(`/listings/${id}`);
    }

    next();
};




//index route
const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

app.get("/listings", wrapAsync(async (req, res) => {
    const { q } = req.query;
    let listings;

    if (q) {
        listings = await Listing.find(
            { $text: { $search: q } },
            { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" } });

        // If you didn't build the text index yet, fallback to this:
        // const regex = new RegExp(escapeRegExp(q), "i");
        // listings = await Listing.find({
        //   $or: [
        //     { title: regex },
        //     { description: regex },
        //     { location: regex },
        //     { country: regex }
        //   ]
        // });
    } else {
        listings = await Listing.find({});
    }

    res.render("./listings/index.ejs", { allListings: listings, q });
}));

//new route
app.get("/listings/new", (req,res)=>{
    if((!req.isAuthenticated()))
    {
        req.flash("error","You must be logged in to create listing");
        return res.redirect("/login");  
    }
    res.render("./listings/new.ejs");

});


//show route
app.get("/listings/:id", wrapAsync(async(req,res)=>{
    let {id}=req.params;
    const listing = await Listing.findById(id).populate({path:"reviews",populate:{
        path:"author",
    }}).populate("owner");
    if(!listing)
    {
         req.flash("error", "Listing you requested for doesnt exist");
         return res.redirect("/listings");
    }
    res.render("./listings/show.ejs",{listing});

}));

//create route
app.post("/listings", isLoggedIn, validateListing, wrapAsync(async (req, res, next) => {
    if (!req.body.listing.image || !req.body.listing.image.url) {
        req.body.listing.image = { url: undefined };
    }

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "New Listing created");
    res.redirect("/listings");
}));



//edit route
app.get("/listings/:id/edit", isLoggedIn, isOwner, wrapAsync(async(req,res)=>{
            if((!req.isAuthenticated()))
    {
        req.flash("error","You must be logged in to create listing");
        return res.redirect("/login");  
    }
    let {id}=req.params;
    const listing = await Listing.findById(id);
     if(!listing)
        {
         req.flash("error", "Listing you requested for doesnt exist");
         return res.redirect("/listings");
    }
    res.render("./listings/edit.ejs",{listing});
    
}));
//update route
app.put("/listings/:id", isLoggedIn , validateListing, wrapAsync(async (req,res)=>{
        if((!req.isAuthenticated()))
    {
        req.flash("error","You must be logged in to create listing");
        return res.redirect("/login");  
    }
    let {id} = req.params;
    await Listing.findByIdAndUpdate(req.params.id, req.body.listing);
    req.flash("success", " Listing Updated");
    res.redirect(`/listings/${id}`);

}));
//delete route
app.delete("/listings/:id", isLoggedIn, isOwner, wrapAsync(async (req,res)=>{
            if((!req.isAuthenticated()))
    {
        req.flash("error","You must be logged in to create listing");
        return res.redirect("/login");  
    }
    let {id} = req.params;
    let deleteListing = await Listing.findByIdAndDelete(id);
    console.log(deleteListing);
    req.flash("success", " Listing Deleted");
    res.redirect("/listings");
}));

//review
//post route
app.post("/listings/:id/reviews", isLoggedIn, validateReview, wrapAsync(async(req,res)=>{
   let listing = await Listing.findById(req.params.id);
   let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
   listing.reviews.push(newReview);
   

   await newReview.save();
   await listing.save();
   req.flash("success", " New review created");
   res.redirect(`/listings/${listing._id}`);


}));
//delete route
app.delete("/listings/:id/reviews/:reviewId",  isLoggedIn, isAuthor,wrapAsync(async(req,res)=>{
    let {id,reviewId} = req.params;
    await Listing.findByIdAndUpdate(id,{ $pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", " Review Deleted");
    res.redirect(`/listings/${id}`);
}))


//signup login

app.get("/signup", (req,res)=>{
    res.render("users/signup.ejs");
}
);

//post
app.post("/signup", wrapAsync(async(req,res)=>{
    try
    {
        let {username, email, password} = req.body;
        const newUser = new User({email, username});
        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser);
        req.login(registeredUser,(err)=>{
            if(err)
            {
                return next(err);
            }
            req.flash("success", "Welcome to Home Sweet Home");
            res.redirect("/listings");
        })

    }
    catch(e){
        req.flash("error", e.message);
        res.redirect("/signup");
    }

}));


//login

app.get("/login",(req,res)=>{
    res.render("users/login.ejs")
})

app.post("/login", passport.authenticate("local",{failureRedirect:'/login', failureFlash:true}), async(req,res)=>{
    req.flash("success","Welcome back to Home Sweet Home");
    res.redirect("/listings");

})


app.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err) {
           return next(err);
        }
        req.flash("success","You are logged out");
        res.redirect("/listings");
    })
})




app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { err }); 
});








