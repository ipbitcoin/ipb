/**
 * The tools AI apps can call over MCP (server/routes/mcp.ts): the tasks board,
 * read and changed as the admin who connected the app. Each checks its input
 * here and runs as one Convex function (packages/backend/convex/mcpTasks.ts),
 * which checks the app's grant again before doing anything.
 */
import { api } from "@ipb/backend/api";
import type { Id } from "@ipb/backend/dataModel";
import { LABEL_COLORS, TASK_STATUSES } from "@ipb/backend/lib";
import type { ConvexHttpClient } from "convex/browser";
import { z } from "zod";

/** Who a tool runs for, and how it reaches Convex. */
export interface ToolCall {
  convex: ConvexHttpClient;
  grantId: Id<"mcpGrants">;
  serviceKey: string;
}

/** Thrown for input a model got wrong, with how to put it right. */
export class ToolInputError extends Error {
  override name = "ToolInputError";
}

interface ToolSpec<Input extends z.ZodObject> {
  /** snake_case, as models call it. */
  name: string;
  /** For people, in the app's list of tools. */
  title: string;
  /** For models: what it does, when to use it, and what it returns. */
  description: string;
  kind: "read" | "write";
  input: Input;
  /** Deletes something; apps ask before running it. */
  destructive?: boolean;
  /** Running it twice with the same input changes nothing more. */
  idempotent?: boolean;
  run: (call: ToolCall, input: z.output<Input>) => Promise<unknown>;
}

export interface McpTool {
  name: string;
  title: string;
  description: string;
  kind: "read" | "write";
  destructive: boolean;
  idempotent: boolean;
  inputSchema: Record<string, unknown>;
  /** Checks the input, then runs the tool. */
  call: (call: ToolCall, input: unknown) => Promise<unknown>;
}

function defineTool<Input extends z.ZodObject>({
  input,
  run,
  ...spec
}: ToolSpec<Input>): McpTool {
  const { $schema: _dialect, ...inputSchema } = z.toJSONSchema(input, {
    io: "input",
  });
  return {
    ...spec,
    call: (call, value) => {
      const parsed = input.safeParse(value ?? {});
      if (!parsed.success) {
        throw new ToolInputError(z.prettifyError(parsed.error));
      }
      return run(call, parsed.data);
    },
    destructive: spec.destructive === true,
    idempotent: spec.idempotent === true,
    inputSchema,
  };
}

const status = z
  .enum(TASK_STATUSES)
  .describe(`A column of the board: ${TASK_STATUSES.join(", ")}.`);
const taskId = z.string().describe("The task's id, as list_tasks shows it.");
const person = z
  .string()
  .describe(
    'Someone on the team, by username, name or email; "me" for whoever connected you.'
  );
const dueDate = z.iso.date().describe("A date, as YYYY-MM-DD.");

const grantOf = (tool: ToolCall) => ({
  grantId: tool.grantId,
  serviceKey: tool.serviceKey,
});

export const MCP_TOOLS: readonly McpTool[] = [
  defineTool({
    description:
      "The tasks board at a glance: its statuses in order (key, the name people see, and how many tasks each holds), its categories (with how many tasks are in each), the people tasks can be assigned to, and who you are. Start here.",
    input: z.object({}),
    kind: "read",
    name: "get_board",
    run: (tool) => tool.convex.query(api.mcpTasks.board, grantOf(tool)),
    title: "Read the board",
  }),
  defineTool({
    description:
      "Tasks on the board, in board order: by status, then by their place in the column. Leaves out done tasks unless include_done or status asks for them. Filters combine. Returns at most 200, with the total that matched.",
    input: z.object({
      assignee: z
        .string()
        .optional()
        .describe(
          'Only tasks assigned to this person (username, name or email), "me" for yours, or "none" for unassigned ones.'
        ),
      category: z
        .string()
        .optional()
        .describe("Only tasks in this category, by name."),
      include_done: z.boolean().optional().describe("Also list done tasks."),
      search: z
        .string()
        .optional()
        .describe(
          "Words every task listed has in its title, description or categories."
        ),
      status: z
        .array(status)
        .optional()
        .describe("Only tasks in these statuses."),
    }),
    kind: "read",
    name: "list_tasks",
    run: (tool, input) =>
      tool.convex.query(api.mcpTasks.listTasks, {
        ...grantOf(tool),
        assignee: input.assignee,
        category: input.category,
        includeDone: input.include_done,
        search: input.search,
        statuses: input.status,
      }),
    title: "List tasks",
  }),
  defineTool({
    description:
      "One task in full: title, description, status, assignee, due date, categories, and when it was made and last changed.",
    input: z.object({ task_id: taskId }),
    kind: "read",
    name: "get_task",
    run: (tool, input) =>
      tool.convex.query(api.mcpTasks.getTask, {
        ...grantOf(tool),
        taskId: input.task_id,
      }),
    title: "Read a task",
  }),
  defineTool({
    description:
      "Adds a task to the board, last in its status column. The team writes in Portuguese (pt-PT): write the title and description in it unless told otherwise. Returns the task.",
    input: z.object({
      assignee: person.optional(),
      categories: z
        .array(z.string())
        .optional()
        .describe(
          "Category names the board has (get_board lists them; create_category adds one)."
        ),
      description: z.string().optional().describe("Plain text."),
      due_date: dueDate.optional(),
      status: status
        .optional()
        .describe("Where it starts; todo when left out."),
      title: z.string().min(1),
    }),
    kind: "write",
    name: "create_task",
    run: (tool, input) =>
      tool.convex.mutation(api.mcpTasks.createTask, {
        ...grantOf(tool),
        assignee: input.assignee,
        categories: input.categories,
        description: input.description,
        dueDate: input.due_date,
        status: input.status,
        title: input.title,
      }),
    title: "Create a task",
  }),
  defineTool({
    description:
      "Changes a task: only the fields given. Pass null to clear the description, assignee or due date. categories replaces the task's categories (an empty list takes them all off). Moving it to another status puts it last in that column. Returns the task.",
    // It can clear fields and replace categories, so apps should ask first.
    destructive: true,
    idempotent: true,
    input: z.object({
      assignee: person.nullable().optional(),
      categories: z
        .array(z.string())
        .optional()
        .describe("Every category the task is in, by name."),
      description: z
        .string()
        .nullable()
        .optional()
        .describe("Plain text; replaces it."),
      due_date: dueDate.nullable().optional(),
      status: status.optional(),
      task_id: taskId,
      title: z.string().min(1).optional(),
    }),
    kind: "write",
    name: "update_task",
    run: (tool, input) =>
      tool.convex.mutation(api.mcpTasks.updateTask, {
        ...grantOf(tool),
        assignee: input.assignee,
        categories: input.categories,
        description: input.description,
        dueDate: input.due_date,
        status: input.status,
        taskId: input.task_id,
        title: input.title,
      }),
    title: "Update a task",
  }),
  defineTool({
    description:
      "Deletes a task for everyone. It can't be undone: to finish a task, move it to done instead.",
    destructive: true,
    input: z.object({ task_id: taskId }),
    kind: "write",
    name: "delete_task",
    run: (tool, input) =>
      tool.convex.mutation(api.mcpTasks.deleteTask, {
        ...grantOf(tool),
        taskId: input.task_id,
      }),
    title: "Delete a task",
  }),
  defineTool({
    description:
      "Adds a category tasks can be put in. A name the board already has (ignoring case and accents) is that category, not a new one. Returns its name and color, and whether it was created.",
    idempotent: true,
    input: z.object({
      color: z
        .enum(LABEL_COLORS)
        .optional()
        .describe("Its color; the least used one when left out."),
      name: z.string().min(1).max(40),
    }),
    kind: "write",
    name: "create_category",
    run: (tool, input) =>
      tool.convex.mutation(api.mcpTasks.createCategory, {
        ...grantOf(tool),
        color: input.color,
        name: input.name,
      }),
    title: "Create a category",
  }),
];

// Names are how apps call tools, so two with one name would hide one of them.
if (new Set(MCP_TOOLS.map((tool) => tool.name)).size !== MCP_TOOLS.length) {
  throw new Error("Two MCP tools share a name.");
}
