-- ========================================================
-- GovWealth Planner Web — Supabase PostgreSQL Schema
-- ระบบบริหารความมั่งคั่งและภาษีข้าราชการไทย (พ.ศ. ๒๕๖๙)
-- ========================================================

-- เปิดใช้งาน UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ตาราง Profiles: บันทึกข้อมูลส่วนตัว ข้าราชการ เงินเดือน และสัดส่วนพอร์ตเป้าหมาย
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  organization TEXT DEFAULT 'สำนักงานสาธารณสุขจังหวัดนครนายก',
  rank TEXT DEFAULT 'นักวิชาการสาธารณสุขชำนาญการ',
  current_monthly_salary NUMERIC DEFAULT 0,
  gpf_rate_percent NUMERIC DEFAULT 3.0,
  target_cash_percent NUMERIC DEFAULT 10.0,
  target_thai_fund_percent NUMERIC DEFAULT 20.0,
  target_foreign_fund_percent NUMERIC DEFAULT 20.0,
  target_thai_stock_percent NUMERIC DEFAULT 20.0,
  target_foreign_stock_percent NUMERIC DEFAULT 20.0,
  target_forex_percent NUMERIC DEFAULT 10.0,
  usd_to_thb_rate NUMERIC DEFAULT 36.5,
  is_onboarded BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ตาราง Assets: สินทรัพย์ 6 หมวด
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- '1. เงินสดและเทียบเท่า', '2. กองทุนรวมไทย', '3. กองทุนรวมต่างประเทศ', '4. หุ้นไทย', '5. หุ้นต่างประเทศ', '6. พอร์ต FOREX และอื่นๆ'
  institution TEXT DEFAULT '',
  amount_thb NUMERIC DEFAULT 0,
  amount_usd NUMERIC DEFAULT 0,
  is_usd BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ตาราง Liabilities: หนี้สินคงค้าง
CREATE TABLE IF NOT EXISTS liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lender TEXT DEFAULT '',
  total_outstanding NUMERIC DEFAULT 0,
  monthly_installment NUMERIC DEFAULT 0,
  remaining_months INT DEFAULT 0,
  paid_this_month NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ตาราง Categories: หมวดหมู่รายรับ / รายจ่าย
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'INCOME' หรือ 'EXPENSE'
  default_amount NUMERIC DEFAULT 0,
  revenue_category TEXT, -- 40(1) - 40(8) หรือ ยกเว้นภาษี
  tax_deduction_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ตาราง Journal Entries: บันทึกสมุดรายวัน (Double-Entry)
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL, -- 'รับเงิน (รายได้)', 'จ่ายเงิน (ค่าใช้จ่าย)', 'โอนเงิน'
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  debit_account_name TEXT DEFAULT '',
  credit_account_name TEXT DEFAULT '',
  revenue_category TEXT DEFAULT '',
  tax_deduction_tag TEXT,
  gross_dividend_amount NUMERIC DEFAULT 0,
  withholding_tax_amount NUMERIC DEFAULT 0,
  dividend_tax_credit_amount NUMERIC DEFAULT 0,
  corporate_tax_rate_percent NUMERIC DEFAULT 20,
  stock_symbol TEXT DEFAULT '',
  destination_asset_id TEXT,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ตาราง Tax Items: รายการลดหย่อนภาษี และ กบข.
CREATE TABLE IF NOT EXISTS tax_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  deduction_type TEXT NOT NULL, -- 'กบข.', 'RMF', 'ThaiESG', 'ประกันชีวิต' ฯลฯ
  fund_code TEXT DEFAULT '',
  amount NUMERIC NOT NULL,
  asset_class_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. ตาราง Historical Records: สถิติรายปี
CREATE TABLE IF NOT EXISTS historical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buddhist_year INT NOT NULL,
  net_worth NUMERIC DEFAULT 0,
  total_assets NUMERIC DEFAULT 0,
  total_liabilities NUMERIC DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  net_cash_flow NUMERIC DEFAULT 0,
  net_savings_rate_percent NUMERIC DEFAULT 0,
  roa_percent NUMERIC DEFAULT 0,
  roe_percent NUMERIC DEFAULT 0,
  de_ratio NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================================
-- Row Level Security (RLS) เพื่อรักษาความปลอดภัยข้อมูลแยกตาม User
-- ========================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_records ENABLE ROW LEVEL SECURITY;

-- นโยบาย RLS สำหรับ profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- นโยบาย RLS สำหรับ assets
CREATE POLICY "Users can view own assets" ON assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON assets FOR DELETE USING (auth.uid() = user_id);

-- นโยบาย RLS สำหรับ liabilities
CREATE POLICY "Users can view own liabilities" ON liabilities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own liabilities" ON liabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own liabilities" ON liabilities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own liabilities" ON liabilities FOR DELETE USING (auth.uid() = user_id);

-- นโยบาย RLS สำหรับ categories
CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- นโยบาย RLS สำหรับ journal_entries
CREATE POLICY "Users can view own journal_entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal_entries" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal_entries" ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal_entries" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

-- นโยบาย RLS สำหรับ tax_items
CREATE POLICY "Users can view own tax_items" ON tax_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tax_items" ON tax_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tax_items" ON tax_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tax_items" ON tax_items FOR DELETE USING (auth.uid() = user_id);

-- นโยบาย RLS สำหรับ historical_records
CREATE POLICY "Users can view own historical_records" ON historical_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own historical_records" ON historical_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own historical_records" ON historical_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own historical_records" ON historical_records FOR DELETE USING (auth.uid() = user_id);
