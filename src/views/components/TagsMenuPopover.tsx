import React, { useState, useCallback, useEffect } from "react";
import {
  Popover,
  List,
  ListItem,
  TextField,
  Box,
  Typography,
  IconButton,
} from "@material-ui/core";
import { TrashCan } from "mdi-material-ui";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { Autocomplete } from "@material-ui/lab";
import { TagNode } from "../../lib/notebook";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    menuItemOverride: {
      cursor: "default",
      padding: `0 0 0 ${theme.spacing(2)}px`,
      "&:hover": {
        backgroundColor: "inherit",
      },
    },
    menuItemTextField: {
      paddingRight: theme.spacing(2),
    },
  })
);
interface Props {
  anchorElement: HTMLElement;
  onClose: () => void;
  addTag: (tagName: string) => void;
  deleteTag: (tagName: string) => void;
  tagNames: string[];
  notebookTagNode: TagNode;
}
export function TagsMenuPopover(props: Props) {
  const classes = useStyles(props);
  const { t } = useTranslation();
  const [tagName, setTagName] = useState<string>("");
  const [options, setOptions] = useState<string[]>([]);

  const addTag = useCallback(
    (tagName: string) => {
      if (!tagName || tagName.trim().length === 0) {
        return;
      }
      props.addTag(tagName);
      setTagName("");
    },
    [props]
  );

  useEffect(() => {
    setTagName("");
  }, [props.anchorElement]);

  useEffect(() => {
    if (!props.anchorElement) {
      return;
    }
    let options: string[] = [];
    const helper = (children: TagNode[]) => {
      if (!children || !children.length) {
        return;
      }
      for (let i = 0; i < children.length; i++) {
        const tag = children[i].path;
        options.push(tag);
        helper(children[i].children);
      }
    };
    helper(props.notebookTagNode.children);
    setOptions(options);
  }, [props.notebookTagNode, props]);

  return (
    <Popover
      open={Boolean(props.anchorElement)}
      anchorEl={props.anchorElement}
      keepMounted
      onClose={props.onClose}
    >
      <List>
        <ListItem
          className={clsx(classes.menuItemOverride, classes.menuItemTextField)}
        >
          <Autocomplete
            inputValue={tagName}
            onInputChange={(event, newInputValue) => {
              setTagName(newInputValue);
            }}
            options={(tagName.trim().length > 0 &&
            options.findIndex((x) => x === tagName.trim()) < 0
              ? [tagName, ...options]
              : options
            ).map((opt) => "＋  " + opt)}
            style={{ width: 300, maxWidth: "100%" }}
            value={""}
            onChange={(event: any, newValue: string = "") => {
              if (newValue) {
                addTag(newValue.replace(/^＋/, "").trim());
              }
            }}
            renderInput={(params) => (
              <TextField
                placeholder={t("general/add-a-tag")}
                fullWidth={true}
                autoFocus={true}
                onKeyUp={(event) => {
                  if (event.which === 13) {
                    addTag(tagName);
                  }
                }}
                {...params}
              ></TextField>
            )}
            noOptionsText={t("general/no-tags")}
            openText={t("general/Open")}
            closeText={t("general/close")}
            loadingText={t("general/loading")}
            clearText={t("general/clear-all")}
          ></Autocomplete>
        </ListItem>
        {props.tagNames.length > 0 ? (
          props.tagNames.map((tagName) => {
            return (
              <ListItem
                key={tagName}
                className={clsx(classes.menuItemOverride)}
              >
                <Box
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <Typography>{tagName}</Typography>
                  <IconButton onClick={() => props.deleteTag(tagName)}>
                    <TrashCan></TrashCan>
                  </IconButton>
                </Box>
              </ListItem>
            );
          })
        ) : (
          <ListItem className={clsx(classes.menuItemOverride)}>
            <Typography style={{ margin: "8px 0" }}>
              {t("general/no-tags")}
            </Typography>
          </ListItem>
        )}
      </List>
    </Popover>
  );
}
