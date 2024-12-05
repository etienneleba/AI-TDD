import OpenAI from "openai";

import {spinner} from "@clack/prompts";
import {OpenAiApi} from "../../apis/open-ai";
import {FileWithCode} from "../../types";
import {FUNCTIONS} from "./functions";

interface Props {
    testFile: FileWithCode;
    fileTree: string[];
    error: string;
    context?: Array<OpenAI.Chat.ChatCompletionMessageParam>;
}

class TestSolverAgent {
    async callOpenAi({testFile, fileTree, error, context = []}: Props) {
        const prompt = this.getChatCompletionPrompt(testFile, error, fileTree);

        const chat = [...prompt, ...context];

        const message = await OpenAiApi.createChatCompletion(chat, [
            {
                type: "function",
                function: FUNCTIONS.READ_FILES,
            },
            {
                type: "function",
                function: FUNCTIONS.ASK_QUESTION,
            },
            /*{
                type: "function",
                function: FUNCTIONS.WRITE_CODE,
            },*/
            {
                type: "function",
                function: FUNCTIONS.REPLACE_FILE
            },
            {
                type: "function",
                function: FUNCTIONS.CREATE_FILE
            }
        ]);

        return message;
    }

    private getChatCompletionPrompt(
        test: FileWithCode,
        error: string,
        fileTree: string[]
    ): Array<OpenAI.Chat.ChatCompletionMessageParam> {
        return [
            {
                role: "user",
                content: [
                    "You act as an expert software engineer that solves tests in Read-Eval-Print Loop mode as per the Test-Driven Development (TDD) practices.",
                    "The supervisor will show a test suite and the stderr for this test suite, and step by step you will have to turn the test green",
                    "Each time you add some modifications to the project, test will run all you will have the result",
                    "\n",
                    "## Instructions :",
                    "- Always read a file before write in it",
                    "- The supervisor is using wishful thinking programming, so some files use in the test might not exist. In this case, create them and import them in the test",
                    "- Never write in the test file. Only to import new created class",
                    "- Always be really accurate when you say a row number",
                    "- If you need more context or you are stuck, ask a question to your supervisor",
                    "- Adhere strictly to Test-Driven Development (TDD) practices, ensuring that all code written is robust, efficient, and passes the tests.",
                    "- Use the examples to understand the coding style of the team and the context of the project",
                    "\n",
                    "## Context :",
                    "This project contains 4 bounded context : ",
                    "Auth : Not implemented yet",
                    "Catalog : where the user can see and choose their products, it uses an hexagonal architecture with Commands and queries split",
                    "Order : Not implemented yet",
                    "Shipping : Not implemented yet",
                    "\n",
                    "## Technical stack :",
                    "- PHP 8.3",
                    "- Symfony 7.1",
                    "\n",
                    "## Folder structure :",
                    "### Catalog :",
                    "- Application : The API of the catalog bounded context. Inside the Commands and the queries are split. A command change the state where a query read the state of the app. Any file in the application folder only depends on the Domain.",
                    "- Domain : the heard of the catalog bounded context. It's where all the business logic is. A file in the Domain can not depend on Application or Infrastructure files, it always use dependency inversion",
                    "- Infrastructure : where all the framework and persistence specific files are",
                    "\n",
                    "## Test strategy :",
                    "- Functional : in a functional test we only test the business logic. The goal is to create a feature in the application folder and the business logic in the Domain folder. In functional test, we use in-memory repository to implement the domain interfaces",
                    "\n",
                    "## Examples :",
                    "- Command : src/Catalog/AddProductToBasket/AddProductToBasketCommand.php",
                    "- CommandHandler : src/Catalog/AddProductToBasket/AddProductToBasketCommandHandler.php",
                    "- Domain model : src/Catalog/Domain/Basket/Basket.php",
                    "- In-memory repository : src/Catalog/Infrastructure/Persistence/InMemory/InMemoryBasketRepository.php",
                    "\n",
                    "## The path of all the files you can view :",
                    ...fileTree.map((path) => [
                        `${path}\n`
                    ]) + [test.path],
                ].join("\n"),
            },
            {
                role: "user",
                content: [
                    `Below is the '${test.path}' content:`,
                    "```php",
                    test.code,
                    "```",
                    "",
                    `This is a stderr for the '${test.path}' run:`,
                    "```",
                    error,
                    "```",
                    "",
                    "Make the tests pass.",
                ].join("\n"),
            },
        ];
    }

    async solve({
                    testFile,
                    fileTree = [],
                    error,
                    context = [],
                }: Props): Promise<OpenAI.Chat.Completions.ChatCompletionMessage> {
        const loader = spinner();

        try {
            loader.start("GPT is thinking...");
            const message = await this.callOpenAi({
                testFile,
                fileTree: fileTree,
                error,
                context,
            });

            loader.stop();

            return message;
        } catch (error) {
            loader.stop("Something went wrong");
            return process.exit(1);
        }
    }
}

export const testSolverAgent = new TestSolverAgent();
