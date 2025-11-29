-- Vendors table
CREATE TABLE vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  payment_method TEXT DEFAULT 'card' CHECK (payment_method IN ('card', 'cash', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendors
-- Allow public read access (needed for share links)
CREATE POLICY "Allow public read vendors" ON vendors
  FOR SELECT USING (true);

-- Allow public insert/update/delete (for admin operations)
CREATE POLICY "Allow public insert vendors" ON vendors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update vendors" ON vendors
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete vendors" ON vendors
  FOR DELETE USING (true);

-- RLS Policies for transactions
-- Allow public read access
CREATE POLICY "Allow public read transactions" ON transactions
  FOR SELECT USING (true);

-- Allow public insert/update/delete
CREATE POLICY "Allow public insert transactions" ON transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update transactions" ON transactions
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete transactions" ON transactions
  FOR DELETE USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE vendors;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- Payment requests table (for vendor-initiated payment requests)
CREATE TABLE payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payer_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  processed_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for payment_requests
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_requests
CREATE POLICY "Allow public read payment_requests" ON payment_requests
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert payment_requests" ON payment_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update payment_requests" ON payment_requests
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete payment_requests" ON payment_requests
  FOR DELETE USING (true);

-- Enable realtime for payment_requests
ALTER PUBLICATION supabase_realtime ADD TABLE payment_requests;

-- Create indexes for better performance
CREATE INDEX idx_transactions_vendor_id ON transactions(vendor_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_vendors_share_token ON vendors(share_token);
CREATE INDEX idx_payment_requests_vendor_id ON payment_requests(vendor_id);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_payment_requests_created_at ON payment_requests(created_at DESC);
