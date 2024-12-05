export const FUNCTIONS = {
  ASK_QUESTION: {
    name: "ask_question",
    description: "ask a question to your supervisor if you are stuck. Always read the relevant files before asking question",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description:
              "The question you want to ask to your supervisor",
        },
      },
      required: ["question"],
    },
  },
  READ_FILES: {
    name: "read_files",
    description: "read the content of all the relevant files you need to understand the context and solve the test",
    parameters: {
      type: "object",
      properties: {
        filePaths: {
          type: "array",
          description:
            "An array of file paths. 10 maximum",
          items: {
            type: "string",
          },
        },
      },
      required: ["filePaths"],
    },
  },
  CREATE_FILE: {
    name: "create_file",
    description: "Create a file with some content inside",
    parameters: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "The path of the file"
        },
        content: {
          type: "string",
          description: "The full content of the file"
        }
      }
    }

  },
  REPLACE_FILE: {
    name: "replace_file",
    description: "Replace the full content of a file",
    parameters: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "The path of the file"
        },
        content: {
          type: "string",
          description: "The full content of the file"
        }
      }
    }

  },
  WRITE_CODE: {
    name: "write_code",
    description:
        "Modify code at a specified file path according to given instructions. Always read a file before modifying it. Be very accurate with the row number",
    parameters: {
      type: "object",
      properties: {
        modifications: {
          type: "array",
          description: "An array of modifications to apply to the code",
          items: {
            type: "object",
            properties: {
              filePath: {
                type: "string",
                description: "The path of the file",
              },
              content: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    rowNumber: {
                      type: "number",
                      description: "The line number to apply the modification",
                    },
                    action: {
                      type: "string",
                      enum: ["replace", "append", "delete"],
                      description: "The action to perform on the 'row'",
                    },
                    with: {
                      type: "string",
                      description: "The line to insert",
                    },
                  },
                  required: ["rowNumber", "action", "with"],
                },
                description: "Every line to change in the file",
              },
            },
            required: ["filePath", "content"],
          },
        },
      },
      required: ["modifications"],
    },
  },

};
