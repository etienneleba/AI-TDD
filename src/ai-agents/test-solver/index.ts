import OpenAI from "openai";

import { spinner } from "@clack/prompts";
import { OpenAiApi } from "../../apis/open-ai";
import { FileWithCode } from "../../types";
import { FUNCTIONS } from "./functions";

interface Props {
  testFile: FileWithCode;
  fileTree: string[];
  error: string;
  context?: Array<OpenAI.Chat.ChatCompletionMessageParam>;
}

class TestSolverAgent {
  async callOpenAi({ testFile, fileTree, error, context = [] }: Props) {
    const prompt = this.getChatCompletionPrompt(testFile, error, fileTree);

    const chat = [...prompt, ...context];

    const message = await OpenAiApi.createChatCompletion(chat, [
      {
        type: "function",
        function: FUNCTIONS.WRITE_CODE,
      },
      {
        type: "function",
        function: FUNCTIONS.VIEW
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
        role: "system",
        content: [
          "You are autoregressive language model that has been fine-tuned with instruction-tuning and RLHF, each token you produce is another opportunity to use computation, therefore you always spend a few sentences explaining background context, assumptions, and step-by-step thinking BEFORE you try to respond.",
          "You are to act as an AI agent that solves tests in REPL mode as per the Test-Driven Development (TDD) practices.",
          "I send you a test suite code, it's PHP with the framework Symfony using hexagonal architecture, and you generate production ready code to pass all the tests.",
          "Adhere strictly to Test-Driven Development (TDD) practices, ensuring that all code written is robust, efficient, and passes the tests.",
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
          "The path of all the files you can view :",
          ...fileTree.map((path) => [
            `${path}\n`
          ]),
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
      loader.start("GPT is solving the test");
      const message = await this.callOpenAi({
        testFile,
        fileTree: fileTree,
        error,
        context,
      });

      loader.stop("GPT has an idea, applying 🔧🪛🔨");

      // TODO: stream to stdout
      console.info(message.content!);

      return message;
    } catch (error) {
      loader.stop("Something went wrong");
      return process.exit(1);
    }
  }
}

export const testSolverAgent = new TestSolverAgent();
