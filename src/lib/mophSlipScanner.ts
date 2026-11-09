// Smart MOPH Salary Slip Scanner & Parser (สำนักงานปลัดกระทรวงสาธารณสุข)

export interface ScannedMophSlip {
  transferDate: string; // YYYY-MM-DD
  rawDateText?: string;
  employeeName?: string;
  organization?: string;
  bankName?: string;
  bankAccountNo?: string;
  baseSalary: number;
  retroSalary: number;
  totalGrossIncome: number;
  withholdingTax: number;
  gpfMandatory: number;
  gpfVoluntary: number;
  coopShares: number;
  coopLoan: number;
  housingLoan: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  rawText: string;
}

// Clean and extract numeric amounts from OCR lines
function extractAmount(text: string, regex: RegExp): number {
  const match = text.match(regex);
  if (!match) return 0;
  const valStr = match[1] || match[2] || '';
  const cleaned = valStr.replace(/,/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function parseMophSlipText(rawText: string): ScannedMophSlip {
  const text = rawText.replace(/\r\n/g, '\n');

  // 1. Date extraction: โอนเงินเข้าวันที่ : 27/10/2569
  let transferDate = new Date().toISOString().slice(0, 10);
  let rawDateText = '';
  const dateMatch = text.match(/โอนเงินเข้าวันที่\s*[:\s]*([0-9]{1,2})\s*[\/\-]\s*([0-9]{1,2})\s*[\/\-]\s*([0-9]{4})/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    let year = parseInt(dateMatch[3]);
    rawDateText = `${day}/${month}/${year}`;
    if (year > 2500) {
      year -= 543; // Convert BE to CE for standard ISO date input
    }
    transferDate = `${year}-${month}-${day}`;
  }

  // 2. Employee Info
  const nameMatch = text.match(/ชื่อ[- ]*สกุล\s*[:\s]*([^\n]+)/);
  const employeeName = nameMatch ? nameMatch[1].trim() : '';

  const orgMatch = text.match(/หน่วยงาน\s*[:\s]*([^\n]+)/);
  const organization = orgMatch ? orgMatch[1].trim() : '';

  const bankMatch = text.match(/ชื่อธนาคาร\s*[:\s]*([^\n]+)/);
  const bankName = bankMatch ? bankMatch[1].trim() : '';

  const accMatch = text.match(/เลขที่บัญชี\s*[:\s]*([0-9\-]+)/);
  const bankAccountNo = accMatch ? accMatch[1].trim() : '';

  // 3. Incomes (รายการรับ)
  const baseSalary = extractAmount(text, /1[\.\s]+เงินเดือน[^\d\n]*([0-9,]+\.[0-9]{2})/);
  const retroSalary = extractAmount(text, /2[\.\s]+เงินเดือน\s*\(ตกเบิก\)[^\d\n]*([0-9,]+\.[0-9]{2})/);
  let totalGrossIncome = extractAmount(text, /รวมรับทั้งหมด[^\d\n]*([0-9,]+\.[0-9]{2})/);
  if (totalGrossIncome === 0 && (baseSalary > 0 || retroSalary > 0)) {
    totalGrossIncome = baseSalary + retroSalary;
  }

  // 4. Deductions (รายการหัก)
  const withholdingTax = extractAmount(text, /1[\.\s]+ภาษี[^\d\n]*([0-9,]+\.[0-9]{2})/);
  const gpfMandatory = extractAmount(text, /2[\.\s]+กบข[^\n\d]*([0-9,]+\.[0-9]{2})/);
  const housingLoan = extractAmount(text, /4[\.\s]+เงินกู้เพื่อที่อยู่อาศัย[^\n\d]*([0-9,]+\.[0-9]{2})/);
  const coopShares = extractAmount(text, /5[\.\s]+สหกรณ์[^\n\d]*([0-9,]+\.[0-9]{2})/);
  const gpfVoluntary = extractAmount(text, /6[\.\s]+กบข[^\n\d]*ออมเพิ่ม[^\n\d]*([0-9,]+\.[0-9]{2})/);
  const coopLoan = extractAmount(text, /7[\.\s]+สหกรณ์อื่น[^\n\d]*([0-9,]+\.[0-9]{2})/);

  let totalDeductions = extractAmount(text, /รวมหักทั้งหมด[^\d\n]*([0-9,]+\.[0-9]{2})/);
  if (totalDeductions === 0) {
    totalDeductions = withholdingTax + gpfMandatory + coopShares + gpfVoluntary + housingLoan + coopLoan;
  }

  let netSalary = extractAmount(text, /รับสุทธิ[^\d\n]*([0-9,]+\.[0-9]{2})/);
  if (netSalary === 0 && totalGrossIncome > 0) {
    netSalary = totalGrossIncome - totalDeductions;
  }

  return {
    transferDate,
    rawDateText,
    employeeName,
    organization,
    bankName,
    bankAccountNo,
    baseSalary,
    retroSalary,
    totalGrossIncome,
    withholdingTax,
    gpfMandatory,
    gpfVoluntary,
    coopShares,
    coopLoan,
    housingLoan,
    otherDeductions: 0,
    totalDeductions,
    netSalary,
    rawText,
  };
}

// Preset template matching the user's uploaded official MOPH pay slip (ต.ค. 2569)
export const PRESET_NITAT_SLIP: ScannedMophSlip = {
  transferDate: '2026-10-27',
  rawDateText: '27/10/2569',
  employeeName: 'นายนิทัศน์ ปัญจะโรทัย',
  organization: 'กลุ่มงานพัฒนายุทธศาสตร์สาธารณสุข สำนักงานสาธารณสุขจังหวัดนครนายก',
  bankName: 'ธนาคารกรุงไทย จำกัด(มหาชน) สาขา นครนายก',
  bankAccountNo: '2110023333',
  baseSalary: 48170.00,
  retroSalary: 8100.00,
  totalGrossIncome: 56270.00, // 48,170.00 + 8,100.00
  withholdingTax: 1462.35,
  gpfMandatory: 1688.10, // 3%
  gpfVoluntary: 5627.00, // 10%
  coopShares: 2000.00, // สหกรณ์ สสจ.นย.
  coopLoan: 0.00,
  housingLoan: 0.00,
  otherDeductions: 0.00,
  totalDeductions: 10777.45,
  netSalary: 45492.55,
  rawText: 'ใบรับรองการจ่ายเงินเดือนและเงินอื่น สำนักงานปลัดกระทรวงสาธารณสุข ต.ค. 2569',
};

// Client-side OCR Runner using Tesseract.js
export async function scanSlipWithOCR(
  imageSource: string | File,
  onProgress?: (progress: number, status: string) => void
): Promise<ScannedMophSlip> {
  const Tesseract = (await import('tesseract.js')).default;
  const result = await Tesseract.recognize(imageSource, 'tha+eng', {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100), 'กำลังประมวลผลตัวอักษร...');
      } else if (onProgress && m.status) {
        onProgress(10, 'กำลังโหลดโมเดล OCR...');
      }
    },
  });

  const parsed = parseMophSlipText(result.data.text);
  return parsed;
}
