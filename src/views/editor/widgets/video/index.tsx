import { WidgetCreator, WidgetArgs } from "vickymd/widget";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import {
  Card,
  Typography,
  IconButton,
  Box,
  Input,
  Tooltip,
  Switch,
  FormControlLabel,
} from "@material-ui/core";
import {
  createStyles,
  makeStyles,
  Theme,
  ThemeProvider,
} from "@material-ui/core/styles";
import clsx from "clsx";
import { TrashCan } from "mdi-material-ui";
import { useTranslation } from "react-i18next";
import { selectedTheme } from "../../../themes/manager";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    card: {
      padding: theme.spacing(2),
      position: "relative",
    },
    actionButtons: {
      position: "absolute",
      top: "0",
      right: "0",
    },
    section: {
      marginTop: theme.spacing(2),
    },
    videoWrapper: {
      cursor: "default",
      position: "relative",
      width: "100%",
      height: "0",
      paddingTop: "56.25%",
    },
    video: {
      position: "absolute",
      left: "0",
      top: "0",
      width: "100%",
      height: "100%",
    },
  })
);

function VideoWidget(props: WidgetArgs) {
  const attributes = props.attributes;
  const classes = useStyles(props);
  const { t } = useTranslation();
  const [source, setSource] = useState<string>(attributes["source"] || "");
  const [autoplay, setAutoplay] = useState<boolean>(
    attributes["autoplay"] || false
  );
  const [controls, setControls] = useState<boolean>(
    attributes["controls"] || true
  );
  const [loop, setLoop] = useState<boolean>(attributes["loop"] || false);
  const [muted, setMuted] = useState<boolean>(attributes["muted"] || false);
  const [poster, setPoster] = useState<string>(attributes["poster"] || "");

  if (attributes["src"]) {
    return (
      <span style={{ cursor: "default" }}>
        <Box className={clsx(classes.videoWrapper)}>
          <video
            className={clsx(classes.video)}
            autoPlay={attributes["autoplay"] || attributes["autoPlay"]}
            controls={attributes["controls"]}
            loop={attributes["loop"]}
            muted={attributes["muted"]}
            style={attributes["style"]}
            poster={attributes["poster"]}
          >
            {t("widget/crossnote.video/video_element_fail")}
            <source src={attributes["src"]} type={attributes["type"]}></source>
          </video>
        </Box>
      </span>
    );
  }

  if (props.isPreview) {
    return <span></span>;
  }

  return (
    <Card elevation={2} className={clsx(classes.card)}>
      <Typography variant={"h5"}>{t("general/Video")}</Typography>
      <Box className={clsx(classes.actionButtons)}>
        <Tooltip title={t("general/Delete")}>
          <IconButton onClick={() => props.removeSelf()}>
            <TrashCan></TrashCan>
          </IconButton>
        </Tooltip>
      </Box>
      <Box className={clsx(classes.section)}>
        <Typography variant={"subtitle1"} style={{ marginBottom: "8px" }}>
          {t("general/source-url")}
        </Typography>
        <Input
          margin={"dense"}
          placeholder={t("widget/crossnote.video/video-url-placeholder")}
          value={source}
          onChange={(event) => {
            setSource(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.which === 13) {
              if (source) {
                const attrs = {
                  autoplay,
                  controls,
                  loop,
                  muted,
                  src: source,
                  poster,
                };
                props.replaceSelf(
                  `<!-- @crossnote.video ${JSON.stringify(attrs)
                    .replace(/^{/, "")
                    .replace(/}$/, "")} -->`
                );
              }
            }
          }}
          fullWidth={true}
        ></Input>
      </Box>
      <Box className={clsx(classes.section)}>
        <Typography variant={"subtitle1"} style={{ marginBottom: "8px" }}>
          {t("widget/crossnote.video/poster-url")}
        </Typography>
        <Input
          margin={"dense"}
          placeholder={t("widget/crossnote.video/poster-url-placeholder")}
          value={poster}
          onChange={(event) => {
            setPoster(event.target.value);
          }}
          fullWidth={true}
        ></Input>
      </Box>
      <Box className={clsx(classes.section)}>
        <FormControlLabel
          label={t("widget/autoplay")}
          control={
            <Switch
              checked={autoplay}
              onChange={() => setAutoplay(!autoplay)}
              color={"primary"}
            ></Switch>
          }
        ></FormControlLabel>
        <FormControlLabel
          label={t("widget/controls")}
          control={
            <Switch
              checked={controls}
              onChange={() => setControls(!controls)}
              color={"primary"}
            ></Switch>
          }
        ></FormControlLabel>
        <FormControlLabel
          label={t("widget/loop")}
          control={
            <Switch
              checked={loop}
              onChange={() => setLoop(!loop)}
              color={"primary"}
            ></Switch>
          }
        ></FormControlLabel>
        <FormControlLabel
          label={t("widget/muted")}
          control={
            <Switch
              checked={muted}
              onChange={() => setMuted(!muted)}
              color={"primary"}
            ></Switch>
          }
        ></FormControlLabel>
      </Box>
    </Card>
  );
}

export const VideoWidgetCreator: WidgetCreator = (args) => {
  const el = document.createElement("span");
  ReactDOM.render(
    <ThemeProvider theme={selectedTheme.muiTheme}>
      <VideoWidget {...args}></VideoWidget>
    </ThemeProvider>,
    el
  );
  return el;
};
