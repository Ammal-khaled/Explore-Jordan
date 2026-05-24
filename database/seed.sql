-- Explore Jordan Supabase seed data
-- Generated from the current JSON files in /data.
-- The frontend still uses JSON as the active data source for now.

-- Categories
INSERT INTO categories (name, type)
VALUES
  ('Heritage', 'destination'),
  ('Desert', 'destination'),
  ('Nature', 'destination'),
  ('City', 'destination'),
  ('Coast', 'destination'),
  ('Nature Reserve', 'destination'),
  ('Adventure', 'activity'),
  ('Water', 'activity'),
  ('Scenic', 'activity'),
  ('Cultural', 'activity'),
  ('Wellness', 'activity'),
  ('History', 'activity'),
  ('Luxury Hotel', 'accommodation'),
  ('Eco Lodge', 'accommodation'),
  ('Desert Camp', 'accommodation'),
  ('Resort', 'accommodation'),
  ('Boutique Hotel', 'accommodation'),
  ('Beach Hotel', 'accommodation');

-- Destinations
INSERT INTO destinations (
  name,
  city,
  category,
  short_description,
  long_description,
  image,
  map_link,
  official_link,
  tags
)
VALUES
  ('Petra', 'Wadi Musa', 'Heritage', 'Petra is Jordan''s most famous archaeological site, known for monumental facades carved into rose-colored sandstone.', 'Enter Petra through the narrow Siq and arrive at the Treasury, one of the most recognizable landmarks in the region. The ancient Nabataean city rewards slow exploration, with tombs, temples, trails, viewpoints, and layers of Roman and local history.', 'assets/images/petra.jpg', 'https://www.google.com/maps/search/?api=1&query=Petra+Jordan', 'https://www.visitpetra.jo/en', ARRAY['UNESCO', 'archaeology', 'history', 'hiking']::text[]),
  ('Wadi Rum', 'Wadi Rum Village', 'Desert', 'Wadi Rum is a protected desert landscape of red sand, sandstone mountains, and wide-open skies.', 'Known as the Valley of the Moon, Wadi Rum is best experienced with local Bedouin guides who understand its routes, camps, and stories. Visitors can explore by jeep, camel, or on foot, then stay overnight for sunset, stargazing, and traditional hospitality.', 'assets/images/wadi-rum.jpg', 'https://www.google.com/maps/search/?api=1&query=Wadi+Rum+Jordan', 'https://wadirum.jo/', ARRAY['desert', 'bedouin', 'stargazing', 'adventure']::text[]),
  ('Dead Sea', 'Dead Sea Region', 'Nature', 'The Dead Sea is famous for mineral-rich water, dramatic views, and effortless floating at the lowest point on Earth.', 'The Jordanian side of the Dead Sea offers resort stays, spa treatments, and striking views across the water and surrounding cliffs. It is a relaxing stop between Amman, Madaba, Wadi Mujib, and southern Jordan.', 'assets/images/dead-sea.jpg', 'https://www.google.com/maps/search/?api=1&query=Dead+Sea+Jordan', 'https://jordan.gov.jo/EN/Pages/Dead_Sea', ARRAY['wellness', 'nature', 'floating', 'spa']::text[]),
  ('Amman', 'Amman', 'City', 'Amman blends ancient ruins, busy markets, modern cafes, galleries, and a strong food culture.', 'Jordan''s capital is a practical and rewarding base for a wider trip through the country. Visit the Citadel, Roman Theater, downtown souqs, local restaurants, and creative neighborhoods to see how ancient and modern Jordan meet.', 'assets/images/amman.jpg', 'https://www.google.com/maps/search/?api=1&query=Amman+Jordan', 'https://jordan.gov.jo/EN/Pages/Amman', ARRAY['capital', 'food', 'culture', 'history']::text[]),
  ('Aqaba', 'Aqaba', 'Coast', 'Aqaba is Jordan''s Red Sea gateway, with beaches, coral reefs, diving, and a relaxed coastal pace.', 'The city adds a warm seaside finish to desert and heritage itineraries. Travelers come for snorkeling, diving, boat trips, seafood, and easy access to Wadi Rum and southern Jordan.', 'assets/images/aqaba.jpg', 'https://www.google.com/maps/search/?api=1&query=Aqaba+Jordan', 'https://www.visitaqaba.com.jo/EN', ARRAY['red sea', 'diving', 'beach', 'snorkeling']::text[]),
  ('Jerash', 'Jerash', 'Heritage', 'Jerash is one of the region''s best-preserved Roman cities, with colonnaded streets, plazas, temples, and theaters.', 'The archaeological site is an easy day trip from Amman and a highlight for travelers interested in classical history. Its scale and preservation make it easy to imagine the rhythm of public life in the ancient city.', 'assets/images/jerash.jpg', 'https://www.google.com/maps/search/?api=1&query=Jerash+Archaeological+Site+Jordan', 'https://jordan.gov.jo/EN/Pages/Jerash', ARRAY['roman', 'archaeology', 'day trip', 'history']::text[]),
  ('Dana Biosphere Reserve', 'Dana', 'Nature Reserve', 'Dana Biosphere Reserve protects rugged valleys, mountain views, wildlife habitats, and quiet village landscapes.', 'Jordan''s largest nature reserve offers trails for different fitness levels, from scenic village walks to longer routes through dramatic terrain. It is a strong choice for hikers, nature lovers, and travelers who want a slower rural stay.', 'assets/images/dana-biosphere.jpg', 'https://www.google.com/maps/search/?api=1&query=Dana+Biosphere+Reserve+Jordan', 'https://www.rscn.org.jo/dana', ARRAY['nature reserve', 'hiking', 'wildlife', 'eco travel']::text[]),
  ('Madaba', 'Madaba', 'Heritage', 'Madaba is known for Byzantine and Umayyad mosaics, including the famous sixth-century map of the Holy Land.', 'The city''s churches, mosaic workshops, and calm streets make it a rewarding cultural stop southwest of Amman. Madaba also pairs well with Mount Nebo, the Dead Sea, and the King''s Highway.', 'assets/images/madaba.jpg', 'https://www.google.com/maps/search/?api=1&query=Madaba+Jordan', 'https://jordan.gov.jo/EN/Pages/Madaba', ARRAY['mosaics', 'churches', 'culture', 'day trip']::text[]),
  ('Ajloun Castle', 'Ajloun', 'Heritage', 'Ajloun Castle is a 12th-century hilltop fortress overlooking forests, olive groves, and the Jordan Valley.', 'Built for defense and regional control, the castle remains one of northern Jordan''s most atmospheric historic sites. Its towers, corridors, and viewpoints combine military history with some of the country''s greenest scenery.', 'assets/images/ajloun-castle.jpg', 'https://www.google.com/maps/search/?api=1&query=Ajloun+Castle+Jordan', 'https://en.visitjordan.com/', ARRAY['castle', 'history', 'northern jordan', 'views']::text[]),
  ('Wadi Mujib', 'Dead Sea Region', 'Nature Reserve', 'Wadi Mujib is a dramatic canyon near the Dead Sea, known for seasonal water trails and narrow sandstone cliffs.', 'The reserve is a memorable adventure stop for travelers who are comfortable with water, uneven terrain, and guided seasonal routes. Its canyon scenery, waterfalls, and proximity to the Dead Sea make it one of Jordan''s most distinctive nature experiences.', 'assets/images/wadi-mujib.jpg', 'https://www.google.com/maps/search/?api=1&query=Wadi+Mujib+Jordan', 'https://www.rscn.org.jo', ARRAY['canyoning', 'nature reserve', 'water trail', 'adventure']::text[]);

-- Activities
INSERT INTO activities (
  name,
  location,
  category,
  short_description,
  long_description,
  image,
  duration,
  price_range,
  map_link,
  tags
)
VALUES
  ('Hiking in Dana', 'Dana Biosphere Reserve', 'Adventure', 'Walk through Dana''s valleys, viewpoints, and village trails with routes suited to different experience levels.', 'Dana is one of Jordan''s best places for guided hiking, with landscapes that shift from limestone cliffs to sandstone valleys. Trails can be planned as gentle walks or longer full-day routes, depending on season, fitness, and guide availability.', 'assets/images/hiking-dana.jpg', '2 hours to full day', '$', 'https://www.google.com/maps/search/?api=1&query=Dana+Biosphere+Reserve+Jordan', ARRAY['hiking', 'nature', 'guided', 'eco travel']::text[]),
  ('Diving in Aqaba', 'Aqaba', 'Water', 'Explore Red Sea reefs, warm water, and accessible dive sites along Jordan''s short but rewarding coastline.', 'Aqaba is suitable for certified divers, beginners, and snorkelers, with coral gardens and underwater sites close to shore. Local operators offer guided dives, training sessions, and boat trips depending on weather and experience.', 'assets/images/diving-aqaba.jpg', 'Half day', '$$', 'https://www.google.com/maps/search/?api=1&query=Aqaba+Diving+Jordan', ARRAY['diving', 'snorkeling', 'red sea', 'marine life']::text[]),
  ('Hot Air Ballooning in Wadi Rum', 'Wadi Rum', 'Scenic', 'See Wadi Rum from above as desert cliffs, dunes, and camps catch the early morning light.', 'Hot air balloon flights are typically scheduled around sunrise and depend on wind and seasonal operating conditions. When available, the experience offers a quiet, panoramic view of one of Jordan''s most memorable landscapes.', 'assets/images/hot-air-balloon-wadi-rum.jpg', '2 to 3 hours including transfer', '$$$', 'https://www.google.com/maps/search/?api=1&query=Wadi+Rum+Jordan', ARRAY['scenic', 'sunrise', 'desert', 'photography']::text[]),
  ('Camel Trekking', 'Wadi Rum', 'Cultural', 'Travel slowly through desert routes with local guides and a traditional form of transport.', 'Camel trekking offers a quieter way to experience Wadi Rum''s open spaces, rock formations, and desert silence. Short rides are easy to combine with jeep tours, while longer routes require more planning and guide support.', 'assets/images/camel-trekking.jpg', '1 hour to half day', '$$', 'https://www.google.com/maps/search/?api=1&query=Wadi+Rum+camel+trekking', ARRAY['camel', 'bedouin', 'desert', 'slow travel']::text[]),
  ('Petra by Night', 'Petra', 'Cultural', 'Walk the candlelit Siq to the Treasury for an atmospheric evening experience at Petra.', 'Petra by Night is a separate evening program held on selected nights and should be checked in advance. It is best enjoyed as a reflective complement to a daytime visit, when the site''s scale and details are easier to explore.', 'assets/images/petra-by-night.jpg', 'About 2 hours', '$$', 'https://www.google.com/maps/search/?api=1&query=Petra+by+Night+Jordan', ARRAY['petra', 'evening', 'culture', 'photography']::text[]),
  ('Dead Sea Floating', 'Dead Sea Region', 'Wellness', 'Float in the mineral-rich Dead Sea and enjoy one of Jordan''s most relaxing natural experiences.', 'The high salinity makes floating effortless, while many resorts and public beach areas offer access to showers and spa facilities. Visitors should avoid shaving beforehand, protect cuts, and keep water away from the eyes.', 'assets/images/dead-sea-floating.jpg', '1 to 3 hours', '$$', 'https://www.google.com/maps/search/?api=1&query=Dead+Sea+Jordan', ARRAY['wellness', 'floating', 'spa', 'nature']::text[]),
  ('Jerash Ruins Tour', 'Jerash', 'History', 'Tour Jerash''s Roman streets, temples, theaters, and plazas with time to understand the city''s scale.', 'A guided visit helps bring the archaeological site to life, connecting the Oval Plaza, Cardo, theaters, gates, and temples into one coherent story. Jerash works well as a half-day trip from Amman or as part of a northern Jordan route.', 'assets/images/jerash.jpg', '2 to 4 hours', '$', 'https://www.google.com/maps/search/?api=1&query=Jerash+Archaeological+Site+Jordan', ARRAY['roman', 'history', 'guided tour', 'archaeology']::text[]),
  ('Wadi Rum Jeep Tour', 'Wadi Rum', 'Adventure', 'Cover Wadi Rum''s major desert viewpoints, rock bridges, dunes, and canyons with a local driver-guide.', 'Jeep tours are a practical way to see more of the protected area in limited time while learning from local guides. Routes often include scenic stops, short walks, tea breaks, sunset viewpoints, and transfer to desert camps.', 'assets/images/wadi-rum.jpg', '2 hours to full day', '$$', 'https://www.google.com/maps/search/?api=1&query=Wadi+Rum+Jeep+Tour', ARRAY['jeep tour', 'desert', 'bedouin', 'sunset']::text[]);

-- Accommodations
INSERT INTO accommodations (
  name,
  city,
  type,
  price_range,
  short_description,
  long_description,
  image,
  booking_link,
  tags
)
VALUES
  ('Luxury Stays', 'Amman, Petra, Dead Sea, and Aqaba', 'Luxury Hotel', '$$$', 'High-end hotels and resorts with polished service, strong locations, and comfortable amenities for longer itineraries.', 'Luxury stays in Jordan are strongest in Amman, Petra, the Dead Sea, and Aqaba, where travelers can pair sightseeing with full-service comfort. Expect refined rooms, restaurants, pools, concierge support, and easy access to major routes.', 'assets/images/petra.jpg', 'https://www.booking.com/searchresults.html?ss=Jordan', ARRAY['luxury', 'hotel', 'comfort', 'full service']::text[]),
  ('Eco Lodges', 'Dana and Nature Reserves', 'Eco Lodge', '$$', 'Nature-focused lodges that support slower travel, local communities, and access to hiking routes.', 'Eco lodges are ideal for travelers who want quiet landscapes, guided walks, and a lighter environmental footprint. Dana and nearby reserve areas offer some of the best settings for simple, memorable stays connected to nature.', 'assets/images/dana-biosphere.jpg', 'https://www.rscn.org.jo', ARRAY['eco travel', 'nature', 'hiking', 'local community']::text[]),
  ('Desert Camps', 'Wadi Rum', 'Desert Camp', '$$', 'Wadi Rum camps offer desert views, evening meals, stargazing, and easy access to guided tours.', 'Desert camps range from simple Bedouin-style tents to more comfortable dome and cabin experiences. The best stays focus on good guiding, respectful hosting, clear transfers, and time to enjoy sunset and the night sky.', 'assets/images/wadi-rum-camp.jpg', 'https://www.booking.com/searchresults.html?ss=Wadi+Rum%2C+Jordan', ARRAY['desert', 'wadi rum', 'stargazing', 'bedouin']::text[]),
  ('Dead Sea Resorts', 'Dead Sea Region', 'Resort', '$$$', 'Resort stays along the Dead Sea combine floating access, spa treatments, pools, and sunset views.', 'Dead Sea resorts work well as a restorative stop between cultural touring and outdoor adventure. Many properties offer beach access, mud treatments, restaurants, and comfortable spaces for travelers who want a slower day.', 'assets/images/dead-sea.jpg', 'https://www.booking.com/searchresults.html?ss=Dead+Sea%2C+Jordan', ARRAY['resort', 'wellness', 'spa', 'dead sea']::text[]),
  ('Boutique Hotels in Amman', 'Amman', 'Boutique Hotel', '$$', 'Small and stylish Amman hotels place travelers close to cafes, galleries, restaurants, and historic neighborhoods.', 'Boutique hotels are a good fit for visitors who want a more personal base in the capital. Look for locations near Jabal Amman, Rainbow Street, downtown, or Abdali depending on whether the priority is food, culture, business, or nightlife.', 'assets/images/amman-boutique-hotel.jpg', 'https://www.booking.com/searchresults.html?ss=Amman%2C+Jordan', ARRAY['boutique', 'city', 'amman', 'restaurants']::text[]),
  ('Aqaba Beach Hotels', 'Aqaba', 'Beach Hotel', '$$', 'Aqaba beach hotels offer Red Sea access, warm weather, and an easy base for diving or snorkeling.', 'Aqaba is a natural place to unwind after Petra and Wadi Rum, especially for travelers who want a few days by the water. Hotels range from practical city stays to beach resorts with pools, dive centers, and boat-trip access.', 'assets/images/aqaba.jpg', 'https://www.booking.com/searchresults.html?ss=Aqaba%2C+Jordan', ARRAY['beach', 'aqaba', 'red sea', 'diving']::text[]);
