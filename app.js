window.state = {
  invNo: "HX-1/1/26WS",
  date: "06/01/2026",
  client: { name: "", address: "", phone: "" },
  items: [],
  advance: 0,
};

const STORAGE_KEY = "HX_INVOICE_STATE";

window.onload = async () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) window.state = JSON.parse(saved);
  await renderUI();
};

async function getBase64Image(imgUrl) {
  try {
    const response = await fetch(imgUrl);
    const blob = await response.blob();
    return new Promise((res) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result);
      r.readAsDataURL(blob);
    });
  } catch (e) {
    return "";
  }
}

function saveState() {
  window.state.invNo = document.getElementById("inv-no").innerText;
  window.state.date = document.getElementById("inv-date").innerText;
  window.state.client = {
    name: document.getElementById("client-name").innerText,
    address: document.getElementById("client-address").innerText,
    phone: document.getElementById("client-phone").innerText,
  };
  window.state.advance =
    parseFloat(
      document.getElementById("input-advance").innerText.replace(/,/g, "")
    ) || 0;
  window.state.items = Array.from(document.querySelectorAll(".item-row")).map(
    (row) => ({
      desc: row.querySelector(".item-desc").innerText,
      amount:
        parseFloat(
          row.querySelector(".item-amt").innerText.replace(/,/g, "")
        ) || 0,
    })
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.state));
}

function exportJSON() {
  saveState();
  const blob = new Blob([JSON.stringify(window.state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `HX_Data_${window.state.invNo}.json`;
  a.click();
}

function importJSON(event) {
  const reader = new FileReader();
  reader.onload = (e) => {
    window.state = JSON.parse(e.target.result);
    renderUI();
    saveState();
  };
  reader.readAsText(event.target.files[0]);
}

function convertAmountToWords(amount) {
  const single = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const tr = (n) => {
    if (n < 20) return single[n];
    if (n < 100)
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + single[n % 10] : "")
      );
    if (n < 1000)
      return (
        tr(Math.floor(n / 100)) +
        " Hundred" +
        (n % 100 !== 0 ? " " + tr(n % 100) : "")
      );
    if (n < 100000)
      return (
        tr(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + tr(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        tr(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + tr(n % 100000) : "")
      );
    return (
      tr(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + tr(n % 10000000) : "")
    );
  };
  return amount > 0 ? tr(Math.floor(amount)) + " Taka Only" : "Zero Taka";
}
