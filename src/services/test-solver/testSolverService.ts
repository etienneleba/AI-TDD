/* This service tries to solve a test file */

import {isCancel, select} from "@clack/prompts";
import chalk from "chalk";
import OpenAI from "openai";
import {outroError} from "src/utils/prompts";
import {exe} from "src/utils/shell";
import {testSolverAgent} from "../../ai-agents/test-solver";
import {fileManipulator} from "../file-manipulator/fileManipulatorService";
import {FUNCTIONS} from "src/ai-agents/test-solver/functions.ts";

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
            console.info(
                `Call function ${chalk.green(
                    tool.function.name
                )} with arguments ${chalk.magenta(tool.function.arguments)}`
            );

            const confirmExecution = await select({
                message: `Run?`,
                options: [
                    {value: true, label: "✅"},
                    {value: false, label: "🚫"},
                ],
            });

            if (isCancel(confirmExecution) || !confirmExecution) process.exit(1);

            try {
                const args = JSON.parse(tool.function.arguments);

                // TODO: sanitize directory, namePattern, and type...

                switch (tool.function.name) {
                    case FUNCTIONS.WRITE_CODE.name: {
                        const {modifications} = args as {
                            modifications: Array<{
                                filePath: string;
                                content: string;
                            }>;
                        };

                        const response = await fileManipulator.manage(modifications);

                        outputs.push({
                            callId: tool.id,
                            name: tool.function.name,
                            content:
                                response.reduce((acc, result) => `${acc}\n${result}`, "") ?? "",
                        });

                        break;
                    }

                    case FUNCTIONS.VIEW.name: {
                        const {filePaths} = args as {
                            filePaths: Array<{
                                path: string;
                            }>;
                        };

                        let fileContents = [];

                        for (const path of filePaths)
                            fileContents.push(await fileManipulator.readFileContent(path.path));

                        outputs.push({
                            callId: tool.id,
                            name: tool.function.name,
                            content:
                                fileContents.reduce((path, content) => `${path} :\n${content}`, '\n\n'),
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

        const fileTree = fileManipulator.getAllFilePaths('./src');

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
