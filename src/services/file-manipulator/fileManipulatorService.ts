/* This service manipulates code: replaces, prepends, appends lines */

import { readdirSync, statSync, mkdirSync } from 'fs';
import { join } from 'path';


interface IContent {
    rowNumber: number;
    action: "replace" | "append" | "prepend" | "delete";
    with: string;
}

interface FileToManipulate {
    filePath: string;
    content: IContent[];
}

class FileManipulator {

    public getAllFilePaths(directory: string): string[] {
        let filePaths: string[] = [];

        // Read the contents of the directory
        const entries = readdirSync(directory);

        for (const entry of entries) {
            const fullPath = join(directory, entry);

            // Check if the current entry is a directory or a file
            if (statSync(fullPath).isDirectory()) {
                // If it's a directory, recurse into it
                filePaths = filePaths.concat(this.getAllFilePaths(fullPath));
            } else {
                // If it's a file, add it to the list
                filePaths.push(fullPath);
            }
        }

        return filePaths;
    }

    private extractDirsFromFilePath(filePath: string): string | null {
        const folders = filePath.split("/");

        if (!folders.length) return null;

        const fileName = folders.pop();

        if (!fileName) return null;

        return folders.join("/");
    }

    async createFile(filePath: string, content?: string) {
        try {
            await Bun.write(filePath, content ?? "");
        } catch (error: any) {
            // directory does not exist, create one
            if (error.code === "ENOENT") {
                const directory = this.extractDirsFromFilePath(filePath);

                if (!directory) throw error;

                await mkdirSync(directory);
                await this.createFile(filePath, content);
            }
        }
    }

    async writeFile(filePath: string, content: string) {
        await Bun.write(filePath, content);
    }

    async readFileContent(filePath: string): Promise<string | null> {
        const file = Bun.file(filePath);

        const isFileExists = await file.exists();

        if (!isFileExists) return null;

        const text = await file.text();

        return text;
    }

    // TODO: make this async write in place for better performance
    manipulateFileContent(currentContent: string, newContent: IContent) {
        const lines = currentContent.split("\n");
        const newLines: string[] = [];
        let currentRowNumber = 1;
        for (const line of lines) {
            if (currentRowNumber != newContent.rowNumber) {
                newLines.push(line);
                currentRowNumber++;
                continue;
            }

            if (newContent.action === "replace") {
                newLines.push(newContent.with);
            } else if (newContent.action === "delete") {

            } else if (newContent.action === "append") {
                newLines.push(line);
                newLines.push(newContent.with);
            } else if (newContent.action === "prepend") {
                newLines.push(newContent.with);
                newLines.push(line);
            } else {
                throw new Error("UNKNOWN_CONTENT_ACTION");
            }
            currentRowNumber++;
        }
        if(currentRowNumber <= newContent.rowNumber) {
            for(currentRowNumber; currentRowNumber <= newContent.rowNumber; currentRowNumber++) {

                if (currentRowNumber != newContent.rowNumber) {
                    newLines.push("");
                    continue;
                }

                if (newContent.action === "replace") {
                    newLines.push(newContent.with);
                } else if (newContent.action === "delete") {

                } else if (newContent.action === "append") {
                    newLines.push("");
                    newLines.push(newContent.with);
                } else if (newContent.action === "prepend") {
                    newLines.push(newContent.with);
                } else {
                    throw new Error("UNKNOWN_CONTENT_ACTION");
                }
            }
        }

        return newLines.join("\n");
    }

    async writeFileContent(filePath: string, modifications: IContent[]) {
        let currentContent = await this.readFileContent(filePath);

        for (const modification of modifications) {
            try {
                if (!currentContent) {
                    await this.createFile(filePath, modification.with);
                } else {
                    const contentToWrite = this.manipulateFileContent(
                        currentContent,
                        modification
                    );

                    currentContent = contentToWrite;

                    await this.writeFile(filePath, contentToWrite);
                }
            } catch (error) {
                return `${filePath}: ${error}`;
            }

        }
        return `${filePath}: success`;
    }

    async manage(files: FileToManipulate[]) {
        const outputs = [];
        for (const file of files)
            outputs.push(await this.writeFileContent(file.filePath, file.content));

        return outputs;
    }
}

export const fileManipulator = new FileManipulator();
