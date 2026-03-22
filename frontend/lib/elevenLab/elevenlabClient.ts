import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error("ELEVENLABS_API_KEY is missing in your .env file");
}
 
const elClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});
 
export default elClient;
