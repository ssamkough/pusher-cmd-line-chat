const chatkit = require("@pusher/chatkit-server");
const express = require("express");
const bp = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

const chatkit = new chatkit.default({
  instanceLocator: `${process.env.CHAT_KIT_INSTANCE_LOCATOR}`,
  key: `${process.env.CHAT_KIT_KEY}`
});

//cofigure user route
app.post("/user", (req, res) => {
  const { name } = req.body;

  console.log("User Sign-In: " + name);

  chatkit
    .createUser({ id: name, name: name })
    .then(() => {
      console.log("New User Created");
      res.status(200).json({ msg: "user_created" });
    })
    .catch(err => {
      if (err.error === "services/chatkit/user_already_exists") {
        console.log("Duplicate User Detected");
        res.status(400).json({ msg: "duplicate_user" });
      }
    });
});

app.post("/auth", (req, res) => {
  console.log("Requested Connect By User: " + req.query.user_id);

  var userId = req.query.user_id;

  var authdata = chatkit.authenticate({ userId: userId });
  console.log(authdata);

  res.status(authdata.status).json(authdata.body);
});

const port = 3000;
app.listen(port, () => {
  console.log("Listening on port " + port + "...");
});
