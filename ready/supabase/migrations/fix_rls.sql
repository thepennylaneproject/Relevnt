DROP POLICY IF EXISTS "Users can insert their own profile" ON ready_profiles; CREATE POLICY "Users can insert their own profile" ON ready_profiles FOR INSERT WITH CHECK (auth.uid() = id);
