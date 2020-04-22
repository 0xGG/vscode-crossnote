import React from "react";
import ReactDOM from "react-dom";
import "typeface-roboto";
import "typeface-noto-sans-sc";
import "noty/lib/noty.css";
import "noty/lib/themes/relax.css";
import { ThemeProvider } from "@material-ui/styles";
import "./i18n/i18n";
import "./index.less";
import { NotesPanel } from "./components/NotesPanel";
import { CssBaseline } from "@material-ui/core";
import { selectedTheme } from "./themes/manager";

ReactDOM.render(
  <ThemeProvider theme={selectedTheme.muiTheme}>
    <CssBaseline></CssBaseline>
    <NotesPanel></NotesPanel>
  </ThemeProvider>,

  document.getElementById("root")
);
