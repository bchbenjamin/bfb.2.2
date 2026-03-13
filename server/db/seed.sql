-- BengaluruDuru Seed Data
-- Realistic Bengaluru grievances for development/demo

-- Test Users (3 roles)
INSERT INTO users (id, aadhaar_id, name, email, phone, role, language_pref, ward) VALUES
  ('a0000000-0000-0000-0000-000000000001', '123456789012', 'Ramesh Kumar', 'ramesh@example.com', '9876543210', 'citizen', 'en', 'Koramangala'),
  ('a0000000-0000-0000-0000-000000000002', '234567890123', 'Priya Nair', 'priya@example.com', '9876543211', 'officer', 'kn', 'Jayanagar'),
  ('a0000000-0000-0000-0000-000000000003', '345678901234', 'Suresh Reddy', 'suresh@example.com', '9876543212', 'admin', 'en', 'Malleshwaram')
ON CONFLICT (aadhaar_id) DO NOTHING;

-- Sample Grievances across Bengaluru wards
INSERT INTO grievances (user_id, title, raw_description, ai_category, ai_subcategory, ai_priority, ai_detected_location, latitude, longitude, status, impact_count, ward) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Large pothole on 100ft Road', 'There is a massive pothole near the 100ft Road signal in Indiranagar. Two-wheelers are skidding daily. Very dangerous especially at night.', 'Roads & Footpaths', 'Pothole', 4, '100ft Road, Indiranagar', 12.9784, 77.6408, 'open', 23, 'Indiranagar'),
  ('a0000000-0000-0000-0000-000000000001', 'Overflowing drain near Metro station', 'The drain near Indiranagar Metro station has been overflowing since 2 hours. Dirty water is flooding the footpath. People are walking on the road.', 'Sewage & Drainage', 'Blocked Drain', 4, 'Indiranagar Metro Station', 12.9783, 77.6409, 'assigned', 15, 'Indiranagar'),
  ('a0000000-0000-0000-0000-000000000001', 'Streetlight not working on 80ft Road', 'Three streetlights are not working on 80ft Road, near the Koramangala bus stop. The stretch is completely dark at night.', 'Street Lighting', 'Non-functional Light', 3, '80ft Road, Koramangala', 12.9352, 77.6245, 'open', 8, 'Koramangala'),
  ('a0000000-0000-0000-0000-000000000001', 'Garbage dump on footpath', 'Large pile of garbage dumped on the footpath near Jayanagar 4th Block shopping complex. It has been there for 3 days. Very bad smell.', 'Garbage & Waste', 'Illegal Dumping', 3, 'Jayanagar 4th Block', 12.9259, 77.5835, 'in_progress', 31, 'Jayanagar'),
  ('a0000000-0000-0000-0000-000000000001', 'No water supply since morning', 'No water supply in our area since 6 AM. This is the third time this week. BWSSB has not given any notice.', 'Water Supply', 'No Supply', 4, 'Malleshwaram 18th Cross', 13.0035, 77.5648, 'open', 45, 'Malleshwaram'),
  ('a0000000-0000-0000-0000-000000000001', 'Broken footpath tiles near park', 'The footpath tiles near Cubbon Park entrance are broken and uneven. Senior citizens are finding it difficult to walk.', 'Roads & Footpaths', 'Broken Footpath', 2, 'Cubbon Park Entrance', 12.9763, 77.5929, 'open', 12, 'Shivajinagar'),
  ('a0000000-0000-0000-0000-000000000001', 'Illegal construction blocking road', 'A shop owner has extended their construction onto the road near Chickpete. Half the road is blocked. Traffic is terrible.', 'Encroachment', 'Road Encroachment', 3, 'Chickpete Main Road', 12.9672, 77.5768, 'assigned', 19, 'Chickpete'),
  ('a0000000-0000-0000-0000-000000000001', 'Loud music from marriage hall', 'Marriage hall on Bannerghatta Road is playing extremely loud music past midnight. This has been going on for 3 days. Cannot sleep.', 'Noise Pollution', 'Commercial Noise', 2, 'Bannerghatta Road', 12.8916, 77.5969, 'open', 7, 'JP Nagar'),
  ('a0000000-0000-0000-0000-000000000001', 'Traffic signal not working', 'The traffic signal at Silk Board junction is not working since yesterday. There is no traffic police either. Complete chaos.', 'Traffic & Signals', 'Signal Malfunction', 5, 'Silk Board Junction', 12.9177, 77.6233, 'open', 67, 'BTM Layout'),
  ('a0000000-0000-0000-0000-000000000001', 'Park playground damaged', 'The playground equipment in Lalbagh botanical garden\'s children area is broken. Swings are rusty and dangerous for children.', 'Parks & Open Spaces', 'Damaged Equipment', 3, 'Lalbagh Botanical Garden', 12.9507, 77.5848, 'open', 14, 'Basavanagudi'),
  ('a0000000-0000-0000-0000-000000000001', 'Bus stop shelter collapsed', 'The BMTC bus stop shelter near Whitefield railway station has partially collapsed. It is dangerous for people waiting.', 'Public Transport (BMTC/Metro)', 'Damaged Infrastructure', 4, 'Whitefield Railway Station', 12.9698, 77.7500, 'open', 22, 'Whitefield'),
  ('a0000000-0000-0000-0000-000000000001', 'Sewage leak on main road', 'There is a major sewage leak on the main road near Yelahanka New Town post office. The entire road smells terrible. Health hazard.', 'Sewage & Drainage', 'Sewage Leak', 4, 'Yelahanka New Town', 13.1007, 77.5963, 'open', 28, 'Yelahanka'),
  ('a0000000-0000-0000-0000-000000000001', 'Illegal building exceeding floor limit', 'A new building coming up on 5th Main, HSR Layout is clearly exceeding the sanctioned floor limit. No BBMP signage visible.', 'Building Violations', 'Excess Construction', 2, 'HSR Layout 5th Main', 12.9116, 77.6389, 'open', 5, 'HSR Layout'),
  ('a0000000-0000-0000-0000-000000000001', 'Water pipeline burst', 'Main water pipeline has burst near Rajajinagar 2nd Block. Water is flooding the road. Huge wastage happening.', 'Water Supply', 'Pipeline Burst', 5, 'Rajajinagar 2nd Block', 12.9907, 77.5553, 'open', 38, 'Rajajinagar'),
  ('a0000000-0000-0000-0000-000000000001', 'Road completely waterlogged', 'The road near Majestic bus station underpass is completely waterlogged after last night rain. Vehicles cannot pass. Some are stuck.', 'Roads & Footpaths', 'Waterlogging', 4, 'Majestic Bus Station', 12.9767, 77.5713, 'open', 52, 'Majestic')
ON CONFLICT DO NOTHING;

-- Sample upvotes
INSERT INTO upvotes (grievance_id, user_id)
SELECT g.id, 'a0000000-0000-0000-0000-000000000002'
FROM grievances g LIMIT 5
ON CONFLICT DO NOTHING;
