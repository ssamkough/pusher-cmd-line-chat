const prompt = require("prompt");
const { ChatManager, TokenProvider } = require("@pusher/chatkit-client");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const readline = require("readline");
const ora = require("ora");
require("dotenv").config();

const spinner = ora();

makeCompatiblewithcommadline = () => {
  const { window } = new JSDOM();
  global.window = window;
  global.navigator = {};
};

prompt.start();
makeCompatiblewithcommadline();
prompt.message = "";

var usernameSchema = {
  properties: {
    name: {
      message: "Enter Username: ",
      required: true
    }
  }
};

var roomIndexSchema = {
  properties: {
    index: {
      message: "Enter Room Index: ",
      required: true
    }
  }
};

prompt.get(usernameSchema, function(err, result) {
  console.log("Username: " + result.name);

  spinner.start();
  axios
    .post("http://localhost:3000/user", { name: result.name })
    .then(data => {
      console.log("Success: " + data.data.msg);

      //get the token
      const chatmanager = new ChatManager({
        instanceLocator: `${process.env.CHAT_KIT_INSTANCE_LOCATOR}`,
        userId: result.name,
        tokenProvider: new TokenProvider({
          url: "http://localhost:3000/auth"
        })
      });

      chatmanager
        .connect()
        .then(data => {
          subsroom(data);
        })
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log("Error: " + err);
    });
});

const subsroom = async user => {
  //list all available rooms
  spinner.stop();
  const avaiblerooms = await user.getJoinableRooms();
  const allromms = [...avaiblerooms, ...user.rooms];

  allromms.forEach((element, index) => {
    console.log("Rooms: " + index + " " + JSON.stringify(element.name));
  });

  //get room index to join
  prompt.get(roomIndexSchema, async function(err, result) {
    var roomnumber = result.index;

    const selectedRoom = allromms[roomnumber];

    await user.subscribeToRoomMultipart({
      roomId: selectedRoom.id,
      hooks: {
        onMessage: message => {
          // this hook will run when a new message is recieved displaying the message

          if (message.senderId !== user.name) {
            console.log(
              message.senderId + " : " + message.parts[0].payload.content
            );
          }
        },
        onUserJoined: userobj => {
          //this hook will run when a new user is joind to the room diaplaying the joined message
          console.log(userobj.name + " joined, say hello!\n");
        }
      },

      messageLimit: 0
    });

    const input = readline.createInterface({ input: process.stdin });

    input.on("line", async test => {
      //send the massage you enter to the room

      await user.sendSimpleMessage({ roomId: selectedRoom.id, text: test });
    });
  });
};
