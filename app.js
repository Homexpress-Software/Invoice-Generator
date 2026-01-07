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
/**
 * EXPORT: Converts current window.state to a JSON file and downloads it.
 */
function exportJSON() {
  // Sync latest UI data to state before exporting
  saveState();

  const dataStr = JSON.stringify(window.state, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  const exportFileDefaultName = `Invoice_${window.state.invNo || "data"}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
}

/**
 * IMPORT: Reads a JSON file, updates window.state, and refreshes the UI.
 */
function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);

      // Basic validation: Check if essential fields exist
      if (importedData.invNo && importedData.client) {
        window.state = importedData;

        // Save to LocalStorage so it persists on refresh
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.state));

        // Re-render the entire UI with new data
        renderUI();

        alert("Invoice data imported successfully!");
      } else {
        alert(
          "Invalid JSON format. Please upload a valid HomExpress invoice file."
        );
      }
    } catch (err) {
      alert("Error parsing JSON file.");
      console.error(err);
    }
    // Reset the input so the same file can be uploaded again if needed
    event.target.value = "";
  };
  reader.readAsText(file);
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
