// Smart Thai Bank Transfer Slip Scanner & Parser (KBank, Krungthai, SCB, PromptPay)

export type SlipTransactionCategory = 'SELF_TRANSFER' | 'EXPENSE' | 'CREDIT_CARD_PAYMENT';

export interface ScannedBankSlip {
  transferDate: string; // YYYY-MM-DD
  rawDateText?: string;
  transferTime?: string; // HH:mm
  amount: number;
  fee: number;
  senderName: string;
  senderBank: string;
  senderAccountNo: string;
  recipientName: string;
  recipientBankOrPromptPay: string;
  recipientAccountNo: string;
  memo: string; // บันทึกช่วยจำ e.g. "ค่าข้าว", "ค่ากาแฟ"
  referenceNo: string;
  isSelfTransfer: boolean;
  isCreditCardPayment: boolean;
  suggestedType: SlipTransactionCategory;
  suggestedCategoryName: string; // e.g. "ค่าอาหารและเครื่องดื่ม"
  rawText: string;
}

const THAI_MONTH_MAP: Record<string, string> = {
  'ม.ค.': '01', 'มกราคม': '01',
  'ก.พ.': '02', 'กุมภาพันธ์': '02',
  'มี.ค.': '03', 'มีนาคม': '03',
  'เม.ย.': '04', 'เมษายน': '04',
  'พ.ค.': '05', 'พฤษภาคม': '05',
  'มิ.ย.': '06', 'มิถุนายน': '06',
  'ก.ค.': '07', 'กรกฎาคม': '07',
  'ส.ค.': '08', 'สิงหาคม': '08',
  'ก.ย.': '09', 'กันยายน': '09',
  'ต.ค.': '10', 'ตุลาคม': '10',
  'พ.ย.': '11', 'พฤศจิกายน': '11',
  'ธ.ค.': '12', 'ธันวาคม': '12',
};

function extractAmount(text: string, regex: RegExp): number {
  const match = text.match(regex);
  if (!match) return 0;
  const valStr = match[1] || match[2] || '';
  const cleaned = valStr.replace(/,/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function parseBankSlipText(rawText: string): ScannedBankSlip {
  const text = rawText.replace(/\r\n/g, '\n');

  // 1. Amount (จำนวนเงิน)
  let amount = extractAmount(text, /(?:จำนวน|จำนวนเงิน|ยอดโอน)[^\d\n]*([0-9,]+\.[0-9]{2})/);
  if (amount === 0) {
    amount = extractAmount(text, /([0-9,]+\.[0-9]{2})\s*บาท/);
  }

  // 2. Fee (ค่าธรรมเนียม)
  const fee = extractAmount(text, /ค่าธรรมเนียม[^\d\n]*([0-9,]+\.[0-9]{2})/);

  // 3. Date & Time
  let transferDate = new Date().toISOString().slice(0, 10);
  let rawDateText = '';
  let transferTime = '';

  // Match e.g. "9 พ.ย. 69 10:46" or "09 พ.ย. 2569 - 10:45"
  const dateMatch = text.match(/([0-9]{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s*([0-9]{2,4})(?:[^\d\n]*([0-9]{1,2}[:.][0-9]{2}))?/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const monthStr = dateMatch[2];
    const month = THAI_MONTH_MAP[monthStr] || '11';
    let year = parseInt(dateMatch[3]);
    if (year < 100) {
      year += 2500; // 69 -> 2569
    }
    rawDateText = `${day} ${monthStr} ${year}`;
    if (year > 2500) {
      year -= 543; // Convert Buddhist Year to CE for ISO
    }
    transferDate = `${year}-${month}-${day}`;
    if (dateMatch[4]) {
      transferTime = dateMatch[4].replace('.', ':');
    }
  }

  // 4. Memo (บันทึกช่วยจำ)
  const memoMatch = text.match(/บันทึกช่วยจำ\s*[:\s]*([^\n]+)/);
  const memo = memoMatch ? memoMatch[1].trim() : '';

  // 5. Reference No
  const refMatch = text.match(/(?:เลขที่รายการ|รหัสอ้างอิง|เลขที่อ้างอิง)\s*[:\s]*([A-Za-z0-9]+)/);
  const referenceNo = refMatch ? refMatch[1].trim() : '';

  // 6. Sender & Recipient names & banks
  let senderName = '';
  let senderBank = '';
  let senderAccountNo = '';
  let recipientName = '';
  let recipientBankOrPromptPay = '';
  let recipientAccountNo = '';

  // Pattern A: Krungthai NEXT format ("จาก ... ไปยัง ...")
  const fromToMatch = text.match(/จาก\s*\n([^\n]+)\n([^\n]+)(?:\n([^\n]+))?[\s\S]*?ไปยัง\s*\n([^\n]+)\n([^\n]+)(?:\n([^\n]+))?/);
  if (fromToMatch) {
    senderName = fromToMatch[1].trim();
    senderBank = fromToMatch[2].trim();
    senderAccountNo = fromToMatch[3] ? fromToMatch[3].trim() : '';
    recipientName = fromToMatch[4].trim();
    recipientBankOrPromptPay = fromToMatch[5].trim();
    recipientAccountNo = fromToMatch[6] ? fromToMatch[6].trim() : '';
  } else {
    // Pattern B: KBank K+ format
    // Look for names containing นาย/นาง/นางสาว/บริษัท
    const names = text.match(/(?:นาย|นางสาว|นาง|บจก\.|บริษัท)\s*[^\n\d]+/g);
    if (names && names.length >= 2) {
      senderName = names[0].trim();
      recipientName = names[1].trim();
    } else if (names && names.length === 1) {
      senderName = names[0].trim();
    }

    if (text.includes('กสิกรไทย')) senderBank = 'ธนาคารกสิกรไทย';
    if (text.includes('กรุงไทย')) recipientBankOrPromptPay = 'ธนาคารกรุงไทย';
    if (text.includes('พร้อมเพย์')) recipientBankOrPromptPay = 'พร้อมเพย์';
  }

  // Fallback defaults for missing names if "นิทัศน์" appears in text
  if (!senderName && text.includes('นิทัศน์')) {
    senderName = 'นายนิทัศน์ ปัญจะโรทัย';
  }
  if (!recipientName && text.includes('นิทัศน์')) {
    recipientName = 'นายนิทัศน์ ปัญจะโรทัย';
  }

  // 7. Intelligence: Self-Transfer vs Credit Card vs Expense
  const normalizedSender = senderName.replace(/\s+/g, '');
  const normalizedRecipient = recipientName.replace(/\s+/g, '');
  const lowerMemo = memo.toLowerCase();

  const isCreditCardPayment =
    lowerMemo.includes('บัตร') ||
    lowerMemo.includes('credit') ||
    lowerMemo.includes('card') ||
    lowerMemo.includes('ktc') ||
    lowerMemo.includes('cardx') ||
    recipientName.includes('บัตร') ||
    recipientName.toLowerCase().includes('card');

  // Both sender and receiver contain "นิทัศน์"
  const isSelfTransfer =
    !isCreditCardPayment &&
    ((normalizedSender.includes('นิทัศน์') && normalizedRecipient.includes('นิทัศน์')) ||
      (normalizedSender.length > 3 && normalizedRecipient.includes(normalizedSender)));

  let suggestedType: SlipTransactionCategory = 'EXPENSE';
  let suggestedCategoryName = 'ค่าใช้จ่ายทั่วไป';

  if (isCreditCardPayment) {
    suggestedType = 'CREDIT_CARD_PAYMENT';
    suggestedCategoryName = 'ชำระหนี้บัตรเครดิต';
  } else if (isSelfTransfer) {
    suggestedType = 'SELF_TRANSFER';
    suggestedCategoryName = 'โอนย้ายเงินระหว่างบัญชีตนเอง';
  } else {
    suggestedType = 'EXPENSE';
    if (/ข้าว|อาหาร|กาแฟ|ชา|กิน|ขนม|lunch|dinner|cafe|food/i.test(memo)) {
      suggestedCategoryName = 'ค่าอาหารและเครื่องดื่ม';
    } else if (/น้ำมัน|เดินทาง|bts|mrt|ค่ารถ|ทางด่วน/i.test(memo)) {
      suggestedCategoryName = 'ค่าเดินทางและยานพาหนะ';
    } else if (/ของใช้|ช้อป|เซเว่น|7-eleven|โลตัส|บิ๊กซี/i.test(memo)) {
      suggestedCategoryName = 'ของใช้ในบ้าน/ส่วนตัว';
    } else if (/น้ำ|ไฟ|เน็ต|โทรศัพท์|บิล/i.test(memo)) {
      suggestedCategoryName = 'สาธารณูปโภค/ค่าใช้จ่ายประจำ';
    }
  }

  return {
    transferDate,
    rawDateText,
    transferTime,
    amount,
    fee,
    senderName: senderName || 'นายนิทัศน์ ปัญจะโรทัย',
    senderBank: senderBank || (text.includes('กสิกร') ? 'ธ.กสิกรไทย' : 'ธ.กรุงไทย'),
    senderAccountNo,
    recipientName: recipientName || 'นายนิทัศน์ ปัญจะโรทัย',
    recipientBankOrPromptPay: recipientBankOrPromptPay || (text.includes('พร้อมเพย์') ? 'พร้อมเพย์' : 'ธ.กรุงไทย'),
    recipientAccountNo,
    memo,
    referenceNo,
    isSelfTransfer,
    isCreditCardPayment,
    suggestedType,
    suggestedCategoryName,
    rawText,
  };
}

// Preset samples matching user's actual uploaded slips for 1-click test
export const PRESET_KBANK_SLIP: ScannedBankSlip = {
  transferDate: '2026-11-09',
  rawDateText: '9 พ.ย. 2569',
  transferTime: '10:46',
  amount: 20.00,
  fee: 0.00,
  senderName: 'นาย นิทัศน์ ป',
  senderBank: 'ธ.กสิกรไทย',
  senderAccountNo: 'xxx-x-x3811-x',
  recipientName: 'นายนิทัศน์ ปัญจะโรทัย',
  recipientBankOrPromptPay: 'ธ.กรุงไทย',
  recipientAccountNo: 'xxx-x-x2333-x',
  memo: 'ค่าข้าว',
  referenceNo: '016313104636COR09678',
  isSelfTransfer: true,
  isCreditCardPayment: false,
  suggestedType: 'SELF_TRANSFER',
  suggestedCategoryName: 'โอนย้ายเงินระหว่างบัญชีตนเอง',
  rawText: 'สลิป KBank โอนเงินสำเร็จ 20.00 บาท (ค่าข้าว)',
};

export const PRESET_KTB_SLIP: ScannedBankSlip = {
  transferDate: '2026-11-09',
  rawDateText: '09 พ.ย. 2569',
  transferTime: '10:45',
  amount: 20.00,
  fee: 0.00,
  senderName: 'นายนิทัศน์ ป***',
  senderBank: 'กรุงไทย',
  senderAccountNo: 'XXX-X-XX333-3',
  recipientName: 'นาย นิทัศน์ ปัญจะโรทัย',
  recipientBankOrPromptPay: 'พร้อมเพย์',
  recipientAccountNo: 'XXX XXX 0613',
  memo: 'ค่ากาแฟ',
  referenceNo: 'Ae4b616370ec745e6',
  isSelfTransfer: true,
  isCreditCardPayment: false,
  suggestedType: 'SELF_TRANSFER',
  suggestedCategoryName: 'โอนย้ายเงินระหว่างบัญชีตนเอง',
  rawText: 'สลิป Krungthai NEXT โอนเงินสำเร็จ 20.00 บาท (ค่ากาแฟ)',
};

// Client-side OCR Runner using Tesseract.js
export async function scanBankSlipWithOCR(
  imageSource: string | File,
  onProgress?: (progress: number, status: string) => void
): Promise<ScannedBankSlip> {
  const Tesseract = (await import('tesseract.js')).default;
  const result = await Tesseract.recognize(imageSource, 'tha+eng', {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100), 'กำลังอ่านข้อมูลสลิปโอนเงิน...');
      } else if (onProgress && m.status) {
        onProgress(15, 'กำลังเตรียมโมเดลวิเคราะห์ภาพ...');
      }
    },
  });

  const parsed = parseBankSlipText(result.data.text);
  return parsed;
}
