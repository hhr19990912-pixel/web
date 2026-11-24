(() => {
  const displayEl = document.getElementById("display");
  const expressionEl = document.getElementById("expression");
  const keysEl = document.querySelector(".calc-keys");

  const state = {
    current: "0",
    previous: null,
    operator: null,
    overwrite: false,
  };

  const opSymbols = {
    "+": "+",
    "-": "−",
    "*": "×",
    "/": "÷",
  };

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "Error";

    const str = String(value);
    if (str.includes("e")) return str;

    const [intPart, decPart] = str.split(".");
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
  }

  function formatCurrent() {
    if (state.current === "Error") return "Error";

    const negative = state.current.startsWith("-");
    const raw = negative ? state.current.slice(1) : state.current;
    const [intPart, decPart] = raw.split(".");
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const sign = negative ? "-" : "";

    if (decPart !== undefined) {
      return `${sign}${formattedInt}.${decPart}`;
    }
    return `${sign}${formattedInt}`;
  }

  function updateDisplay() {
    displayEl.textContent = formatCurrent();

    if (state.previous !== null && state.operator) {
      expressionEl.textContent = `${formatNumber(Number(state.previous))} ${opSymbols[state.operator]}`;
    } else {
      expressionEl.textContent = "";
    }
  }

  function clearAll() {
    state.current = "0";
    state.previous = null;
    state.operator = null;
    state.overwrite = false;
  }

  function inputDigit(digit) {
    if (state.current === "Error") clearAll();

    if (state.overwrite) {
      state.current = digit;
      state.overwrite = false;
      return;
    }

    if (state.current === "0") {
      state.current = digit;
      return;
    }

    if (state.current.replace("-", "").replace(".", "").length >= 12) return;
    state.current += digit;
  }

  function inputDecimal() {
    if (state.current === "Error") clearAll();

    if (state.overwrite) {
      state.current = "0.";
      state.overwrite = false;
      return;
    }

    if (!state.current.includes(".")) {
      state.current += ".";
    }
  }

  function toggleSign() {
    if (state.current === "Error" || state.current === "0") return;
    state.current = state.current.startsWith("-")
      ? state.current.slice(1)
      : `-${state.current}`;
  }

  function toPercent() {
    if (state.current === "Error") return;
    const value = Number(state.current) / 100;
    state.current = String(value);
    state.overwrite = true;
  }

  function compute(a, b, operator) {
    switch (operator) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  }

  function setOperator(nextOperator) {
    if (state.current === "Error") return;

    const currentValue = Number(state.current);

    if (state.previous !== null && state.operator && !state.overwrite) {
      const result = compute(Number(state.previous), currentValue, state.operator);
      if (!Number.isFinite(result)) {
        state.current = "Error";
        state.previous = null;
        state.operator = null;
        state.overwrite = true;
        return;
      }
      state.current = String(parseFloat(result.toPrecision(12)));
      state.previous = state.current;
    } else {
      state.previous = state.current;
    }

    state.operator = nextOperator;
    state.overwrite = true;
  }

  function equals() {
    if (state.operator === null || state.previous === null || state.current === "Error") {
      return;
    }

    const result = compute(Number(state.previous), Number(state.current), state.operator);
    if (!Number.isFinite(result)) {
      state.current = "Error";
    } else {
      state.current = String(parseFloat(result.toPrecision(12)));
    }

    state.previous = null;
    state.operator = null;
    state.overwrite = true;
  }

  function handleAction(action, value) {
    switch (action) {
      case "digit":
        inputDigit(value);
        break;
      case "decimal":
        inputDecimal();
        break;
      case "operator":
        setOperator(value);
        break;
      case "equals":
        equals();
        break;
      case "clear":
        clearAll();
        break;
      case "sign":
        toggleSign();
        break;
      case "percent":
        toPercent();
        break;
      default:
        break;
    }
    updateDisplay();
  }

  keysEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    handleAction(button.dataset.action, button.dataset.value);
  });

  document.addEventListener("keydown", (event) => {
    const { key } = event;

    if (/\d/.test(key)) {
      handleAction("digit", key);
      return;
    }

    if (key === ".") {
      handleAction("decimal");
      return;
    }

    if (key === "+" || key === "-" || key === "*" || key === "/") {
      event.preventDefault();
      handleAction("operator", key);
      return;
    }

    if (key === "Enter" || key === "=") {
      event.preventDefault();
      handleAction("equals");
      return;
    }

    if (key === "Escape" || key === "c" || key === "C") {
      handleAction("clear");
      return;
    }

    if (key === "%") {
      handleAction("percent");
      return;
    }

    if (key === "Backspace") {
      if (state.overwrite || state.current === "Error") {
        clearAll();
      } else if (state.current.length <= 1 || (state.current.length === 2 && state.current.startsWith("-"))) {
        state.current = "0";
      } else {
        state.current = state.current.slice(0, -1);
      }
      updateDisplay();
    }
  });

  updateDisplay();
})();

(() => {
  const SIZE = 4;
  const boardEl = document.getElementById("game-board");
  const scoreEl = document.getElementById("game-score");
  const overlayEl = document.getElementById("game-overlay");
  const overlayTextEl = document.getElementById("game-overlay-text");
  const gameRoot = document.querySelector(".game-2468");
  const padEl = document.querySelector(".game-pad");
  const restartBtns = [
    document.getElementById("game-restart"),
    document.getElementById("game-overlay-restart"),
  ];

  let board = [];
  let score = 0;
  let won = false;
  let over = false;
  let touchStart = null;

  function emptyBoard() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  }

  function cloneBoard(source) {
    return source.map((row) => row.slice());
  }

  function boardsEqual(a, b) {
    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        if (a[r][c] !== b[r][c]) return false;
      }
    }
    return true;
  }

  function emptyCells() {
    const cells = [];
    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        if (board[r][c] === 0) cells.push([r, c]);
      }
    }
    return cells;
  }

  function addRandomTile() {
    const cells = emptyCells();
    if (!cells.length) return null;
    const [r, c] = cells[Math.floor(Math.random() * cells.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
    return [r, c];
  }

  function tileClass(value) {
    if (value >= 2468) return "tile tile-2468";
    if (value >= 1024) return "tile tile-1024";
    if (value >= 512) return "tile tile-512";
    if (value >= 256) return "tile tile-256";
    if (value >= 128) return "tile tile-128";
    if (value >= 64) return "tile tile-64";
    if (value >= 32) return "tile tile-32";
    if (value >= 16) return "tile tile-16";
    if (value >= 10) return "tile tile-8";
    if (value === 8) return "tile tile-8";
    if (value === 6) return "tile tile-6";
    if (value === 4) return "tile tile-4";
    if (value === 2) return "tile tile-2";
    return "tile";
  }

  function render(meta = {}) {
    const { newborn = null, merged = [] } = meta;
    boardEl.innerHTML = "";

    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        const value = board[r][c];
        const cell = document.createElement("div");
        if (value) {
          cell.className = tileClass(value);
          cell.textContent = String(value);
          if (newborn && newborn[0] === r && newborn[1] === c) {
            cell.classList.add("tile-new");
          }
          if (merged.some(([mr, mc]) => mr === r && mc === c)) {
            cell.classList.add("tile-merged");
          }
        } else {
          cell.className = "tile";
        }
        boardEl.appendChild(cell);
      }
    }

    scoreEl.textContent = String(score);

    const overlayRestart = document.getElementById("game-overlay-restart");
    if (over) {
      overlayEl.hidden = false;
      overlayTextEl.textContent = "没有空位了";
      overlayRestart.textContent = "再来一局";
    } else if (won) {
      overlayEl.hidden = false;
      overlayTextEl.textContent = "到达 2468！";
      overlayRestart.textContent = "继续玩";
    } else {
      overlayEl.hidden = true;
    }
  }

  function slideLine(line) {
    const filtered = line.filter((n) => n !== 0);
    const result = [];
    const mergedFlags = [];
    let i = 0;
    let gained = 0;

    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        // 2468：相同数字合并为「当前值 + 2」，如 2+2→4，4+4→6，6+6→8…
        const next = filtered[i] + 2;
        result.push(next);
        mergedFlags.push(true);
        gained += next;
        i += 2;
      } else {
        result.push(filtered[i]);
        mergedFlags.push(false);
        i += 1;
      }
    }

    while (result.length < SIZE) {
      result.push(0);
      mergedFlags.push(false);
    }

    return { line: result, gained, mergedFlags };
  }

  function move(direction) {
    if (over) return;

    const prev = cloneBoard(board);
    const mergedCells = [];
    let gained = 0;

    const writeRow = (r, values, flags, reverse) => {
      const cols = reverse ? [3, 2, 1, 0] : [0, 1, 2, 3];
      cols.forEach((c, i) => {
        board[r][c] = values[i];
        if (flags[i] && values[i]) mergedCells.push([r, c]);
      });
    };

    const writeCol = (c, values, flags, reverse) => {
      const rows = reverse ? [3, 2, 1, 0] : [0, 1, 2, 3];
      rows.forEach((r, i) => {
        board[r][c] = values[i];
        if (flags[i] && values[i]) mergedCells.push([r, c]);
      });
    };

    if (direction === "left" || direction === "right") {
      const reverse = direction === "right";
      for (let r = 0; r < SIZE; r += 1) {
        const source = reverse ? board[r].slice().reverse() : board[r].slice();
        const { line, gained: g, mergedFlags } = slideLine(source);
        gained += g;
        writeRow(r, line, mergedFlags, reverse);
      }
    } else {
      const reverse = direction === "down";
      for (let c = 0; c < SIZE; c += 1) {
        const source = [];
        for (let r = 0; r < SIZE; r += 1) source.push(board[r][c]);
        if (reverse) source.reverse();
        const { line, gained: g, mergedFlags } = slideLine(source);
        gained += g;
        writeCol(c, line, mergedFlags, reverse);
      }
    }

    if (boardsEqual(prev, board)) return;

    score += gained;
    const newborn = addRandomTile();

    if (!won && board.some((row) => row.some((v) => v >= 2468))) {
      won = true;
    }

    if (!emptyCells().length && !hasMoves()) {
      over = true;
    }

    render({ newborn, merged: mergedCells });
  }

  function hasMoves() {
    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        const value = board[r][c];
        if (value === 0) return true;
        if (c + 1 < SIZE && board[r][c + 1] === value) return true;
        if (r + 1 < SIZE && board[r + 1][c] === value) return true;
      }
    }
    return false;
  }

  function restart() {
    board = emptyBoard();
    score = 0;
    won = false;
    over = false;
    addRandomTile();
    addRandomTile();
    render();
    gameRoot.focus({ preventScroll: true });
  }

  function continueAfterWin() {
    won = false;
    overlayEl.hidden = true;
    gameRoot.focus({ preventScroll: true });
  }

  restartBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.id === "game-overlay-restart" && won && !over) {
        continueAfterWin();
        return;
      }
      restart();
    });
  });

  padEl.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-dir]");
    if (!btn) return;
    move(btn.dataset.dir);
  });

  document.addEventListener("keydown", (event) => {
    const keyMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      W: "up",
      s: "down",
      S: "down",
      a: "left",
      A: "left",
      d: "right",
      D: "right",
    };

    const direction = keyMap[event.key];
    if (!direction) return;

    // 方向键留给游戏；WASD 仅在焦点在游戏区时生效，避免和输入冲突
    if (["w", "W", "a", "A", "s", "S", "d", "D"].includes(event.key)) {
      if (document.activeElement !== gameRoot && !gameRoot.contains(document.activeElement)) {
        return;
      }
    }

    event.preventDefault();
    move(direction);
  });

  boardEl.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return;
      const t = event.touches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    },
    { passive: true }
  );

  boardEl.addEventListener(
    "touchend",
    (event) => {
      if (!touchStart || event.changedTouches.length !== 1) return;
      const t = event.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      touchStart = null;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (Math.max(absX, absY) < 24) return;

      if (absX > absY) {
        move(dx > 0 ? "right" : "left");
      } else {
        move(dy > 0 ? "down" : "up");
      }
    },
    { passive: true }
  );

  restart();
})();
