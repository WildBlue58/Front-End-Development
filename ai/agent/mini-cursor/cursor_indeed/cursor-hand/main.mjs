import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { AgentExecutor } from "langchain/agents";
import { pull } from "langchain/hub";
import {
  readFileTool,
  writeFileTool,
  executeCommanTool,
  listDirectoryTool,
} from "./all_tools.mjs";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

const tools = [
  readFileTool,
  writeFileTool,
  executeCommanTool,
  listDirectoryTool,
];

const prompt = await pull("hwchase17/react");

const agent = createReactAgent({
  model,
  tools,
  prompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
  verbose: true,
});

const result = await agentExecutor.invoke({
  input: "列出当前目录下的文件",
});

console.log(result);
