import React from "react";
import ReactDOM from "react-dom";
import "typeface-roboto";
import "typeface-noto-sans-sc";
import { ThemeProvider } from "@material-ui/styles";
import "./editor/index";
import { crossnoteTheme } from "./util/theme";
import "./i18n/i18n";
import "./index.less";

import Editor from "./components/Editor";
import { CssBaseline } from "@material-ui/core";

ReactDOM.render(
  <ThemeProvider theme={crossnoteTheme}>
    <CssBaseline></CssBaseline>
    <Editor></Editor>
  </ThemeProvider>,

  document.getElementById("root")
);
