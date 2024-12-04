/* This service manipulates code: replaces, prepends, appends lines */

import { readdirSync, statSync, mkdirSync } from 'fs';
import { join } from 'path';

interface FileToManipulate {
    filePath: string;
    content: string;
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

                mkdirSync(directory);
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

    async writeFileContent(filePath: string, content: string) {
        const currentContent = await this.readFileContent(filePath);

        try {
            if (!currentContent) {
                await this.createFile(filePath, content);
            } else {

                await this.writeFile(filePath, content);

                return `${filePath}: success`;
            }
        } catch (error) {
            return `${filePath}: ${error}`;
        }

    }

    async manage(files: FileToManipulate[]) {
        const outputs = [];
        for (const file of files)
            outputs.push(await this.writeFileContent(file.filePath, file.content));

        return outputs;
    }
}

export const fileManipulator = new FileManipulator();
