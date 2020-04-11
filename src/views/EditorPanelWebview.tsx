import React from "react";
import ReactDOM from "react-dom";
import "typeface-roboto";
import "typeface-noto-sans-sc";
import { ThemeProvider } from "@material-ui/styles";
import "./editor/index";
import { crossnoteTheme } from "./util/theme";
import "./i18n/i18n";
import "./index.less";

import EditorPanel from "./components/EditorPanel";
import { CssBaseline } from "@material-ui/core";

ReactDOM.render(
  <ThemeProvider theme={crossnoteTheme}>
    <CssBaseline></CssBaseline>
    <EditorPanel></EditorPanel>
  </ThemeProvider>,

  document.getElementById("root")
);
