import { useEffect, useState } from "react";

import { config } from "@gluestack-ui/config";
import {
  Box,
  GluestackUIProvider,
  Heading,
  Text,
  Button,
  ButtonText,
  VStack,
  Input,
  InputField,
  HStack,
  Center,
} from "@gluestack-ui/themed";
import { ScrollView } from "react-native";
import Gradient from "./assets/Icons/Gradient";
import DocumentData from "./assets/Icons/DocumentData";
import LightBulbPerson from "./assets/Icons/LightbulbPerson";
import Rocket from "./assets/Icons/Rocket";
import Logo from "./assets/Icons/Logo";

import io from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:3000"; // Replace with your server URL

class Client {
  constructor(socket) {
    this.socket = socket;
    this.data = { client: {}, shared: {} };
  }

  setData(newData) {
    this.data = newData;
  }

  updateSharedData(newSharedData) {
    this.setData({ ...this.data, shared: newSharedData });
    this.socket.emit("updateShared", newSharedData);
  }
}

interface Action {
  doThis(): void;
}

export default function App() {
  const [client, setClient] = useState(null);
  const [data, setData] = useState({ client: {}, shared: {} });

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
    });

    const client = new Client(socket);
    setClient(client);

    socket.on("updateData", (newData) => {
      setData(newData);
      client.setData(newData);
      //console.log(newData);
    });

    socket.on("connect", () => {
      // Initial logic or data synchronization
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <GluestackUIProvider config={config}>
      <VStack p="$3" gap="$2" sx={{ _ios: { pt: "$16" } }}>
        {data.shared?.ui?.map((ui: any, index) => {
          console.log(ui);

          let uiHandler = {
            resolve: (val) => {
              console.log("Resolving", val);
              client?.socket?.emit("resolve", {
                value: val,
                uiID: index,
              });
              //client.updateSharedData({ ...data.shared, io: null });
            },
          };

          switch (ui?.type) {
            case "print":
              return <Print uiHandler={uiHandler}>{ui.children}</Print>;
              break;
            case "scan":
              return <Scan uiHandler={uiHandler}>{ui.children}</Scan>;
              break;

            default:
              return <></>;
          }
        })}
      </VStack>
    </GluestackUIProvider>
  );
}

function Print({ children }) {
  return <Heading>{children}</Heading>;
}

function Scan({ uiHandler, children }) {
  const [val, setVal] = useState("");

  return (
    <HStack gap="$1.5">
      <Input
        variant="outline"
        size="md"
        isDisabled={false}
        isInvalid={false}
        isReadOnly={false}
        w="$32"
      >
        <InputField
          placeholder={children}
          value={val}
          onChangeText={(t) => setVal(t)}
        />
      </Input>
      <Button onPress={() => uiHandler.resolve(val)}>
        <ButtonText> ⏎ </ButtonText>
      </Button>
    </HStack>
  );
}
