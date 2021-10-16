//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect(
    'mongodb+srv://admin-luvjeet:test-123@cluster0.yljos.mongodb.net/todolistDB',
    { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }
);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const itemsSchema = {
    name: String,
};

const Item = mongoose.model('Item', itemsSchema); // Mongoose model are usually capitalised for example Item

const item1 = new Item({
    name: 'Welcome to your list!',
});

const defaultItems = [item1];

const listSchema = {
    name: String,
    items: [itemsSchema],
};

const List = mongoose.model('List', listSchema);
////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/', function (req, res) {
    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Success');
                }
            });
            res.redirect('/');
        } else {
            res.render('list', {
                listTitle: 'Today',
                newListItems: foundItems,
            });
        }
    });
});

app.post('/', function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName,
    });

    if (listName === 'Today') {
        item.save();
        res.redirect('/');
    } else {
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect('/' + listName);
        });
    }
});

app.post('/delete', function (req, res) {
    const checkboxItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === 'Today') {
        Item.findByIdAndRemove(checkboxItemId, function (err) {
            if (!err) {
                res.redirect('/');
            }
        });
    } else {
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkboxItemId } } },
            function (err, foundList) {
                if (!err) {
                    res.redirect('/' + listName);
                }
            }
        );
    }
});

app.get('/:customListName', function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems,
                });
                list.save();
                res.redirect('/' + customListName);
            } else {
                res.render('list', {
                    listTitle: foundList.name,
                    newListItems: foundList.items,
                });
            }
        }
    });

    const list = List({
        name: String,
        items: defaultItems,
    });
    list.save();
});

let port = process.env.PORT;
if (port == null || port == '') {
    port = 3000;
}

app.listen(port, function () {
    console.log('Server started on port 3000');
});
