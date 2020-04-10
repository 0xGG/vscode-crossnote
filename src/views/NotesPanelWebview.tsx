import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "typeface-roboto";
import "typeface-noto-sans-sc";
import { ThemeProvider } from "@material-ui/styles";
import { crossnoteTheme } from "./util/theme";
import "./index.less";
import { NotesPanel } from "./components/NotsPanel";

ReactDOM.render(
  <ThemeProvider theme={crossnoteTheme}>
    <NotesPanel></NotesPanel>
  </ThemeProvider>,

  document.getElementById("root")
);
