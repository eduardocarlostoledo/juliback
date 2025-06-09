require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
//console.log(process.env.GEMINI_API_KEY);

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

const chatPost = async (message) => {
  try {
    const result = await model.generateContent(message);
    const response = result.response.text();
    return response;
  } catch (error) {
    console.error("Error:", error);
  }
};

const getChat = async () => {
  try {
    const result = await model.generateContent("Hello");
    const response = result.response.text();
    return response;
  } catch (error) {
    console.error("Error:", error);
  }
};

module.exports = { chatPost, getChat };
