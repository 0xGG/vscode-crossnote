import React, { useEffect, useState, useCallback } from "react";
import {
  fade,
  createStyles,
  makeStyles,
  Theme,
} from "@material-ui/core/styles";
import clsx from "clsx";
import {
  Box,
  InputBase,
  Card,
  IconButton,
  Typography,
  Hidden,
  CircularProgress,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@material-ui/core";
import {
  Magnify,
  FileEditOutline,
  Cog,
  Menu as MenuIcon,
  SortVariant,
  SortDescending,
  SortAscending,
} from "mdi-material-ui";
import { useTranslation } from "react-i18next";
import { Message, MessageAction } from "../../lib/message";
import { Note } from "../../lib/note";
import { CrossnoteSectionType, SelectedSection } from "../../lib/section";
import Notes, { OrderDirection, OrderBy } from "./Notes";
import { vscode } from "../util/util";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    notesPanel: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      width: "100%",
      backgroundColor: theme.palette.background.default,
    },
    topPanel: {
      padding: theme.spacing(0, 1),
      borderRadius: 0,
      backgroundColor: theme.palette.background.paper,
    },
    row: {
      display: "flex",
      alignItems: "center",
    },
    sectionName: {
      marginLeft: theme.spacing(1),
    },
    search: {
      position: "relative",
      borderRadius: theme.shape.borderRadius,
      backgroundColor: fade(theme.palette.common.white, 0.15),
      "&:hover": {
        backgroundColor: fade(theme.palette.common.white, 0.25),
      },
      marginRight: 0, // theme.spacing(2),
      marginLeft: 0,
      width: "100%",
      [theme.breakpoints.up("sm")]: {
        // marginLeft: theme.spacing(3),
        // width: "auto"
      },
    },
    searchIcon: {
      width: theme.spacing(7),
      color: "rgba(0, 0, 0, 0.54)",
      height: "100%",
      position: "absolute",
      pointerEvents: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    inputRoot: {
      color: "inherit",
      border: "1px solid #bbb",
      borderRadius: "4px",
      width: "100%",
    },
    inputInput: {
      padding: theme.spacing(1, 1, 1, 7),
      transition: theme.transitions.create("width"),
      width: "100%",
      [theme.breakpoints.up("md")]: {
        // width: 200
      },
    },
    notesList: {
      position: "relative",
      flex: "1",
      overflowY: "auto",
      paddingBottom: theme.spacing(12),
    },
    loading: {
      position: "absolute",
      top: "40%",
      left: "50%",
      transform: "translateX(-50%)",
    },
    sortSelected: {
      color: theme.palette.primary.main,
      "& svg": {
        color: theme.palette.primary.main,
      },
    },
  })
);

interface Props {}
export function NotesPanel(props: Props) {
  const classes = useStyles(props);
  const { t } = useTranslation();
  const [selectedSection, setSelectedSection] = useState<SelectedSection>(null);
  const [selectedNote, setSelectedNote] = useState<Note>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [searchValueInputTimeout, setSearchValueInputTimeout] = useState<
    NodeJS.Timeout
  >(null);
  const [finalSearchValue, setFinalSearchValue] = useState<string>("");
  const [sortMenuAnchorEl, setSortMenuAnchorEl] = useState<HTMLElement>(null);
  const [orderBy, setOrderBy] = useState<OrderBy>(OrderBy.ModifiedAt);
  const [orderDirection, setOrderDirection] = useState<OrderDirection>(
    OrderDirection.DESC
  );

  const createNewNote = useCallback(() => {
    if (!selectedSection) {
      return;
    }
    const message: Message = {
      action: MessageAction.CreateNewNote,
      data: selectedSection,
    };
    vscode.postMessage(message);
  }, [selectedSection]);

  const onChangeSearchValue = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const value = event.target.value;
      setSearchValue(value);
      if (searchValueInputTimeout) {
        clearTimeout(searchValueInputTimeout);
      }
      const timeout = setTimeout(() => {
        setFinalSearchValue(value);
      }, 400);
      setSearchValueInputTimeout(timeout);
    },
    [searchValueInputTimeout]
  );

  useEffect(() => {
    const message: Message = {
      action: MessageAction.InitializedNotesPanelWebview,
      data: {},
    };
    vscode.postMessage(message);
  }, []);

  useEffect(() => {
    const onMessage = (event) => {
      const message: Message = event.data;
      let note: Note;
      switch (message.action) {
        case MessageAction.SelectedSection:
          setSelectedSection(message.data);
          if (
            selectedSection &&
            message.data.notebook.dir !== selectedSection.notebook.dir
          ) {
            setSearchValue("");
          }
          break;
        case MessageAction.SendNotes:
          const notes: Note[] = message.data;
          notes.forEach((note) => {
            note.config.createdAt = new Date(note.config.createdAt || 0);
            note.config.modifiedAt = new Date(note.config.modifiedAt || 0);
          });
          setNotes(message.data || []);
          break;
        case MessageAction.CreatedNewNote:
          note = message.data;
          note.config.createdAt = new Date(note.config.createdAt || 0);
          note.config.modifiedAt = new Date(note.config.modifiedAt || 0);

          setNotes((notes) => [note, ...notes]);
          setSelectedNote(note);
          break;
        case MessageAction.SelectedNote:
          note = message.data;
          note.config.createdAt = new Date(note.config.createdAt || 0);
          note.config.modifiedAt = new Date(note.config.modifiedAt || 0);
          setSelectedNote(note);
          break;
        default:
          break;
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [selectedSection]);

  return (
    <Box className={clsx(classes.notesPanel)}>
      <Card className={clsx(classes.topPanel)}>
        <Box className={clsx(classes.row)}>
          <div className={clsx(classes.search)}>
            <div className={clsx(classes.searchIcon)}>
              <Magnify />
            </div>
            <InputBase
              placeholder={t("search/placeholder")}
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
              value={searchValue}
              inputProps={{ "aria-label": "search" }}
              onChange={onChangeSearchValue}
              autoComplete={"off"}
              autoCorrect={"off"}
            />
          </div>
          <IconButton onClick={createNewNote}>
            <FileEditOutline></FileEditOutline>
          </IconButton>
        </Box>
        <Box
          className={clsx(classes.row)}
          style={{ justifyContent: "space-between" }}
        >
          {selectedSection?.type === CrossnoteSectionType.Notes ||
          selectedSection?.type === CrossnoteSectionType.Notebook ? (
            <Box className={clsx(classes.row)}>
              <span role="img" aria-label="notes">
                📔
              </span>
              <Typography className={clsx(classes.sectionName)}>
                {selectedSection.notebook.name}
              </Typography>
            </Box>
          ) : selectedSection?.type === CrossnoteSectionType.Today ? (
            <Box className={clsx(classes.row)}>
              <span role="img" aria-label="today-notes">
                📅
              </span>
              <Typography className={clsx(classes.sectionName)}>
                {t("general/today")}
              </Typography>
            </Box>
          ) : selectedSection?.type === CrossnoteSectionType.Todo ? (
            <Box className={clsx(classes.row)}>
              <span role="img" aria-label="todo-notes">
                ☑️
              </span>
              <Typography className={clsx(classes.sectionName)}>
                {t("general/todo")}
              </Typography>
            </Box>
          ) : selectedSection?.type === CrossnoteSectionType.Tagged ? (
            <Box className={clsx(classes.row)}>
              <span role="img" aria-label="tagged-notes">
                🏷️
              </span>
              <Typography className={clsx(classes.sectionName)}>
                {t("general/tagged")}
              </Typography>
            </Box>
          ) : selectedSection?.type === CrossnoteSectionType.Untagged ? (
            <Box className={clsx(classes.row)}>
              <span role="img" aria-label="untagged-notes">
                🈚
              </span>
              <Typography className={clsx(classes.sectionName)}>
                {t("general/untagged")}
              </Typography>
            </Box>
          ) : selectedSection?.type === CrossnoteSectionType.Tag ? (
            <Box className={clsx(classes.row)}>
              <span role="img" aria-label="tag">
                🏷️
              </span>
              <Typography className={clsx(classes.sectionName)}>
                {selectedSection.path}
              </Typography>
            </Box>
          ) : selectedSection?.type === CrossnoteSectionType.Encrypted ? (
            <Box className={clsx(classes.row)}>
              <span role="img" aria-label="encrypted-notes">
                🔐
              </span>
              <Typography className={clsx(classes.sectionName)}>
                {t("general/encrypted")}
              </Typography>
            </Box>
          ) : selectedSection?.type === CrossnoteSectionType.Conflicted ? (
            <Box className={clsx(classes.row)}>
              <span role="img" aria-label="conflicted-notes">
                ⚠️
              </span>
              <Typography className={clsx(classes.sectionName)}>
                {t("general/conflicted")}
              </Typography>
            </Box>
          ) : (
            selectedSection?.type === CrossnoteSectionType.Directory && (
              <Box className={clsx(classes.row)}>
                <span role="img" aria-label="folder">
                  {"📁"}
                </span>
                <Typography className={clsx(classes.sectionName)}>
                  {selectedSection.path}
                </Typography>
              </Box>
            )
          )}

          <Box>
            <IconButton
              onClick={(event) => setSortMenuAnchorEl(event.currentTarget)}
            >
              <SortVariant></SortVariant>
            </IconButton>
            <Popover
              anchorEl={sortMenuAnchorEl}
              keepMounted
              open={Boolean(sortMenuAnchorEl)}
              onClose={() => setSortMenuAnchorEl(null)}
            >
              <List>
                <ListItem
                  button
                  onClick={() => setOrderBy(OrderBy.ModifiedAt)}
                  className={clsx(
                    orderBy === OrderBy.ModifiedAt && classes.sortSelected
                  )}
                >
                  <ListItemText
                    primary={t("general/date-modified")}
                  ></ListItemText>
                </ListItem>
                <ListItem
                  button
                  onClick={() => setOrderBy(OrderBy.CreatedAt)}
                  className={clsx(
                    orderBy === OrderBy.CreatedAt && classes.sortSelected
                  )}
                >
                  <ListItemText
                    primary={t("general/date-created")}
                  ></ListItemText>
                </ListItem>
                <ListItem
                  button
                  onClick={() => setOrderBy(OrderBy.Title)}
                  className={clsx(
                    orderBy === OrderBy.Title && classes.sortSelected
                  )}
                >
                  <ListItemText primary={t("general/title")}></ListItemText>
                </ListItem>
                <Divider></Divider>
                <ListItem
                  button
                  onClick={() => setOrderDirection(OrderDirection.DESC)}
                  className={clsx(
                    orderDirection === OrderDirection.DESC &&
                      classes.sortSelected
                  )}
                >
                  <ListItemText primary={"Desc"}></ListItemText>
                  <ListItemIcon style={{ marginLeft: "8px" }}>
                    <SortDescending></SortDescending>
                  </ListItemIcon>
                </ListItem>
                <ListItem
                  button
                  onClick={() => setOrderDirection(OrderDirection.ASC)}
                  className={clsx(
                    orderDirection === OrderDirection.ASC &&
                      classes.sortSelected
                  )}
                >
                  <ListItemText primary={"Asc"}></ListItemText>
                  <ListItemIcon style={{ marginLeft: "8px" }}>
                    <SortAscending></SortAscending>
                  </ListItemIcon>
                </ListItem>
              </List>
            </Popover>
          </Box>
        </Box>
      </Card>

      <Notes
        searchValue={finalSearchValue}
        notes={notes}
        orderBy={orderBy}
        orderDirection={orderDirection}
        selectedNote={selectedNote}
        setSelectedNote={setSelectedNote}
      ></Notes>
    </Box>
  );
}
