import {expect, test} from "bun:test";
import {fileManipulator} from "src/services/file-manipulator/fileManipulatorService.ts";

test("should find all paths", async () => {
    const paths = fileManipulator.getAllFilePaths("./src");

    console.log(paths);
});

test("should replace, append or preprend", async () => {
    await fileManipulator.createFile('./__tests__/sandbox/test.php', 'hello\nHow are you ?\nGood and you ?');

    await fileManipulator.manage([
        {
            filePath: './__tests__/sandbox/test.php',
            content: [{
                rowNumber: 1,
                action: "replace",
                with: "salut"
            },{
                rowNumber: 2,
                action: "append",
                with: "ça va, ça va"
            }, {
                rowNumber: 4,
                action: "prepend",
                with: "parle français"
            }
            ]
        }
    ])

    const content = await fileManipulator.readFileContent('./__tests__/sandbox/test.php');


    expect(content).toBe("salut\n" +
        "How are you ?\n" +
        "ça va, ça va\n" +
        "parle français\n" +
        "Good and you ?");

});

test("should delete", async () => {
    await fileManipulator.createFile('./__tests__/sandbox/test.php', 'hello\nHow are you ?\nGood and you ?');

    await fileManipulator.manage([
        {
            filePath: './__tests__/sandbox/test.php',
            content: [{
                rowNumber: 2,
                action: "delete",
                with: ""
            }
            ]
        }
    ])

    const content = await fileManipulator.readFileContent('./__tests__/sandbox/test.php');


    expect(content).toBe("hello\n" + "Good and you ?");

});

test("should add more", async () => {
    await fileManipulator.createFile('./__tests__/sandbox/test.php', 'hello\nHow are you ?\nGood and you ?');

    await fileManipulator.manage([
        {
            filePath: './__tests__/sandbox/test.php',
            content: [{
                rowNumber: 5,
                action: "append",
                with: "Hey"
            }
            ]
        }
    ])

    const content = await fileManipulator.readFileContent('./__tests__/sandbox/test.php');


    expect(content).toBe("hello\nHow are you ?\nGood and you ?\n\n\nHey");

});