import * as fs from "fs";
import * as path from "path";
import YAML from "yamljs";
import { Note, NoteConfig, getHeaderFromMarkdown } from "./note";
import AES from "crypto-js/aes";

const pfs = fs.promises;

export interface Directory {
  name: string;
  path: string;
  children: Directory[];
}

export interface TagNode {
  name: string;
  path: string;
  children: TagNode[];
}

interface ListNotesArgs {
  dir: string;
  includeSubdirectories?: Boolean;
}

interface MatterOutput {
  data: any;
  content: string;
}

export class Notebook {
  public name: string;
  public dir: string;
  public notes: Note[] = [];
  public rootDirectory: Directory | undefined;
  public rootTagNode: TagNode | undefined;

  constructor(name: string, dir: string) {
    this.name = name;
    this.dir = dir;
  }

  public async initData() {
    this.notes = await this.listNotes({
      dir: "./",
      includeSubdirectories: true,
    });

    const res = await Promise.all([
      this.getNotebookDirectoriesFromNotes(this.notes),
      this.getNotebookTagNodeFromNotes(this.notes),
    ]);
    this.rootDirectory = res[0];
    this.rootTagNode = res[1];
  }

  private matter(markdown: string): MatterOutput {
    let endFrontMatterOffset = 0;
    let frontMatter = {};
    if (
      markdown.startsWith("---") &&
      /* tslint:disable-next-line:no-conditional-assignment */
      (endFrontMatterOffset = markdown.indexOf("\n---")) > 0
    ) {
      const frontMatterString = markdown.slice(3, endFrontMatterOffset);
      try {
        frontMatter = YAML.parse(frontMatterString);
      } catch (error) {}
      markdown = markdown
        .slice(endFrontMatterOffset + 4)
        .replace(/^[ \t]*\n/, "");
    }
    return {
      data: frontMatter,
      content: markdown,
    };
  }

  private matterStringify(markdown: string, frontMatter: any) {
    frontMatter = frontMatter || {};
    const yamlStr = YAML.stringify(frontMatter).trim();
    if (yamlStr === "{}" || !yamlStr) {
      return markdown;
    } else {
      return `---
${yamlStr}
---
${markdown}`;
    }
  }

  public async getNote(
    filePath: string,
    stats?: fs.Stats
  ): Promise<Note | null> {
    const absFilePath = path.resolve(this.dir, filePath);
    if (!stats) {
      try {
        stats = await pfs.stat(absFilePath);
      } catch (error) {
        return null;
      }
    }
    if (stats.isFile() && filePath.endsWith(".md")) {
      let markdown = await pfs.readFile(absFilePath, { encoding: "utf-8" });
      // console.log("read: ", filePath, markdown);

      // Read the noteConfig, which is like <!-- note {...} --> at the end of the markdown file
      let noteConfig: NoteConfig = {
        // id: "",
        createdAt: new Date(stats.ctimeMs),
        modifiedAt: new Date(stats.mtimeMs),
        tags: [],
      };

      try {
        const data = this.matter(markdown);
        noteConfig = Object.assign(noteConfig, data.data["note"] || {});
        const frontMatter: any = Object.assign({}, data.data);
        delete frontMatter["note"];
        // markdown = matter.stringify(data.content, frontMatter); // <= NOTE: I think gray-matter has bug. Although I delete "note" section from front-matter, it still includes it.
        markdown = this.matterStringify(data.content, frontMatter);
      } catch (error) {
        // Do nothing
        markdown =
          "Please fix front-matter. (👈 Don't forget to delete this line)\n\n" +
          markdown;
      }

      // Create note
      const note: Note = {
        notebookPath: this.dir,
        filePath: path.relative(this.dir, absFilePath),
        markdown,
        config: noteConfig,
      };
      return note;
    } else {
      return null;
    }
  }

  public async listNotes({
    dir = "./",
    includeSubdirectories = true,
  }: ListNotesArgs): Promise<Note[]> {
    let notes: Note[] = [];
    let files: string[] = [];
    try {
      files = await pfs.readdir(path.resolve(this.dir, dir));
    } catch (error) {
      files = [];
    }
    const listNotesPromises = [];
    for (let i = 0; i < files.length; i++) {
      // TODO: Improve the performance here
      const file = files[i];
      const absFilePath = path.resolve(this.dir, dir, file);
      const stats = await pfs.stat(absFilePath);
      const note = await this.getNote(
        path.relative(this.dir, absFilePath),
        stats
      );
      if (note) {
        notes.push(note);
      }

      if (stats.isDirectory() && file !== ".git" && includeSubdirectories) {
        listNotesPromises.push(
          this.listNotes({
            dir: path.relative(this.dir, absFilePath),
            includeSubdirectories,
          })
        );
      }
    }
    const res = await Promise.all(listNotesPromises);
    res.forEach((r) => {
      notes = notes.concat(r);
    });

    // console.log("listNotes: ", notes);
    return notes;
  }

  // public async moveNote(fromFilePath: string, toFilePath: string) {}
  public async getNotebookDirectoriesFromNotes(
    notes: Note[]
  ): Promise<Directory> {
    const rootDirectory: Directory = {
      name: ".",
      path: ".",
      children: [],
    };

    const filePaths = new Set<string>([]);
    for (let i = 0; i < notes.length; i++) {
      filePaths.add(path.dirname(notes[i].filePath));
    }

    filePaths.forEach((value) => {
      const dirNames = value.split("/");
      let directory = rootDirectory;
      for (let i = 0; i < dirNames.length; i++) {
        if (dirNames[i] === ".") {
          break;
        } else {
          let subDirectory = directory.children.filter(
            (directory) => directory.name === dirNames[i]
          )[0];
          if (subDirectory) {
            directory = subDirectory;
          } else {
            let paths: string[] = [];
            for (let j = 0; j <= i; j++) {
              paths.push(dirNames[j]);
            }
            subDirectory = {
              name: dirNames[i],
              path: paths.join("/"),
              children: [],
            };
            directory.children.push(subDirectory);
            directory = subDirectory;
          }
        }
      }
    });

    return rootDirectory;
  }

  public getNotebookTagNodeFromNotes(notes: Note[]): TagNode {
    const rootTagNode: TagNode = {
      name: ".",
      path: ".",
      children: [],
    };

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const tags = note.config.tags || [];
      tags.forEach((tag) => {
        let node = rootTagNode;
        tag.split("/").forEach((t) => {
          t = t.toLocaleLowerCase().replace(/\s+/g, " ");
          const offset = node.children.findIndex((c) => c.name === t);
          if (offset >= 0) {
            node = node.children[offset];
          } else {
            const newNode: TagNode = {
              name: t,
              path: node.name === "." ? t : node.path + "/" + t,
              children: [],
            };
            node.children.push(newNode);
            node.children.sort((x, y) => x.name.localeCompare(y.name));
            node = newNode;
          }
        });
      });
    }

    return rootTagNode;
  }

  public hasSummaryMD(): boolean {
    return fs.existsSync(path.resolve(this.dir, "SUMMARY.md"));
  }

  public async writeNote(
    filePath: string,
    markdown: string,
    noteConfig: NoteConfig,
    password?: string
  ): Promise<NoteConfig> {
    noteConfig.modifiedAt = new Date();

    try {
      const data = this.matter(markdown);
      if (data.data["note"] && data.data["note"] instanceof Object) {
        noteConfig = Object.assign({}, noteConfig, data.data["note"] || {});
      }
      const frontMatter = Object.assign(data.data || {}, { note: noteConfig });
      markdown = data.content;
      if (noteConfig.encryption) {
        // TODO: Refactor
        noteConfig.encryption.title = getHeaderFromMarkdown(markdown);
        markdown = AES.encrypt(
          JSON.stringify({ markdown }),
          password || ""
        ).toString();
      }
      markdown = this.matterStringify(markdown, frontMatter);
    } catch (error) {
      if (noteConfig.encryption) {
        // TODO: Refactor
        noteConfig.encryption.title = getHeaderFromMarkdown(markdown);
        markdown = AES.encrypt(
          JSON.stringify({ markdown }),
          password || ""
        ).toString();
      }
      markdown = this.matterStringify(markdown, { note: noteConfig });
    }

    await pfs.writeFile(path.resolve(this.dir, filePath), markdown);
    return noteConfig;
  }
}
