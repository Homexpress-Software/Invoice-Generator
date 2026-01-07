async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");
  const s = window.state;
  const logoBase64 = document.getElementById("main-logo").src;

  const PAGE_WIDTH = 210;
  const MARGIN = 15;
  const FOOTER_Y = 285;
  const BOTTOM_LIMIT = 255; // Trigger C/F before this point
  const TABLE_START_Y = 112;

  let cursorY = 0;
  let runningTotal = 0;
  let itemIndex = 0;
  let pageNum = 1;

  // --- 1. PRE-CALCULATE TOTAL PAGES (N) ---
  const calculateTotalPages = () => {
    let tempY = TABLE_START_Y;
    let pages = 1;
    s.items.forEach((item) => {
      const lines = doc.splitTextToSize(item.desc, 130).length;
      const h = Math.max(lines * 7, 10);
      if (tempY + h > BOTTOM_LIMIT) {
        pages++;
        tempY = TABLE_START_Y;
      }
      tempY += h;
    });
    // Check if summary fits on last page
    if (tempY + 40 > BOTTOM_LIMIT) pages++;
    return pages;
  };

  const totalPages = calculateTotalPages();

  // --- 2. PAGE TEMPLATE FUNCTION ---
  const drawPageTemplate = (p, currentSubTotal, isNewPage) => {
    // Watermark
    if (logoBase64) {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.1 }));
      doc.addImage(logoBase64, "PNG", 40, 100, 130, 100, undefined, "FAST", 0);
      doc.restoreGraphicsState();
    }

    // Header & Contact Details
    if (logoBase64) doc.addImage(logoBase64, "PNG", MARGIN, 15, 28, 24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text("HomExpress Software", MARGIN + 32, 22);

    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      "Al-Islam Chamber (2nd Floor), 91, Agrabad C/A, Chattogram",
      MARGIN + 32,
      27
    );
    doc.text(
      `WhatsApp: +88 0158 189 2235 | Bkash: +88 0171 107 2553`,
      MARGIN + 32,
      31
    );
    doc.text(
      "accounts@homexpressworld.com | www.homexpressworld.com",
      MARGIN + 32,
      35
    );

    // Invoice Title
    doc.setFontSize(32);
    doc.setTextColor(241, 245, 249);
    doc.text("INVOICE", PAGE_WIDTH - MARGIN - doc.getTextWidth("INVOICE"), 35);

    // Ref & Date Bar
    doc.setFillColor(248, 250, 252);
    doc.rect(MARGIN, 48, PAGE_WIDTH - MARGIN * 2, 10, "F");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`Ref: ${s.invNo}`, MARGIN + 5, 54.5);
    doc.text(`Date: ${s.date}`, PAGE_WIDTH - MARGIN - 35, 54.5);

    // Bill To Section
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("BILL TO:", MARGIN, 68);
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(s.client.name.toUpperCase(), MARGIN, 74);
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const splitAddr = doc.splitTextToSize(s.client.address, 100);
    doc.text(splitAddr, MARGIN, 80);
    const phoneY = 82 + splitAddr.length * 4.5;
    doc.setFont("helvetica", "bold");
    doc.text(`Phone: ${s.client.phone}`, MARGIN, phoneY);

    // Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(MARGIN, TABLE_START_Y - 10, PAGE_WIDTH - MARGIN * 2, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.text("#", MARGIN + 5, TABLE_START_Y - 3.5);
    doc.text("DESCRIPTION OF SERVICES", MARGIN + 15, TABLE_START_Y - 3.5);
    doc.text("AMOUNT (TK)", PAGE_WIDTH - MARGIN - 30, TABLE_START_Y - 3.5);

    // Footer with Page X of N
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Efficiency • Reliability • Excellence", MARGIN, FOOTER_Y);
    doc.text(`Page ${p} of ${totalPages}`, PAGE_WIDTH - MARGIN - 20, FOOTER_Y);

    // Brought Forward (B/F) logic
    if (isNewPage) {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100);
      doc.text("Balance Brought Forward (B/F)", MARGIN + 15, TABLE_START_Y + 5);
      const bfAmt = currentSubTotal.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      });
      doc.text(bfAmt, PAGE_WIDTH - MARGIN - 5, TABLE_START_Y + 5, {
        align: "right",
      });
      return TABLE_START_Y + 12;
    }
    return TABLE_START_Y;
  };

  // --- 3. RENDERING LOOP ---
  cursorY = drawPageTemplate(pageNum, 0, false);

  while (itemIndex < s.items.length) {
    const item = s.items[itemIndex];
    const descLines = doc.splitTextToSize(item.desc, 130);
    const rowHeight = Math.max(descLines.length * 7, 10);

    // Page Break & Carried Forward (C/F)
    if (cursorY + rowHeight > BOTTOM_LIMIT) {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100);
      doc.text("Balance Carried Forward (C/F)", MARGIN + 15, cursorY + 5);
      const cfAmt = runningTotal.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      });
      doc.text(cfAmt, PAGE_WIDTH - MARGIN - 5, cursorY + 5, { align: "right" });

      doc.addPage();
      pageNum++;
      cursorY = drawPageTemplate(pageNum, runningTotal, true);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`${itemIndex + 1}`, MARGIN + 5, cursorY + 6);
    doc.text(descLines, MARGIN + 15, cursorY + 6);

    const amt = item.amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    });
    doc.text(amt, PAGE_WIDTH - MARGIN - 5, cursorY + 6, { align: "right" });

    doc.setDrawColor(241, 245, 249);
    doc.line(
      MARGIN,
      cursorY + rowHeight,
      PAGE_WIDTH - MARGIN,
      cursorY + rowHeight
    );

    runningTotal += item.amount;
    cursorY += rowHeight;
    itemIndex++;
  }

  // Final Totals Block
  if (cursorY + 40 > BOTTOM_LIMIT) {
    doc.addPage();
    pageNum++;
    cursorY = drawPageTemplate(pageNum, runningTotal, true);
  }

  cursorY += 10;
  const sumX = PAGE_WIDTH - MARGIN - 65;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Sub-Total:", sumX, cursorY);
  doc.text(
    runningTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    PAGE_WIDTH - MARGIN - 5,
    cursorY,
    { align: "right" }
  );

  cursorY += 8;
  doc.setTextColor(220, 38, 38);
  doc.text("Advance Paid:", sumX, cursorY);
  doc.text(
    s.advance.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    PAGE_WIDTH - MARGIN - 5,
    cursorY,
    { align: "right" }
  );

  cursorY += 10;
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Grand Total:", sumX, cursorY);
  doc.text(
    (runningTotal - s.advance).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    }),
    PAGE_WIDTH - MARGIN - 5,
    cursorY,
    { align: "right" }
  );

  doc.save(`HomExpress_${s.invNo}.pdf`);
}
