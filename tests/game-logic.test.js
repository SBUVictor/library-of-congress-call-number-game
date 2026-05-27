const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
let fetchCalls = 0;

function fakeElement() {
  return {
    addEventListener() {},
    appendChild() {},
    classList: {
      add() {},
      remove() {},
      contains() { return false; }
    },
    dataset: {},
    innerHTML: "",
    querySelector() { return null; },
    setAttribute() {},
    style: {},
    textContent: "",
    value: ""
  };
}

const context = vm.createContext({
  console,
  fetch: async () => {
    fetchCalls += 1;
    return {};
  },
  document: {
    createElement: fakeElement,
    getElementById: fakeElement,
    querySelectorAll() { return []; }
  }
});

vm.runInContext(`${script}
globalThis.__game = {
  buildPayload,
  buildQuestions,
  answerQuiz,
  checkAnswer,
  compareCallNumbers,
  finalLabels,
  finishGame,
  goCheck,
  goQuiz,
  goWorked,
  sortKey,
  renderFinal,
  submitResults,
  setState(value) { state = value; },
  getState() { return state; }
};`, context);

const game = context.__game;

function firstChoiceIndex(question) {
  return game.compareCallNumbers(question.choices[0], question.choices[1]) <= 0 ? 0 : 1;
}

assert(game.compareCallNumbers("QA 1 .A3 2000", "QA 1 .A30 1990") < 0);
assert(game.compareCallNumbers("QA 1 .A30 1990", "QA 1 .A301 1980") < 0);
assert(game.compareCallNumbers("QA 1 .A99 2000", "QA 1 .B1 1900") < 0);
assert(game.compareCallNumbers("QA 76.73 .J38 B76 2021 v.1", "QA 76.73 .J38 B76 2021 v.2") < 0);

for (const key of ["classes", "numbers", "cutters", "complex"]) {
  for (let run = 0; run < 100; run++) {
    const questions = game.buildQuestions(key);
    assert.strictEqual(questions.length, 15);
    for (const question of questions) {
      assert.strictEqual(
        question.answer,
        firstChoiceIndex(question),
        `generated ${key} question answer did not match comparator: ${JSON.stringify(question)}`
      );
    }
  }
}
assert.throws(() => game.buildQuestions("missing"), /No question factory/);
assert(html.includes('id="bank" class="sortbank" tabindex="0" role="button"'));

const final = game.finalLabels();
assert.deepStrictEqual(final, final.slice().sort(game.compareCallNumbers));

game.setState({
  step: 0,
  phase: "teach",
  qIndex: 0,
  score: 0,
  questions: {
    classes: game.buildQuestions("classes")
  },
  moduleScores: {
    classes: 0,
    numbers: 0,
    cutters: 0,
    complex: 0
  }
});
game.answerQuiz(0);
assert.strictEqual(game.getState().score, 0);
assert.strictEqual(game.getState().phase, "teach");
game.goCheck();
assert.strictEqual(game.getState().phase, "check");
game.goQuiz();
assert.strictEqual(game.getState().phase, "check");
game.checkAnswer(0);
if (game.getState().phase !== "check-passed") {
  game.checkAnswer(1);
}
assert.strictEqual(game.getState().phase, "check-passed");
game.goWorked();
assert.strictEqual(game.getState().phase, "worked");
game.goCheck();
assert.strictEqual(game.getState().phase, "worked");
game.goQuiz();
assert.strictEqual(game.getState().phase, "quiz");
const firstQuestion = game.getState().questions.classes[0];
game.answerQuiz(firstQuestion.answer);
assert.strictEqual(game.getState().score, 1);
assert.strictEqual(game.getState().phase, "answered");
game.answerQuiz(firstQuestion.answer);
assert.strictEqual(game.getState().score, 1);

game.setState({
  score: 60,
  finalPassed: true,
  student: {
    realName: "Test Student",
    preferredName: "Test",
    email: "test@stonybrook.edu"
  },
  moduleScores: {
    classes: 15,
    numbers: 15,
    cutters: 15,
    complex: 15
  }
});

const payload = game.buildPayload();
assert.strictEqual(payload.totalScore, 61);
assert.strictEqual(payload.passFail, "Pass");
assert.strictEqual(payload.sbuEmail, "test@stonybrook.edu");
assert.strictEqual(payload.totalModulesCompleted, 4);
assert.strictEqual(payload.totalModulesPassed, 4);

game.setState({
  score: 44,
  finalPassed: false,
  student: {
    realName: "Needs Review",
    preferredName: "Review",
    email: "review@stonybrook.edu"
  },
  moduleScores: {
    classes: 11,
    numbers: 10,
    cutters: 15,
    complex: 8
  }
});

const failingPayload = game.buildPayload();
assert.strictEqual(failingPayload.totalScore, 44);
assert.strictEqual(failingPayload.passFail, "Fail");
assert.strictEqual(failingPayload.totalModulesPassed, 2);
assert.strictEqual(failingPayload.cumulativeCheckPassed, false);
assert.strictEqual(failingPayload.finalDragDropPassed, false);

game.setState({
  step: 4,
  phase: "final",
  finalPassed: true,
  finalOrder: final,
  student: {
    realName: "Final Tester",
    preferredName: "Final",
    email: "final@stonybrook.edu"
  },
  moduleScores: {
    classes: 15,
    numbers: 15,
    cutters: 15,
    complex: 15
  }
});
game.renderFinal();
assert.strictEqual(game.getState().phase, "final");
assert.strictEqual(game.getState().finalPassed, false);
game.finishGame();
assert.strictEqual(game.getState().step, 4);

game.setState({
  score: 60,
  finalPassed: true,
  submitted: false,
  submitting: false,
  student: {
    realName: "Submit Tester",
    preferredName: "Submit",
    email: "submit@stonybrook.edu"
  },
  moduleScores: {
    classes: 15,
    numbers: 15,
    cutters: 15,
    complex: 15
  }
});

(async () => {
  await Promise.all([game.submitResults(), game.submitResults()]);
  assert.strictEqual(fetchCalls, 1);
  assert.strictEqual(game.getState().submitted, true);
  assert.strictEqual(game.getState().submitting, false);
  console.log("game logic tests passed");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
