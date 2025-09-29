// Elements
const boxes = document.querySelectorAll(".box");
const statusEl = document.getElementById("status");
const vsCpuToggle = document.getElementById("vs-cpu");
const newRoundBtn = document.getElementById("new-round");
const resetScoreBtn = document.getElementById("reset-score");
const scoreXEl = document.getElementById("score-x");
const scoreOEl = document.getElementById("score-o");
const scoreDEl = document.getElementById("score-d");

// State
let xTurn = true; // X always starts
let gameActive = true;
let aiThinking = false; // prevent user clicks while AI is "thinking"
const scores = { X: 0, O: 0, D: 0 };

const winPatterns = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// Helpers
const setStatus = (msg) => (statusEl.textContent = msg);
const updateScoreboard = () => {
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
  scoreDEl.textContent = scores.D;
};

const enableAll = () =>
  boxes.forEach((b) => {
    b.disabled = false;
  });
const disableAll = () =>
  boxes.forEach((b) => {
    b.disabled = true;
  });

const clearBoard = () => {
  boxes.forEach((b, i) => {
    b.textContent = "";
    b.classList.remove("x", "o", "win");
    b.disabled = false;
    b.setAttribute("aria-label", `Cell ${i + 1}, empty`);
  });
};

const boardFull = () => [...boxes].every((b) => b.textContent !== "");

const checkWinner = () => {
  for (const [a, b, c] of winPatterns) {
    const v1 = boxes[a].textContent;
    if (!v1) continue;
    if (v1 === boxes[b].textContent && v1 === boxes[c].textContent) {
      [a, b, c].forEach((i) => boxes[i].classList.add("win"));
      return v1; // "X" or "O"
    }
  }
  return null;
};

const endRound = (result) => {
  gameActive = false;
  if (result === "X" || result === "O") {
    scores[result] += 1;
    setStatus(`Winner: ${result}`);
  } else {
    scores.D += 1;
    setStatus("Draw!");
  }
  updateScoreboard();
  disableAll();
};

// AI (Computer plays as O when enabled)
const getBoard = () => [...boxes].map((b) => b.textContent);
const emptyIndices = (board) =>
  board.map((v, i) => (v ? null : i)).filter((v) => v !== null);

const isWinFor = (board, mark) => {
  return winPatterns.some(
    ([a, b, c]) => board[a] === mark && board[b] === mark && board[c] === mark
  );
};

const findWinningMove = (board, mark) => {
  for (const i of emptyIndices(board)) {
    const copy = board.slice();
    copy[i] = mark;
    if (isWinFor(copy, mark)) return i;
  }
  return -1;
};

const chooseAiMove = () => {
  const board = getBoard();
  const empties = emptyIndices(board);
  if (empties.length === 0) return -1;

  // 1) Win if possible
  let idx = findWinningMove(board, "O");
  if (idx !== -1) return idx;
  // 2) Block X's win
  idx = findWinningMove(board, "X");
  if (idx !== -1) return idx;
  // 3) Take center
  if (board[4] === "") return 4;
  // 4) Take a corner
  const corners = [0, 2, 6, 8].filter((i) => board[i] === "");
  if (corners.length)
    return corners[Math.floor(Math.random() * corners.length)];
  // 5) Take an edge
  const edges = [1, 3, 5, 7].filter((i) => board[i] === "");
  if (edges.length) return edges[Math.floor(Math.random() * edges.length)];
  return empties[0];
};

const makeMove = (idx, mark) => {
  const cell = boxes[idx];
  if (!cell || cell.textContent) return false;
  cell.textContent = mark;
  cell.classList.add(mark.toLowerCase());
  cell.disabled = true;
  cell.setAttribute("aria-label", `Cell ${idx + 1}, ${mark}`);
  return true;
};

const afterMove = () => {
  const winner = checkWinner();
  if (winner) return endRound(winner);
  if (boardFull()) return endRound(null);

  xTurn = !xTurn;
  setStatus(`Turn: ${xTurn ? "X" : "O"}`);

  // If vs CPU and it's now O's turn, let AI move
  if (vsCpuToggle.checked && !xTurn && gameActive) aiMove();
};

const aiMove = () => {
  if (!gameActive || !vsCpuToggle.checked || xTurn || aiThinking) return;
  aiThinking = true;
  setTimeout(() => {
    const idx = chooseAiMove();
    if (idx !== -1) makeMove(idx, "O");
    aiThinking = false;
    afterMove();
  }, 350); // small delay for UX
};

// Events
boxes.forEach((box) => {
  box.addEventListener("click", (e) => {
    if (!gameActive || aiThinking) return;
    // Disallow clicking for O when vs CPU is on (O is computer)
    if (vsCpuToggle.checked && !xTurn) return;

    const idx = parseInt(e.currentTarget.dataset.index, 10);
    const mark = vsCpuToggle.checked ? "X" : xTurn ? "X" : "O";

    if (makeMove(idx, mark)) afterMove();
  });
});

newRoundBtn.addEventListener("click", () => {
  gameActive = true;
  xTurn = true; // X always starts
  clearBoard();
  enableAll();
  setStatus("Turn: X");
  // If you want AI to sometimes start, you could randomize here and call aiMove()
});

resetScoreBtn.addEventListener("click", () => {
  scores.X = 0;
  scores.O = 0;
  scores.D = 0;
  updateScoreboard();
});

vsCpuToggle.addEventListener("change", () => {
  // If enabling mid-game and it's O's turn, let AI move
  if (vsCpuToggle.checked && gameActive && !xTurn) aiMove();
});

// Init
setStatus("Turn: X");
updateScoreboard();
