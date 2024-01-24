const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

interface Action {}

class AdditionAction implements Action {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async invoke() {
    const ui = this.client.ui;

    ui.print(`Enter your first name`);
    let firstName = await ui.scan("firstName = ");

    ui.print(`Enter your last name`);
    let lastName = await ui.scan("lastName = ");

    ui.print(`Hello ${firstName} ${lastName}!`);
  }
}

class Client {
  ui: ClientUI;

  constructor(socket) {
    this.ui = new ClientUI(this);

    this.socket = socket;
    this.data = {
      server: {},
      shared: {
        ui: [],
      },
    };
  }

  setData(newData) {
    this.data = newData;
    this.socket.emit("updateData", this.data);
  }

  getData() {
    return this.data;
  }

  invokeAction(ActionClass: typeof Action) {
    new ActionClass(this).invoke();
  }
}

class ClientUI {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  print(text) {
    this.renderAppend({
      type: "print",
      children: text,
    });
  }

  async scan(text: string): Promise<string> {
    const uiID = this.renderAppend({
      type: "scan",
      children: text,
    });

    console.log("SCANID", uiID);

    return new Promise((resolve) => {
      this.client.socket.on("resolve", (data) => {
        if (data.uiID == uiID) {
          resolve(data.value);
        }
      });

      /*setTimeout(() => {
        resolve("Sanket");
      }, 1000); // 1000 milliseconds = 1 second*/
    });
  }

  render(data) {
    this.client.setData({
      ...this.client.data,
      shared: {
        ...this.client.data.shared,
        ui: [data],
      },
    });
    return this.client.data.shared.ui.length - 1;
  }

  renderAppend(data) {
    this.client.setData({
      ...this.client.data,
      shared: {
        ...this.client.data.shared,
        ui: [...this.client.data.shared.ui, data],
      },
    });

    return this.client.data.shared.ui.length - 1;
  }
}

const ClientList = {};

io.on("connection", (socket) => {
  const client = new Client(socket);
  ClientList[socket.id] = client;

  console.log(ClientList);

  socket.on("resolve", (data) => {
    console.log(data);
  });

  socket.on("updateShared", (updatedSharedData) => {
    const updatedData = { ...client.getData(), shared: updatedSharedData };
    client.setData(updatedData);
  });

  socket.on("disconnect", () => {
    delete ClientList[socket.id];
  });

  setTimeout(async () => {
    client.invokeAction(AdditionAction);
  }, 1000);

  /*  setTimeout(() => {
    BDD;
  });*/
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
