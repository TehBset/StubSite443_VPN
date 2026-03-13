const BOARD_SIZE = 8;
const bestScoreKey = "glow-blocks-best-score";

const COLORS = [
  "block-blue",
  "block-cyan",
  "block-green",
  "block-yellow",
  "block-orange",
  "block-purple",
  "block-pink",
];

const SHAPES = [
  [[0, 0]],
  [
    [0, 0],
    [1, 0],
  ],
  [
    [0, 0],
    [0, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 0],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
  ],
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
];

const boardEl = document.getElementById("board");
const trayEl = document.getElementById("tray");
const scoreValueEl = document.getElementById("scoreValue");
const bestScoreEl = document.getElementById("bestScore");
const messageBoxEl = document.getElementById("messageBox");
const restartButtonEl = document.getElementById("restartButton");
const dragGhostEl = document.getElementById("dragGhost");
const leaderboardEl = document.getElementById("leaderboard");
const onlineCountEl = document.getElementById("onlineCount");

const leaderboardSeed = [
  ["NovaHex", 12480],
  ["PixelMira", 11820],
  ["ZenBrick", 11275],
  ["BlockMancer", 10940],
  ["LumaGrid", 10410],
];

let board = [];
let pieces = [];
let selectedPieceId = null;
let score = 0;
let bestScore = Number(window.localStorage.getItem(bestScoreKey) || 0);
let hoverPosition = null;
let gameOver = false;
let dragState = null;
let onlineCount = 1284;

const createEmptyBoard = () =>
  Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

const createId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `piece-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const makePiece = () => ({
  id: createId(),
  shape: randomItem(SHAPES),
  color: randomItem(COLORS),
});

const generatePieces = () => Array.from({ length: 3 }, makePiece);

const shapeBounds = (shape) => ({
  width: Math.max(...shape.map(([x]) => x)) + 1,
  height: Math.max(...shape.map(([, y]) => y)) + 1,
});

const getPieceById = (pieceId) => pieces.find((piece) => piece.id === pieceId);

const canPlacePiece = (piece, originX, originY) =>
  piece.shape.every(([dx, dy]) => {
    const x = originX + dx;
    const y = originY + dy;

    return (
      x >= 0 &&
      y >= 0 &&
      x < BOARD_SIZE &&
      y < BOARD_SIZE &&
      board[y][x] === null
    );
  });

const findClearedLines = () => {
  const rows = [];
  const cols = [];

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    if (board[y].every(Boolean)) {
      rows.push(y);
    }
  }

  for (let x = 0; x < BOARD_SIZE; x += 1) {
    let filled = true;

    for (let y = 0; y < BOARD_SIZE; y += 1) {
      if (!board[y][x]) {
        filled = false;
        break;
      }
    }

    if (filled) {
      cols.push(x);
    }
  }

  return { rows, cols };
};

const updateMessage = (text, warning = false) => {
  messageBoxEl.textContent = text;
  messageBoxEl.classList.toggle("is-warning", warning);
};

const updateScore = () => {
  scoreValueEl.textContent = score;

  if (score > bestScore) {
    bestScore = score;
    window.localStorage.setItem(bestScoreKey, String(bestScore));
  }

  bestScoreEl.textContent = bestScore;
};

const renderLeaderboard = () => {
  leaderboardEl.innerHTML = "";

  leaderboardSeed.forEach(([name, points], index) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    row.innerHTML = `
      <span class="leaderboard-row__rank">#${index + 1}</span>
      <span class="leaderboard-row__name">${name}</span>
      <span class="leaderboard-row__score">${points.toLocaleString()}</span>
    `;
    leaderboardEl.appendChild(row);
  });
};

const clearLinesIfNeeded = () => {
  const { rows, cols } = findClearedLines();
  const uniqueCells = new Set();

  rows.forEach((row) => {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      uniqueCells.add(`${x}:${row}`);
      board[row][x] = null;
    }
  });

  cols.forEach((col) => {
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      uniqueCells.add(`${col}:${y}`);
      board[y][col] = null;
    }
  });

  if (uniqueCells.size > 0) {
    score += uniqueCells.size + (rows.length + cols.length) * 8;
    updateMessage("Линия очищена. Продолжай собирать комбо.");
  }
};

const anyMovesLeft = () =>
  pieces.some((piece) => {
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        if (canPlacePiece(piece, x, y)) {
          return true;
        }
      }
    }

    return false;
  });

const maybeRefillPieces = () => {
  if (pieces.length === 0) {
    pieces = generatePieces();
    updateMessage("Новый набор фигур готов.");
  }
};

const endGame = () => {
  gameOver = true;
  selectedPieceId = null;
  hoverPosition = null;
  updateMessage("Ходов больше нет. Нажми «Новая игра», чтобы начать заново.", true);
};

const renderBoard = () => {
  boardEl.innerHTML = "";
  const activePiece = getPieceById(selectedPieceId);
  let previewSet = new Set();
  let previewValid = false;

  if (activePiece && hoverPosition) {
    previewValid = canPlacePiece(activePiece, hoverPosition.x, hoverPosition.y);
    previewSet = new Set(
      activePiece.shape.map(
        ([dx, dy]) => `${hoverPosition.x + dx}:${hoverPosition.y + dy}`,
      ),
    );
  }

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);

      const colorClass = board[y][x];
      if (colorClass) {
        cell.classList.add("is-filled", colorClass);
      }

      const previewKey = `${x}:${y}`;
      if (previewSet.has(previewKey) && !colorClass) {
        cell.classList.add(previewValid ? "is-preview-valid" : "is-preview-invalid");
        if (previewValid && activePiece) {
          cell.classList.add(activePiece.color);
        }
      }

      boardEl.appendChild(cell);
    }
  }
};

const renderPiece = (piece) => {
  const bounds = shapeBounds(piece.shape);
  const pieceCard = document.createElement("button");
  pieceCard.type = "button";
  pieceCard.className = "piece-card";
  pieceCard.dataset.pieceId = piece.id;
  pieceCard.setAttribute("aria-label", "Фигура");

  if (piece.id === selectedPieceId) {
    pieceCard.classList.add("is-selected");
  }

  if (dragState?.pieceId === piece.id) {
    pieceCard.classList.add("is-dragging");
  }

  const grid = document.createElement("div");
  grid.className = "piece-grid";
  grid.style.gridTemplateColumns = `repeat(${bounds.width}, 26px)`;
  grid.style.gridTemplateRows = `repeat(${bounds.height}, 26px)`;

  const filled = new Set(piece.shape.map(([x, y]) => `${x}:${y}`));

  for (let y = 0; y < bounds.height; y += 1) {
    for (let x = 0; x < bounds.width; x += 1) {
      const cell = document.createElement("div");
      cell.className = "mini-cell";

      if (filled.has(`${x}:${y}`)) {
        cell.classList.add("is-filled", piece.color);
      }

      grid.appendChild(cell);
    }
  }

  pieceCard.appendChild(grid);
  return pieceCard;
};

const renderGhost = (piece) => {
  const preview = renderPiece(piece).querySelector(".piece-grid");
  dragGhostEl.innerHTML = "";
  dragGhostEl.appendChild(preview);
};

const moveGhost = (clientX, clientY) => {
  dragGhostEl.style.transform = `translate(${clientX - 26}px, ${clientY - 26}px)`;
};

const setHoverFromPointer = (clientX, clientY) => {
  const hoveredElement = document.elementFromPoint(clientX, clientY);
  const cell = hoveredElement?.closest(".cell");

  if (!cell) {
    hoverPosition = null;
    renderBoard();
    return;
  }

  hoverPosition = {
    x: Number(cell.dataset.x),
    y: Number(cell.dataset.y),
  };

  renderBoard();
};

const stopDragging = () => {
  dragState = null;
  dragGhostEl.classList.add("hidden");
  dragGhostEl.innerHTML = "";
  document.body.classList.remove("is-dragging");
};

const renderTray = () => {
  trayEl.innerHTML = "";

  pieces.forEach((piece) => {
    trayEl.appendChild(renderPiece(piece));
  });
};

const refresh = () => {
  updateScore();
  renderBoard();
  renderTray();
};

const selectPiece = (pieceId) => {
  if (gameOver) {
    return;
  }

  selectedPieceId = selectedPieceId === pieceId ? null : pieceId;
  hoverPosition = null;

  if (selectedPieceId) {
    updateMessage("Наведи курсор на поле и кликни, чтобы поставить фигуру.");
  } else {
    updateMessage("Выбери фигуру снизу и поставь ее на поле.");
  }

  refresh();
};

const beginDragging = (pieceId, clientX, clientY) => {
  const piece = getPieceById(pieceId);
  if (!piece || gameOver) {
    return;
  }

  selectedPieceId = pieceId;
  dragState = { pieceId };
  document.body.classList.add("is-dragging");
  dragGhostEl.classList.remove("hidden");
  renderGhost(piece);
  moveGhost(clientX, clientY);
  setHoverFromPointer(clientX, clientY);
  updateMessage("Перетащи фигуру на поле и отпусти, чтобы поставить ее.");
  refresh();
};

const placeSelectedPiece = (x, y) => {
  if (gameOver || !selectedPieceId) {
    return false;
  }

  const piece = getPieceById(selectedPieceId);
  if (!piece || !canPlacePiece(piece, x, y)) {
    updateMessage("Сюда фигура не помещается. Попробуй другую позицию.", true);
    renderBoard();
    return false;
  }

  piece.shape.forEach(([dx, dy]) => {
    board[y + dy][x + dx] = piece.color;
  });

  score += piece.shape.length;
  pieces = pieces.filter((item) => item.id !== piece.id);
  selectedPieceId = null;
  hoverPosition = null;

  clearLinesIfNeeded();
  maybeRefillPieces();
  refresh();

  if (!anyMovesLeft()) {
    endGame();
    refresh();
    return true;
  }

  updateMessage("Отлично. Выбери следующую фигуру.");
  return true;
};

const startGame = () => {
  board = createEmptyBoard();
  pieces = generatePieces();
  selectedPieceId = null;
  hoverPosition = null;
  score = 0;
  gameOver = false;
  updateMessage("Выбери фигуру снизу и поставь ее на поле.");
  refresh();
};

trayEl.addEventListener("pointerdown", (event) => {
  const pieceCard = event.target.closest(".piece-card");
  if (!pieceCard) {
    return;
  }

  event.preventDefault();
  pieceCard.setPointerCapture(event.pointerId);
  beginDragging(pieceCard.dataset.pieceId, event.clientX, event.clientY);
});

restartButtonEl.addEventListener("click", startGame);

document.addEventListener("pointermove", (event) => {
  if (!dragState) {
    return;
  }

  moveGhost(event.clientX, event.clientY);
  setHoverFromPointer(event.clientX, event.clientY);
});

document.addEventListener("pointerup", (event) => {
  if (!dragState) {
    return;
  }

  const activePiece = getPieceById(dragState.pieceId);
  const dropTarget = document.elementFromPoint(event.clientX, event.clientY);
  const cell = dropTarget?.closest(".cell");
  let placed = false;

  if (activePiece && cell) {
    placed = placeSelectedPiece(Number(cell.dataset.x), Number(cell.dataset.y));
  } else {
    selectedPieceId = null;
    hoverPosition = null;
    updateMessage("Фигура возвращена. Перетащи ее на поле еще раз.");
    refresh();
  }

  if (!placed) {
    selectedPieceId = null;
    hoverPosition = null;
  }

  stopDragging();
  renderBoard();
  renderTray();
});

document.addEventListener("pointercancel", () => {
  if (!dragState) {
    return;
  }

  selectedPieceId = null;
  hoverPosition = null;
  stopDragging();
  updateMessage("Перетаскивание отменено. Попробуй еще раз.");
  refresh();
});

bestScoreEl.textContent = bestScore;
renderLeaderboard();
startGame();

window.setInterval(() => {
  onlineCount += Math.floor(Math.random() * 7) - 3;
  onlineCount = Math.max(1180, Math.min(1450, onlineCount));
  onlineCountEl.textContent = `${onlineCount.toLocaleString()} online`;
}, 3200);
