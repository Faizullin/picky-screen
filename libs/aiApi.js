const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OpenAI } = require("openai");
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
      Respond in JSON data strcitly format for any error or success as follows:

      {
        "results": [
          {
            "task_number": 1,
            "short_answer": "short final answer",
            "explanation": "This is a more detailed explanation of the task."
          },
          {
            "task_number": 2,
            "short_answer": "...",
            "explanation": "..."
          }
        ],
        "status": "success" | "error",
        "error": "message about possible error ocurred"
      }`;
  } else {
    return `
      Your primary function is to respond user prompts with input provided related to specifc acadmeic subject.
      Your are proivded with input text. Solve task with explaination and provide short (final) answer  if possible.
      ${addionalText}

      **API Details:**
      Input: "${prompt}"
      **Response Format:**
      Respond in JSON data strcitly format for any error or success as follows:

      {
        "results": [
          {
            "task_number": 1,
            "short_answer": "short final answer",
            "explanation": "This is a more detailed explanation of the task."
          },
          {
            "task_number": 2,
            "short_answer": "...",
            "explanation": "..."
          }
        ],
        "status": "success" | "error",
        "error": "message about possible error ocurred"
      }
        
      `;
  }
}




const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AI_MODEL_NAME = process.env.AI_MODEL_NAME;
const OPENAPI_PROJECT_ID = process.env.OPENAPI_PROJECT_ID;

const getAIModel = (model) => {
  if (model === "openai") {
    console.log(`init openapi with ${OPENAI_API_KEY} and ${OPENAPI_PROJECT_ID}`);
    return new OpenAI({
      apiKey: OPENAI_API_KEY,
      // project: OPENAPI_PROJECT_ID,
    });
  } else {
    console.log(`init gemini with ${GEMINI_API_KEY}`);
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    return model;
  }
}


const model = getAIModel(AI_MODEL_NAME)




async function sendScreenshotToAI(imagePath) {

  const imageFile = fs.readFileSync(imagePath);
  if (AI_MODEL_NAME === "openai") {
    async function getGPTResponse() {
      try {
        const base64Image = imageFile.toString("base64");

        // Make a request with image and text input
        const response = await model.chat.completions.create({
          model: "gpt-4o", // Use a model that supports vision (e.g., gpt-4-turbo)
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
        console.log("raw response", response_str);
        return response_str;
      } catch (error) {
        console.error("Error:", error);
      }
    }
    return await getGPTResponse();
  }
  else if (AI_MODEL_NAME === "gemini") {
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

      const result = await model.generateContent({ contents: [{ role: "user", parts: parts }] });
      const response = result.response;
      const response_text = response.text();

      return response_text;
    } catch (error) {
      console.error("Error sending image to AI:", error);
      return { short_answer: "Error", explanation: "Failed to retrieve response." };

    }
  }
}

const sendTextToAI = async (prompt) => {
  try {
    if (AI_MODEL_NAME === "openai") {
      const result = await model.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an AI assistant that can analyze text and respond to queries." },
          { role: "user", content: getPrompt(prompt) },
        ],
      });
      console.log("raw response", result);
      return result.choices[0].message.content;
    } else if (AI_MODEL_NAME === "gemini") {
      const parts = [
        { text: getPrompt(prompt) }
      ];
      const result = await model.generateContent({ contents: [{ role: "user", parts: parts }] });
      const response = result.response;
      const response_text = response.text();

      return response_text;
    }
  } catch (error) {
    console.error("Error sending text to AI:", error);
    return { short_answer: "Error", explanation: "Failed to retrieve response." };
  }
}

module.exports = { sendScreenshotToAI, sendTextToAI };