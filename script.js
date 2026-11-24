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
