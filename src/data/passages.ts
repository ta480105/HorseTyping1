export type PassageDifficulty = 'easy' | 'medium' | 'hard';
export type PassageCategory =
  | 'general'
  | 'science'
  | 'technology'
  | 'animals'
  | 'nature'
  | 'geography'
  | 'history'
  | 'education'
  | 'literature'
  | 'punctuation';

export interface Passage {
  id: string;
  title: string;
  text: string;
  difficulty: PassageDifficulty;
  category: PassageCategory;
}

export const PASSAGES: Passage[] = [
  // --- EVERYDAY LIFE & GENERAL (1 - 12) ---
  {
    id: 'passage-001',
    title: 'The Quiet Craft of Tactile Tools',
    difficulty: 'easy',
    category: 'general',
    text: 'Good tools disappear into the work they support. When a mechanical switch responds with a crisp, predictable return, your attention shifts from the keyboard to the rhythm of the sentence taking shape on screen.'
  },
  {
    id: 'passage-002',
    title: 'Morning Light in the Studio',
    difficulty: 'easy',
    category: 'general',
    text: 'Early light filters through tall studio windows and settles across the oak desk. Before messages arrive and schedules fill the afternoon, a quiet hour of focused writing sets a steady pace for the entire day.'
  },
  {
    id: 'passage-003',
    title: 'Rhythm Over Raw Speed',
    difficulty: 'easy',
    category: 'general',
    text: 'Typing quickly is rarely about rushing your fingers. Smooth speed comes from steady cadence, looking slightly ahead in the text, and avoiding the hesitation that causes clustered mistakes.'
  },
  {
    id: 'passage-004',
    title: 'Weekend Farmers Market',
    difficulty: 'easy',
    category: 'general',
    text: 'Every Saturday morning, wooden crates of crisp apples, heirloom tomatoes, and fresh rosemary line the town square. Bakers pull warm sourdough loaves from canvas baskets while neighbors catch up over paper cups of coffee.'
  },
  {
    id: 'passage-005',
    title: 'The Art of Packing Light',
    difficulty: 'easy',
    category: 'general',
    text: 'Seasoned travelers learn that carrying less makes every journey easier. A single versatile jacket, comfortable walking shoes, and a compact notebook leave room for unexpected discoveries along the way.'
  },
  {
    id: 'passage-006',
    title: 'Neighborhood Bicycle Repair',
    difficulty: 'medium',
    category: 'general',
    text: 'Keeping a commuter bicycle in top condition requires only a few simple habits. Wiping grit from the chain, checking tire pressure before Monday rides, and adjusting brake cable tension prevent roadside delays.'
  },
  {
    id: 'passage-007',
    title: 'Roasting Coffee Beans at Home',
    difficulty: 'medium',
    category: 'general',
    text: 'Green coffee beans smell grassy and mild until heat transforms their internal sugars. Listening closely for the first audible crack tells the roaster when bright citrus notes give way to deeper caramel warmth.'
  },
  {
    id: 'passage-008',
    title: 'Evening Walk After Rain',
    difficulty: 'easy',
    category: 'general',
    text: 'After a late afternoon downpour, the neighborhood sidewalks shine beneath amber streetlights. Cool air carries the scent of wet pavement and cedar bark while puddles reflect the passing clouds.'
  },
  {
    id: 'passage-009',
    title: 'Restoring Cast Iron Cookware',
    difficulty: 'medium',
    category: 'general',
    text: 'A neglected cast iron skillet can almost always be brought back to life. Scrubbing away surface rust and baking thin layers of oil into the metal creates a smooth, durable finish that lasts for decades.'
  },
  {
    id: 'passage-010',
    title: 'Community Garden Plots',
    difficulty: 'easy',
    category: 'general',
    text: 'Behind the public library, twenty raised cedar beds burst with marigolds, snap peas, and leafy kale. Volunteers share watering duties in the evening and trade surplus zucchini at the garden gate.'
  },
  {
    id: 'passage-011',
    title: 'Handwritten Postcards',
    difficulty: 'easy',
    category: 'general',
    text: 'Receiving a handwritten postcard among a stack of printed bills feels like a small gift. Even a few lines describing a coastal train ride or a quiet cafe carry a personal warmth that instant messages rarely match.'
  },
  {
    id: 'passage-012',
    title: 'Designing a Calm Workspace',
    difficulty: 'medium',
    category: 'general',
    text: 'Cluttered surfaces quietly compete for visual attention throughout the afternoon. Clearing stray cables, positioning a warm desk lamp to reduce glare, and keeping only current notes within reach foster sustained concentration.'
  },

  // --- SCIENCE (13 - 25) ---
  {
    id: 'passage-013',
    title: 'Coastal Navigation by Dead Reckoning',
    difficulty: 'medium',
    category: 'science',
    text: 'Before satellite positioning became universal, mariners plotted their course using compass bearings, measured speed through the water, and careful estimates of wind drift and tidal current across open channels.'
  },
  {
    id: 'passage-014',
    title: 'Adaptation Above the Timberline',
    difficulty: 'hard',
    category: 'science',
    text: 'Above the alpine timberline, cushion plants grow in dense, low-profile mats that trap radiant heat, resist desiccating winter gales, and complete their entire flowering cycle during a brief six-week thaw.'
  },
  {
    id: 'passage-015',
    title: 'Acoustic Resonance in Concert Halls',
    difficulty: 'medium',
    category: 'science',
    text: 'Architects shape concert halls so that early reflections from side walls reach the listener within thirty milliseconds, blending with the direct sound of the orchestra to create warmth, clarity, and spatial depth.'
  },
  {
    id: 'passage-016',
    title: 'Photosynthesis in Canopy Leaves',
    difficulty: 'medium',
    category: 'science',
    text: 'Leaves at the top of a forest canopy develop thicker protective cuticles and denser chloroplast layers than shaded leaves below, allowing them to harvest intense midday sunlight without suffering cellular damage.'
  },
  {
    id: 'passage-017',
    title: 'Deep Ocean Hydrothermal Vents',
    difficulty: 'hard',
    category: 'science',
    text: 'Along mid-ocean ridges where tectonic plates pull apart, superheated water rich in dissolved minerals erupts from dark chimneys, supporting chemosynthetic bacteria that thrive in complete darkness.'
  },
  {
    id: 'passage-018',
    title: 'How Snowflakes Form Symmetry',
    difficulty: 'medium',
    category: 'science',
    text: 'As a microscopic ice crystal drifts through cloud layers of varying temperature and humidity, water vapor deposits onto its six corners at matching rates, producing intricate hexagonal branches that are unique to its path.'
  },
  {
    id: 'passage-019',
    title: 'Earth’s Magnetosphere Shield',
    difficulty: 'hard',
    category: 'science',
    text: 'Convection currents of molten iron and nickel within the outer core generate a planetary magnetic field that deflects charged solar wind particles, protecting atmospheric gases from being stripped into space.'
  },
  {
    id: 'passage-020',
    title: 'Bioluminescence in Marine Plankton',
    difficulty: 'hard',
    category: 'science',
    text: 'When waves disturb dinoflagellates near the ocean surface at night, a rapid enzymatic reaction between luciferin and luciferase emits flashes of blue-green light that startle nocturnal grazers.'
  },
  {
    id: 'passage-021',
    title: 'Capillary Action in Tall Trees',
    difficulty: 'medium',
    category: 'science',
    text: 'Giant redwoods lift water more than ninety meters from roots to crown without a mechanical pump. Evaporation from tiny leaf pores pulls continuous columns of water upward through microscopic xylem vessels.'
  },
  {
    id: 'passage-022',
    title: 'Spectroscopy and Distant Stars',
    difficulty: 'hard',
    category: 'science',
    text: 'By splitting starlight through a precision diffraction grating, astronomers identify dark absorption lines that reveal the exact chemical elements, surface temperature, and radial velocity of stars light-years away.'
  },
  {
    id: 'passage-023',
    title: 'Ice Cores and Ancient Climates',
    difficulty: 'medium',
    category: 'science',
    text: 'Cylinders of ice drilled from Antarctic glaciers trap microscopic bubbles of ancient air. Analyzing these preserved layers allows paleoclimatologists to reconstruct atmospheric composition across hundreds of millennia.'
  },
  {
    id: 'passage-024',
    title: 'Surface Tension of Water',
    difficulty: 'easy',
    category: 'science',
    text: 'Hydrogen bonds between water molecules pull surface droplets into tight domes and allow lightweight pond skaters to walk across calm streams without breaking through the liquid film.'
  },
  {
    id: 'passage-025',
    title: 'Tidal Locking of the Moon',
    difficulty: 'medium',
    category: 'science',
    text: 'Over millions of years, gravitational friction slowed the rotation of the Moon until its spin period matched its orbital period around Earth, causing the same lunar hemisphere to face our planet permanently.'
  },

  // --- TECHNOLOGY & ENGINEERING (26 - 38) ---
  {
    id: 'passage-026',
    title: 'Precision of the Mechanical Escapement',
    difficulty: 'medium',
    category: 'technology',
    text: 'At the heart of every mechanical timepiece lies the escapement, a tiny mechanism that releases gear-train energy in measured impulses while keeping the balance wheel oscillating at a constant frequency.'
  },
  {
    id: 'passage-027',
    title: 'Clocks in Distributed Systems',
    difficulty: 'hard',
    category: 'technology',
    text: 'Physical quartz oscillators drift slightly with temperature and age; consequently, distributed databases rely on logical clocks, monotonic timers, and quorum protocols to establish causal ordering across distant nodes.'
  },
  {
    id: 'passage-028',
    title: 'Subsea Fiber Optic Cables',
    difficulty: 'medium',
    category: 'technology',
    text: 'Beneath the oceans, armored bundles of glass fibers thinner than a human hair carry laser pulses between continents, transmitting the vast majority of international data traffic at nearly two hundred thousand kilometers per second.'
  },
  {
    id: 'passage-029',
    title: 'Error-Correcting Memory Codes',
    difficulty: 'hard',
    category: 'technology',
    text: 'High-reliability servers use error-correcting code memory to detect and repair single-bit flips caused by stray cosmic rays, preventing silent data corruption during long computational workloads.'
  },
  {
    id: 'passage-030',
    title: 'Regenerative Braking in Electric Trains',
    difficulty: 'medium',
    category: 'technology',
    text: 'When an electric locomotive slows down on a mountain grade, its traction motors reverse their role and act as generators, converting kinetic momentum back into electrical energy that feeds the overhead line.'
  },
  {
    id: 'passage-031',
    title: 'E-Ink Display Physics',
    difficulty: 'medium',
    category: 'technology',
    text: 'Electronic paper screens contain millions of tiny microcapsules filled with positively charged white particles and negatively charged black particles. Once arranged by an electric field, the image holds without drawing power.'
  },
  {
    id: 'passage-032',
    title: 'Tactile Mechanical Key Switches',
    difficulty: 'easy',
    category: 'technology',
    text: 'Inside a mechanical key switch, a coiled metal spring and a shaped stem determine how much force is needed to register a keystroke. A subtle tactile bump confirms actuation before the key bottoms out.'
  },
  {
    id: 'passage-033',
    title: 'Passive Cooling in Architecture',
    difficulty: 'medium',
    category: 'technology',
    text: 'Modern low-energy buildings combine deep roof overhangs, high thermal mass concrete floors, and stack-effect ventilation shafts to exhaust warm air naturally and reduce reliance on mechanical air conditioning.'
  },
  {
    id: 'passage-034',
    title: 'Lossless Data Compression',
    difficulty: 'hard',
    category: 'technology',
    text: 'Lossless compression algorithms scan files for recurring byte sequences and replace frequent patterns with shorter bit representations, shrinking archive size while guaranteeing bit-for-bit reconstruction.'
  },
  {
    id: 'passage-035',
    title: 'Pumped Hydroelectric Storage',
    difficulty: 'medium',
    category: 'technology',
    text: 'When solar and wind generation exceed grid demand at midday, reversible turbines pump water from a lower valley into an upper mountain reservoir, storing potential energy until evening peak consumption.'
  },
  {
    id: 'passage-036',
    title: 'Ultraviolet Photolithography',
    difficulty: 'hard',
    category: 'technology',
    text: 'Semiconductor foundries project extreme ultraviolet light through precision photomasks onto silicon wafers coated with photoresist, etching billions of nanometer-scale transistor gates onto a single processor die.'
  },
  {
    id: 'passage-037',
    title: 'Version Control and Atomic Commits',
    difficulty: 'easy',
    category: 'technology',
    text: 'Organizing software changes into small, self-contained commits makes code review faster and debugging simpler. Clear commit messages explain why a decision was made long after the details fade.'
  },
  {
    id: 'passage-038',
    title: 'Rubidium Atomic Frequency Standards',
    difficulty: 'hard',
    category: 'technology',
    text: 'Navigation satellites carry compact atomic clocks that lock a quartz oscillator to the microwave hyperfine transition of rubidium atoms, maintaining nanosecond timing accuracy across orbital paths.'
  },

  // --- ANIMALS & WILDLIFE (39 - 50) ---
  {
    id: 'passage-039',
    title: 'Arctic Tern Migration',
    difficulty: 'medium',
    category: 'animals',
    text: 'Every year, the slender Arctic tern flies from northern breeding grounds to the edge of the Antarctic pack ice and back again, experiencing two polar summers and more daylight than any other creature on Earth.'
  },
  {
    id: 'passage-040',
    title: 'Sea Otters and Kelp Forests',
    difficulty: 'easy',
    category: 'animals',
    text: 'Sea otters play a vital role in coastal ecosystems by feeding on spiny sea urchins. Where otter populations thrive, underwater kelp forests grow tall and provide shelter for hundreds of fish species.'
  },
  {
    id: 'passage-041',
    title: 'Honeybee Waggle Dance',
    difficulty: 'medium',
    category: 'animals',
    text: 'When a foraging honeybee discovers a rich patch of wildflowers, she returns to the dark hive and performs a figure-eight waggle dance whose angle and duration tell nestmates the exact direction and distance to the nectar.'
  },
  {
    id: 'passage-042',
    title: 'Octopus Camouflage Cells',
    difficulty: 'hard',
    category: 'animals',
    text: 'An octopus can alter its skin texture and color in less than a second by expanding or contracting thousands of pigment-filled chromatophores while neuromuscular papillae mimic surrounding coral and rock.'
  },
  {
    id: 'passage-043',
    title: 'Beaver Dam Engineering',
    difficulty: 'easy',
    category: 'animals',
    text: 'Using felled aspen branches, river mud, and stones, beavers construct sturdy dams that slow rushing streams into tranquil ponds. These wetlands trap sediment, recharge groundwater, and create habitat for waterfowl.'
  },
  {
    id: 'passage-044',
    title: 'Barn Owl Silent Flight',
    difficulty: 'medium',
    category: 'animals',
    text: 'Comb-like serrations along the leading edge of a barn owl’s primary feathers break turbulent air into tiny micro-eddies, allowing the bird to glide silently over meadow grass while listening for rustling voles.'
  },
  {
    id: 'passage-045',
    title: 'Leafcutter Ant Underground Gardens',
    difficulty: 'medium',
    category: 'animals',
    text: 'Columns of leafcutter ants carry freshly scissored foliage down into subterranean chambers not to eat the leaves directly, but to cultivate a specialized fungus that feeds the entire colony.'
  },
  {
    id: 'passage-046',
    title: 'Albatross Dynamic Soaring',
    difficulty: 'hard',
    category: 'animals',
    text: 'Wandering albatrosses cross thousands of kilometers of open ocean without flapping their wings by curving repeatedly across the wind gradient just above the wave crests, extracting energy from shear layers.'
  },
  {
    id: 'passage-047',
    title: 'Elephant Infrasound Communication',
    difficulty: 'medium',
    category: 'animals',
    text: 'African elephants produce deep, low-frequency rumbles that travel through both air and ground for several kilometers, enabling separated family herds to coordinate movements toward distant watering holes.'
  },
  {
    id: 'passage-048',
    title: 'Chameleon Ballistic Tongue',
    difficulty: 'medium',
    category: 'animals',
    text: 'A chameleon stores elastic energy in collagen sheaths wrapped around its hyoid bone, launching its sticky tongue forward at remarkable acceleration to capture insects on distant twigs.'
  },
  {
    id: 'passage-049',
    title: 'Monarch Butterfly Overwintering',
    difficulty: 'easy',
    category: 'animals',
    text: 'Millions of monarch butterflies travel south each autumn to cluster on high-altitude oyamel fir trees in central Mexico, where cool mountain air slows their metabolism until spring warmth returns.'
  },
  {
    id: 'passage-050',
    title: 'Pistol Shrimp Cavitation Bubble',
    difficulty: 'hard',
    category: 'animals',
    text: 'By snapping its enlarged claw shut at extreme speed, a pistol shrimp creates a low-pressure cavitation bubble whose collapse generates a sharp acoustic shockwave capable of stunning nearby prey.'
  },

  // --- NATURE & ECOLOGY (51 - 62) ---
  {
    id: 'passage-051',
    title: 'Old-Growth Temperate Rainforests',
    difficulty: 'medium',
    category: 'nature',
    text: 'In coastal temperate rainforests, fallen nurse logs covered in thick green moss provide moist seedbeds for young Sitka spruce and western hemlock saplings, linking generations of forest life.'
  },
  {
    id: 'passage-052',
    title: 'Desert Ephemeral Superblooms',
    difficulty: 'medium',
    category: 'nature',
    text: 'Seeds of desert wildflowers can lie dormant in arid gravel for years until steady winter rains wash away germination inhibitors, carpeting dry valleys in gold, violet, and crimson blossoms.'
  },
  {
    id: 'passage-053',
    title: 'Mycorrhizal Forest Networks',
    difficulty: 'hard',
    category: 'nature',
    text: 'Beneath the forest floor, symbiotic mycorrhizal fungi wrap delicate hyphae around tree roots, trading phosphorus and nitrogen collected from soil pores for carbon sugars produced in the canopy.'
  },
  {
    id: 'passage-054',
    title: 'Estuary Salt Marshes',
    difficulty: 'easy',
    category: 'nature',
    text: 'Where freshwater rivers meet the rising ocean tide, cordgrass marshes buffer coastlines from storm surge, filter runoff, and serve as calm nurseries for juvenile crabs and schooling fish.'
  },
  {
    id: 'passage-055',
    title: 'Autumn Leaf Pigments',
    difficulty: 'easy',
    category: 'nature',
    text: 'As autumn days shorten and nights grow crisp, deciduous trees break down green chlorophyll in their leaves, unveiling yellow carotenoids and bright red anthocyanins before winter dormancy.'
  },
  {
    id: 'passage-056',
    title: 'Peat Bog Carbon Vaults',
    difficulty: 'medium',
    category: 'nature',
    text: 'Waterlogged sphagnum bogs are so acidic and low in oxygen that fallen plant matter decomposes at a glacial pace, locking vast stores of organic carbon in deep layers of peat.'
  },
  {
    id: 'passage-057',
    title: 'Mangrove Intertidal Roots',
    difficulty: 'medium',
    category: 'nature',
    text: 'Red mangroves thrive in brackish tropical lagoons by propping themselves above shifting silt on arched stilt roots that filter salt from seawater and trap nutrient-rich sediment.'
  },
  {
    id: 'passage-058',
    title: 'Fire Ecology of Lodgepole Pines',
    difficulty: 'medium',
    category: 'nature',
    text: 'Many lodgepole pine cones remain sealed with tough resin for years until the heat of a passing forest fire melts the bond, releasing winged seeds onto mineral-rich ash beds.'
  },
  {
    id: 'passage-059',
    title: 'Coral Reef Symbiosis',
    difficulty: 'hard',
    category: 'nature',
    text: 'Reef-building coral polyps house microscopic photosynthetic algae called zooxanthellae within their tissues, recycling scarce nutrients in clear tropical waters to build massive limestone structures.'
  },
  {
    id: 'passage-060',
    title: 'Alpine Glacial Tarns',
    difficulty: 'easy',
    category: 'nature',
    text: 'High in mountain cirques carved by retreating ice, small glacial lakes called tarns glow turquoise in summer sunlight due to fine rock flour suspended in the cold meltwater.'
  },
  {
    id: 'passage-061',
    title: 'Prairie Deep Root Systems',
    difficulty: 'easy',
    category: 'nature',
    text: 'Native tallgrass prairie plants grow fibrous root systems that reach several meters underground, anchoring fertile topsoil against wind erosion and surviving prolonged summer droughts.'
  },
  {
    id: 'passage-062',
    title: 'Limestone Karst Caves',
    difficulty: 'medium',
    category: 'nature',
    text: 'Rainwater absorbs carbon dioxide as it percolates through soil, forming weak carbonic acid that slowly dissolves bedrock fractures into underground caverns decorated with stalactites and flowstone.'
  },

  // --- GEOGRAPHY & EARTH (63 - 74) ---
  {
    id: 'passage-063',
    title: 'The Humboldt Ocean Current',
    difficulty: 'medium',
    category: 'geography',
    text: 'Flowing north along the western coast of South America, the cold Humboldt Current drives nutrient upwelling that supports abundant marine life while creating cool coastal fog beside the arid Atacama Desert.'
  },
  {
    id: 'passage-064',
    title: 'Fjords of the Northern Coast',
    difficulty: 'easy',
    category: 'geography',
    text: 'Steep-walled fjords were carved during past ice ages when massive valley glaciers ground their way below sea level. When the ice retreated, seawater flooded the deep rock troughs.'
  },
  {
    id: 'passage-065',
    title: 'River Deltas and Alluvial Plains',
    difficulty: 'medium',
    category: 'geography',
    text: 'When a sediment-laden river reaches a calm sea, its current slows and drops sand and silt in branching channels, building fertile alluvial deltas that have supported agriculture for millennia.'
  },
  {
    id: 'passage-066',
    title: 'Rain Shadows of Mountain Ranges',
    difficulty: 'medium',
    category: 'geography',
    text: 'Moist prevailing winds forced upward over high mountain crests cool and release their rain on windward slopes, leaving the leeward basin dry and sunny in a pronounced rain shadow.'
  },
  {
    id: 'passage-067',
    title: 'Atolls and Volcanic Subsidence',
    difficulty: 'hard',
    category: 'geography',
    text: 'Ring-shaped coral atolls form over millions of years as an oceanic volcano slowly subsides beneath the waves while its fringing reef continues growing upward around a central lagoon.'
  },
  {
    id: 'passage-068',
    title: 'The Great Rift Valley',
    difficulty: 'medium',
    category: 'geography',
    text: 'Stretching thousands of kilometers across eastern Africa, the Great Rift Valley marks a divergent tectonic boundary where the continental crust is gradually thinning and pulling apart, forming deep ribbon lakes.'
  },
  {
    id: 'passage-069',
    title: 'Loess Plateaus and Windblown Silt',
    difficulty: 'hard',
    category: 'geography',
    text: 'During glacial periods, powerful winds swept fine mineral dust from dry outwash plains and deposited thick blankets of porous yellow loess that weather into steep terraces and productive farmland.'
  },
  {
    id: 'passage-070',
    title: 'Trade Winds and Horse Latitudes',
    difficulty: 'medium',
    category: 'geography',
    text: 'Solar heating at the equator drives rising air that circulates poleward and descends near thirty degrees latitude, feeding reliable trade winds that guided sailing ships across the Atlantic and Pacific.'
  },
  {
    id: 'passage-071',
    title: 'Permafrost and Polygon Tundra',
    difficulty: 'medium',
    category: 'geography',
    text: 'Across high-latitude tundra plains, seasonal freezing and thawing of the active soil layer above permanent ice wedges sculpts the ground into striking geometric networks of polygonal ridges.'
  },
  {
    id: 'passage-072',
    title: 'Basalt Columns of Volcanic Flows',
    difficulty: 'medium',
    category: 'geography',
    text: 'When thick pools of basaltic lava cool evenly from the surface downward, contraction stresses fracture the rock into tightly packed hexagonal columns that resemble giant organ pipes.'
  },
  {
    id: 'passage-073',
    title: 'Oxbow Lakes on Meandering Rivers',
    difficulty: 'easy',
    category: 'geography',
    text: 'Across flat floodplains, rivers swing in wide loops as water erodes outer banks and deposits sand on inner bends. Eventually a flood cuts straight across a narrow neck, leaving a crescent oxbow lake.'
  },
  {
    id: 'passage-074',
    title: 'Geothermal Geysers and Silica Sinter',
    difficulty: 'hard',
    category: 'geography',
    text: 'Groundwater circulating through fractured volcanic rock superheats under pressure until steam bubbles trigger a periodic eruption, depositing terraced mounds of white siliceous sinter around the vent.'
  },

  // --- HISTORY & CIVILIZATION (75 - 86) ---
  {
    id: 'passage-075',
    title: 'Marine Chronometers and Longitude',
    difficulty: 'hard',
    category: 'history',
    text: 'In the eighteenth century, clockmaker John Harrison solved the long-standing problem of determining longitude at sea by building temperature-compensated marine chronometers that kept accurate time aboard pitching ships.'
  },
  {
    id: 'passage-076',
    title: 'Roman Aqueduct Gradients',
    difficulty: 'medium',
    category: 'history',
    text: 'Roman surveyors used spirit levels and sighting instruments to build stone aqueducts that descended at a remarkably gentle, uniform gradient, carrying fresh spring water across valleys into public cisterns.'
  },
  {
    id: 'passage-077',
    title: 'Movable Type and the Printing Press',
    difficulty: 'medium',
    category: 'history',
    text: 'By combining durable metal alloy type molds, oil-based ink, and a wooden screw press, fifteenth-century print workshops reduced the cost of books dramatically and accelerated the spread of scientific treatises.'
  },
  {
    id: 'passage-078',
    title: 'Ancient Silk Road Caravanserais',
    difficulty: 'medium',
    category: 'history',
    text: 'Spaced a day’s journey apart along overland trade routes, fortified roadside inns called caravanserais provided merchants and camel caravans with safe courtyards, fresh water, and lively exchanges of ideas.'
  },
  {
    id: 'passage-079',
    title: 'Polynesian Wayfinding Star Compasses',
    difficulty: 'hard',
    category: 'history',
    text: 'Master navigators settled remote Pacific archipelagos in double-hulled canoes by memorizing the rising and setting points of hundreds of stars, reading ocean swell interference patterns, and observing seabird flight paths.'
  },
  {
    id: 'passage-080',
    title: 'The Evolution of the QWERTY Layout',
    difficulty: 'easy',
    category: 'history',
    text: 'Early mechanical typewriters jammed when adjacent metal typebars were struck in rapid succession. Rearranging common letter pairs across the keyboard reduced mechanical collisions and established a layout still used today.'
  },
  {
    id: 'passage-081',
    title: 'Windmills of the Dutch Polders',
    difficulty: 'easy',
    category: 'history',
    text: 'Starting in the medieval period, communities in the Low Countries built networks of wind-poweredscoop wheels and drainage canals to pump water from low-lying marshes and reclaim fertile polder farmland.'
  },
  {
    id: 'passage-082',
    title: 'Telegraph Under the Atlantic',
    difficulty: 'medium',
    category: 'history',
    text: 'When the first durable transatlantic telegraph cable was completed in 1866, messages that once required a ten-day steamship voyage between London and New York could be transmitted in a matter of minutes.'
  },
  {
    id: 'passage-083',
    title: 'Library of Alexandria Scroll Catalogs',
    difficulty: 'medium',
    category: 'history',
    text: 'Scholars working in ancient libraries organized tens of thousands of papyrus scrolls using subject catalogs called Pinakes, recording each author’s biography, title, opening line, and total line count.'
  },
  {
    id: 'passage-084',
    title: 'Fresnel Lighthouse Lenses',
    difficulty: 'hard',
    category: 'history',
    text: 'Augustin-Jean Fresnel revolutionized coastal safety by replacing heavy spherical mirrors with stepped concentric glass prisms that focused a single lamp’s flame into a brilliant beam visible over twenty miles out to sea.'
  },
  {
    id: 'passage-085',
    title: 'Terraced Agriculture of the Andes',
    difficulty: 'medium',
    category: 'history',
    text: 'Stone-walled agricultural terraces built along steep Andean mountainsides absorbed daytime solar warmth, prevented soil erosion during heavy rains, and created distinct microclimates for cultivating dozens of potato varieties.'
  },
  {
    id: 'passage-086',
    title: 'The Metric System Standardization',
    difficulty: 'medium',
    category: 'history',
    text: 'Before decimal measurement standards were adopted, every region maintained its own incompatible units of length and weight. Defining the meter and kilogram on universal physical constants simplified trade and laboratory science.'
  },

  // --- EDUCATION, LEARNING & LITERATURE (87 - 98) ---
  {
    id: 'passage-087',
    title: 'Typographic Proportions and Measure',
    difficulty: 'medium',
    category: 'literature',
    text: 'A comfortable line length allows the human eye to travel from the end of one line to the beginning of the next without losing its place. Generous leading and balanced letterspacing turn dense prose into an effortless page.'
  },
  {
    id: 'passage-088',
    title: 'Cotton Rag and Archival Ink',
    difficulty: 'medium',
    category: 'literature',
    text: 'Acid-free paper milled from long cotton fibers resists yellowing for centuries. Paired with carbon pigment ink, handwritten notebooks from scientific expeditions remain crisp and legible generations later.'
  },
  {
    id: 'passage-089',
    title: 'Spaced Repetition in Memory',
    difficulty: 'easy',
    category: 'education',
    text: 'Reviewing new material at gradually increasing intervals strengthens long-term recall far more effectively than cramming everything into a single night. Brief, consistent practice sessions build durable mastery.'
  },
  {
    id: 'passage-090',
    title: 'Deliberate Practice and Feedback Loops',
    difficulty: 'medium',
    category: 'education',
    text: 'Whether learning a musical instrument or refining keyboard fluency, progress accelerates when you isolate specific weak spots, slow down enough to execute each motion accurately, and observe immediate feedback.'
  },
  {
    id: 'passage-091',
    title: 'The Feynman Technique of Explanation',
    difficulty: 'easy',
    category: 'education',
    text: 'One of the clearest ways to test your understanding of a complex topic is to explain it in plain, everyday language without hiding behind jargon. Wherever the explanation stalls, you have found what to study next.'
  },
  {
    id: 'passage-092',
    title: 'Reading Aloud for Prose Cadence',
    difficulty: 'easy',
    category: 'literature',
    text: 'Writers often read a finished draft aloud to test its rhythm. Awkward transitions, repetitive sentence lengths, and cluttered clauses reveal themselves to the ear long before they stand out to the eye.'
  },
  {
    id: 'passage-093',
    title: 'Marginalia and Active Reading',
    difficulty: 'medium',
    category: 'education',
    text: 'Jotting brief questions and summaries in the margins of a book turns passive reading into a conversation with the author, helping you synthesize arguments and locate key passages months later.'
  },
  {
    id: 'passage-094',
    title: 'Motor Chunking in Touch Typing',
    difficulty: 'medium',
    category: 'education',
    text: 'Experienced typists no longer think about individual letters one by one. Instead, the motor cortex groups common syllables and suffixes into fluid finger sequences that execute as a single coordinated gesture.'
  },
  {
    id: 'passage-095',
    title: 'Cartography and Visual Hierarchy',
    difficulty: 'medium',
    category: 'education',
    text: 'Well-designed maps rely on subtle differences in line weight, color saturation, and label typography so that rivers, elevation contours, and town names remain legible without overwhelming the reader.'
  },
  {
    id: 'passage-096',
    title: 'Bookbinding and Smythe Sewing',
    difficulty: 'medium',
    category: 'literature',
    text: 'Folded signatures of paper sewn together with linen thread allow a hardcover book to lie completely flat on a reading table without cracking the spine or loosening individual pages over time.'
  },
  {
    id: 'passage-097',
    title: 'Etymology of Everyday Words',
    difficulty: 'easy',
    category: 'literature',
    text: 'Tracing the history of common English words reveals centuries of cultural exchange, showing how Latin scholarly terms, Norse seafaring vocabulary, and French culinary phrases blended into a rich language.'
  },
  {
    id: 'passage-098',
    title: 'Cognitive Load and Interface Clarity',
    difficulty: 'medium',
    category: 'education',
    text: 'When an interface removes flashing banners and unnecessary counters, working memory is freed to focus entirely on the task at hand, reducing fatigue and improving both accuracy and comprehension.'
  },

  // --- PUNCTUATION, NUMBERS & PRECISION DRILLS (99 - 108) ---
  {
    id: 'passage-099',
    title: 'Rhythm, Clauses, and Punctuation',
    difficulty: 'hard',
    category: 'punctuation',
    text: 'Wait—did the telemetry log record 98.4% accuracy at 07:30, or was that after the calibration pass? Check the primary metrics (latency, jitter, and throughput); then verify every threshold before publishing.'
  },
  {
    id: 'passage-100',
    title: 'Monotonic Timing & Telemetry Drill',
    difficulty: 'hard',
    category: 'punctuation',
    text: 'In benchmark #42 (v2.6.0), frame time dropped from 16.7ms to 8.3ms—a 50.3% reduction! However, p99 tail latency stayed near 14.2ms; engineers traced the spike to garbage-collection pauses.'
  },
  {
    id: 'passage-101',
    title: 'Observatory Logbook Entry',
    difficulty: 'hard',
    category: 'punctuation',
    text: 'At 02:15 UTC on October 14, dome shutter #3 opened to azimuth 142.8°; seeing conditions measured 0.65 arcseconds, humidity held at 34%, and mirror temperature stabilized at -4.2°C.'
  },
  {
    id: 'passage-102',
    title: 'Editorial Style Guide Checklist',
    difficulty: 'hard',
    category: 'punctuation',
    text: 'Use an em-dash—without surrounding spaces—for an abrupt break; use a semicolon to link independent clauses; and always verify whether "smart quotes" or straight quotes are required by the specification.'
  },
  {
    id: 'passage-103',
    title: 'Expedition Supply Manifest',
    difficulty: 'hard',
    category: 'punctuation',
    text: 'Crate A-19 contains: 24 lithium cells (3.7V, 2,600mAh), 3 barometer modules, 12 waterproof notebooks (140mm x 210mm), and 450 meters of braided nylon cord—total weight: 18.6 kilograms.'
  },
  {
    id: 'passage-104',
    title: 'Train Timetable & Platform Notice',
    difficulty: 'medium',
    category: 'punctuation',
    text: 'Express service #408 to Zurich departs Platform 6 at 08:45; intermediate stops include Basel (09:38), Olten (10:04), and Aarau (10:16). Passengers with bicycles must board Coach B.'
  },
  {
    id: 'passage-105',
    title: 'Botanical Specimen Label',
    difficulty: 'hard',
    category: 'punctuation',
    text: 'Specimen ID: ALP-2026-089. Collected at 2,480m elevation (46.52°N, 7.98°E) on granite talus; petals 5, deep cobalt-blue; flowering period: late June through mid-August.'
  },
  {
    id: 'passage-106',
    title: 'Architectural Blueprint Notes',
    difficulty: 'hard',
    category: 'punctuation',
    text: 'Verify column spacing on Grid C (4,800mm on center); window sills sit 920mm above finished floor level, and acoustic ceiling panels require a minimum NRC rating of 0.85.'
  },
  {
    id: 'passage-107',
    title: 'Financial Ledger Reconciliation',
    difficulty: 'hard',
    category: 'punctuation',
    text: 'Invoice #8841 ($1,420.50) and Invoice #8842 ($639.75) were settled on 2026-09-30; after applying the 2.5% early-payment discount, the net balance transferred was $2,008.74.'
  },
  {
    id: 'passage-108',
    title: 'Laboratory Titration Protocol',
    difficulty: 'hard',
    category: 'punctuation',
    text: 'Pipette 25.0mL of the 0.10M solution into Flask B; add 3 drops of indicator, swirl gently at 22.5°C, and record the burette volume (to ±0.02mL) at the exact equivalence point.'
  }
];

export function getPassageById(id: string): Passage {
  return PASSAGES.find((p) => p.id === id) ?? PASSAGES[0];
}

export function getFilteredPassages(options?: {
  difficulty?: PassageDifficulty | 'all';
  category?: PassageCategory | 'all';
}): Passage[] {
  return PASSAGES.filter((p) => {
    if (
      options?.difficulty &&
      options.difficulty !== 'all' &&
      p.difficulty !== options.difficulty
    ) {
      return false;
    }
    if (options?.category && options.category !== 'all' && p.category !== options.category) {
      return false;
    }
    return true;
  });
}

export function selectNextPassage(
  excludeIds: string[] = [],
  options?: { difficulty?: PassageDifficulty | 'all'; category?: PassageCategory | 'all' }
): Passage {
  const pool = getFilteredPassages(options);
  const available = pool.filter((p) => !excludeIds.includes(p.id));
  const candidates = available.length > 0 ? available : pool.length > 0 ? pool : PASSAGES;
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

/**
 * Builds an initial multi-passage string for Timed Mode so the user has plenty of text,
 * and provides a helper to append non-repeating passages when cursor approaches the end.
 */
export function buildInitialTimedPassage(
  minLength = 650,
  options?: {
    difficulty?: PassageDifficulty | 'all';
    category?: PassageCategory | 'all';
    excludeIds?: string[];
  }
): { text: string; usedIds: string[]; primaryId: string } {
  const initialExcluded = options?.excludeIds ?? [];
  const usedIds: string[] = [];
  const chunks: string[] = [];
  let totalLength = 0;

  while (totalLength < minLength) {
    const next = selectNextPassage([...initialExcluded, ...usedIds], options);
    usedIds.push(next.id);
    chunks.push(next.text.trim());
    totalLength = chunks.join(' ').length;
    if (usedIds.length >= PASSAGES.length && totalLength < minLength) {
      usedIds.splice(0, usedIds.length - 2);
    }
  }

  return {
    text: chunks.join(' '),
    usedIds,
    primaryId: usedIds[0] ?? PASSAGES[0].id,
  };
}
