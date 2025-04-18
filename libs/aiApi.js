const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OpenAI } = require("openai");
const Anthropic = require("@anthropic-ai/sdk");
const { config } = require('./config');



const getPrompt = (prompt, imagePath = null) => {
  const addionalText = config.additionalPrompt;
  if (imagePath) {
    return `
      Your primary function is to respond user prompts with image provided related to specifc acadmeic subject.
      Your are proivded with task screen shot. Solve task with explaination and provide short (final) answer  if possible.
      ${addionalText}

      **API Details:**
      **Response Format:**
      Respond data in strcitly format as follows:
      #{{number}}) {{short_answer}}
      Explaination: {{explanation}}
`;
  } else {
    return `
      Your primary function is to respond user prompts with input provided related to specifc acadmeic subject.
      Your are proivded with input text. Solve task with explaination and provide short (final) answer  if possible.
      ${addionalText}

      **API Details:**
      **Response Format:**
      Respond data in strcitly format as follows:
      #{{number}}) {{short_answer}}
      Explaination: {{explanation}}
      `;
  }
}




const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAPI_PROJECT_ID = process.env.OPENAPI_PROJECT_ID;
const CLAUDAI_API_KEY = process.env.CLAUDAI_API_KEY;

// const getAIModel = (model) => {
//   if (model === "openai") {
//     console.log(`init openapi with ${OPENAI_API_KEY} and ${OPENAPI_PROJECT_ID}`);
//     return new OpenAI({
//       apiKey: OPENAI_API_KEY,
//       // project: OPENAPI_PROJECT_ID,
//     });
//   } else {
//     console.log(`init gemini with ${GEMINI_API_KEY}`);
//     const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//     return model;
//   }
// }


const models = {
  openai: {
    key: "openai",
    models: ["gpt-4o", "gpt-4", "gpt-3.5-turbo", "o1"],
    apiKey: OPENAI_API_KEY,
    instance: new OpenAI({
      apiKey: OPENAI_API_KEY,
      // project: OPENAPI_PROJECT_ID,
    }),
  },
  gemini: {
    key: "gemini",
    models: ["gemini-1.5-flash", "gemini-1.5"],
    apiKey: GEMINI_API_KEY,
    instance: new GoogleGenerativeAI(GEMINI_API_KEY),
  },
  claudeai: {
    key: "claudeai",
    models: ["claude-3-7-sonnet-20250219"],
    apiKey: CLAUDAI_API_KEY,
    instance: new Anthropic({
      apiKey: CLAUDAI_API_KEY,
    }),
  },
}

const getAiDataItem = (model_name) => {
  const keys = Object.keys(models);
  for (const key of keys) {
    const model = models[key];
    if (model.models.includes(model_name)) {
      return model;
    }
  }
  return null;
}

async function sendScreenshotToAI(imagePath, model_name = "gpt-4o") {
  const model_data_item = getAiDataItem(model_name);
  if (!model_data_item) {
    console.error("Invalid model name:", model_name);
    return;
  }
  const imageFile = fs.readFileSync(imagePath);
  if (model_data_item.key === "openai") {
    async function getGPTResponse() {
      try {
        const base64Image = imageFile.toString("base64");

        // Make a request with image and text input
        const response = await model_data_item.instance.chat.completions.create({
          model: model_name, // Use a model that supports vision (e.g., gpt-4-turbo)
          messages: [
            { role: "system", content: "You are an AI assistant that can analyze images and respond to queries." },
            {
              role: "user",
              content: [
                { type: "text", text: getPrompt(null, imagePath) },
                {

                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
                // { type: "image_url", image_url: `data:image/png;base64,${base64Image}` }, // Attach the image
              ],
            },
          ],
        });
        const response_str = response.choices[0].message.content;
        return response_str;
      } catch (error) {
        console.error("Error:", error);
      }
    }
    return await getGPTResponse();
  } else if (model_data_item.key === "claudeai") {
    try {
      const base64Image = imageFile.toString("base64");
      const response = await model_data_item.instance.messages.create({
        model: model_name,
        max_tokens: 1000,
        temperature: 1,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg", // Adjust the mime type if your image is different (e.g., "image/png")
                  data: base64Image
                }
              },
              {
                type: "text",
                text: getPrompt(null, imagePath),
              },
            ]
          }
        ],
      });
      const response_content = response.content.map((item) => {
        if (item.type === "text") {
          return item.text;
        }
        return null;
      }).join("\n");
      return response_content;
    } catch (error) {
      console.error("Error sending image to AI:", error);
      return
    }
  } else if (model_data_item.key === "gemini") {
    try {
      const imageBase64 = imageFile.toString("base64");;
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg", // Adjust the mime type if your image is different (e.g., "image/png")
          data: imageBase64,
        },
      };
      const parts = [
        { text: getPrompt(null, imagePath) },
        imagePart
      ];

      const response = await model_data_item.instance.generateContent({ contents: [{ role: "user", parts: parts }] });
      const response_text = response.response.text();

      return response_text;
    } catch (error) {
      console.error("Error sending image to AI:", error);
      return;

    }
  }
}

const sendTextToAI = async (prompt, model_name) => {
  const model_data_item = getAiDataItem(model_name);
  if (!model_data_item) {
    console.error("Invalid model name:", model_name);
    return;
  }
  try {
    if (model_data_item.key === "openai") {
      const response = await model_data_item.instance.chat.completions.create({
        model: model_name,
        messages: [
          { role: "system", content: "You are an AI assistant that can analyze text and respond to queries." },
          { role: "user", content: getPrompt(prompt) },
        ],
      });
      return response.choices[0].message.content;
    } else if (model_data_item.key === "gemini") {
      const parts = [
        { text: getPrompt(prompt) }
      ];
      const response = await model_data_item.instance.generateContent({ contents: [{ role: "user", parts: parts }] });
      const response_text = response.response.text();

      return response_text;
    } else if (model_data_item.key === "claudeai") {
      const response = await model_data_item.instance.messages.create({
        model: model_name,
        max_tokens: 1000,
        temperature: 1,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: getPrompt(prompt),
              },
            ]
          }
        ],
      });
      const response_content = response.content.map((item) => {
        if (item.type === "text") {
          return item.text;
        }
        return null;
      }).join("\n");
      return response_content;
    }
  } catch (error) {
    console.error("Error sending text to AI:", error);
  }
}

module.exports = { sendScreenshotToAI, sendTextToAI };