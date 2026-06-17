---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** If working in an isolated worktree, it should have been created via the `superpowers:using-git-worktrees` skill at execution time.

**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default)

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Task Right-Sizing

A task is the smallest unit that carries its own test cycle and is worth a
fresh reviewer's gate. When drawing task boundaries: fold setup,
configuration, scaffolding, and documentation steps into the task whose
deliverable needs them; split only where a reviewer could meaningfully
reject one task while approving its neighbor. Each task ends with an
independently testable deliverable.

## Task Classification

Before defining steps for each task, classify it. The type determines whether a red test is required and when verification runs.

| Type | Criteria | Red Test | When to Verify |
|------|----------|----------|----------------|
| **Structural** | Creates class/file scaffolding, DB migrations, config files, interface definitions | ❌ None | At next Checkpoint |
| **Behavioral** | Implements logic with assertable input → output | ✅ Required | At current Checkpoint |
| **Integration** | Connects multiple already-implemented components end-to-end | ✅ Optional | At current Checkpoint |

**Gate Function — before writing a red test, ask in order:**
1. If the implementation existed correctly, would this test pass? If unsure → skip.
2. Would failure be a **compile error** (symbol not found) or a **behavior assertion failure**? Compile error → skip. Assertion failure → write it.
3. Do all classes/methods called in the test already exist from earlier tasks? If no → skip (compile error, not behavior failure).

## Bite-Sized Task Granularity

Structural tasks are one step. Behavioral tasks are two steps. Tests run at Checkpoints only — not after every individual task.

**Structural task (1 step):**
- "Create the class/file skeleton with correct signatures" — step

**Behavioral task (2 steps):**
- "Write the failing test (assertion failure, not compile error)" — step
- "Write minimal implementation" — step

**Checkpoint (runs after a group of tasks):**
- "Run all accumulated tests, confirm all pass" — step
- "Commit" — step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every task's requirements implicitly
include this section.]

---
```

## Task Structure

Tag each task with its type: `[Structural]`, `[Behavioral]`, or `[Integration]`.

### Structural Task Template

````markdown
### Task N: [Component Name] [Structural]

**Files:**
- Create: `exact/path/to/file.py`

**Interfaces:**
- Produces: [exact function names, parameter and return types that later tasks depend on]

- [ ] **Step 1: Create skeleton**

```python
class ClassName:
    def method_name(self, param: Type) -> ReturnType:
        pass  # implemented in Task N+x
```

> No red test. Skeleton creation would only fail with a compile error, which proves nothing.
> Verified at the next Checkpoint.
````

### Behavioral Task Template

````markdown
### Task N: [Component Name] [Behavioral]

**Files:**
- Modify: `exact/path/to/existing.py`
- Test: `tests/exact/path/to/test_file.py`

**Interfaces:**
- Consumes: [exact signatures from earlier tasks]
- Produces: [what later tasks rely on — exact function names, parameter and return types]

- [ ] **Step 1: Write failing test**

> Must fail due to **behavior assertion failure**, not a compile error.
> All referenced classes/methods must already exist from earlier tasks.

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected  # fails: behavior not implemented yet
```

- [ ] **Step 2: Write minimal implementation**

```python
def function(input):
    return expected
```

> Verified at the next Checkpoint — not immediately after this task.
````

### Integration Task Template

````markdown
### Task N: [Component Name] [Integration]

**Files:**
- Test: `tests/integration/test_flow.py`

- [ ] **Step 1: Write integration test** (only if end-to-end behavior is not already covered by unit tests)

```python
def test_full_flow():
    # exercise real components, minimal mocking
    result = system.process(input)
    assert result == expected_output
```

- [ ] **Step 2: Wire components together**

> Verified at the next Checkpoint.
````

## Checkpoint Structure

Insert a Checkpoint after every 2–5 tasks, at feature-slice boundaries, and before every commit. **Checkpoints are the only place tests run and commits happen.**

**Checkpoint placement rules:**
- After completing a logical feature slice (all its structural + behavioral tasks done)
- Before tasks that depend on outputs of the current group
- Never more than 5 tasks between checkpoints
- Architectural guideline: more behavioral tasks = more frequent checkpoints (2–3 tasks); mostly structural tasks = can span up to 5 tasks

````markdown
### ✅ Checkpoint: [Feature Slice Name]

**Covers tasks:** Task N, Task N+1, Task N+2

- [ ] Run all tests

  ```bash
  pytest tests/ -v --tb=short
  ```

  Expected: All pass, output clean (no errors, no warnings)

- [ ] Commit

  ```bash
  git add .
  git commit -m "feat: [feature slice description]"
  ```
````

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Remember
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Fresh subagent per task + two-stage review

**If Inline Execution chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:executing-plans
- Batch execution with checkpoints for review
