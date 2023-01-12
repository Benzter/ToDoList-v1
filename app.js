//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/toDoListDB");

const itemSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemSchema);

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to toDoList",
});

const item2 = new Item({
  name: "Hit the + button to add new item",
});

const item3 = new Item({
  name: "<--Hit this to delete an item",
});

const defaultItem = [item1, item2, item3];

app.get("/", function (req, res) {
  Item.find({}, function (err, result) {
    if (result.length === 0) {
      Item.insertMany(defaultItem, function (err) {
        if (!err) {
          console.log("Successfully inerted!!!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: result });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.get("/:cutomeListName", function (req, res) {
  const customListName = _.capitalize(req.params.cutomeListName);
  //console.log(customListName);
  List.findOne({ name: customListName }, function (err, resultsList) {
    if (!err) {
      if (!resultsList) {
        //Create new list
        const list = new List({
          name: customListName,
          items: defaultItem,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show existing list
        res.render("list", {
          listTitle: resultsList.name,
          newListItems: resultsList.items,
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.post("/delete", function (req, res) {
  const listId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(listId, function (err) {
      if (!err) {
        console.log("Successfully deleted!!!");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: listId } } },
      function (err, findList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
