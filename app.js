const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const serverless = require("serverless-http")


const app = express();

module.exports.handler = serverless(app);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://Rubesh_KR:Test123@cluster0.skfvrfw.mongodb.net/todolistDB");

const itemsSchema = {
    name: String
};



const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listsSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listsSchema);


app.get("/", function (req, res) {
    var today = new Date();
    var options = {
        weekday: "long",
        day: "numeric",
        month: "long",
    }

    var day = today.toLocaleDateString("en-us", options);

    Item.find({}).then(function (foundItems) {
        //console.log(foundItems,"im");
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems);
            res.redirect("/")
        } else {
            res.render('list', { title: day, newListItems: foundItems });
        }

    }).catch(function (err) {
        console.log(err);
    });


})

app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });
    
    if ( listName=== "Today"){
        item.save();
        res.redirect("/");
    } else{
        List.findOne({name : listName}).then(function (foundName) {
            foundName.items.push(item);
            foundName.save();
            res.redirect("/"+listName);
        }).catch(function(err){
            console.log(err);
        });

    }
    

});

app.post("/delete", function (req, res) {
    const deleteItem_id = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today"){
        Item.findByIdAndRemove(deleteItem_id).then(function () {
            console.log("item is deleted");
        }).catch(function (err) {
            console.log(err);
        });
    
        res.redirect("/");
    } else {
        List.findOneAndUpdate({name: listName}, {$pull : {items:{_id : deleteItem_id}}}).then(function () {
            console.log("item is deleted");
            res.redirect("/" + listName);
        }).catch(function (err) {
            console.log(err);
        });
        
    }

    
});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }).then(function (foundList) {
        if (!foundList) {

            const list = new List({
                name: customListName,
                items: defaultItems
            });

            list.save();
            res.redirect("/" + customListName);
        } else {
            res.render('list', { title: foundList.name, newListItems: foundList.items });
        }

    }).catch(function (err) {
        console.log(err);
    })




})


const port = process.env.PORT || 3000;

app.listen(port, function () {
    console.log("Server is Started Running on port 3000");
})