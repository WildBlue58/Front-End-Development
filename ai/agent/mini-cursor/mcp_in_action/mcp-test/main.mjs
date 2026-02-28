/**
 * MCP Agent 入口 - 结合 LangChain、MCP 工具与 LLM 的 Agent 示例
 * 支持：高德地图、文件系统、Chrome DevTools 等多工具调用
 */

import "dotenv/config"; // 加载 .env 中的环境变量
import { fileURLToPath } from "url";
import { dirname } from "path";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

// ESM 模块中无 __dirname，需通过 import.meta.url 自行计算
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { ChatOpenAI } from "@langchain/openai";
import chalk from "chalk"; // 终端彩色输出
import { HumanMessage, ToolMessage } from "@langchain/core/messages";

// 创建 LLM 实例，配置从 .env 读取（支持自定义 baseURL，可对接国内 API 代理）
const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL, // 可选，用于对接国内 API 代理
  },
});

// 配置多 MCP 服务器
const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    // 高德地图 MCP：POI 搜索、路线规划等（需 AMAP_MAPS_API_KEY）
    "amap-maps-streamableHTTP": {
      url: `https://mcp.amap.com/mcp?key=${process.env.AMAP_MAPS_API_KEY}`,
    },
    // MCP 官方文件系统：读写本地文件，__dirname 为允许访问的根目录
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", __dirname],
    },
    // Chrome DevTools MCP：控制浏览器、截图、修改页面等
    "chrome-devtools": {
      command: "npx",
      args: ["-y", "chrome-devtools-mcp@latest"],
    },
  },
});

// 获取所有 MCP 提供的工具并绑定到模型
const tools = await mcpClient.getTools();
const modelWithTools = model.bindTools(tools);

/**
 * Agent 主循环：模型思考 -> 可选调用工具 -> 将结果反馈模型 -> 继续思考
 * @param {string} query - 用户问题
 * @param {number} maxIterations - 最大迭代轮数，防止死循环
 */
async function runAgentWithTools(query, maxIterations = 30) {
  const messages = [new HumanMessage(query)];

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen("⏳正在等待AI思考..."));
    const response = await modelWithTools.invoke(messages);
    messages.push(response);

    // 无工具调用 => 模型给出最终答案，结束循环
    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log(`\n AI 最终回复：\n ${response.content}\n`);
      return response.content;
    }

    // 打印本轮要调用的工具名称
    console.log(
      chalk.bgBlue(`🔍 检测到 ${response.tool_calls.length} 个工具调用`),
    );
    console.log(
      chalk.bgBlue(
        `🔍 工具调用: ${response.tool_calls.map((t) => t.name).join(", ")}`,
      ),
    );

    // 并行执行工具调用（多工具无依赖时可提速），再将结果追加到对话
    const toolResults = await Promise.all(
      response.tool_calls.map(async (toolCall) => {
        const foundTool = tools.find((t) => t.name === toolCall.name);
        if (!foundTool) {
          return new ToolMessage({
            content: `未找到工具: ${toolCall.name}`,
            tool_call_id: toolCall.id,
          });
        }
        try {
          const toolResult = await foundTool.invoke(toolCall.args);
          const contentStr =
            typeof toolResult === "string"
              ? toolResult
              : toolResult?.text ?? JSON.stringify(toolResult ?? "");
          return new ToolMessage({
            content: contentStr,
            tool_call_id: toolCall.id,
          });
        } catch (err) {
          return new ToolMessage({
            content: `工具执行失败: ${err.message}`,
            tool_call_id: toolCall.id,
          });
        }
      }),
    );
    messages.push(...toolResults);
  }

  return messages[messages.length - 1].content;
}

// ========== 示例调用 ==========
// await runAgentWithTools('北京南站附近的酒店，以及去的路线');
// await runAgentWithTools(`北京南站附近的2个酒店，路线规划生成文档保存到 md 文件`);

// try {
//   await runAgentWithTools(`
// 永丰县附近的3个酒店，获取每个酒店的地址、评分、距离，以及从永丰县到每个酒店的步行/驾车路线，
// 整理成 Markdown 文档，保存为 yongfeng_county_hotels.md
// `);
// } finally {
//   await mcpClient.close();
// }

try {
  await runAgentWithTools(`
永丰县附近的3个酒店，拿到酒店图片，展开浏览器，展示每个酒店的图片，
每个tab一个url展示，并且把那个页面标题改为酒店名
`);
} finally {
  await mcpClient.close();
}
