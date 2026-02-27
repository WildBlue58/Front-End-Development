/**
 * my-mcp-server.mjs
 *
 * MCP 通信协议架构：
 *   MCP Client (Cursor 等) <──stdio──> MCP Server (本文件)
 *
 * 提供工具：
 *   - query-user   查询单个用户信息
 *   - list-users   列出所有用户
 *   - create-user  新增用户
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ─── 数据层 ───────────────────────────────────────────────────────────────────

/** 模拟数据库（生产中替换为真实 DB 调用） */
const database = {
  users: {
    "001": {
      id: "001",
      name: "张三",
      email: "zhangsan@example.com",
      role: "admin",
    },
    "002": { id: "002", name: "李四", email: "lisi@example.com", role: "user" },
    "003": {
      id: "003",
      name: "王五",
      email: "wangwu@example.com",
      role: "user",
    },
  },
};

/** 辅助：生成下一个自增 ID */
function nextUserId() {
  const ids = Object.keys(database.users).map(Number);
  const next = Math.max(...ids) + 1;
  return String(next).padStart(3, "0");
}

/** 辅助：把用户对象格式化为可读文本 */
function formatUser(user) {
  return `- ID: ${user.id}\n- 姓名: ${user.name}\n- 邮箱: ${user.email}\n- 角色: ${user.role}`;
}

/** 辅助：返回成功响应 */
function ok(text) {
  return { content: [{ type: "text", text }] };
}

/** 辅助：返回错误响应 */
function err(text) {
  return { isError: true, content: [{ type: "text", text }] };
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "my-mcp-server",
  version: "1.0.0",
});

// ── Tool 1：查询单个用户 ──────────────────────────────────────────────────────
server.registerTool(
  "query-user",
  {
    description: "根据用户 ID 查询用户详情（姓名、邮箱、角色）。",
    inputSchema: {
      userId: z.string().describe("用户 ID，例如：001、002、003"),
    },
  },
  async ({ userId }) => {
    const user = database.users[userId];
    if (!user) {
      return err(
        `用户 ID "${userId}" 不存在。当前可用 ID：${Object.keys(database.users).join("、")}`,
      );
    }
    return ok(`用户信息：\n${formatUser(user)}`);
  },
);

// ── Tool 2：列出所有用户 ──────────────────────────────────────────────────────
server.registerTool(
  "list-users",
  {
    description: "列出数据库中所有用户的简要信息。",
    inputSchema: {},
  },
  async () => {
    const users = Object.values(database.users);
    if (users.length === 0) return ok("当前数据库中没有用户。");

    const lines = users.map(
      (u) => `[${u.id}] ${u.name} <${u.email}> (${u.role})`,
    );
    return ok(`共 ${users.length} 位用户：\n${lines.join("\n")}`);
  },
);

// ── Tool 3：新增用户 ──────────────────────────────────────────────────────────
server.registerTool(
  "create-user",
  {
    description: "新增一个用户到数据库，自动分配 ID，默认角色为 user。",
    inputSchema: {
      name: z.string().min(1).describe("用户姓名"),
      email: z.string().email().describe("用户邮箱"),
      role: z
        .enum(["admin", "user"])
        .optional()
        .describe("角色：admin 或 user，默认 user"),
    },
  },
  async ({ name, email, role = "user" }) => {
    // 邮箱唯一性检查
    const exists = Object.values(database.users).find((u) => u.email === email);
    if (exists) {
      return err(
        `邮箱 "${email}" 已被用户 ${exists.name}（ID: ${exists.id}）使用。`,
      );
    }

    const id = nextUserId();
    const newUser = { id, name, email, role };
    database.users[id] = newUser;

    return ok(`用户创建成功！\n${formatUser(newUser)}`);
  },
);

// ─── 启动（stdio 本地进程模式）────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
