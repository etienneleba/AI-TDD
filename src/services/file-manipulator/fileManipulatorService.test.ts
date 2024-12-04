import {expect, test} from "bun:test";
import {fileManipulator} from "src/services/file-manipulator/fileManipulatorService.ts";

test("should find user in UserService", async () => {
   const paths = fileManipulator.getAllFilePaths("./src");

   console.log(paths);
});