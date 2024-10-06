import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import OpenAI from "openai";

const API_KEY = process.env.OPENAI_API_KEY; 
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;  
const REMOTE_ACTION_BASE_URL = process.env.REMOTE_ACTION_BASE_URL; 

const openai = new OpenAI({
  apiKey: API_KEY,  
  baseURL: OPENAI_BASE_URL,  
});

const serviceAdapter = new OpenAIAdapter({ openai });

console.log("REMOTE_ACTION_BASE_URL", REMOTE_ACTION_BASE_URL);

const runtime = new CopilotRuntime({
  remoteActions: [
    {
      url: `${REMOTE_ACTION_BASE_URL}/copilotkit`, 
    },
  ],
});

export const POST = async (req: NextRequest) => {
  console.log("Here");
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
