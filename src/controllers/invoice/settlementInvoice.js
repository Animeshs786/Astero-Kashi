const PDFDocument = require("pdfkit");
const https = require("https");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const numberToWords = require("number-to-words");
const InvoiceCount = require("../../models/invoiceCount");
const AppError = require("../../utils/AppError");
const moment = require("moment-timezone");
const Settlement = require("../../models/settlement");

moment.tz.setDefault("Asia/Kolkata");

// Function to validate URL
const isValidUrl = (urlString) => {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
};

// Function to generate invoice number
const getInvoiceNumber = async () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const financialYear = currentDate.getMonth() >= 3 ? currentYear : currentYear - 1;

  const invoiceCount = await InvoiceCount.findById("67f37a017cf4b997067a59a4");
  if (!invoiceCount) {
    throw new AppError("Invoice count not found", 500);
  }
  const sequence = (+invoiceCount.invoiceCount + 1).toString().padStart(4, "0");
  invoiceCount.invoiceCount = +invoiceCount.invoiceCount + 1;
  await invoiceCount.save();
  return `XC${financialYear}${sequence}`; // e.g., XC20250001
};

// Function to download image
const downloadImage = async (url, dest) => {
  if (!isValidUrl(url)) {
    throw new AppError(`Invalid URL: ${url}`, 400);
  }

  const agent = new https.Agent({ rejectUnauthorized: false });
  try {
    const response = await axios.get(url, {
      responseType: "stream",
      httpsAgent: agent,
    });
    const writer = fs.createWriteStream(dest);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    throw new AppError(`Failed to download image from ${url}: ${error.message}`, 500);
  }
};

// Main settlement invoice generation function
exports.generateSettlementInvoice = async (settlementId) => {
  try {
    // Fetch settlement with populated astrologer data
    const settlement = await Settlement.findById(settlementId)
      .populate("astrologer", "name email mobile");

    if (!settlement) {
      throw new AppError("Settlement not found", 404);
    }

    // Define file paths
    const logoUrl = "https://astrokashi.in/public/imageBulk/imageBulk-1747917927305.png";
    const logoPath = path.join(__dirname, "../../../public/logo_astrokashi.png");
    const invoiceNo = await getInvoiceNumber();
    const invoicePath = path.join(__dirname, `../../../public/invoices/Settlement_Invoice_${invoiceNo}.pdf`);

    // Ensure invoices directory exists
    const invoicesDir = path.join(__dirname, "../../../public/invoices");
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    // Download logo
    await downloadImage(logoUrl, logoPath).catch((err) => {
      console.error(`Failed to download logo: ${err.message}`);
      throw err;
    });

    // Initialize PDF document
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(invoicePath));

    // Header: Logo and Company Details
    const pageWidth = doc.page.width; // 612 for A4 with 50pt margins on each side
    const logoWidth = 100;
    const logoX = 50; // Fixed to left margin
    const logoY = 20; // Top margin for logo
    doc.image(logoPath, logoX, logoY, { width: logoWidth });

    // Company details (centered on the page)
    const companyDetailsWidth = pageWidth - 100; // Full width minus left and right margins
    const companyDetailsX = 50; // Start at left margin, but text will be centered within width
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("AstroKashi", companyDetailsX, logoY, { width: companyDetailsWidth, align: "center" })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text("123 Astrology Lane, Kolkata, India", companyDetailsX, logoY + 20, { width: companyDetailsWidth, align: "center" })
      .text("Email: support@astrokashi.in | Phone: +91 98765 43210", companyDetailsX, logoY + 35, { width: companyDetailsWidth, align: "center" })
      .moveDown(1);

    // Invoice Title (Centered, below logo and company details)
    const invoiceTitleY = logoY + 70;
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("SETTLEMENT INVOICE", 50, invoiceTitleY, { align: "center", width: pageWidth - 100 })
      .moveDown(1);

    // Invoice Details (Right-aligned, below invoice title)
    const invoiceDetailsY = invoiceTitleY + 30;
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Invoice No: ${invoiceNo}`, 400, invoiceDetailsY, { align: "right" })
      .text(`Date: ${moment().format("DD MMMM YYYY")}`, 400, invoiceDetailsY + 15, { align: "right" });

    // Astrologer Details (below invoice details)
    const astrologerDetailsY = invoiceDetailsY + 40;
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Astrologer Details:", 50, astrologerDetailsY)
      .font("Helvetica")
      .fontSize(10)
      .text(`Name: ${settlement.astrologer?.name || "Unknown"}`, 50, astrologerDetailsY + 15)
      .text(`Email: ${settlement.astrologer?.email || "N/A"}`, 50, astrologerDetailsY + 30)
      .text(`Phone: ${settlement.astrologer?.mobile || "N/A"}`, 50, astrologerDetailsY + 45);

    // Settlement Details Table
    const tableTop = astrologerDetailsY + 75;
    const tableWidth = 500;
    const colWidths = [30, 250, 70, 70, 80]; // Sl, Description, Amount, Commission, GST
    const headers = ["Sl.", "Description", "Amount", "Commission", "GST"];
    const items = [
      {
        sl: "1",
        description: `Settlement for period ${moment(settlement.startDate).format("DD MMMM YYYY")} to ${moment(settlement.endDate).format("DD MMMM YYYY")}`,
        amount: settlement.totalAmount.toFixed(2),
        commission: settlement.totalCommission.toFixed(2),
        gst: settlement.gstCharge.toFixed(2),
      },
    ];

    // Calculate table height
    let tableHeight = 20; // Header row
    doc.fontSize(10).font("Helvetica");
    items.forEach((item) => {
      const maxHeight = Math.max(
        ...Object.values(item).map((value) =>
          doc.heightOfString(value.toString(), {
            width: colWidths[Object.keys(item).indexOf(Object.keys(item).find((key) => item[key] === value))],
            align: Object.keys(item).indexOf("description") === 1 ? "left" : "center",
          })
        )
      );
      tableHeight += Math.max(20, maxHeight + 10);
    });

    // Draw table border
    doc.rect(50, tableTop, tableWidth, tableHeight).lineWidth(1).stroke();

    // Draw vertical lines
    let x = 50;
    for (let i = 0; i < colWidths.length - 1; i++) {
      x += colWidths[i];
      doc.moveTo(x, tableTop).lineTo(x, tableTop + tableHeight).stroke();
    }

    // Draw header row
    doc.fontSize(10).font("Helvetica-Bold");
    headers.forEach((header, i) => {
      doc.text(header, 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop + 5, {
        width: colWidths[i],
        align: i === 1 ? "left" : "center",
      });
    });

    // Draw horizontal line after header
    doc.moveTo(50, tableTop + 20).lineTo(50 + tableWidth, tableTop + 20).stroke();

    // Draw table content
    let y = tableTop + 25;
    items.forEach((item) => {
      doc.fontSize(10).font("Helvetica");
      Object.keys(item).forEach((key, i) => {
        let value = item[key];
        if (key === "amount" || key === "commission" || key === "gst") {
          value = `${parseFloat(value).toFixed(2)}`;
        }
        doc.text(value, 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
          width: colWidths[i],
          align: key === "description" ? "left" : "center",
        });
      });
      y += 20;
    });

    // Summary Section
    const summaryTop = y + 20;
    const columnWidth = 100;
    const columnSpacing = 10;
    const col1X = 350;
    const col2X = col1X + columnWidth + columnSpacing;

    const totalSettlementAmount = settlement.totalSettlementAmount;
    const paidAmount = settlement.status === "completed" ? totalSettlementAmount : 0;

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Total Settlement Amount:", col1X, summaryTop, { width: columnWidth, align: "left" })
      .text("Paid Amount:", col1X, summaryTop + 15, { width: columnWidth, align: "left" })
      .font("Helvetica")
      .text(`${parseFloat(totalSettlementAmount).toFixed(2)}`, col2X, summaryTop, { width: columnWidth, align: "left" })
      .text(`${parseFloat(paidAmount).toFixed(2)}`, col2X, summaryTop + 15, { width: columnWidth, align: "left" });

    // Total in Words
    const totalWordsY = summaryTop + 50;
    const totalInWords = numberToWords.toWords(paidAmount).replace(/\b\w/g, (l) => l.toUpperCase());
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("TOTAL PAID: ", 50, totalWordsY, { continued: true })
      .font("Helvetica")
      .text(`Rupees ${totalInWords} Only`, { align: "left" });

    // Horizontal line
    doc.moveTo(50, totalWordsY + 15).lineTo(550, totalWordsY + 15).lineWidth(1).stroke();

    // Terms & Conditions
    const termsY = totalWordsY + 25;
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("TERMS & CONDITIONS:", 50, termsY)
      .font("Helvetica")
      .text("1. Amount paid is non-refunded unless otherwise specified.", 50, termsY + 15)
      .text("2. Settlement amounts are final as per agreed terms.", 50, termsY + 30);

    // Footer
    const footerY = termsY + 280;
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("(Authorized Signatory)", 450, footerY, { align: "right" })
      .text("for AstroKashi", 450, footerY + 15, { align: "right" })
      .text("This is a computer-generated invoice.", 50, footerY + 15, { align: "left" });

    doc.end();

    // Update settlement with invoice path
    settlement.invoice = `public/invoices/Settlement_Invoice_${invoiceNo}.pdf`;
    await settlement.save();

    console.log(`Settlement invoice generated at ${invoicePath}`);
    return invoicePath;
  } catch (error) {
    console.error("Error generating settlement invoice:", error.message);
    throw error;
  }
};

