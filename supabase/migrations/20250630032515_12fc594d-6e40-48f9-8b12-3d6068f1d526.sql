
-- Insert the dairy units (using INSERT ... ON CONFLICT to avoid duplicates)
INSERT INTO public.dairy_units (name, code, description) VALUES
('Wayanad Dairy', 'WYD', 'Wayanad Dairy Unit'),
('Malappuram Dairy', 'MLP', 'Malappuram Dairy Unit'),
('Kannur Dairy', 'KNR', 'Kannur Dairy Unit'),
('Kozhikode Dairy', 'KZD', 'Kozhikode Dairy Unit'),
('Palakkad Dairy', 'PKD', 'Palakkad Dairy Unit'),
('Kasaragod Dairy', 'KSD', 'Kasaragod Dairy Unit')
ON CONFLICT (name) DO NOTHING;
