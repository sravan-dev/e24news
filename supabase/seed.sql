insert into public.articles (slug, title, excerpt, content, image, category, author, tags, featured, trending, views, published_at, updated_at)
select s.slug, s.title, e.excerpt,
  e.excerpt || E'

' ||
  'Officials said the details would be shared in the coming days. Local residents and community leaders welcomed the move, while others raised questions about the timeline and the cost involved. A detailed statement is expected later this week.' || E'

' ||
  'This is placeholder text for the ' || replace(s.category, '-', ' ') || ' section. Replace it from the admin panel with the real story, quotes and context. Paragraphs are separated by a blank line, and each one is shown as its own block on the article page.' || E'

' ||
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Cras mattis consectetur purus sit amet fermentum. Donec ullamcorper nulla non metus auctor fringilla.' || E'

' ||
  'E24 News will continue to follow the story and update this report as more information becomes available.',
  'https://picsum.photos/seed/' || left(s.slug, 30) || '/1200/800',
  s.category, s.author, array[s.category], s.featured, s.trending, s.views, s.published_at::timestamptz, s.published_at::timestamptz
from (values
('Super League Kerala: Thiruvananthapuram Kombans take on Thrissur Magic FC tonight','super-league-kerala-thiruvananthapuram-kombans-take-on-thrissur-magic-fc-tonight','kerala','E24 Desk',true,true,50,'2026-10-23T04:30:00.000Z'),
('WMF Qatar National Council''s Spotlight ''26 dance festival draws record crowd','wmf-qatar-national-council-s-spotlight-26-dance-festival-draws-record-crowd','qatar','Staff Reporter',true,true,769,'2026-10-22T19:30:00.000Z'),
('Riyadh services suspended until October 15, airline confirms','riyadh-services-suspended-until-october-15-airline-confirms','gulf','Anjali Menon',true,true,588,'2026-10-22T10:30:00.000Z'),
('''Jailer 2'' box office run continues into second week','jailer-2-box-office-run-continues-into-second-week','india','Rahul Nair',true,true,407,'2026-10-22T01:30:00.000Z'),
('Angamaly native donates a bus to KSRTC as a gift to his hometown','angamaly-native-donates-a-bus-to-ksrtc-as-a-gift-to-his-hometown','grama-vartha','Fathima Basheer',true,true,226,'2026-10-21T16:30:00.000Z'),
('The quiet libraries of Malabar and the readers who keep them alive','the-quiet-libraries-of-malabar-and-the-readers-who-keep-them-alive','writers-corner','E24 Desk',false,true,945,'2026-10-21T07:30:00.000Z'),
('Green card rules: TCS says changes are not part of its hiring strategy','green-card-rules-tcs-says-changes-are-not-part-of-its-hiring-strategy','tech','Staff Reporter',false,false,764,'2026-10-20T22:30:00.000Z'),
('Bollywood actor''s car shot at outside Mumbai home','bollywood-actor-s-car-shot-at-outside-mumbai-home','movies','Anjali Menon',false,false,583,'2026-10-20T13:30:00.000Z'),
('US immigration curbs not targeted at India, says Marco Rubio','us-immigration-curbs-not-targeted-at-india-says-marco-rubio','world','Rahul Nair',false,false,402,'2026-10-20T04:30:00.000Z'),
('Kerala Blasters sign new striker ahead of ISL season','kerala-blasters-sign-new-striker-ahead-of-isl-season','sports','Fathima Basheer',false,false,221,'2026-10-19T19:30:00.000Z'),
('Cover story: the new face of Kerala tourism','cover-story-the-new-face-of-kerala-tourism','magazines','E24 Desk',false,false,940,'2026-10-19T10:30:00.000Z'),
('Thiruvalla YMCA Vikas School unveils new development projects','thiruvalla-ymca-vikas-school-unveils-new-development-projects','kerala','Staff Reporter',false,false,759,'2026-10-19T01:30:00.000Z'),
('French President Emmanuel Macron arrives in Doha for two-day visit','french-president-emmanuel-macron-arrives-in-doha-for-two-day-visit','qatar','Anjali Menon',false,false,578,'2026-10-18T16:30:00.000Z'),
('King Khalid International Airport opens new terminal wing','king-khalid-international-airport-opens-new-terminal-wing','gulf','Rahul Nair',false,false,397,'2026-10-18T07:30:00.000Z'),
('Opposition leader''s foreign trip sparks political row','opposition-leader-s-foreign-trip-sparks-political-row','india','Fathima Basheer',false,false,216,'2026-10-17T22:30:00.000Z'),
('Escaped prisoner recaptured within an hour after police spot him','escaped-prisoner-recaptured-within-an-hour-after-police-spot-him','grama-vartha','E24 Desk',false,false,935,'2026-10-17T13:30:00.000Z'),
('Letters home: a Gulf migrant''s notebook from 1987','letters-home-a-gulf-migrant-s-notebook-from-1987','writers-corner','Staff Reporter',false,false,754,'2026-10-17T04:30:00.000Z'),
('Indian robotics, agritech and medtech startups draw global investors','indian-robotics-agritech-and-medtech-startups-draw-global-investors','tech','Anjali Menon',false,false,573,'2026-10-16T19:30:00.000Z'),
('Veteran actor Nana Patekar dies at 75','veteran-actor-nana-patekar-dies-at-75','movies','Rahul Nair',false,false,392,'2026-10-16T10:30:00.000Z'),
('Navanethem Pillay honoured for lifetime of peace work','navanethem-pillay-honoured-for-lifetime-of-peace-work','world','Fathima Basheer',false,false,211,'2026-10-16T01:30:00.000Z'),
('India clinch T20 series with a game to spare','india-clinch-t20-series-with-a-game-to-spare','sports','E24 Desk',false,false,930,'2026-10-15T16:30:00.000Z'),
('In conversation with a 90-year-old Kathakali maestro','in-conversation-with-a-90-year-old-kathakali-maestro','magazines','Staff Reporter',false,false,749,'2026-10-15T07:30:00.000Z'),
('Families of Malayalis killed in Germany fire seek help to bring bodies home','families-of-malayalis-killed-in-germany-fire-seek-help-to-bring-bodies-home','kerala','Anjali Menon',false,false,568,'2026-10-14T22:30:00.000Z'),
('Qatar Airways adds more flights to Riyadh and Dammam','qatar-airways-adds-more-flights-to-riyadh-and-dammam','qatar','Rahul Nair',false,false,387,'2026-10-14T13:30:00.000Z'),
('Flights to Kochi rescheduled after airspace disruption','flights-to-kochi-rescheduled-after-airspace-disruption','gulf','Fathima Basheer',false,false,206,'2026-10-14T04:30:00.000Z'),
('ISRO prepares for next lunar mission launch window','isro-prepares-for-next-lunar-mission-launch-window','india','E24 Desk',false,false,925,'2026-10-13T19:30:00.000Z'),
('Snehasparsham 2026: helping hand for patients in need','snehasparsham-2026-helping-hand-for-patients-in-need','grama-vartha','Staff Reporter',false,false,744,'2026-10-13T10:30:00.000Z'),
('Why Malayalam poetry is finding a new audience online','why-malayalam-poetry-is-finding-a-new-audience-online','writers-corner','Anjali Menon',false,false,563,'2026-10-13T01:30:00.000Z'),
('Big job opportunities open up in the space sector','big-job-opportunities-open-up-in-the-space-sector','tech','Rahul Nair',false,false,382,'2026-10-12T16:30:00.000Z'),
('Court intervenes on actress''s complaint against producer','court-intervenes-on-actress-s-complaint-against-producer','movies','Fathima Basheer',false,false,201,'2026-10-12T07:30:00.000Z'),
('Setback for Indian IT sector as new visa fees take effect','setback-for-indian-it-sector-as-new-visa-fees-take-effect','world','E24 Desk',false,false,920,'2026-10-11T22:30:00.000Z'),
('Sanju Samson named in squad for Australia tour','sanju-samson-named-in-squad-for-australia-tour','sports','Staff Reporter',false,false,739,'2026-10-11T13:30:00.000Z'),
('Weekend reads: ten books to pick up this month','weekend-reads-ten-books-to-pick-up-this-month','magazines','Anjali Menon',false,false,558,'2026-10-11T04:30:00.000Z'),
('Monthly payment case: Chief Minister''s office responds to ED summons','monthly-payment-case-chief-minister-s-office-responds-to-ed-summons','kerala','Rahul Nair',false,false,377,'2026-10-10T19:30:00.000Z'),
('Qatar Incas Palakkad district committee holds family meet','qatar-incas-palakkad-district-committee-holds-family-meet','qatar','Fathima Basheer',false,false,196,'2026-10-10T10:30:00.000Z'),
('UAE announces long weekend for National Day','uae-announces-long-weekend-for-national-day','gulf','E24 Desk',false,false,915,'2026-10-10T01:30:00.000Z'),
('RBI keeps repo rate unchanged for fourth time','rbi-keeps-repo-rate-unchanged-for-fourth-time','india','Staff Reporter',false,false,734,'2026-10-09T16:30:00.000Z'),
('New district with Muvattupuzha as headquarters under consideration','new-district-with-muvattupuzha-as-headquarters-under-consideration','grama-vartha','Anjali Menon',false,false,553,'2026-10-09T07:30:00.000Z'),
('Europe calls for tighter controls on AI development','europe-calls-for-tighter-controls-on-ai-development','tech','Rahul Nair',false,false,372,'2026-10-08T22:30:00.000Z'),
('18th IDSFFK opens in Thiruvananthapuram today','18th-idsffk-opens-in-thiruvananthapuram-today','movies','Fathima Basheer',false,false,191,'2026-10-08T13:30:00.000Z'),
('Messi''s final match: Argentina says goodbye to a legend','messi-s-final-match-argentina-says-goodbye-to-a-legend','world','E24 Desk',false,false,910,'2026-10-08T04:30:00.000Z'),
('State school athletics meet begins in Kunnamkulam','state-school-athletics-meet-begins-in-kunnamkulam','sports','Staff Reporter',false,false,729,'2026-10-07T19:30:00.000Z'),
('State to study rollout of new labour codes before implementation','state-to-study-rollout-of-new-labour-codes-before-implementation','kerala','Anjali Menon',false,false,548,'2026-10-07T10:30:00.000Z'),
('Jumbo Electronics announces mega promotion across Qatar','jumbo-electronics-announces-mega-promotion-across-qatar','qatar','Rahul Nair',false,false,367,'2026-10-07T01:30:00.000Z'),
('Oman eases visa rules for GCC residents','oman-eases-visa-rules-for-gcc-residents','gulf','Fathima Basheer',false,false,186,'2026-10-06T16:30:00.000Z'),
('Basheer Muttathil passes away at 64','basheer-muttathil-passes-away-at-64','grama-vartha','E24 Desk',false,false,905,'2026-10-06T07:30:00.000Z'),
('Kerala Startup Mission launches new incubation programme','kerala-startup-mission-launches-new-incubation-programme','tech','Staff Reporter',false,false,724,'2026-10-05T22:30:00.000Z'),
('Mohanlal''s next big release gets a festival date','mohanlal-s-next-big-release-gets-a-festival-date','movies','Anjali Menon',false,false,543,'2026-10-05T13:30:00.000Z'),
('New Governor to be sworn in at Raj Bhavan today','new-governor-to-be-sworn-in-at-raj-bhavan-today','kerala','Rahul Nair',false,false,362,'2026-10-05T04:30:00.000Z'),
('Kochi Metro phase two works to begin next month','kochi-metro-phase-two-works-to-begin-next-month','kerala','Fathima Basheer',false,false,181,'2026-10-04T19:30:00.000Z'),
('Heavy rain alert issued for five districts','heavy-rain-alert-issued-for-five-districts','kerala','E24 Desk',false,false,900,'2026-10-04T10:30:00.000Z')
) as s(title, slug, category, author, featured, trending, views, published_at)
cross join lateral (select s.title || '. Our correspondent reports on the latest developments, reactions from the people involved and what it means for readers across Kerala and the Gulf.' as excerpt) e
on conflict (slug) do nothing;
