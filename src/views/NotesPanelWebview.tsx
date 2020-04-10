import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "typeface-roboto";
import "typeface-noto-sans-sc";
import { ThemeProvider } from "@material-ui/styles";
import { crossnoteTheme } from "./util/theme";
import "./i18n/i18n";
import "./index.less";
import { NotesPanel } from "./components/NotesPanel";
import { CssBaseline } from "@material-ui/core";

ReactDOM.render(
  <ThemeProvider theme={crossnoteTheme}>
    <CssBaseline></CssBaseline>
    <NotesPanel></NotesPanel>
  </ThemeProvider>,

  document.getElementById("root")
);
