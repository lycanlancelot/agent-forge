# AgentForge improvement notes

## 1. 当前 AgentForge 已有能力

根据 `README.md`、`SPEC.md` 和当前代码实现，AgentForge 的定位是本地 coding agent 管理台，重点不是重新实现 agent 框架，而是把 Claude Code、OpenAI Codex、Kimi Code 这些 CLI agent 管起来。

已具备的核心功能：

- 多 agent 管理：支持 `claude`、`codex`、`kimi` 三类 agent，能创建、启动、停止、暂停、恢复、删除。
- Web 控制台：React + Vite + Tailwind，提供 Dashboard、Agent Detail、Tasks、Worktrees、Commits、Settings 页面。
- 实时终端：后端用 `node-pty` 启动 CLI，前端用 xterm.js 连接 Socket.io，支持实时输出、输入和 resize。
- WSL 集成：后端通过 `wsl.exe -d <distro> -e bash -c ...` 在 WSL repo/worktree 中启动 agent。
- Git worktree 并行：启动 agent 时自动创建独立 worktree 和分支，降低多个 agent 同时改同一 repo 的冲突概率。
- 任务队列：有 `Task` 模型、任务看板、任务创建/分配/启动/取消，以及 Ralph Loop 自动消费 pending task 的雏形。
- 自动提交：`CommitScheduler` 可以按间隔检查 worktree 变更、自动 commit，并可选 push。
- 活动和历史：保存 session logs、commit 记录、overview stats，并通过 Socket.io 推送 agent/task/commit 状态。
- Cloudflare Tunnel：可以启动/停止 tunnel，方便远程访问本地 dashboard。
- 基础配置：agent config 支持 model、permission mode、auto commit、auto push、plan mode、env vars、WSL distro 等。

当前实现里比较明显的可改点：

- `pauseAgent/resumeAgent` 直接对 `wsl.exe` PTY 发 `SIGSTOP/SIGCONT`，在 Windows/WSL 场景里可靠性需要验证，可能需要改成更明确的进程组控制。
- `TaskQueue.dequeue` 只按数据库返回顺序拿第一个 pending，没有真正按 `priority` 排序，也没有 agent 能力匹配。
- Ralph Loop 状态只存在内存里，服务重启后会丢失，UI 也只是全局 toggle。
- `stats/activity` 目前调用 `db.getSessionLogs('')`，因为 session log 按 agent_id 查询，这个接口很可能返回不了有效活动流。
- worktree 创建默认 base branch 是 `main`，虽然会 fallback 到当前分支，但缺少 UI 选择、远端同步、冲突检测和 PR 流程。
- 自动提交缺少运行测试、diff 摘要、commit message 质量检查、失败重试、最终合并/PR 审批。
- Cloudflare 远程访问默认没有内建认证、CSRF 防护、细粒度权限，配合 `dangerously_skip_permissions=true` 风险较高。
- Session log 只是 stdout/stderr/user_input 文本，没有结构化 trace、token/cost、tool call、agent decision、文件改动阶段等信息。

## 2. 同类经典工具对比

### LangGraph / LangGraph Platform

LangGraph 的核心卖点是面向长时间运行、状态化 agent 的 orchestration。官方文档强调 durable execution、streaming、human-in-the-loop、memory、debugging/observability 和生产部署能力。它的 durable execution 通过 checkpoint 保存每步状态，失败或人工中断后可以恢复；time travel 可以从历史 checkpoint replay 或 fork 出替代路径。

对 AgentForge 的启发：

- AgentForge 现在只保存 CLI 输出和任务状态，没有“执行状态 checkpoint”。可以增加 task run checkpoint，把任务、prompt、agent config、repo commit、worktree path、关键输出、人工审批状态都固化下来。
- 增加“从某个 run 继续/重跑/复制分支”的能力，对 coding agent 特别有价值：一次失败不必重头来过，可以用同一 worktree、同一 prompt、同一模型配置重试。
- 增加 timeline/debug view，把 agent 输出、文件变更、commit、人工输入、失败点放在一个可回放视图里。

参考：

- https://docs.langchain.com/oss/python/langgraph
- https://docs.langchain.com/oss/python/langgraph/durable-execution
- https://docs.langchain.com/oss/python/langgraph/use-time-travel
- https://docs.langchain.com/oss/python/langchain/human-in-the-loop

### CrewAI

CrewAI 偏“角色化多 agent 团队 + Flow 编排”。官方文档里比较值得参考的是：agents/crews/flows、统一 memory、human feedback、observability/tracing、guardrails、顺序/层级/混合流程。

对 AgentForge 的启发：

- AgentForge 可以保留“管理外部 CLI coding agent”的特色，但加一层“team template”：例如 `planner -> coder -> reviewer -> tester -> fixer`，每个角色绑定不同 CLI、模型、权限和 worktree 策略。
- 增加共享 memory/knowledge：记录 repo 约定、用户偏好、历史踩坑、测试命令、发布流程，让不同 agent 和不同任务复用。
- 增加 human feedback loop：agent 输出计划、diff 或测试失败时，进入待审批节点，用户可以 approve / request changes / reject，反馈可被记录到项目 memory。
- 增加 guardrail：例如禁止触碰特定路径、禁止提交 secret、必须跑指定测试、禁止 auto-push 到 protected branch。

参考：

- https://docs.crewai.com/en/concepts/flows
- https://docs.crewai.com/en/concepts/memory
- https://docs.crewai.com/en/learn/human-feedback-in-flows
- https://docs.crewai.com/en/observability

### AutoGen Studio

AutoGen Studio 是低代码多 agent 原型工具。官方文档列出的四个界面很有参考价值：Team Builder、Playground、Gallery、Deployment。它支持可视化定义 team/agent/tool/model/termination conditions，Playground 里可以看实时 message streaming 和 control transition graph，并支持 pause/stop。

对 AgentForge 的启发：

- 增加 Agent/Team Builder：用表单或 JSON 定义 agent 模板、默认 prompt、工具/权限、终止条件和模型。
- 增加 Playground：在真正改代码前，用临时 sandbox/worktree 跑任务，观察多个 agent 的消息流和控制流。
- 增加 Gallery/Templates：内置常见 coding 工作流模板，如 bugfix、review PR、add tests、refactor、upgrade dependency、docs sync。
- 增加 Deployment/Export：把 UI 中配置好的任务流导出成 `agentforge.yaml` 或脚本，方便版本化、复现和分享。

参考：

- https://microsoft.github.io/autogen/stable/user-guide/autogenstudio-user-guide/index.html

### Dify Workflow / LLMOps

Dify 的强项是 workflow canvas、run history、logs、节点级可观测、API 触发和应用化发布。官方文档强调每次 workflow run 都有完整历史，日志能看到输入输出、时延和系统元数据。

对 AgentForge 的启发：

- 增加 Run History 页面：按 task run 展示输入、输出摘要、用时、exit code、commit、diff、测试结果、token/cost、agent 配置快照。
- 增加节点级指标：即便底层是 CLI，也可以把阶段拆成 `prepare worktree`、`start agent`、`agent output`、`test`、`commit`、`push`、`cleanup`。
- 增加 API/Webhook/Scheduler：外部系统可以创建任务，GitHub issue/PR、cron、Notion、Slack、Linear 都可以触发 AgentForge。

参考：

- https://docs.dify.ai/en/use-dify/debug/history-and-logs
- https://docs.dify.ai/en/use-dify/monitor/logs

### OpenAI Agents SDK

OpenAI Agents SDK 的几个概念适合借鉴到 AgentForge 的控制层：handoffs、guardrails、tracing。handoff 是 agent 之间的受控移交；guardrails 可在输入、输出、工具调用前后阻断或修改；tracing 记录 agent run、LLM generation、tool call、handoff 等事件。

对 AgentForge 的启发：

- 增加 handoff：例如 planner agent 生成任务拆分后，自动把子任务交给 coder agent；reviewer 发现问题后交给 fixer。
- 增加 guardrail tripwire：检测 secret、危险命令、超预算、超时、过大 diff、测试失败时暂停或阻断提交。
- 增加 tracing schema：即使不能拿到 CLI 内部所有 tool call，也可以统一记录 AgentForge 层面的 run/span/event。

参考：

- https://openai.github.io/openai-agents-python/handoffs/
- https://openai.github.io/openai-agents-python/guardrails/
- https://openai.github.io/openai-agents-python/ref/tracing/

## 3. 建议新增功能

### P0：先补“可用性和安全底座”

1. 认证和远程访问保护
   - 为 dashboard 增加本地登录/token，远程 Cloudflare Tunnel 默认要求认证。
   - 增加只读用户、操作者、管理员三类权限。
   - 对高风险动作二次确认：full-access、dangerously skip permissions、auto-push、删除 worktree。

2. 任务运行快照
   - 新增 `task_runs` 表：记录 task_id、agent_id、agent_config_snapshot、repo_head、worktree_path、started_at、ended_at、status、exit_code、summary。
   - 每次 start task 都生成 run，而不是直接覆盖 task 状态。
   - 支持 retry run、clone run、resume from worktree。

3. 结构化活动流
   - 新增 `events` 表：`run_started`、`agent_output`、`file_changed`、`test_started`、`test_failed`、`commit_created`、`approval_requested` 等。
   - Dashboard Activity 不再从 session log 反推，而是读 events。

4. Ralph Loop 持久化和调度修正
   - Ralph Loop 状态落库，支持每个 agent 单独开关。
   - `dequeue` 按 `priority DESC, created_at ASC` 排序。
   - 增加 agent capability matching：agent type、repo、permission、model、标签。

5. 安全默认值调整
   - `dangerously_skip_permissions` 默认改为 `false` 或首次创建时显著提示。
   - Cloudflare Tunnel 面板提示“未启用认证时不要开放 full-access agent”。
   - 自动提交默认不 push，push 需要 branch allowlist。

### P1：把 coding agent 工作流做完整

1. Plan / Review / Execute 审批流
   - plan mode 输出后进入待审核。
   - 用户可 approve、edit prompt、request changes、reject。
   - 审批记录进入 task run history。

2. 测试和质量门禁
   - 每个 repo 可配置 test command、lint command、typecheck command。
   - auto-commit 前先跑质量门禁。
   - 失败时不提交或提交到 WIP commit，并把失败日志挂到 task。

3. Diff / 文件变更视图
   - Agent Detail 中增加实时 changed files、git diff、git status。
   - 支持选中文件回滚、暂存、排除出自动提交。
   - Commit 页面显示 diff summary 和测试状态。

4. PR 集成
   - 支持从 agent worktree 创建 PR。
   - 支持把 task title/summary/test result 生成 PR description。
   - 支持 reviewer agent 对 PR diff 做二次 review。

5. 终止条件和预算
   - 每个 task 可设置 timeout、最大输出量、最大 commit 次数、最大 token/cost 预算。
   - 超限时暂停 agent 并请求用户决定。

### P2：多 agent 编排和模板化

1. Team Template
   - 内置模板：
     - Bugfix: investigator -> coder -> tester -> reviewer
     - Feature: planner -> implementer -> test-writer -> docs-writer
     - Refactor: mapper -> refactorer -> compatibility-reviewer
     - PR review: reviewer -> fixer
   - 每个节点可绑定 agent type、model、permission、repo/worktree 策略。

2. Handoff
   - 支持一个 agent 的输出自动生成下一步 task。
   - 支持人工确认后再 handoff。
   - 支持失败 handoff：tester 失败后回交 fixer。

3. Shared Memory / Project Knowledge
   - 项目级 memory：测试命令、架构约定、常见错误、不要改的文件。
   - Agent 级 memory：某个 CLI/模型的偏好、成功/失败样例。
   - Human feedback 自动沉淀成“规则候选”，用户批准后写入 memory。

4. Gallery
   - Agent 模板、任务模板、工作流模板可导入/导出。
   - 支持 `agentforge.yaml`，让配置进入 git。

### P3：观测、评估和运维

1. Trace 页面
   - 统一 run/span/event 视图。
   - 记录阶段耗时、失败点、重试次数、输出摘要。
   - 支持按 agent、repo、task type、status 过滤。

2. Eval / Benchmark
   - 为常见任务维护 benchmark：给定 repo 状态和 issue，检查最终测试是否通过、diff 是否合理。
   - 比较不同 agent/model 的成功率、耗时、提交大小、失败类型。

3. 成本和资源监控
   - 如果 CLI 能输出 usage，解析 token/cost。
   - 至少记录运行时长、输出字符数、提交次数、失败次数。

4. Sandbox / 容器隔离
   - WSL worktree 之外，支持 Docker/Dev Container 启动 agent。
   - 对 shell 权限、网络、文件系统路径做更强隔离。

## 4. 建议修改现有实现

- `server/src/routes/stats.ts`
  - 修复 `/api/stats/activity`，不要调用 `getSessionLogs('')`；新增 `events` 表或聚合最近 session logs/commits/tasks。

- `server/src/services/TaskQueue.ts`
  - `dequeue` 改为按 priority 排序。
  - Ralph Loop 状态持久化到 DB。
  - `processNext` 应处理 agent error/completed 状态，必要时先归位到 idle。

- `server/src/services/AgentManager.ts`
  - `startAgent` 创建 worktree 后应重新读取 agent，避免使用旧的 `agent.worktree_path/branch/config` 快照。
  - `onExit` 更新 task 状态时不应直接把 agent status 映射给 task status；agent `completed` 对 task 是 `completed`，agent `error` 对 task 是 `failed`。
  - `wrapWSL` 需要更稳健的 shell escaping，避免 prompt/env 中的引号、换行、`$()` 等引发命令注入或执行失败。
  - pause/resume 需要 Windows/WSL 实测，必要时记录“不支持”状态或改成发送 CLI 原生命令。

- `server/src/services/WorktreeManager.ts`
  - worktree 创建时支持 base branch UI 选择。
  - 删除 worktree 前检查未提交变更，并要求确认/归档 patch。
  - `listWorktrees` 目前没有真正解析 `git worktree list --porcelain` 同步 DB，可以补齐。

- `server/src/services/CommitScheduler.ts`
  - commit 前增加 test/lint gate。
  - 记录 commit stats 应在 commit 后用 `git show --stat`，当前 `getStatus` 更像工作区状态，不是 commit diff stats。
  - auto-push 需要 branch allowlist 和失败重试。

- 前端
  - Dashboard 的 “Commits Today” 现在用的是 `stats.totalCommits`，文案或数据要修正。
  - Tasks 页 Ralph Loop 应展示每个 agent 的开关状态，而不是只对当前 idle agents 批量开关。
  - Agent Detail 增加 git diff、run history、approval panel。

## 5. 推荐路线图

第一阶段：让它安全、可恢复、可复盘。

- 加认证和远程访问保护。
- 加 task run/event 表。
- 修复 stats/activity、task status 映射、priority queue。
- 增加 run history 和 diff summary。

第二阶段：让它适合真实 coding 工作流。

- 加 plan approval。
- 加 test/lint gate。
- 加 PR 创建和 reviewer agent。
- 加 repo/project config。

第三阶段：做出差异化。

- Team template + handoff。
- Shared memory / human feedback learning。
- Trace/Eval/Benchmark。
- Docker/Dev Container 隔离。

## 6. 一个更清晰的产品定位

建议把 AgentForge 的定位从“多 agent 终端管理器”升级为：

> A local control plane for running, reviewing, and shipping work from multiple coding agents safely.

也就是：不和 LangGraph/CrewAI/AutoGen Studio 正面竞争“agent 框架”，而是做 coding agent 的本地控制平面。核心卖点应是 worktree 隔离、真实终端、人工审批、测试门禁、PR 交付和完整可追溯 run history。
