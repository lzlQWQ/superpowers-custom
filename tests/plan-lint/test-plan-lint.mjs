import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const planLint = path.join(
  repoRoot,
  "skills",
  "subagent-driven-development",
  "scripts",
  "plan-lint",
);

function runPlanLint(planPath) {
  return spawnSync(process.execPath, [planLint, planPath], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function writeFixture(name, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "superpowers-plan-lint-"));
  const file = path.join(dir, name);
  fs.writeFileSync(file, content);
  return { dir, file };
}

test("valid execution-slice plan passes", () => {
  const { dir, file } = writeFixture(
    "valid.md",
    `# Example Implementation Plan

## Global Constraints

- Python 3.12

---

### Task 1: Add Calculator [Mixed]

**Files:**
- Create: \`src/calculator.py\`
- Test: \`tests/test_calculator.py\`

- [ ] **Substep 1: Structural setup**

\`\`\`python
def add(a, b):
    raise NotImplementedError
\`\`\`

- [ ] **Substep 2: RED batch**

\`\`\`python
def test_adds_two_numbers():
    assert add(2, 3) == 5
\`\`\`

Run:
\`\`\`bash
pytest tests/test_calculator.py -v --tb=short
\`\`\`
Expected: FAIL with assertion mismatch.

- [ ] **Substep 3: Implementation**

\`\`\`python
def add(a, b):
    return a + b
\`\`\`

- [ ] **Substep 4: GREEN verification**

Run:
\`\`\`bash
pytest tests/test_calculator.py -v --tb=short
\`\`\`
Expected: PASS.

- [ ] **Substep 5: Commit**

\`\`\`bash
git add src/calculator.py tests/test_calculator.py
git commit -m "feat: add calculator"
\`\`\`
`,
  );

  try {
    const result = runPlanLint(file);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /plan-lint: OK/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("old checkpoint plan fails", () => {
  const { dir, file } = writeFixture(
    "checkpoint.md",
    `# Old Plan

### Task 1: Skeleton [Structural]

- [ ] **Step 1: Create skeleton**

> Verified at the next Checkpoint.

### Checkpoint: Foundation

- [ ] Run all tests
`,
  );

  try {
    const result = runPlanLint(file);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /standalone Checkpoint/);
    assert.match(result.stderr, /deferred checkpoint verification/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("compile-error RED plan fails", () => {
  const { dir, file } = writeFixture(
    "compile-red.md",
    `# Bad RED Plan

### Task 1: Add Service [Behavioral Batch]

- [ ] **Substep 1: RED batch**

Run:
\`\`\`bash
mvn test
\`\`\`
Expected: FAIL with cannot find symbol.

- [ ] **Substep 2: Implementation**

- [ ] **Substep 3: GREEN verification**

Run:
\`\`\`bash
mvn test
\`\`\`
Expected: PASS.

- [ ] **Substep 4: Commit**
`,
  );

  try {
    const result = runPlanLint(file);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /invalid RED expectation/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("behavioral task without GREEN fails", () => {
  const { dir, file } = writeFixture(
    "missing-green.md",
    `# Missing GREEN Plan

### Task 1: Add Parser [Behavioral Batch]

- [ ] **Substep 1: RED batch**

Expected: FAIL with assertion mismatch.

- [ ] **Substep 2: Implementation**

- [ ] **Substep 3: Commit**
`,
  );

  try {
    const result = runPlanLint(file);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must include GREEN verification/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("plan without tasks fails", () => {
  const { dir, file } = writeFixture(
    "no-task.md",
    `# No Task Plan

This plan forgot to define implementation tasks.
`,
  );

  try {
    const result = runPlanLint(file);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /at least one Task heading/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
