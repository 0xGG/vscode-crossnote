const path = require("path");

module.exports = {
  entry: {
    EditorPanel: path.resolve(__dirname, "./src/views/EditorPanel.tsx"),
    NotesPanel: path.resolve(__dirname, "./src/views/NotesPanel.tsx"),
  },
  output: {
    path: path.resolve(__dirname, "./out/views"),
    filename: "[name].bundle.js",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
};
