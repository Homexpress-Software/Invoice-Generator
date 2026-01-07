/**
 * ui.js
 * Implements "Type to Add" functionality with Real-time Amount Formatting.
 */

async function renderUI() {
  const s = window.state;
  const b64 = await getBase64Image("logo.png");
  document.getElementById("main-logo").src = b64;
  document.getElementById("watermark").src = b64;

  document.getElementById("inv-no").innerText = s.invNo;
  document.getElementById("inv-date").innerText = s.date;
  document.getElementById("client-name").innerText = s.client.name;
  document.getElementById("client-address").innerText = s.client.address;
  document.getElementById("client-phone").innerText = s.client.phone;
  document.getElementById("input-advance").innerText =
    s.advance.toLocaleString("en-IN");

  const tbody = document.getElementById("items-tbody");
  tbody.innerHTML = "";

  if (s.items.length) {
    s.items.forEach((i) => addRowToDOM(i.desc, i.amount));
  }

  ensureEmptyRow();
  calculateTotals();
}

/**
 * Formats a number string with commas (Indian numbering system)
 * while preserving cursor position for contentEditable.
 */
function formatAmountCell(el) {
  let rawValue = el.innerText.replace(/,/g, "");

  // 1. Handle Empty Case: If cell is cleared, keep it empty and stop
  if (rawValue === "") {
    el.innerText = "";
    return;
  }

  // 2. Prevent NaN: Check if the input is a valid number
  const numericValue = parseFloat(rawValue);
  if (isNaN(numericValue)) {
    // If user types non-numeric characters, revert or clear
    el.innerText = "";
    return;
  }

  // 3. Apply Formatting while preserving cursor
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const offset = selection.focusOffset;
    const oldLength = el.innerText.length;

    const formatted = numericValue.toLocaleString("en-IN");

    if (el.innerText !== formatted) {
      el.innerText = formatted;

      // Restore cursor position relative to the change in length
      const newLength = el.innerText.length;
      const newOffset = Math.max(0, offset + (newLength - oldLength));

      const range = document.createRange();
      const newSelection = window.getSelection();
      if (el.childNodes.length > 0) {
        range.setStart(el.childNodes[0], newOffset);
        range.collapse(true);
        newSelection.removeAllRanges();
        newSelection.addRange(range);
      }
    }
  }
}

function handleInput(element) {
  // If typing in the amount column, apply formatting
  if (element.classList.contains("item-amt")) {
    formatAmountCell(element);
  }

  saveState();
  calculateTotals();

  const row = element.closest("tr");
  const isLastRow = !row.nextElementSibling;

  if (isLastRow) {
    ensureEmptyRow();
  }
}

function ensureEmptyRow() {
  const rows = document.querySelectorAll(".item-row");
  const lastRow = rows[rows.length - 1];

  if (!lastRow) {
    addRowToDOM("", 0);
    return;
  }

  const desc = lastRow.querySelector(".item-desc").innerText.trim();
  const amt = lastRow.querySelector(".item-amt").innerText.trim();

  if (desc !== "" || (amt !== "" && amt !== "0")) {
    addRowToDOM("", 0);
  }

  updateRowNumbers();
}

function addRowToDOM(desc, amt) {
  const tr = document.createElement("tr");
  tr.className =
    "item-row group border-b border-gray-200 hover:bg-gray-50 transition-colors";

  const displayAmt =
    amt === 0 && desc === "" ? "" : amt.toLocaleString("en-IN");

  tr.innerHTML = `
        <td class="p-4 text-center text-gray-400 no-print relative w-12">
            <div class="delete-btn-container"></div>
            <span class="row-num font-medium text-sm"></span>
        </td>
        <td contenteditable="true" 
            class="p-4 item-desc outline-none text-slate-800 text-sm" 
            oninput="handleInput(this)">${desc}</td>
        <td contenteditable="true" 
            class="p-4 item-amt text-right outline-none font-mono font-bold text-sm" 
            oninput="handleInput(this)">${displayAmt}</td>
    `;
  document.getElementById("items-tbody").appendChild(tr);
  updateRowNumbers();
}

function updateRowNumbers() {
  const rows = document.querySelectorAll(".item-row");
  rows.forEach((row, i) => {
    row.querySelector(".row-num").innerText = i + 1;
    const btnContainer = row.querySelector(".delete-btn-container");
    const isLastRow = i === rows.length - 1;

    if (isLastRow) {
      btnContainer.innerHTML = "";
    } else if (btnContainer.innerHTML === "") {
      btnContainer.innerHTML = `
        <button onclick="removeRow(this)" 
                class="absolute left-1 text-red-500 opacity-0 group-hover:opacity-100 font-bold px-2 transition-opacity">×</button>
      `;
    }
  });
}

function removeRow(btn) {
  btn.closest("tr").remove();
  updateRowNumbers();
  saveState();
  calculateTotals();
}

function calculateTotals() {
  let net = 0;
  const items = [];

  document.querySelectorAll(".item-row").forEach((row) => {
    const desc = row.querySelector(".item-desc").innerText.trim();
    const amtStr = row.querySelector(".item-amt").innerText.replace(/,/g, "");

    // Use 0 if the cell is empty or invalid
    const amt = parseFloat(amtStr) || 0;

    if (desc !== "" || amt !== 0) {
      net += amt;
      items.push({ desc, amount: amt });
    }
  });

  window.state.items = items;

  // Handle Advance Paid field safely
  const advEl = document.getElementById("input-advance");
  const advStr = advEl.innerText.replace(/,/g, "");
  const adv = parseFloat(advStr) || 0;

  // Prevent NaN in the total calculation
  const grand = net - adv;

  document.getElementById("display-net").innerText = net.toLocaleString(
    "en-IN",
    { minimumFractionDigits: 2 }
  );
  document.getElementById("display-grand").innerText = grand.toLocaleString(
    "en-IN",
    { minimumFractionDigits: 2 }
  );

  if (typeof convertAmountToWords === "function") {
    document.getElementById("display-words").innerText =
      convertAmountToWords(grand);
  }
}
