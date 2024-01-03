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
    const io = this.client.io;

    let x = await io.scan("Value of X?");
    let y = await io.scan("Value of Y?");
    io.print("x + y = " + (parseInt(x) + parseInt(y)));
  }
}

class Client {
  io: ClientIO;

  constructor(socket) {
    this.io = new ClientIO(this);

    this.socket = socket;
    this.data = {
      server: {},
      shared: {
        io: [],
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

class ClientIO {
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
    const ioID = this.renderAppend({
      type: "scan",
      children: text,
    });

    console.log("SCANID", ioID);

    return new Promise((resolve) => {
      this.client.socket.on("resolve", (data) => {
        if (data.ioID == ioID) {
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
        io: [data],
      },
    });
    return this.client.data.shared.io.length - 1;
  }

  renderAppend(data) {
    this.client.setData({
      ...this.client.data,
      shared: {
        ...this.client.data.shared,
        io: [...this.client.data.shared.io, data],
      },
    });

    return this.client.data.shared.io.length - 1;
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
