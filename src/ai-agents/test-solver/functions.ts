export const FUNCTIONS = {
  VIEW: {
    name: "view",
    description: "View the content of some files to write better code",
    parameters: {
      type: "object",
      properties: {
        filePaths: {
          type: "array",
          description:
            "An array of the paths of the files you need to see. 10 maximum",
          items: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "The path of a file",
              },
            },
            required: ["path"],
          },
        },
      },
      required: ["filePaths"],
    },
  },

  WRITE_CODE: {
    name: "write_code",
    description:
      "Modify code at a specified file path according to given instructions",
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
                description: "The absolute file path relative to the test file",
              },
              content: {
                type: "string",
                description: "The content modifications to apply",
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
