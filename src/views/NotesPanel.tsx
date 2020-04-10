import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "typeface-roboto";
import "typeface-noto-sans-sc";
import { ThemeProvider } from "@material-ui/styles";
import { crossnoteTheme } from "./util/theme";
import "./index.less";
import { Box, Typography } from "@material-ui/core";
import { Message, MessageAction } from "../extension/message";
import { CrossnoteTreeItem } from "../extension/TreeItem";

interface Props {}
function NotesPanel(props: Props) {
  const [selectedTreeItem, setSelectedTreeItem] = useState<CrossnoteTreeItem>(
    null
  );

  useEffect(() => {
    const onMessage = (event) => {
      const message: Message = event.data;
      console.log(message);
      switch (message.action) {
        case MessageAction.SelectedTreeItem:
          setSelectedTreeItem(message.data);
          break;
        default:
          break;
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <Box>
      <Typography>This is notes panel</Typography>
      {selectedTreeItem && (
        <Box>
          <Typography>{selectedTreeItem.type}</Typography>
          <Typography>{selectedTreeItem.path}</Typography>
        </Box>
      )}
    </Box>
  );
}

ReactDOM.render(
  <ThemeProvider theme={crossnoteTheme}>
    <NotesPanel></NotesPanel>
  </ThemeProvider>,

  document.getElementById("root")
);
