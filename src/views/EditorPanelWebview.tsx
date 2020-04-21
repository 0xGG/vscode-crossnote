import React from "react";
import ReactDOM from "react-dom";
import "typeface-roboto";
import "typeface-noto-sans-sc";
import "noty/lib/noty.css";
import "noty/lib/themes/relax.css";
import { ThemeProvider } from "@material-ui/styles";
import "./editor/index";
import "./i18n/i18n";
import "./index.less";
import EditorPanel from "./components/EditorPanel";
import { CssBaseline } from "@material-ui/core";
import { selectedTheme } from "./themes/manager";

ReactDOM.render(
  <ThemeProvider theme={selectedTheme.muiTheme}>
    <CssBaseline></CssBaseline>
    <EditorPanel></EditorPanel>
  </ThemeProvider>,

  document.getElementById("root")
);
