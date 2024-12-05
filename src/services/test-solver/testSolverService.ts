/* This service tries to solve a test file */

import {isCancel, select, text} from "@clack/prompts";
import chalk from "chalk";
import OpenAI from "openai";
import {outroError} from "src/utils/prompts";
import {exe} from "src/utils/shell";
import {testSolverAgent} from "../../ai-agents/test-solver";
import {fileManipulator} from "../file-manipulator/fileManipulatorService";
import {FUNCTIONS} from "src/ai-agents/test-solver/functions.ts";
import {testRunner} from "src/services/test-runner/testRunnerService.ts";
import {file} from "bun";

interface testRelevantFile {
    name: string;
    from: string;
    declarations: {
        from: string;
        declaration: string;
    }[];
}

export interface ToolCallOutput {
    callId: string;
    name: string;
    content: string;
}

class TestSolverService {
    async callTools(
        tools: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[]
    ): Promise<ToolCallOutput[]> {
        const outputs: ToolCallOutput[] = [];

        for (const tool of tools) {
            try {
                const args = JSON.parse(tool.function.arguments);


                switch (tool.function.name) {
                    case FUNCTIONS.CREATE_FILE.name: {

                        const {filePath, content} = args as {
                            filePath: string;
                            content: string;
                        };

                          console.info(
                              `📝 ${chalk.green(
                                  filePath
                              )}\n`
                          );
/*
                          const confirmExecution = await select({
                              message: `Run ?`,
                              options: [
                                  {value: true, label: "✅"},
                                  {value: false, label: "🚫"},
                              ],
                          });
                           if (isCancel(confirmExecution) || !confirmExecution) process.exit(1);*/

                        await fileManipulator.createFile(filePath, content);

                        const fileContent = await fileManipulator.readFileContent(filePath);

                        const result = await testRunner.assert("");

                        outputs.push({
                            callId: tool.id,
                            name: tool.function.name,
                            content: [
                                "The content of the file you just created :\n",

                                "```php\n" + fileContent + "```",
                                "\n\nThe result of tests after the modification: \n" + result.message,
                            ].join("\n")
                        });
                        break;
                    }
                    case FUNCTIONS.REPLACE_FILE.name: {
                        const {filePath, content} = args as {
                            filePath: string;
                            content: string;
                        };

                        console.info(
                              `📝 ${chalk.green(
                                  filePath
                              )}\n`
                          );

                        /*

                          const confirmExecution = await select({
                              message: `Run ?`,
                              options: [
                                  {value: true, label: "✅"},
                                  {value: false, label: "🚫"},
                              ],
                          });

                          if (isCancel(confirmExecution) || !confirmExecution) process.exit(1);*/

                        await fileManipulator.writeFile(filePath, content);

                        const fileContent = await fileManipulator.readFileContent(filePath);

                        const result = await testRunner.assert("");

                        outputs.push({
                            callId: tool.id,
                            name: tool.function.name,
                            content: [
                                "The content of the file you just created :\n",

                                "```php\n" + fileContent + "```",
                                "\n\nThe result of tests after the modification: \n" + result.message,
                            ].join("\n")
                        });

                        break;
                    }
                    case FUNCTIONS.READ_FILES.name: {
                        const {filePaths} = args as {
                            filePaths: string[];
                        };

                        for (const filePath of filePaths) {
                            console.info(
                                `👁️ ${chalk.green(
                                    filePath
                                )}`
                            );

                        }

                        let fileContents = [];

                        for (const path of filePaths)
                            fileContents.push(await fileManipulator.readFileContent(path));

                        const content = fileContents.reduce((path, content) => `\n${path} :\n\`\`\`php\n${content}\n\`\`\``);

                        outputs.push({
                            callId: tool.id,
                            name: tool.function.name,
                            content
                        });

                        break;
                    }

                    case FUNCTIONS.ASK_QUESTION.name: {
                        const {question} = args as {
                            question: string
                        };
                        const answer = await text({
                            message: `${question}`,
                            placeholder: "Answer",
                            initialValue: "",
                            validate(value) {
                                if (value.length === 0) return `Answer is required`;
                            },
                        });

                        if (isCancel(answer)) return process.exit(1);

                        outputs.push({
                            callId: tool.id,
                            name: tool.function.name,
                            content: answer.toString(),
                        });

                        break;
                    }

                    default:
                        throw new Error(`Unsupported tool name: ${tool.function.name}`);
                }
            } catch (error) {
                console.error("Error calling tool:", {
                    toolCallId: tool.id,
                    error,
                });

                throw error;
            }
        }

        return outputs;
    }

    async solve({
                    testFilePath,
                    error,
                    context,
                }: {
        testFilePath: string;
        error: string;
        context: Array<OpenAI.Chat.ChatCompletionMessageParam>;
    }) {
        const testFileCode = await fileManipulator.readFileContent(testFilePath);

        if (!testFileCode) throw new Error("FILE_NOT_FOUND");

        let fileTree = fileManipulator.getAllFilePaths('./src');
        fileTree.push(...fileManipulator.getAllFilePaths('./tests'))

        const message = await testSolverAgent.solve({
            testFile: {path: testFilePath, code: testFileCode},
            fileTree,
            error,
            context,
        });

        if (!message) {
            outroError("No message present");
            return process.exit(1);
        }

        return message;
    }
}

export const testSolver = new TestSolverService();
