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

A **Task** is an execution slice: the unit dispatched to one implementer,
verified with one focused RED/GREEN batch, committed once, and reviewed once.
Small setup, scaffolding, and documentation steps live inside the task whose
deliverable needs them as substeps. Do not make them separate tasks unless
they are independently testable and worth a fresh review gate.

Split only where a reviewer could meaningfully reject one execution slice
while approving its neighbor. Each task ends with a working, testable
deliverable and a commit.

## Task Classification

Before defining steps for each task, classify the execution slice. The type
determines whether a RED batch is required and how the task is verified.

| Type | Criteria | Red Test | When to Verify |
|------|----------|----------|----------------|
| **Structural** | Creates scaffolding, migrations, config, interfaces, or signatures only | None | In the same task with a compile/static check if useful |
| **Behavioral Batch** | Implements one feature slice with assertable behavior | Required, batched | In the same task |
| **Integration Batch** | Connects already-implemented components end-to-end | Optional | In the same task |
| **Mixed** | Needs structural setup before behavioral work in the same slice | Required after setup | In the same task |

**RED Validity Gate — before writing or running a RED test, ask in order:**
1. If the implementation existed correctly, would this test pass? If unsure,
   do not make it the RED gate.
2. Would the first failure be a compile/setup error such as missing symbol,
   missing class/method, or Maven compilation failure? If yes, do structural
   setup first and do not run that as RED.
3. Would the first failure be a behavior assertion failure from callable code?
   If yes, write it into the RED batch.

## Bite-Sized Task Granularity

Tasks can contain multiple substeps, but each task has one verification
cycle and one commit. Batch related behavior tests into one RED command and
one GREEN command. Do not add standalone Checkpoint sections; they create a
second execution unit that SDD will not dispatch.

**Execution slice skeleton:**
- Structural setup, if needed
- RED batch, or a No-RED reason for structural/integration-only slices
- Implementation
- GREEN verification
- Commit

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

Tag each task with its type: `[Structural]`, `[Behavioral Batch]`,
`[Integration Batch]`, or `[Mixed]`.

### Structural Task Template

````markdown
### Task N: [Component Name] [Structural]

**Files:**
- Create: `exact/path/to/file.py`

**Interfaces:**
- Produces: [exact function names, parameter and return types that later tasks depend on]

- [ ] **Substep 1: Structural setup**

```python
class ClassName:
    def method_name(self, param: Type) -> ReturnType:
        pass  # implemented in Task N+x
```

- [ ] **Substep 2: No-RED Reason**

No RED batch. This task creates callable structure only; any red test would
fail because the symbol does not exist yet, which proves nothing.

- [ ] **Substep 3: GREEN verification**

Run:
```bash
python -m py_compile exact/path/to/file.py
```
Expected: exit 0, no output.

- [ ] **Substep 4: Commit**

```bash
git add exact/path/to/file.py
git commit -m "feat: add component skeleton"
```
````

### Behavioral Batch Task Template

````markdown
### Task N: [Component Name] [Behavioral Batch]

**Files:**
- Modify: `exact/path/to/existing.py`
- Test: `tests/exact/path/to/test_file.py`

**Interfaces:**
- Consumes: [exact signatures from earlier tasks]
- Produces: [what later tasks rely on — exact function names, parameter and return types]

- [ ] **Substep 1: RED batch**

Write all tests for this slice before implementation. The RED command must
fail due to behavior assertions, not missing symbols or compilation errors.

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected  # fails: behavior not implemented yet
```

Run:
```bash
pytest tests/exact/path/to/test_file.py -v --tb=short
```
Expected: FAIL with assertion mismatch for the new behavior.

- [ ] **Substep 2: Implementation**

```python
def function(input):
    return expected
```

- [ ] **Substep 3: GREEN verification**

Run:
```bash
pytest tests/exact/path/to/test_file.py -v --tb=short
```
Expected: PASS, output clean.

- [ ] **Substep 4: Commit**

```bash
git add tests/exact/path/to/test_file.py exact/path/to/existing.py
git commit -m "feat: add specific behavior"
```
````

### Integration Batch Task Template

````markdown
### Task N: [Component Name] [Integration Batch]

**Files:**
- Test: `tests/integration/test_flow.py`

- [ ] **Substep 1: RED batch or No-RED Reason**

Write an integration RED only when the components already exist and the
failure will be a behavior assertion. Otherwise state why existing unit tests
cover the behavior or why setup must be wired before a meaningful RED exists.

```python
def test_full_flow():
    # exercise real components, minimal mocking
    result = system.process(input)
    assert result == expected_output
```

- [ ] **Substep 2: Implementation**

Wire the existing components together.

- [ ] **Substep 3: GREEN verification**

Run:
```bash
pytest tests/integration/test_flow.py -v --tb=short
```
Expected: PASS, output clean.

- [ ] **Substep 4: Commit**

```bash
git add tests/integration/test_flow.py exact/path/to/wiring.py
git commit -m "feat: wire specific flow"
```
````

### Mixed Task Template

Use `[Mixed]` when the same execution slice must first create callable
structure and then add behavior. Put the structural setup before the RED
batch so the RED failure is behavioral.

````markdown
### Task N: [Component Name] [Mixed]

- [ ] **Substep 1: Structural setup**
[Create files/classes/method signatures required for tests to compile.]

- [ ] **Substep 2: RED batch**
[Write and run focused tests; expected failure is a behavior assertion.]

- [ ] **Substep 3: Implementation**
[Implement the behavior.]

- [ ] **Substep 4: GREEN verification**
[Run the same focused command; expected PASS.]

- [ ] **Substep 5: Commit**
[Commit this execution slice.]
````

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task
- Standalone `Checkpoint` headings, or "Verified at next Checkpoint" language

## Remember
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- RED batches fail for behavior assertions, never missing symbols or compilation
- One focused verification cycle and one commit per execution slice
- DRY, YAGNI, TDD, frequent commits at execution-slice boundaries

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

**4. Execution-shape lint:** Run
`node skills/subagent-driven-development/scripts/plan-lint <plan-file>` and fix
any reported issue before handoff.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per execution slice, review between slices, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, one execution slice at a time

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Fresh subagent per execution slice + task review

**If Inline Execution chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:executing-plans
- Execute each Task as one execution slice with its built-in verification and commit
