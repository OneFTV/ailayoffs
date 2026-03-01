const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const occupations = [
  {
    title: "Absorption Technician", title_slug: "absorption-technician", category: "Manufacturing",
    automation_probability: 0.72, description: "Operates absorption equipment in chemical and manufacturing processes.",
    key_tasks: ["Monitor absorption equipment","Adjust chemical flows","Record process data","Maintain equipment"],
    risk_factors: ["Routine process monitoring","Sensor automation","Predictable workflows"],
    safe_factors: ["Equipment troubleshooting","Safety oversight"],
    ai_impact_summary: "AI-driven sensors can automate most monitoring tasks. Human oversight still needed for safety-critical adjustments.",
    related_sector: "Manufacturing", employment_count: 15000, median_salary: 45000
  },
  {
    title: "Academic Advisor", title_slug: "academic-advisor", category: "Education",
    automation_probability: 0.32, description: "Guides students on academic programs, course selection, and degree requirements.",
    key_tasks: ["Advise students on course selection","Review degree progress","Help with academic planning","Connect students to resources"],
    risk_factors: ["AI chatbots for FAQ","Automated degree auditing","Self-service portals"],
    safe_factors: ["Emotional support and mentoring","Complex decision guidance"],
    ai_impact_summary: "AI can handle routine advising queries and degree audits. Complex counseling and mentorship require human empathy.",
    related_sector: "Education", employment_count: 95000, median_salary: 50000
  },
  {
    title: "Access Control Specialist", title_slug: "access-control-specialist", category: "Technology",
    automation_probability: 0.45, description: "Manages physical and digital access control systems for organizations.",
    key_tasks: ["Configure access systems","Monitor security alerts","Issue credentials","Audit access logs"],
    risk_factors: ["Automated credential management","AI anomaly detection","Cloud-based access platforms"],
    safe_factors: ["Security policy decisions","Physical system installation"],
    ai_impact_summary: "Automated identity management tools are replacing routine tasks. Strategic security decisions still need human judgment.",
    related_sector: "Tech", employment_count: 45000, median_salary: 62000
  },
  {
    title: "Account Coordinator", title_slug: "account-coordinator", category: "Sales",
    automation_probability: 0.58, description: "Supports account managers by handling administrative tasks and client communications.",
    key_tasks: ["Coordinate client meetings","Prepare reports","Track deliverables","Handle client inquiries"],
    risk_factors: ["CRM automation","AI scheduling","Template-based communications"],
    safe_factors: ["Client relationship nuance","Cross-team coordination"],
    ai_impact_summary: "AI tools automate scheduling, reporting, and routine communications. Complex client coordination still benefits from human touch.",
    related_sector: "Business Services", employment_count: 120000, median_salary: 48000
  },
  {
    title: "Accounts Payable Clerk", title_slug: "accounts-payable-clerk", category: "Finance",
    automation_probability: 0.85, description: "Processes invoices, verifies expenses, and manages outgoing payments.",
    key_tasks: ["Process invoices","Verify payment details","Reconcile accounts","Manage vendor payments"],
    risk_factors: ["Invoice automation software","OCR and AI matching","Straight-through processing"],
    safe_factors: ["Exception handling","Vendor dispute resolution"],
    ai_impact_summary: "AP automation tools handle most invoice processing end-to-end. Remaining roles focus on exceptions and vendor relationships.",
    related_sector: "Finance", employment_count: 170000, median_salary: 42000
  },
  {
    title: "Accounts Receivable Clerk", title_slug: "accounts-receivable-clerk", category: "Finance",
    automation_probability: 0.83, description: "Manages incoming payments, sends invoices, and tracks outstanding balances.",
    key_tasks: ["Generate invoices","Track payments","Follow up on overdue accounts","Reconcile receivables"],
    risk_factors: ["Automated invoicing","AI collections","Payment platform integration"],
    safe_factors: ["Customer negotiation","Complex dispute resolution"],
    ai_impact_summary: "Automated billing and payment tracking reduce need for manual AR work. Human roles shift to complex collections.",
    related_sector: "Finance", employment_count: 160000, median_salary: 41000
  },
  {
    title: "Acoustical Engineer", title_slug: "acoustical-engineer", category: "Engineering",
    automation_probability: 0.18, description: "Designs and implements solutions for sound control in buildings and products.",
    key_tasks: ["Analyze sound environments","Design acoustic solutions","Test noise levels","Consult on building design"],
    risk_factors: ["Simulation software improvements","AI-assisted modeling"],
    safe_factors: ["Creative design solutions","On-site assessment","Client consultation"],
    ai_impact_summary: "AI enhances acoustic modeling and simulation. Creative design and on-site expertise remain distinctly human.",
    related_sector: "Engineering", employment_count: 12000, median_salary: 82000
  },
  {
    title: "Acupuncturist", title_slug: "acupuncturist", category: "Healthcare",
    automation_probability: 0.09, description: "Treats patients using acupuncture techniques to manage pain and promote wellness.",
    key_tasks: ["Assess patient conditions","Insert acupuncture needles","Develop treatment plans","Monitor patient progress"],
    risk_factors: ["Limited — highly manual practice"],
    safe_factors: ["Physical dexterity required","Patient trust and rapport","Holistic assessment"],
    ai_impact_summary: "Acupuncture requires precise physical skill and patient interaction. AI has minimal impact on this hands-on practice.",
    related_sector: "Healthcare", employment_count: 40000, median_salary: 75000
  },
  {
    title: "Addiction Counselor", title_slug: "addiction-counselor", category: "Healthcare",
    automation_probability: 0.12, description: "Provides counseling and support to individuals dealing with substance abuse disorders.",
    key_tasks: ["Conduct therapy sessions","Develop treatment plans","Lead group sessions","Coordinate with care teams"],
    risk_factors: ["AI mental health chatbots for triage"],
    safe_factors: ["Deep empathy required","Crisis intervention","Trust-based relationships"],
    ai_impact_summary: "AI chatbots may assist with initial screening. Genuine therapeutic relationships and crisis support require human counselors.",
    related_sector: "Healthcare", employment_count: 110000, median_salary: 49000
  },
  {
    title: "Administrative Assistant", title_slug: "administrative-assistant", category: "Administrative",
    automation_probability: 0.76, description: "Provides clerical support including scheduling, correspondence, and document management.",
    key_tasks: ["Manage calendars","Draft correspondence","Organize files","Coordinate meetings"],
    risk_factors: ["AI scheduling tools","Automated document processing","Virtual assistants"],
    safe_factors: ["Complex judgment calls","Executive relationship management"],
    ai_impact_summary: "AI virtual assistants increasingly handle scheduling, email, and document tasks. Strategic support roles will persist.",
    related_sector: "Business Services", employment_count: 3500000, median_salary: 40000
  },
  {
    title: "Admissions Counselor", title_slug: "admissions-counselor", category: "Education",
    automation_probability: 0.42, description: "Evaluates applications and recruits students for educational institutions.",
    key_tasks: ["Review applications","Interview prospective students","Organize campus events","Evaluate credentials"],
    risk_factors: ["AI application screening","Automated scoring","Chatbot recruitment"],
    safe_factors: ["Holistic evaluation","Persuasion and recruitment","Event management"],
    ai_impact_summary: "AI can pre-screen applications and answer FAQs. Holistic evaluation and personal recruitment remain human-driven.",
    related_sector: "Education", employment_count: 75000, median_salary: 47000
  },
  {
    title: "Advertising Copywriter", title_slug: "advertising-copywriter", category: "Creative",
    automation_probability: 0.52, description: "Creates persuasive copy for advertisements across various media channels.",
    key_tasks: ["Write ad copy","Develop campaign concepts","Collaborate with designers","A/B test messaging"],
    risk_factors: ["AI text generation","Automated A/B testing","Template-based ad creation"],
    safe_factors: ["Brand voice nuance","Creative strategy","Emotional storytelling"],
    ai_impact_summary: "Generative AI produces serviceable ad copy at scale. Premium creative work and brand strategy still need human insight.",
    related_sector: "Marketing", employment_count: 48000, median_salary: 65000
  },
  {
    title: "Agricultural Engineer", title_slug: "agricultural-engineer", category: "Engineering",
    automation_probability: 0.30, description: "Designs equipment and systems for agricultural production and processing.",
    key_tasks: ["Design farm equipment","Improve irrigation systems","Develop food processing methods","Analyze environmental impact"],
    risk_factors: ["AI-optimized design tools","Simulation automation"],
    safe_factors: ["Field-specific expertise","On-site problem solving","Interdisciplinary innovation"],
    ai_impact_summary: "AI assists with design optimization and data analysis. Field expertise and creative engineering remain human-essential.",
    related_sector: "Agriculture", employment_count: 3000, median_salary: 82000
  },
  {
    title: "Agricultural Scientist", title_slug: "agricultural-scientist", category: "Science",
    automation_probability: 0.25, description: "Researches methods to improve crop yields, soil health, and agricultural sustainability.",
    key_tasks: ["Conduct field experiments","Analyze crop data","Develop new farming techniques","Publish research findings"],
    risk_factors: ["AI data analysis","Automated experiment monitoring"],
    safe_factors: ["Hypothesis generation","Field research","Interdisciplinary synthesis"],
    ai_impact_summary: "AI accelerates data analysis and pattern recognition. Original research design and field work remain human domains.",
    related_sector: "Agriculture", employment_count: 35000, median_salary: 74000
  },
  {
    title: "AI Research Scientist", title_slug: "ai-research-scientist", category: "Technology",
    automation_probability: 0.15, description: "Conducts fundamental research to advance artificial intelligence capabilities.",
    key_tasks: ["Design novel algorithms","Publish research papers","Train experimental models","Collaborate across teams"],
    risk_factors: ["AI-assisted code generation","Automated hyperparameter tuning"],
    safe_factors: ["Novel research ideation","Cross-disciplinary insight","Scientific rigor"],
    ai_impact_summary: "AI tools assist with experimentation but cannot replace creative research direction. This field grows with AI advancement.",
    related_sector: "Tech", employment_count: 25000, median_salary: 165000
  },
  {
    title: "Air Quality Engineer", title_slug: "air-quality-engineer", category: "Engineering",
    automation_probability: 0.28, description: "Monitors and develops solutions to control air pollution and ensure regulatory compliance.",
    key_tasks: ["Monitor air quality data","Design emission controls","Ensure regulatory compliance","Conduct environmental assessments"],
    risk_factors: ["Automated monitoring sensors","AI regulatory analysis"],
    safe_factors: ["Engineering judgment","Regulatory negotiation","Site-specific solutions"],
    ai_impact_summary: "IoT sensors and AI improve monitoring efficiency. Engineering solutions and compliance navigation need human expertise.",
    related_sector: "Engineering", employment_count: 18000, median_salary: 78000
  },
  {
    title: "Aircraft Maintenance Technician", title_slug: "aircraft-maintenance-technician", category: "Trades",
    automation_probability: 0.20, description: "Inspects, repairs, and maintains aircraft to ensure safe flight operations.",
    key_tasks: ["Inspect aircraft systems","Perform scheduled maintenance","Diagnose mechanical issues","Document repairs"],
    risk_factors: ["Predictive maintenance AI","Automated diagnostics"],
    safe_factors: ["Safety-critical manual work","Physical dexterity","Regulatory requirements"],
    ai_impact_summary: "AI predictive maintenance helps prioritize repairs. Hands-on inspection and repair remain essential for flight safety.",
    related_sector: "Transportation", employment_count: 165000, median_salary: 67000
  },
  {
    title: "Allergist", title_slug: "allergist", category: "Healthcare",
    automation_probability: 0.10, description: "Diagnoses and treats allergies and immune system disorders.",
    key_tasks: ["Perform allergy testing","Diagnose immune disorders","Prescribe treatments","Develop immunotherapy plans"],
    risk_factors: ["AI diagnostic support tools"],
    safe_factors: ["Patient examination","Complex diagnosis","Treatment personalization"],
    ai_impact_summary: "AI assists with pattern recognition in testing results. Clinical judgment and patient care remain firmly human.",
    related_sector: "Healthcare", employment_count: 8000, median_salary: 280000
  },
  {
    title: "Ambulance Driver", title_slug: "ambulance-driver", category: "Transportation",
    automation_probability: 0.55, description: "Drives ambulances and assists with patient transport during medical emergencies.",
    key_tasks: ["Drive emergency vehicles","Navigate to emergencies","Assist paramedics","Maintain vehicle readiness"],
    risk_factors: ["Autonomous vehicle technology","GPS route optimization"],
    safe_factors: ["Emergency decision-making","Patient assistance","Unpredictable conditions"],
    ai_impact_summary: "Autonomous driving may eventually impact this role. Emergency situations and patient care require human presence for now.",
    related_sector: "Healthcare", employment_count: 20000, median_salary: 36000
  },
  {
    title: "Animal Control Officer", title_slug: "animal-control-officer", category: "Government",
    automation_probability: 0.22, description: "Enforces animal-related laws and responds to calls about stray or dangerous animals.",
    key_tasks: ["Respond to animal complaints","Capture stray animals","Investigate animal cruelty","Enforce animal ordinances"],
    risk_factors: ["Automated tracking systems","AI dispatch"],
    safe_factors: ["Physical animal handling","Public safety judgment","Unpredictable situations"],
    ai_impact_summary: "AI can improve dispatch and tracking. Physical animal handling and judgment calls in the field require humans.",
    related_sector: "Government", employment_count: 15000, median_salary: 40000
  },
  {
    title: "Anesthesiology Assistant", title_slug: "anesthesiology-assistant", category: "Healthcare",
    automation_probability: 0.14, description: "Assists anesthesiologists in administering anesthesia during surgical procedures.",
    key_tasks: ["Prepare anesthesia equipment","Monitor patient vitals","Assist during procedures","Manage airway devices"],
    risk_factors: ["Automated monitoring systems"],
    safe_factors: ["Critical patient safety","Physical intervention","Real-time clinical judgment"],
    ai_impact_summary: "AI monitoring enhances safety but cannot replace hands-on clinical skills. This role remains essential in operating rooms.",
    related_sector: "Healthcare", employment_count: 5000, median_salary: 120000
  },
  {
    title: "API Developer", title_slug: "api-developer", category: "Technology",
    automation_probability: 0.38, description: "Designs and builds application programming interfaces for software systems.",
    key_tasks: ["Design API specifications","Write integration code","Document endpoints","Optimize performance"],
    risk_factors: ["AI code generation","Low-code API platforms","Auto-documentation"],
    safe_factors: ["System architecture decisions","Security design","Complex integrations"],
    ai_impact_summary: "AI accelerates API scaffolding and documentation. Architecture decisions and complex integration logic need human developers.",
    related_sector: "Tech", employment_count: 85000, median_salary: 115000
  },
  {
    title: "Application Security Engineer", title_slug: "application-security-engineer", category: "Technology",
    automation_probability: 0.22, description: "Identifies and fixes security vulnerabilities in software applications.",
    key_tasks: ["Perform security audits","Review code for vulnerabilities","Implement security controls","Respond to incidents"],
    risk_factors: ["Automated vulnerability scanning","AI code review"],
    safe_factors: ["Adversarial thinking","Novel threat response","Security architecture"],
    ai_impact_summary: "AI improves vulnerability detection speed. Creative adversarial thinking and incident response require human security experts.",
    related_sector: "Tech", employment_count: 55000, median_salary: 130000
  },
  {
    title: "Appliance Repair Technician", title_slug: "appliance-repair-technician", category: "Trades",
    automation_probability: 0.30, description: "Diagnoses and repairs household and commercial appliances.",
    key_tasks: ["Diagnose appliance problems","Replace faulty parts","Test repaired equipment","Advise customers"],
    risk_factors: ["AI diagnostic tools","Self-diagnosing appliances"],
    safe_factors: ["Physical repair work","Customer homes access","Varied equipment types"],
    ai_impact_summary: "Smart appliances may self-diagnose issues. Physical repair and varied home environments still need skilled technicians.",
    related_sector: "Trades", employment_count: 55000, median_salary: 44000
  },
  {
    title: "Arbitrator", title_slug: "arbitrator", category: "Legal",
    automation_probability: 0.30, description: "Resolves disputes outside of court by hearing arguments and making binding decisions.",
    key_tasks: ["Hear dispute arguments","Review evidence","Render binding decisions","Facilitate negotiations"],
    risk_factors: ["AI-assisted legal research","Online dispute resolution platforms"],
    safe_factors: ["Nuanced judgment","Credibility assessment","Stakeholder management"],
    ai_impact_summary: "AI aids legal research and simple dispute resolution. Complex arbitration requires human judgment and credibility assessment.",
    related_sector: "Legal", employment_count: 8000, median_salary: 75000
  },
  {
    title: "Art Therapist", title_slug: "art-therapist", category: "Healthcare",
    automation_probability: 0.08, description: "Uses creative art processes to improve patients' mental health and emotional well-being.",
    key_tasks: ["Facilitate art-based therapy","Assess patient progress","Develop treatment plans","Collaborate with care teams"],
    risk_factors: ["AI art generation tools for exercises"],
    safe_factors: ["Deep empathy","Therapeutic relationship","Creative facilitation"],
    ai_impact_summary: "AI cannot replicate the therapeutic relationship central to art therapy. This role remains highly resistant to automation.",
    related_sector: "Healthcare", employment_count: 7000, median_salary: 52000
  },
  {
    title: "Artificial Intelligence Trainer", title_slug: "ai-trainer", category: "Technology",
    automation_probability: 0.55, description: "Labels data, evaluates AI outputs, and provides feedback to improve machine learning models.",
    key_tasks: ["Label training data","Evaluate model outputs","Write quality guidelines","Provide feedback annotations"],
    risk_factors: ["Self-improving AI models","Synthetic data generation","Automated evaluation"],
    safe_factors: ["Nuanced quality judgment","Domain expertise","Edge case identification"],
    ai_impact_summary: "Paradoxically, AI training roles may be reduced by the AI they help create. Complex evaluation tasks will persist longer.",
    related_sector: "Tech", employment_count: 60000, median_salary: 55000
  },
  {
    title: "Assembler", title_slug: "assembler", category: "Manufacturing",
    automation_probability: 0.82, description: "Puts together components to build products on assembly lines or workstations.",
    key_tasks: ["Assemble product components","Follow assembly instructions","Inspect finished products","Maintain workstation"],
    risk_factors: ["Robotic assembly","Computer vision QC","Standardized processes"],
    safe_factors: ["Fine motor dexterity for small parts","Custom assembly"],
    ai_impact_summary: "Robots increasingly handle repetitive assembly tasks. Custom and delicate assembly work retains some human need.",
    related_sector: "Manufacturing", employment_count: 1800000, median_salary: 36000
  },
  {
    title: "Auctioneer", title_slug: "auctioneer", category: "Sales",
    automation_probability: 0.60, description: "Conducts auctions by calling bids and facilitating the sale of goods and property.",
    key_tasks: ["Call auction bids","Evaluate items for sale","Market auction events","Manage buyer relationships"],
    risk_factors: ["Online auction platforms","AI pricing algorithms","Digital bidding"],
    safe_factors: ["Live event showmanship","Authentication expertise","Relationship building"],
    ai_impact_summary: "Online platforms replace many traditional auctions. Live specialty auctions and high-value items still benefit from human auctioneers.",
    related_sector: "Sales", employment_count: 15000, median_salary: 55000
  },
  {
    title: "Audio Engineer", title_slug: "audio-engineer", category: "Creative",
    automation_probability: 0.35, description: "Records, mixes, and produces audio for music, film, and media projects.",
    key_tasks: ["Record audio sessions","Mix and master tracks","Operate studio equipment","Collaborate with artists"],
    risk_factors: ["AI mixing and mastering tools","Automated audio processing"],
    safe_factors: ["Creative ear and taste","Artist collaboration","Live sound expertise"],
    ai_impact_summary: "AI tools handle basic mixing and mastering. Creative decision-making and artist relationships keep this role human-centered.",
    related_sector: "Media", employment_count: 35000, median_salary: 58000
  },
  {
    title: "Audiologist", title_slug: "audiologist", category: "Healthcare",
    automation_probability: 0.12, description: "Diagnoses and treats hearing and balance disorders.",
    key_tasks: ["Conduct hearing tests","Fit hearing aids","Diagnose balance disorders","Develop treatment plans"],
    risk_factors: ["AI hearing test apps","Direct-to-consumer hearing aids"],
    safe_factors: ["Clinical examination","Complex diagnosis","Patient counseling"],
    ai_impact_summary: "Consumer hearing devices may reduce simple cases. Complex diagnosis and rehabilitation require audiologist expertise.",
    related_sector: "Healthcare", employment_count: 14000, median_salary: 82000
  },
  {
    title: "Audit Manager", title_slug: "audit-manager", category: "Finance",
    automation_probability: 0.40, description: "Oversees audit engagements and ensures compliance with financial regulations.",
    key_tasks: ["Plan audit engagements","Supervise audit teams","Review audit findings","Report to stakeholders"],
    risk_factors: ["AI-powered audit analytics","Automated testing","Continuous auditing tools"],
    safe_factors: ["Professional judgment","Client management","Regulatory interpretation"],
    ai_impact_summary: "AI automates routine audit testing and data analysis. Professional judgment and stakeholder management remain human-driven.",
    related_sector: "Finance", employment_count: 65000, median_salary: 110000
  },
  {
    title: "Auto Body Repairer", title_slug: "auto-body-repairer", category: "Trades",
    automation_probability: 0.35, description: "Repairs and refinishes damaged vehicle bodies using specialized tools and techniques.",
    key_tasks: ["Assess body damage","Reshape metal panels","Apply body filler and paint","Align vehicle frames"],
    risk_factors: ["AI damage estimation","Robotic painting"],
    safe_factors: ["Skilled manual work","Custom repair judgment","Varied damage types"],
    ai_impact_summary: "AI assists with damage estimation and color matching. Physical repair work requires skilled human craftsmanship.",
    related_sector: "Trades", employment_count: 160000, median_salary: 48000
  },
  {
    title: "Automation Engineer", title_slug: "automation-engineer", category: "Technology",
    automation_probability: 0.20, description: "Designs and implements automated systems and processes for manufacturing or software.",
    key_tasks: ["Design automation systems","Program controllers","Integrate automated workflows","Optimize processes"],
    risk_factors: ["AI-generated automation scripts","Self-configuring systems"],
    safe_factors: ["Complex system design","Cross-domain expertise","Novel problem solving"],
    ai_impact_summary: "Ironically, automation engineers benefit from AI tools. Their expertise in designing complex systems grows more valuable.",
    related_sector: "Tech", employment_count: 80000, median_salary: 105000
  },
  {
    title: "Automotive Designer", title_slug: "automotive-designer", category: "Creative",
    automation_probability: 0.25, description: "Creates visual designs for vehicle exteriors, interiors, and components.",
    key_tasks: ["Sketch vehicle concepts","Create 3D models","Collaborate with engineers","Present designs to stakeholders"],
    risk_factors: ["AI generative design","Automated rendering"],
    safe_factors: ["Aesthetic vision","Brand identity","Physical ergonomics"],
    ai_impact_summary: "AI generates design variations rapidly. Human designers provide creative vision and brand-specific aesthetic judgment.",
    related_sector: "Manufacturing", employment_count: 8000, median_salary: 85000
  },
  {
    title: "Aviation Inspector", title_slug: "aviation-inspector", category: "Government",
    automation_probability: 0.18, description: "Inspects aircraft and aviation facilities to ensure compliance with safety regulations.",
    key_tasks: ["Inspect aircraft","Review maintenance records","Enforce FAA regulations","Issue safety directives"],
    risk_factors: ["AI-assisted inspection tools","Drone inspections"],
    safe_factors: ["Safety-critical judgment","Regulatory authority","Physical inspection"],
    ai_impact_summary: "AI and drones assist with visual inspections. Regulatory judgment and safety decisions require experienced human inspectors.",
    related_sector: "Government", employment_count: 5000, median_salary: 78000
  },
  {
    title: "Bailiff", title_slug: "bailiff", category: "Legal",
    automation_probability: 0.35, description: "Maintains order in courtrooms and ensures the safety of court proceedings.",
    key_tasks: ["Maintain courtroom order","Escort prisoners","Enforce court rules","Assist judges"],
    risk_factors: ["Security technology improvements","AI surveillance"],
    safe_factors: ["Physical presence required","Authority and judgment","Unpredictable situations"],
    ai_impact_summary: "Security tech aids monitoring. Physical presence and authority in courtrooms cannot be replaced by AI.",
    related_sector: "Legal", employment_count: 18000, median_salary: 48000
  },
  {
    title: "Banking Relationship Manager", title_slug: "banking-relationship-manager", category: "Finance",
    automation_probability: 0.40, description: "Manages client relationships and provides personalized banking solutions.",
    key_tasks: ["Manage client portfolios","Advise on banking products","Cross-sell services","Resolve client issues"],
    risk_factors: ["Digital banking platforms","AI financial advisors","Robo-advisory"],
    safe_factors: ["High-net-worth client relationships","Complex financial structuring"],
    ai_impact_summary: "Digital banking handles routine transactions. Complex wealth management and relationship building need human bankers.",
    related_sector: "Finance", employment_count: 120000, median_salary: 72000
  },
  {
    title: "Barber", title_slug: "barber", category: "Trades",
    automation_probability: 0.08, description: "Cuts, trims, and styles hair and provides grooming services.",
    key_tasks: ["Cut and style hair","Trim beards","Advise on hair care","Maintain sanitation"],
    risk_factors: ["Very limited automation potential"],
    safe_factors: ["Physical dexterity","Personal service","Creative styling"],
    ai_impact_summary: "Hair cutting requires precise manual skill and personal interaction. This role is highly resistant to AI automation.",
    related_sector: "Personal Services", employment_count: 85000, median_salary: 35000
  },
  {
    title: "Barista", title_slug: "barista", category: "Food Service",
    automation_probability: 0.65, description: "Prepares and serves coffee beverages and other drinks in cafes and coffee shops.",
    key_tasks: ["Prepare coffee drinks","Operate espresso machines","Handle customer orders","Maintain cleanliness"],
    risk_factors: ["Robotic barista machines","Automated ordering kiosks","Self-serve systems"],
    safe_factors: ["Customer interaction","Craft beverage expertise","Ambiance creation"],
    ai_impact_summary: "Automated coffee machines can replicate standard drinks. Craft coffee culture and customer experience keep human baristas relevant.",
    related_sector: "Food Service", employment_count: 280000, median_salary: 30000
  },
  {
    title: "Benefits Coordinator", title_slug: "benefits-coordinator", category: "HR",
    automation_probability: 0.62, description: "Administers employee benefits programs including health insurance, retirement, and leave.",
    key_tasks: ["Enroll employees in benefits","Answer benefits questions","Process claims","Coordinate with providers"],
    risk_factors: ["Self-service benefits portals","AI chatbots","Automated enrollment"],
    safe_factors: ["Complex benefits counseling","Regulatory compliance","Employee advocacy"],
    ai_impact_summary: "Self-service portals and chatbots handle routine benefits inquiries. Complex cases and compliance work need human coordinators.",
    related_sector: "Business Services", employment_count: 110000, median_salary: 52000
  },
  {
    title: "Bill Collector", title_slug: "bill-collector", category: "Finance",
    automation_probability: 0.74, description: "Contacts debtors to arrange payment of overdue bills and accounts.",
    key_tasks: ["Contact debtors","Negotiate payment plans","Track accounts","Document collection activities"],
    risk_factors: ["AI-powered collection calls","Automated payment systems","Predictive analytics"],
    safe_factors: ["Negotiation skills","Legal compliance judgment"],
    ai_impact_summary: "AI handles routine collection contacts and payment reminders. Complex negotiations and compliance decisions need humans.",
    related_sector: "Finance", employment_count: 250000, median_salary: 38000
  },
  {
    title: "Bioinformatics Scientist", title_slug: "bioinformatics-scientist", category: "Science",
    automation_probability: 0.22, description: "Applies computational methods to analyze biological data such as genomic sequences.",
    key_tasks: ["Analyze genomic data","Develop computational pipelines","Interpret biological patterns","Publish research"],
    risk_factors: ["AI-automated analysis pipelines","AutoML for biology"],
    safe_factors: ["Cross-disciplinary expertise","Novel research questions","Biological interpretation"],
    ai_impact_summary: "AI accelerates data processing and pattern detection. Biological interpretation and research design need human scientists.",
    related_sector: "Healthcare", employment_count: 20000, median_salary: 95000
  },
  {
    title: "Biostatistician", title_slug: "biostatistician", category: "Science",
    automation_probability: 0.28, description: "Designs studies and analyzes data from biological and health research.",
    key_tasks: ["Design clinical trials","Perform statistical analyses","Interpret study results","Write analysis reports"],
    risk_factors: ["Automated statistical analysis","AI study design tools"],
    safe_factors: ["Study design expertise","Regulatory requirements","Complex interpretation"],
    ai_impact_summary: "AI assists with routine analyses. Study design, regulatory compliance, and nuanced interpretation require human biostatisticians.",
    related_sector: "Healthcare", employment_count: 15000, median_salary: 98000
  },
  {
    title: "Blockchain Developer", title_slug: "blockchain-developer", category: "Technology",
    automation_probability: 0.28, description: "Develops decentralized applications and smart contracts on blockchain platforms.",
    key_tasks: ["Write smart contracts","Build dApps","Audit blockchain code","Design consensus mechanisms"],
    risk_factors: ["AI code generation","Smart contract templates"],
    safe_factors: ["Security-critical code","Novel protocol design","Cryptographic expertise"],
    ai_impact_summary: "AI assists with boilerplate code. Security-critical smart contract design and protocol innovation require human expertise.",
    related_sector: "Tech", employment_count: 30000, median_salary: 140000
  },
  {
    title: "Brand Manager", title_slug: "brand-manager", category: "Marketing",
    automation_probability: 0.28, description: "Develops and executes brand strategy to build market presence and customer loyalty.",
    key_tasks: ["Develop brand strategy","Manage brand identity","Analyze market positioning","Coordinate campaigns"],
    risk_factors: ["AI market analysis","Automated A/B testing","Data-driven branding"],
    safe_factors: ["Strategic vision","Creative direction","Cultural intuition"],
    ai_impact_summary: "AI provides market insights and performance data. Brand strategy and creative direction require human cultural understanding.",
    related_sector: "Marketing", employment_count: 55000, median_salary: 95000
  },
  {
    title: "Broadcast Journalist", title_slug: "broadcast-journalist", category: "Media",
    automation_probability: 0.38, description: "Reports news stories for television, radio, and online broadcast platforms.",
    key_tasks: ["Research stories","Conduct interviews","Write and deliver reports","Edit broadcast segments"],
    risk_factors: ["AI news writing","Automated video editing","Synthetic anchors"],
    safe_factors: ["Investigative judgment","On-location reporting","Source relationships"],
    ai_impact_summary: "AI generates basic news reports and summaries. Investigative reporting and on-ground journalism remain human-essential.",
    related_sector: "Media", employment_count: 45000, median_salary: 52000
  },
  {
    title: "Building Automation Technician", title_slug: "building-automation-technician", category: "Trades",
    automation_probability: 0.35, description: "Installs and maintains automated building systems for HVAC, lighting, and security.",
    key_tasks: ["Install control systems","Program building automation","Troubleshoot system issues","Maintain equipment"],
    risk_factors: ["Self-diagnosing systems","Remote monitoring AI"],
    safe_factors: ["Physical installation","System integration","On-site troubleshooting"],
    ai_impact_summary: "Smart building AI improves remote diagnostics. Physical installation and complex troubleshooting need skilled technicians.",
    related_sector: "Trades", employment_count: 40000, median_salary: 58000
  },
  {
    title: "Building Inspector", title_slug: "building-inspector", category: "Government",
    automation_probability: 0.25, description: "Examines buildings and structures to ensure compliance with codes and regulations.",
    key_tasks: ["Inspect construction sites","Review building plans","Enforce building codes","Issue permits"],
    risk_factors: ["Drone inspections","AI code compliance checking"],
    safe_factors: ["Physical inspection judgment","Regulatory authority","Safety assessment"],
    ai_impact_summary: "AI and drones assist with plan review and visual inspection. Human judgment for safety and code compliance remains critical.",
    related_sector: "Government", employment_count: 120000, median_salary: 63000
  },
  {
    title: "Business Continuity Planner", title_slug: "business-continuity-planner", category: "Operations",
    automation_probability: 0.32, description: "Develops plans to ensure business operations continue during and after disruptions.",
    key_tasks: ["Assess business risks","Develop recovery plans","Conduct drills","Update continuity strategies"],
    risk_factors: ["AI risk modeling","Automated plan generation"],
    safe_factors: ["Organizational knowledge","Stakeholder coordination","Crisis management"],
    ai_impact_summary: "AI improves risk modeling and scenario planning. Human expertise in stakeholder coordination and crisis response is essential.",
    related_sector: "Business Services", employment_count: 25000, median_salary: 82000
  },
  {
    title: "Business Intelligence Analyst", title_slug: "business-intelligence-analyst", category: "Technology",
    automation_probability: 0.48, description: "Analyzes business data and creates reports to support organizational decision-making.",
    key_tasks: ["Build dashboards","Analyze business metrics","Create data visualizations","Present insights to leadership"],
    risk_factors: ["AI-powered analytics","Natural language BI queries","Automated reporting"],
    safe_factors: ["Business context understanding","Strategic recommendations","Stakeholder communication"],
    ai_impact_summary: "AI automates routine reporting and dashboarding. Strategic interpretation and stakeholder advisory roles persist.",
    related_sector: "Tech", employment_count: 95000, median_salary: 92000
  },
  {
    title: "Buyer", title_slug: "buyer", category: "Operations",
    automation_probability: 0.55, description: "Purchases goods and services for organizations at optimal cost and quality.",
    key_tasks: ["Source suppliers","Negotiate contracts","Manage purchase orders","Evaluate vendor performance"],
    risk_factors: ["AI procurement platforms","Automated purchasing","Price optimization AI"],
    safe_factors: ["Supplier relationship management","Complex negotiations","Quality judgment"],
    ai_impact_summary: "AI automates routine purchasing and price comparisons. Strategic sourcing and supplier relationships need human buyers.",
    related_sector: "Business Services", employment_count: 180000, median_salary: 58000
  },
  {
    title: "CAD Technician", title_slug: "cad-technician", category: "Engineering",
    automation_probability: 0.62, description: "Creates detailed technical drawings and plans using computer-aided design software.",
    key_tasks: ["Create CAD drawings","Convert sketches to digital","Maintain drawing databases","Support engineering teams"],
    risk_factors: ["AI-generated designs","Parametric modeling","Automated drafting"],
    safe_factors: ["Complex custom designs","Engineering communication","Quality standards"],
    ai_impact_summary: "AI generative design tools automate standard drafting work. Complex and custom design tasks still require skilled technicians.",
    related_sector: "Engineering", employment_count: 70000, median_salary: 55000
  },
  {
    title: "Call Center Manager", title_slug: "call-center-manager", category: "Operations",
    automation_probability: 0.42, description: "Oversees call center operations, staff performance, and customer service quality.",
    key_tasks: ["Manage call center staff","Monitor service metrics","Implement process improvements","Handle escalations"],
    risk_factors: ["AI call routing","Chatbot deflection","Automated quality monitoring"],
    safe_factors: ["People management","Strategic planning","Complex escalations"],
    ai_impact_summary: "AI handles more customer interactions, reducing staff needs. Managers shift focus to AI oversight and complex cases.",
    related_sector: "Business Services", employment_count: 45000, median_salary: 62000
  },
  {
    title: "Campaign Manager", title_slug: "campaign-manager", category: "Marketing",
    automation_probability: 0.35, description: "Plans and executes marketing or political campaigns to achieve specific goals.",
    key_tasks: ["Develop campaign strategy","Manage budgets","Coordinate teams","Analyze campaign performance"],
    risk_factors: ["AI ad optimization","Automated targeting","Predictive analytics"],
    safe_factors: ["Strategic vision","Creative direction","Stakeholder management"],
    ai_impact_summary: "AI optimizes campaign targeting and bidding. Strategic planning and creative direction remain human-driven.",
    related_sector: "Marketing", employment_count: 35000, median_salary: 68000
  },
  {
    title: "Career Counselor", title_slug: "career-counselor", category: "Education",
    automation_probability: 0.30, description: "Helps individuals explore career options and develop professional development plans.",
    key_tasks: ["Assess career interests","Provide job market guidance","Review resumes","Conduct mock interviews"],
    risk_factors: ["AI career matching platforms","Automated resume review"],
    safe_factors: ["Personal motivation coaching","Complex life situation guidance","Empathetic listening"],
    ai_impact_summary: "AI provides career matching and resume feedback. Personal coaching and life-context guidance need human counselors.",
    related_sector: "Education", employment_count: 70000, median_salary: 50000
  },
  {
    title: "Cargo Inspector", title_slug: "cargo-inspector", category: "Transportation",
    automation_probability: 0.52, description: "Inspects cargo and freight to ensure compliance with shipping regulations and safety standards.",
    key_tasks: ["Inspect cargo shipments","Verify documentation","Check hazardous materials compliance","Report violations"],
    risk_factors: ["AI scanning technology","Automated documentation checks","IoT sensors"],
    safe_factors: ["Physical inspection","Judgment on ambiguous cases","Regulatory authority"],
    ai_impact_summary: "AI and sensors improve scanning efficiency. Physical inspection and regulatory judgment for complex cases remain human tasks.",
    related_sector: "Transportation", employment_count: 25000, median_salary: 52000
  },
  {
    title: "Cartographer", title_slug: "cartographer", category: "Science",
    automation_probability: 0.55, description: "Creates maps and visual representations of geographic data.",
    key_tasks: ["Collect geographic data","Design map layouts","Use GIS software","Analyze spatial data"],
    risk_factors: ["AI map generation","Satellite imagery automation","GIS automation"],
    safe_factors: ["Custom visualization design","Specialized mapping needs"],
    ai_impact_summary: "AI automates standard map generation from satellite data. Custom and specialized cartographic work retains human value.",
    related_sector: "Science", employment_count: 12000, median_salary: 68000
  },
  {
    title: "Casino Dealer", title_slug: "casino-dealer", category: "Retail",
    automation_probability: 0.55, description: "Operates table games and manages gameplay in casinos.",
    key_tasks: ["Deal cards","Manage game tables","Calculate payouts","Monitor for cheating"],
    risk_factors: ["Electronic table games","Online gambling growth","Automated dealers"],
    safe_factors: ["Entertainment experience","Customer interaction","Surveillance role"],
    ai_impact_summary: "Electronic and online gaming reduce need for live dealers. Premium casino experiences still value human entertainment.",
    related_sector: "Entertainment", employment_count: 85000, median_salary: 35000
  },
  {
    title: "Catering Manager", title_slug: "catering-manager", category: "Food Service",
    automation_probability: 0.28, description: "Plans and coordinates catering services for events and functions.",
    key_tasks: ["Plan event menus","Coordinate staff","Manage budgets","Ensure food quality"],
    risk_factors: ["AI event planning tools","Automated ordering systems"],
    safe_factors: ["Client relationship management","On-site coordination","Creative menu design"],
    ai_impact_summary: "AI assists with planning and logistics. Client relationships and on-site event management need human catering managers.",
    related_sector: "Food Service", employment_count: 30000, median_salary: 55000
  },
  {
    title: "Cement Mason", title_slug: "cement-mason", category: "Trades",
    automation_probability: 0.35, description: "Finishes and smooths concrete surfaces for construction projects.",
    key_tasks: ["Pour concrete","Smooth and finish surfaces","Set forms","Repair concrete structures"],
    risk_factors: ["3D printing concrete","Automated finishing machines"],
    safe_factors: ["Skilled manual craft","Variable site conditions","Quality finishing"],
    ai_impact_summary: "Concrete 3D printing is emerging but limited. Skilled finishing and repair work in varied conditions need human masons.",
    related_sector: "Construction", employment_count: 55000, median_salary: 48000
  },
  {
    title: "Change Management Consultant", title_slug: "change-management-consultant", category: "Consulting",
    automation_probability: 0.25, description: "Guides organizations through transformational changes in processes, technology, and culture.",
    key_tasks: ["Assess organizational readiness","Design change strategies","Train stakeholders","Monitor adoption"],
    risk_factors: ["AI analytics for change tracking","Automated training tools"],
    safe_factors: ["Human psychology expertise","Stakeholder influence","Organizational politics"],
    ai_impact_summary: "AI aids in tracking adoption metrics. Understanding human resistance and navigating organizational politics requires human consultants.",
    related_sector: "Consulting", employment_count: 35000, median_salary: 95000
  },
  {
    title: "Chaplain", title_slug: "chaplain", category: "Healthcare",
    automation_probability: 0.05, description: "Provides spiritual care and emotional support in hospitals, military, and institutions.",
    key_tasks: ["Provide spiritual counseling","Support patients and families","Lead religious services","Offer crisis support"],
    risk_factors: ["Essentially none"],
    safe_factors: ["Deep human empathy","Spiritual connection","Crisis presence"],
    ai_impact_summary: "Spiritual care is fundamentally human. AI has virtually no role in replacing the empathetic presence chaplains provide.",
    related_sector: "Healthcare", employment_count: 40000, median_salary: 55000
  },
  {
    title: "Chief Data Officer", title_slug: "chief-data-officer", category: "Technology",
    automation_probability: 0.12, description: "Leads organizational data strategy, governance, and analytics initiatives.",
    key_tasks: ["Set data strategy","Oversee data governance","Drive analytics adoption","Manage data teams"],
    risk_factors: ["AI-powered analytics reducing team size"],
    safe_factors: ["Executive leadership","Strategic vision","Organizational influence"],
    ai_impact_summary: "AI makes data more accessible but increases the need for strategic data leadership. CDOs become more important, not less.",
    related_sector: "Tech", employment_count: 15000, median_salary: 200000
  },
  {
    title: "Chief Marketing Officer", title_slug: "chief-marketing-officer", category: "Marketing",
    automation_probability: 0.10, description: "Leads marketing strategy and brand development for organizations.",
    key_tasks: ["Set marketing strategy","Manage brand portfolio","Oversee campaigns","Drive revenue growth"],
    risk_factors: ["AI marketing analytics","Automated campaign optimization"],
    safe_factors: ["Executive leadership","Creative vision","Market intuition"],
    ai_impact_summary: "AI empowers marketing with better analytics. Strategic vision and creative leadership require human CMOs.",
    related_sector: "Marketing", employment_count: 20000, median_salary: 180000
  },
  {
    title: "Child Psychologist", title_slug: "child-psychologist", category: "Healthcare",
    automation_probability: 0.08, description: "Assesses and treats mental health and developmental issues in children.",
    key_tasks: ["Conduct psychological assessments","Provide therapy","Develop treatment plans","Consult with parents and schools"],
    risk_factors: ["AI screening tools"],
    safe_factors: ["Child rapport building","Play-based assessment","Family dynamics understanding"],
    ai_impact_summary: "AI may assist with initial screenings. Therapeutic relationships with children require human empathy and specialized skills.",
    related_sector: "Healthcare", employment_count: 30000, median_salary: 85000
  },
  {
    title: "Chimney Sweep", title_slug: "chimney-sweep", category: "Trades",
    automation_probability: 0.25, description: "Cleans and inspects chimneys and fireplaces to ensure safe operation.",
    key_tasks: ["Clean chimneys","Inspect for damage","Remove blockages","Advise on maintenance"],
    risk_factors: ["Drone inspection assistance"],
    safe_factors: ["Physical climbing required","Varied home conditions","Safety assessment"],
    ai_impact_summary: "Camera drones may assist inspection. Physical cleaning and on-site safety assessment need human chimney sweeps.",
    related_sector: "Trades", employment_count: 15000, median_salary: 42000
  },
  {
    title: "City Planner", title_slug: "city-planner", category: "Government",
    automation_probability: 0.22, description: "Develops plans and programs for land use in urban and suburban areas.",
    key_tasks: ["Develop land use plans","Analyze zoning proposals","Conduct community meetings","Review development applications"],
    risk_factors: ["AI urban simulation","GIS automation","Data-driven planning tools"],
    safe_factors: ["Community engagement","Political navigation","Value-based decisions"],
    ai_impact_summary: "AI improves urban modeling and data analysis. Community engagement and policy decisions require human planners.",
    related_sector: "Government", employment_count: 40000, median_salary: 78000
  },
  {
    title: "Claims Analyst", title_slug: "claims-analyst", category: "Finance",
    automation_probability: 0.72, description: "Reviews and processes insurance claims to determine coverage and payment amounts.",
    key_tasks: ["Review claim submissions","Verify coverage details","Calculate settlements","Detect fraudulent claims"],
    risk_factors: ["AI claims processing","Automated fraud detection","Straight-through processing"],
    safe_factors: ["Complex claim investigation","Customer dispute resolution"],
    ai_impact_summary: "AI automates routine claims processing and fraud detection. Complex and disputed claims still need human analysts.",
    related_sector: "Finance", employment_count: 150000, median_salary: 55000
  },
  {
    title: "Clinical Data Manager", title_slug: "clinical-data-manager", category: "Healthcare",
    automation_probability: 0.52, description: "Manages data collection and quality for clinical trials and medical research.",
    key_tasks: ["Design data collection systems","Monitor data quality","Resolve data queries","Ensure regulatory compliance"],
    risk_factors: ["Automated data cleaning","AI quality checks","Electronic data capture"],
    safe_factors: ["Regulatory expertise","Complex query resolution","Protocol interpretation"],
    ai_impact_summary: "AI automates data cleaning and quality checks. Regulatory compliance and complex data interpretation remain human responsibilities.",
    related_sector: "Healthcare", employment_count: 25000, median_salary: 88000
  },
  {
    title: "Clinical Research Coordinator", title_slug: "clinical-research-coordinator", category: "Healthcare",
    automation_probability: 0.28, description: "Manages day-to-day operations of clinical trials including patient recruitment and data collection.",
    key_tasks: ["Recruit study participants","Coordinate study visits","Collect clinical data","Ensure protocol compliance"],
    risk_factors: ["AI patient matching","Electronic data capture","Automated scheduling"],
    safe_factors: ["Patient interaction","Protocol judgment","Multi-stakeholder coordination"],
    ai_impact_summary: "AI assists with patient matching and data entry. Patient relationships and protocol management need human coordinators.",
    related_sector: "Healthcare", employment_count: 80000, median_salary: 55000
  },
  {
    title: "Cloud Architect", title_slug: "cloud-architect", category: "Technology",
    automation_probability: 0.18, description: "Designs and oversees cloud computing strategies and infrastructure for organizations.",
    key_tasks: ["Design cloud architecture","Evaluate cloud services","Ensure security compliance","Optimize cloud costs"],
    risk_factors: ["AI infrastructure recommendations","Auto-scaling tools"],
    safe_factors: ["Complex system design","Security architecture","Business alignment"],
    ai_impact_summary: "AI assists with optimization and monitoring. Strategic cloud architecture decisions require experienced human architects.",
    related_sector: "Tech", employment_count: 45000, median_salary: 145000
  },
  {
    title: "Cloud Engineer", title_slug: "cloud-engineer", category: "Technology",
    automation_probability: 0.25, description: "Builds and maintains cloud infrastructure and services.",
    key_tasks: ["Deploy cloud infrastructure","Automate provisioning","Monitor cloud services","Manage security configurations"],
    risk_factors: ["Infrastructure as code automation","AI operations tools"],
    safe_factors: ["Complex troubleshooting","Architecture decisions","Security management"],
    ai_impact_summary: "AI automates routine provisioning and monitoring. Complex cloud engineering and troubleshooting need human expertise.",
    related_sector: "Tech", employment_count: 60000, median_salary: 125000
  },
  {
    title: "CNC Operator", title_slug: "cnc-operator", category: "Manufacturing",
    automation_probability: 0.65, description: "Operates computer numerical control machines to manufacture precision parts.",
    key_tasks: ["Set up CNC machines","Load programs","Monitor machining operations","Inspect finished parts"],
    risk_factors: ["Automated tool changing","AI quality monitoring","Lights-out manufacturing"],
    safe_factors: ["Machine setup expertise","Quality troubleshooting","Custom job handling"],
    ai_impact_summary: "Automation enables unmanned machining for standard parts. Setup, troubleshooting, and custom work need skilled operators.",
    related_sector: "Manufacturing", employment_count: 200000, median_salary: 45000
  },
  {
    title: "Collections Agent", title_slug: "collections-agent", category: "Finance",
    automation_probability: 0.72, description: "Contacts customers with overdue accounts to arrange payment.",
    key_tasks: ["Call debtors","Negotiate payment arrangements","Update account records","Meet collection targets"],
    risk_factors: ["AI-powered dialers","Automated payment reminders","Chatbot collections"],
    safe_factors: ["Negotiation skills","Empathy in difficult situations"],
    ai_impact_summary: "AI handles initial outreach and routine collections. Complex negotiations and sensitive situations need human agents.",
    related_sector: "Finance", employment_count: 200000, median_salary: 37000
  },
  {
    title: "Color Scientist", title_slug: "color-scientist", category: "Science",
    automation_probability: 0.42, description: "Develops and manages color formulations for manufacturing and consumer products.",
    key_tasks: ["Develop color formulas","Test color accuracy","Calibrate equipment","Consult on color standards"],
    risk_factors: ["AI color matching","Spectrophotometer automation"],
    safe_factors: ["Perceptual color judgment","Creative application","Quality standards"],
    ai_impact_summary: "AI improves color matching precision. Perceptual judgment and creative color applications need human scientists.",
    related_sector: "Manufacturing", employment_count: 5000, median_salary: 72000
  },
  {
    title: "Commercial Diver", title_slug: "commercial-diver", category: "Trades",
    automation_probability: 0.22, description: "Performs underwater work for construction, inspection, and salvage operations.",
    key_tasks: ["Conduct underwater inspections","Perform underwater welding","Operate diving equipment","Salvage materials"],
    risk_factors: ["ROV and AUV technology","Underwater drones"],
    safe_factors: ["Dexterous manual work","Unpredictable conditions","Safety-critical judgment"],
    ai_impact_summary: "ROVs handle some inspection tasks. Complex manual underwater work and emergency situations require human divers.",
    related_sector: "Construction", employment_count: 4000, median_salary: 60000
  },
  {
    title: "Commercial Real Estate Agent", title_slug: "commercial-real-estate-agent", category: "Real Estate",
    automation_probability: 0.35, description: "Facilitates the buying, selling, and leasing of commercial properties.",
    key_tasks: ["Market commercial properties","Negotiate leases","Analyze market trends","Advise clients on investments"],
    risk_factors: ["AI property valuation","Online listing platforms","Virtual tours"],
    safe_factors: ["Complex deal negotiation","Relationship building","Market expertise"],
    ai_impact_summary: "AI improves property valuations and marketing. Complex negotiations and client relationships need human agents.",
    related_sector: "Real Estate", employment_count: 80000, median_salary: 65000
  },
  {
    title: "Communications Director", title_slug: "communications-director", category: "Marketing",
    automation_probability: 0.20, description: "Leads organizational communications strategy including PR, internal comms, and media relations.",
    key_tasks: ["Develop communications strategy","Manage media relations","Oversee crisis communications","Direct content creation"],
    risk_factors: ["AI content generation","Automated media monitoring"],
    safe_factors: ["Strategic messaging","Crisis management","Stakeholder relationships"],
    ai_impact_summary: "AI assists with content drafting and media monitoring. Strategic communications and crisis management require human directors.",
    related_sector: "Marketing", employment_count: 30000, median_salary: 100000
  },
  {
    title: "Communications Specialist", title_slug: "communications-specialist", category: "Marketing",
    automation_probability: 0.45, description: "Creates and distributes organizational communications across various channels.",
    key_tasks: ["Write press releases","Create internal communications","Manage social media","Coordinate media outreach"],
    risk_factors: ["AI writing tools","Automated social posting","Content generation"],
    safe_factors: ["Brand voice maintenance","Stakeholder sensitivity","Crisis response"],
    ai_impact_summary: "AI drafts routine communications efficiently. Brand voice nuance and sensitive messaging need human specialists.",
    related_sector: "Marketing", employment_count: 120000, median_salary: 62000
  },
  {
    title: "Community Health Worker", title_slug: "community-health-worker", category: "Healthcare",
    automation_probability: 0.12, description: "Provides health education and connects underserved communities to healthcare resources.",
    key_tasks: ["Conduct health outreach","Connect patients to services","Provide health education","Advocate for community needs"],
    risk_factors: ["AI health information chatbots"],
    safe_factors: ["Community trust","Cultural competency","In-person outreach"],
    ai_impact_summary: "AI can distribute health information. Building trust in underserved communities requires human health workers.",
    related_sector: "Healthcare", employment_count: 65000, median_salary: 42000
  },
  {
    title: "Community Manager", title_slug: "community-manager", category: "Marketing",
    automation_probability: 0.38, description: "Builds and manages online communities for brands and organizations.",
    key_tasks: ["Engage community members","Moderate discussions","Plan community events","Analyze engagement metrics"],
    risk_factors: ["AI moderation tools","Automated engagement","Chatbot interactions"],
    safe_factors: ["Authentic community building","Conflict resolution","Brand advocacy"],
    ai_impact_summary: "AI assists with moderation and basic engagement. Authentic community building and conflict resolution need humans.",
    related_sector: "Marketing", employment_count: 50000, median_salary: 58000
  },
  {
    title: "Compensation Analyst", title_slug: "compensation-analyst", category: "HR",
    automation_probability: 0.55, description: "Analyzes and develops compensation structures and pay equity programs.",
    key_tasks: ["Benchmark salaries","Analyze pay equity","Design compensation structures","Prepare compensation reports"],
    risk_factors: ["AI compensation benchmarking","Automated pay analysis","Market data platforms"],
    safe_factors: ["Strategic pay decisions","Regulatory compliance","Executive compensation"],
    ai_impact_summary: "AI automates salary benchmarking and basic analysis. Strategic compensation design and equity decisions need human analysts.",
    related_sector: "Business Services", employment_count: 40000, median_salary: 72000
  },
  {
    title: "Compliance Analyst", title_slug: "compliance-analyst", category: "Finance",
    automation_probability: 0.48, description: "Monitors organizational compliance with regulations and internal policies.",
    key_tasks: ["Monitor regulatory changes","Conduct compliance reviews","Prepare compliance reports","Train staff on policies"],
    risk_factors: ["AI regulatory monitoring","Automated compliance testing","RegTech tools"],
    safe_factors: ["Regulatory interpretation","Risk judgment","Policy development"],
    ai_impact_summary: "AI monitors regulations and automates testing. Interpreting complex regulations and making risk judgments need human analysts.",
    related_sector: "Finance", employment_count: 90000, median_salary: 72000
  },
  {
    title: "Composites Technician", title_slug: "composites-technician", category: "Manufacturing",
    automation_probability: 0.45, description: "Fabricates and repairs composite material parts for aerospace and other industries.",
    key_tasks: ["Lay up composite materials","Operate autoclaves","Inspect finished parts","Repair composite structures"],
    risk_factors: ["Automated layup machines","AI inspection systems"],
    safe_factors: ["Manual repair skills","Quality judgment","Complex geometries"],
    ai_impact_summary: "Automation handles standard layup processes. Complex repairs and quality judgment need skilled composite technicians.",
    related_sector: "Manufacturing", employment_count: 30000, median_salary: 52000
  },
  {
    title: "Computer Hardware Engineer", title_slug: "computer-hardware-engineer", category: "Engineering",
    automation_probability: 0.22, description: "Designs and develops computer hardware components and systems.",
    key_tasks: ["Design circuit boards","Test hardware prototypes","Analyze performance data","Develop specifications"],
    risk_factors: ["AI-assisted chip design","Automated testing","EDA tool advances"],
    safe_factors: ["Novel hardware architecture","Physical prototyping","Cross-disciplinary design"],
    ai_impact_summary: "AI accelerates design verification and testing. Novel hardware architecture and innovation require human engineers.",
    related_sector: "Tech", employment_count: 75000, median_salary: 130000
  },
  {
    title: "Computer Vision Engineer", title_slug: "computer-vision-engineer", category: "Technology",
    automation_probability: 0.18, description: "Develops systems that enable computers to interpret and process visual information.",
    key_tasks: ["Design vision algorithms","Train image models","Optimize visual processing","Deploy vision systems"],
    risk_factors: ["AutoML for vision","Pre-trained model availability"],
    safe_factors: ["Novel application design","Edge case handling","System integration"],
    ai_impact_summary: "Pre-trained models simplify basic tasks. Novel applications and complex visual systems need human vision engineers.",
    related_sector: "Tech", employment_count: 25000, median_salary: 145000
  },
  {
    title: "Concierge", title_slug: "concierge", category: "Retail",
    automation_probability: 0.58, description: "Assists guests and residents with information, reservations, and personalized services.",
    key_tasks: ["Provide local recommendations","Make reservations","Arrange transportation","Handle special requests"],
    risk_factors: ["AI concierge apps","Chatbot services","Automated booking"],
    safe_factors: ["Personal touch","Complex request handling","VIP service"],
    ai_impact_summary: "AI handles standard recommendations and bookings. Luxury and personalized service experiences still value human concierges.",
    related_sector: "Hospitality", employment_count: 35000, median_salary: 38000
  },
  {
    title: "Conservation Scientist", title_slug: "conservation-scientist", category: "Science",
    automation_probability: 0.20, description: "Manages and protects natural resources including forests, rangelands, and waterways.",
    key_tasks: ["Monitor ecosystems","Develop conservation plans","Conduct field research","Advise landowners"],
    risk_factors: ["Remote sensing AI","Automated monitoring"],
    safe_factors: ["Field research","Stakeholder engagement","Policy advocacy"],
    ai_impact_summary: "AI enhances environmental monitoring with satellite and sensor data. Field research and policy work remain human-driven.",
    related_sector: "Government", employment_count: 25000, median_salary: 65000
  },
  {
    title: "Construction Estimator", title_slug: "construction-estimator", category: "Operations",
    automation_probability: 0.55, description: "Calculates costs for construction projects based on plans, materials, and labor requirements.",
    key_tasks: ["Review project plans","Calculate material costs","Estimate labor needs","Prepare bid proposals"],
    risk_factors: ["AI cost estimation","BIM-integrated pricing","Historical data analytics"],
    safe_factors: ["Complex project judgment","Vendor negotiation","Site-specific factors"],
    ai_impact_summary: "AI improves cost estimation accuracy for standard projects. Complex and unique projects need human estimator judgment.",
    related_sector: "Construction", employment_count: 70000, median_salary: 68000
  },
  {
    title: "Construction Superintendent", title_slug: "construction-superintendent", category: "Operations",
    automation_probability: 0.15, description: "Manages daily construction site operations and coordinates workers and subcontractors.",
    key_tasks: ["Oversee daily construction","Coordinate subcontractors","Ensure safety compliance","Manage project schedules"],
    risk_factors: ["AI scheduling tools","Drone site monitoring"],
    safe_factors: ["On-site leadership","Safety management","Problem solving under pressure"],
    ai_impact_summary: "AI assists with scheduling and monitoring. On-site leadership and real-time problem solving require human superintendents.",
    related_sector: "Construction", employment_count: 85000, median_salary: 82000
  },
  {
    title: "Content Manager", title_slug: "content-manager", category: "Marketing",
    automation_probability: 0.42, description: "Oversees content creation, curation, and distribution across organizational channels.",
    key_tasks: ["Develop content strategy","Manage editorial calendar","Oversee content creation","Analyze content performance"],
    risk_factors: ["AI content generation","Automated publishing","AI analytics"],
    safe_factors: ["Brand strategy","Quality curation","Audience understanding"],
    ai_impact_summary: "AI generates draft content and automates publishing. Strategic content direction and quality oversight need human managers.",
    related_sector: "Marketing", employment_count: 55000, median_salary: 72000
  },
  {
    title: "Content Strategist", title_slug: "content-strategist", category: "Marketing",
    automation_probability: 0.35, description: "Develops content strategies aligned with business goals and audience needs.",
    key_tasks: ["Conduct content audits","Develop content frameworks","Define audience personas","Measure content ROI"],
    risk_factors: ["AI content analysis","Automated persona generation"],
    safe_factors: ["Strategic thinking","Brand alignment","Cross-functional coordination"],
    ai_impact_summary: "AI aids content analysis and performance tracking. Strategic content planning and brand alignment require human strategists.",
    related_sector: "Marketing", employment_count: 40000, median_salary: 78000
  },
  {
    title: "Contract Administrator", title_slug: "contract-administrator", category: "Legal",
    automation_probability: 0.62, description: "Manages contract lifecycle from creation through execution and renewal.",
    key_tasks: ["Draft contracts","Track contract milestones","Manage renewals","Ensure compliance with terms"],
    risk_factors: ["AI contract review","Automated lifecycle management","CLM platforms"],
    safe_factors: ["Complex negotiation support","Risk assessment","Relationship management"],
    ai_impact_summary: "AI automates contract drafting, review, and tracking. Complex negotiations and risk assessment need human administrators.",
    related_sector: "Legal", employment_count: 60000, median_salary: 62000
  },
  {
    title: "Coroner", title_slug: "coroner", category: "Government",
    automation_probability: 0.15, description: "Investigates deaths to determine cause and manner, often conducting autopsies.",
    key_tasks: ["Conduct autopsies","Determine cause of death","Collect evidence","Testify in court"],
    risk_factors: ["AI-assisted pathology","Toxicology automation"],
    safe_factors: ["Physical examination","Legal judgment","Courtroom testimony"],
    ai_impact_summary: "AI assists with pathology analysis and toxicology. Physical examination and legal determination of death require human coroners.",
    related_sector: "Government", employment_count: 8000, median_salary: 75000
  },
  {
    title: "Corporate Attorney", title_slug: "corporate-attorney", category: "Legal",
    automation_probability: 0.22, description: "Advises businesses on legal matters including contracts, mergers, and compliance.",
    key_tasks: ["Review contracts","Advise on M&A","Ensure regulatory compliance","Manage corporate governance"],
    risk_factors: ["AI contract analysis","Legal research automation","Document review AI"],
    safe_factors: ["Strategic legal counsel","Negotiation","Client relationship management"],
    ai_impact_summary: "AI accelerates legal research and document review. Strategic counsel and complex negotiations remain human attorney domains.",
    related_sector: "Legal", employment_count: 120000, median_salary: 160000
  },
  {
    title: "Corporate Trainer", title_slug: "corporate-trainer", category: "Education",
    automation_probability: 0.42, description: "Designs and delivers training programs for organizational employees.",
    key_tasks: ["Develop training curriculum","Deliver workshops","Assess learning outcomes","Create e-learning content"],
    risk_factors: ["AI-generated training content","LMS automation","Virtual training platforms"],
    safe_factors: ["Live facilitation skills","Audience adaptation","Motivational speaking"],
    ai_impact_summary: "AI creates training content and automates assessments. Live facilitation and adaptive teaching need human trainers.",
    related_sector: "Education", employment_count: 120000, median_salary: 63000
  },
  {
    title: "Correctional Counselor", title_slug: "correctional-counselor", category: "Government",
    automation_probability: 0.15, description: "Provides counseling and rehabilitation support to inmates in correctional facilities.",
    key_tasks: ["Counsel inmates","Develop rehabilitation plans","Assess risk levels","Coordinate reentry programs"],
    risk_factors: ["AI risk assessment tools"],
    safe_factors: ["Human rapport building","Safety-sensitive environment","Complex behavioral assessment"],
    ai_impact_summary: "AI assists with risk scoring. Therapeutic relationships and rehabilitation in correctional settings require human counselors.",
    related_sector: "Government", employment_count: 30000, median_salary: 48000
  },
  {
    title: "Cost Accountant", title_slug: "cost-accountant", category: "Finance",
    automation_probability: 0.68, description: "Analyzes and reports on costs of production and business operations.",
    key_tasks: ["Track production costs","Analyze cost variances","Prepare cost reports","Recommend cost reductions"],
    risk_factors: ["AI cost analysis","Automated reporting","ERP integration"],
    safe_factors: ["Strategic cost recommendations","Complex variance analysis"],
    ai_impact_summary: "AI automates routine cost tracking and reporting. Strategic cost analysis and recommendations need human accountants.",
    related_sector: "Finance", employment_count: 90000, median_salary: 72000
  },
  {
    title: "Cost Estimator", title_slug: "cost-estimator", category: "Operations",
    automation_probability: 0.55, description: "Estimates costs for products, projects, or services to support business decisions.",
    key_tasks: ["Analyze project requirements","Estimate costs","Prepare bid proposals","Track actual vs estimated costs"],
    risk_factors: ["AI estimation models","Historical data analytics","BIM integration"],
    safe_factors: ["Complex project judgment","Vendor relationships","Unique project factors"],
    ai_impact_summary: "AI improves estimation accuracy for standard work. Complex and unique projects require experienced human estimators.",
    related_sector: "Construction", employment_count: 70000, median_salary: 68000
  },
  {
    title: "Court Clerk", title_slug: "court-clerk", category: "Legal",
    automation_probability: 0.68, description: "Manages court records, schedules proceedings, and assists judges with administrative tasks.",
    key_tasks: ["Maintain court records","Schedule hearings","Process legal documents","Assist during proceedings"],
    risk_factors: ["Digital court systems","AI document processing","E-filing automation"],
    safe_factors: ["Courtroom presence","Complex procedural knowledge","Judge support"],
    ai_impact_summary: "Digital systems automate filing and scheduling. Courtroom presence and procedural expertise retain some human need.",
    related_sector: "Legal", employment_count: 65000, median_salary: 42000
  },
  {
    title: "Court Reporter", title_slug: "court-reporter", category: "Legal",
    automation_probability: 0.72, description: "Creates verbatim transcriptions of legal proceedings using specialized equipment.",
    key_tasks: ["Transcribe proceedings","Produce official records","Read back testimony","Maintain transcription equipment"],
    risk_factors: ["AI speech-to-text","Real-time transcription software","Automated captioning"],
    safe_factors: ["Legal accuracy requirements","Multiple speaker environments","Specialized terminology"],
    ai_impact_summary: "AI transcription improves rapidly. Legal accuracy requirements and complex proceedings may preserve some human roles.",
    related_sector: "Legal", employment_count: 18000, median_salary: 62000
  },
  {
    title: "Crane Operator", title_slug: "crane-operator", category: "Trades",
    automation_probability: 0.42, description: "Operates cranes to lift and move heavy materials at construction and industrial sites.",
    key_tasks: ["Operate crane equipment","Position loads precisely","Inspect equipment","Coordinate with ground crew"],
    risk_factors: ["Automated crane systems","Remote operation technology"],
    safe_factors: ["Safety-critical judgment","Variable site conditions","Spatial awareness"],
    ai_impact_summary: "Automated and remote cranes are emerging. Complex lifts and variable site conditions still need skilled human operators.",
    related_sector: "Construction", employment_count: 50000, median_salary: 58000
  },
  {
    title: "Credit Analyst", title_slug: "credit-analyst", category: "Finance",
    automation_probability: 0.58, description: "Evaluates creditworthiness of individuals and businesses for lending decisions.",
    key_tasks: ["Analyze financial statements","Assess credit risk","Prepare credit reports","Recommend lending decisions"],
    risk_factors: ["AI credit scoring","Automated underwriting","Machine learning risk models"],
    safe_factors: ["Complex deal structuring","Relationship lending","Unusual credit situations"],
    ai_impact_summary: "AI handles routine credit decisions efficiently. Complex credit structures and unusual situations need human analysts.",
    related_sector: "Finance", employment_count: 85000, median_salary: 78000
  },
  {
    title: "Crime Scene Investigator", title_slug: "crime-scene-investigator", category: "Government",
    automation_probability: 0.18, description: "Collects and analyzes physical evidence at crime scenes to support criminal investigations.",
    key_tasks: ["Collect physical evidence","Document crime scenes","Analyze forensic samples","Testify in court"],
    risk_factors: ["AI forensic analysis","Automated DNA processing"],
    safe_factors: ["Scene assessment judgment","Evidence integrity","Court testimony"],
    ai_impact_summary: "AI speeds up forensic analysis. Scene investigation, evidence collection, and legal testimony require human investigators.",
    related_sector: "Government", employment_count: 17000, median_salary: 62000
  },
  {
    title: "Criminologist", title_slug: "criminologist", category: "Science",
    automation_probability: 0.25, description: "Studies criminal behavior, its causes, and prevention strategies.",
    key_tasks: ["Research crime patterns","Analyze criminal behavior","Develop prevention strategies","Publish findings"],
    risk_factors: ["AI pattern analysis","Predictive policing algorithms"],
    safe_factors: ["Theoretical research","Policy development","Ethical analysis"],
    ai_impact_summary: "AI aids crime pattern analysis. Theoretical research and ethical considerations in criminal justice need human criminologists.",
    related_sector: "Government", employment_count: 8000, median_salary: 72000
  },
  {
    title: "Cruise Ship Captain", title_slug: "cruise-ship-captain", category: "Transportation",
    automation_probability: 0.12, description: "Commands cruise ships and is responsible for vessel safety and passenger welfare.",
    key_tasks: ["Navigate vessels","Manage crew operations","Ensure passenger safety","Handle emergencies"],
    risk_factors: ["Autonomous navigation advances"],
    safe_factors: ["Safety-critical command","Emergency leadership","Regulatory responsibility"],
    ai_impact_summary: "Navigation aids improve efficiency. Command authority and emergency leadership of passenger vessels require human captains.",
    related_sector: "Transportation", employment_count: 3000, median_salary: 120000
  },
  {
    title: "Cryptographer", title_slug: "cryptographer", category: "Technology",
    automation_probability: 0.18, description: "Develops encryption algorithms and security protocols to protect information.",
    key_tasks: ["Design encryption algorithms","Analyze security vulnerabilities","Develop cryptographic protocols","Research quantum-safe methods"],
    risk_factors: ["AI-assisted cryptanalysis"],
    safe_factors: ["Mathematical innovation","Security architecture","Novel protocol design"],
    ai_impact_summary: "AI may accelerate cryptanalysis. Designing new cryptographic systems requires deep human mathematical expertise.",
    related_sector: "Tech", employment_count: 5000, median_salary: 140000
  },
  {
    title: "Curriculum Developer", title_slug: "curriculum-developer", category: "Education",
    automation_probability: 0.38, description: "Designs educational curricula and learning materials for schools and training programs.",
    key_tasks: ["Design curriculum frameworks","Develop learning objectives","Create educational materials","Assess program effectiveness"],
    risk_factors: ["AI content generation","Automated assessment design","Adaptive learning platforms"],
    safe_factors: ["Pedagogical expertise","Learner needs analysis","Educational philosophy"],
    ai_impact_summary: "AI generates educational content and assessments. Pedagogical design and learning philosophy require human curriculum experts.",
    related_sector: "Education", employment_count: 50000, median_salary: 68000
  },
  {
    title: "Customer Success Manager", title_slug: "customer-success-manager", category: "Sales",
    automation_probability: 0.32, description: "Ensures customers achieve their goals with a product or service to drive retention and growth.",
    key_tasks: ["Onboard new customers","Monitor customer health","Drive product adoption","Manage renewals and upsells"],
    risk_factors: ["AI health scoring","Automated onboarding","Chatbot support"],
    safe_factors: ["Strategic relationship management","Complex problem solving","Executive alignment"],
    ai_impact_summary: "AI tracks customer health and automates touchpoints. Strategic relationship management and complex issue resolution need humans.",
    related_sector: "Tech", employment_count: 75000, median_salary: 85000
  },
  {
    title: "Customs Broker", title_slug: "customs-broker", category: "Operations",
    automation_probability: 0.55, description: "Facilitates the import and export of goods by managing customs documentation and compliance.",
    key_tasks: ["Prepare customs documentation","Classify goods","Calculate duties","Ensure trade compliance"],
    risk_factors: ["AI classification systems","Automated documentation","Digital customs platforms"],
    safe_factors: ["Complex tariff interpretation","Trade dispute resolution","Regulatory relationships"],
    ai_impact_summary: "AI automates goods classification and documentation. Complex trade regulations and disputes need human customs brokers.",
    related_sector: "Transportation", employment_count: 20000, median_salary: 65000
  },
  {
    title: "Customs Officer", title_slug: "customs-officer", category: "Government",
    automation_probability: 0.32, description: "Enforces customs laws by inspecting goods and travelers at borders and ports.",
    key_tasks: ["Inspect cargo and luggage","Verify travel documents","Detect contraband","Enforce import regulations"],
    risk_factors: ["AI scanning technology","Automated document verification"],
    safe_factors: ["Physical inspection","Judgment calls","Law enforcement authority"],
    ai_impact_summary: "AI improves scanning and document processing. Physical inspection and law enforcement decisions need human officers.",
    related_sector: "Government", employment_count: 35000, median_salary: 68000
  },
  {
    title: "Cybersecurity Analyst", title_slug: "cybersecurity-analyst", category: "Technology",
    automation_probability: 0.22, description: "Monitors and protects organizational systems from cyber threats and security breaches.",
    key_tasks: ["Monitor security alerts","Investigate incidents","Implement security measures","Conduct vulnerability assessments"],
    risk_factors: ["AI threat detection","Automated response systems","SOAR platforms"],
    safe_factors: ["Novel threat analysis","Incident response judgment","Security strategy"],
    ai_impact_summary: "AI improves threat detection speed. Novel attack analysis and strategic security decisions require human analysts.",
    related_sector: "Tech", employment_count: 95000, median_salary: 105000
  },
  {
    title: "Dairy Farmer", title_slug: "dairy-farmer", category: "Agriculture",
    automation_probability: 0.40, description: "Manages dairy farming operations including milking, feeding, and herd health.",
    key_tasks: ["Manage milking operations","Monitor herd health","Maintain farm equipment","Handle feed management"],
    risk_factors: ["Robotic milking systems","AI herd monitoring","Automated feeding"],
    safe_factors: ["Animal care judgment","Farm management","Equipment troubleshooting"],
    ai_impact_summary: "Robotic milking and AI monitoring automate routine tasks. Animal welfare and farm management need human farmers.",
    related_sector: "Agriculture", employment_count: 55000, median_salary: 42000
  },
  {
    title: "Dance Instructor", title_slug: "dance-instructor", category: "Education",
    automation_probability: 0.08, description: "Teaches dance techniques and choreography to students of various skill levels.",
    key_tasks: ["Teach dance techniques","Choreograph routines","Evaluate student progress","Organize performances"],
    risk_factors: ["AI motion analysis for feedback"],
    safe_factors: ["Physical demonstration","Creative choreography","Personal motivation"],
    ai_impact_summary: "AI may assist with movement analysis. Teaching dance requires physical demonstration, creativity, and personal connection.",
    related_sector: "Education", employment_count: 40000, median_salary: 42000
  },
  {
    title: "Data Analyst", title_slug: "data-analyst", category: "Technology",
    automation_probability: 0.48, description: "Collects, processes, and analyzes data to help organizations make informed decisions.",
    key_tasks: ["Clean and process data","Create visualizations","Generate reports","Identify trends and patterns"],
    risk_factors: ["AI-powered analytics","Natural language querying","Automated dashboards"],
    safe_factors: ["Business context interpretation","Stakeholder communication","Problem framing"],
    ai_impact_summary: "AI automates data processing and basic analysis. Contextual interpretation and strategic recommendations need human analysts.",
    related_sector: "Tech", employment_count: 200000, median_salary: 82000
  },
  {
    title: "Data Architect", title_slug: "data-architect", category: "Technology",
    automation_probability: 0.22, description: "Designs the structure and organization of an organization's data systems.",
    key_tasks: ["Design data models","Define data standards","Plan data integration","Ensure data quality governance"],
    risk_factors: ["AI-generated data models","Automated schema design"],
    safe_factors: ["Enterprise architecture decisions","Business alignment","Complex system integration"],
    ai_impact_summary: "AI assists with schema suggestions. Strategic data architecture aligned with business needs requires human architects.",
    related_sector: "Tech", employment_count: 35000, median_salary: 135000
  },
  {
    title: "Data Center Technician", title_slug: "data-center-technician", category: "Technology",
    automation_probability: 0.45, description: "Maintains and repairs servers and networking equipment in data centers.",
    key_tasks: ["Install server hardware","Monitor system health","Troubleshoot hardware issues","Manage cabling"],
    risk_factors: ["Automated monitoring","Robotic maintenance","Remote management"],
    safe_factors: ["Physical hardware work","Emergency repairs","Security procedures"],
    ai_impact_summary: "Automation improves monitoring and reduces routine checks. Physical hardware maintenance still needs human technicians.",
    related_sector: "Tech", employment_count: 55000, median_salary: 55000
  },
  {
    title: "Data Engineer", title_slug: "data-engineer", category: "Technology",
    automation_probability: 0.30, description: "Builds and maintains data pipelines and infrastructure for analytics and applications.",
    key_tasks: ["Build data pipelines","Manage data warehouses","Optimize data flows","Ensure data reliability"],
    risk_factors: ["AI-generated pipelines","Low-code ETL tools","AutoML data prep"],
    safe_factors: ["Complex system architecture","Performance optimization","Novel integrations"],
    ai_impact_summary: "AI simplifies routine pipeline building. Complex data infrastructure and optimization need human data engineers.",
    related_sector: "Tech", employment_count: 80000, median_salary: 120000
  },
  {
    title: "Data Entry Clerk", title_slug: "data-entry-clerk", category: "Administrative",
    automation_probability: 0.93, description: "Enters data into computer systems from paper documents and other sources.",
    key_tasks: ["Input data from documents","Verify data accuracy","Maintain databases","Process forms"],
    risk_factors: ["OCR technology","AI data extraction","Automated form processing"],
    safe_factors: ["Handwritten document processing","Quality verification"],
    ai_impact_summary: "OCR and AI extract data from documents with high accuracy. This role is among the most likely to be fully automated.",
    related_sector: "Administrative", employment_count: 150000, median_salary: 35000
  },
  {
    title: "Data Privacy Officer", title_slug: "data-privacy-officer", category: "Legal",
    automation_probability: 0.22, description: "Ensures organizational compliance with data protection regulations like GDPR and CCPA.",
    key_tasks: ["Develop privacy policies","Conduct privacy assessments","Manage data subject requests","Train staff on compliance"],
    risk_factors: ["AI compliance monitoring","Automated DSAR processing"],
    safe_factors: ["Regulatory interpretation","Strategic privacy decisions","Cross-border complexity"],
    ai_impact_summary: "AI assists with compliance monitoring and request processing. Regulatory interpretation and strategic decisions need human DPOs.",
    related_sector: "Legal", employment_count: 25000, median_salary: 120000
  },
  {
    title: "Data Scientist", title_slug: "data-scientist", category: "Technology",
    automation_probability: 0.28, description: "Applies statistical and machine learning methods to extract insights from complex data.",
    key_tasks: ["Build predictive models","Analyze complex datasets","Design experiments","Communicate findings"],
    risk_factors: ["AutoML platforms","AI code generation","No-code analytics"],
    safe_factors: ["Problem formulation","Novel methodology","Business strategy alignment"],
    ai_impact_summary: "AutoML handles routine modeling. Creative problem formulation and strategic alignment require human data scientists.",
    related_sector: "Tech", employment_count: 120000, median_salary: 130000
  },
  {
    title: "Database Administrator", title_slug: "database-administrator", category: "Technology",
    automation_probability: 0.48, description: "Manages and maintains database systems to ensure performance, security, and availability.",
    key_tasks: ["Monitor database performance","Implement backups","Optimize queries","Manage security access"],
    risk_factors: ["Cloud-managed databases","AI query optimization","Automated scaling"],
    safe_factors: ["Complex migration projects","Security architecture","Disaster recovery"],
    ai_impact_summary: "Cloud services automate routine DBA tasks. Complex migrations and security architecture need experienced human DBAs.",
    related_sector: "Tech", employment_count: 70000, median_salary: 100000
  },
  {
    title: "Dental Assistant", title_slug: "dental-assistant", category: "Healthcare",
    automation_probability: 0.42, description: "Assists dentists during procedures and manages clinical and administrative tasks.",
    key_tasks: ["Prepare treatment rooms","Assist during procedures","Take dental X-rays","Sterilize instruments"],
    risk_factors: ["Digital imaging automation","AI scheduling","Robotic assistance"],
    safe_factors: ["Patient interaction","Physical chairside assistance","Varied clinical tasks"],
    ai_impact_summary: "AI improves imaging and scheduling. Chairside assistance and patient interaction keep dental assistants essential.",
    related_sector: "Healthcare", employment_count: 370000, median_salary: 42000
  },
  {
    title: "Dental Hygienist", title_slug: "dental-hygienist", category: "Healthcare",
    automation_probability: 0.15, description: "Cleans teeth, examines patients for oral diseases, and provides preventive dental care.",
    key_tasks: ["Clean and polish teeth","Take dental X-rays","Screen for oral diseases","Educate patients on oral health"],
    risk_factors: ["AI diagnostic assistance"],
    safe_factors: ["Physical manual skill","Patient rapport","Clinical judgment"],
    ai_impact_summary: "AI aids in diagnostic screening. Physical dental cleaning and patient care require human dental hygienists.",
    related_sector: "Healthcare", employment_count: 220000, median_salary: 80000
  },
  {
    title: "Dentist", title_slug: "dentist", category: "Healthcare",
    automation_probability: 0.08, description: "Diagnoses and treats conditions of the teeth, gums, and mouth.",
    key_tasks: ["Examine patients","Perform dental procedures","Diagnose oral conditions","Develop treatment plans"],
    risk_factors: ["AI diagnostic imaging","Robotic dentistry research"],
    safe_factors: ["Complex procedures","Patient relationship","Clinical judgment"],
    ai_impact_summary: "AI enhances imaging and diagnostics. Dental procedures require human dexterity and clinical decision-making.",
    related_sector: "Healthcare", employment_count: 160000, median_salary: 160000
  },
  {
    title: "Deputy Sheriff", title_slug: "deputy-sheriff", category: "Government",
    automation_probability: 0.15, description: "Enforces laws, responds to emergencies, and maintains public safety in county jurisdictions.",
    key_tasks: ["Patrol assigned areas","Respond to emergencies","Investigate crimes","Serve legal documents"],
    risk_factors: ["AI surveillance","Predictive policing"],
    safe_factors: ["Physical presence","Split-second judgment","Community engagement"],
    ai_impact_summary: "AI aids with surveillance and data analysis. Law enforcement requires human judgment, physical presence, and community trust.",
    related_sector: "Government", employment_count: 175000, median_salary: 65000
  },
  {
    title: "Dermatologist", title_slug: "dermatologist", category: "Healthcare",
    automation_probability: 0.12, description: "Diagnoses and treats conditions of the skin, hair, and nails.",
    key_tasks: ["Examine skin conditions","Perform biopsies","Prescribe treatments","Perform cosmetic procedures"],
    risk_factors: ["AI skin imaging diagnosis","Teledermatology"],
    safe_factors: ["Complex diagnosis","Procedural skill","Patient counseling"],
    ai_impact_summary: "AI excels at skin lesion classification. Complex diagnosis and procedures still require dermatologist expertise.",
    related_sector: "Healthcare", employment_count: 13000, median_salary: 350000
  },
  {
    title: "Desktop Support Technician", title_slug: "desktop-support-technician", category: "Technology",
    automation_probability: 0.55, description: "Provides technical support for desktop computers, software, and peripherals.",
    key_tasks: ["Troubleshoot hardware issues","Install software","Configure workstations","Resolve user problems"],
    risk_factors: ["Remote management tools","AI troubleshooting","Self-healing systems"],
    safe_factors: ["Physical hardware repairs","User interaction","Complex issue diagnosis"],
    ai_impact_summary: "AI resolves many software issues automatically. Physical repairs and complex diagnosis need human support technicians.",
    related_sector: "Tech", employment_count: 150000, median_salary: 52000
  },
  {
    title: "DevOps Engineer", title_slug: "devops-engineer", category: "Technology",
    automation_probability: 0.25, description: "Bridges development and operations by automating deployment and infrastructure management.",
    key_tasks: ["Build CI/CD pipelines","Manage infrastructure as code","Monitor system reliability","Automate deployments"],
    risk_factors: ["AI-generated infrastructure","Platform engineering tools","GitOps automation"],
    safe_factors: ["Complex system design","Incident response","Cross-team collaboration"],
    ai_impact_summary: "AI assists with routine automation and monitoring. Complex system architecture and incident management need human DevOps engineers.",
    related_sector: "Tech", employment_count: 75000, median_salary: 120000
  },
  {
    title: "Diesel Mechanic", title_slug: "diesel-mechanic", category: "Trades",
    automation_probability: 0.22, description: "Repairs and maintains diesel engines and vehicles including trucks and heavy equipment.",
    key_tasks: ["Diagnose engine problems","Repair diesel systems","Perform scheduled maintenance","Test repaired vehicles"],
    risk_factors: ["AI diagnostics","Predictive maintenance"],
    safe_factors: ["Physical repair work","Varied equipment types","On-site troubleshooting"],
    ai_impact_summary: "AI diagnostics improve fault detection. Physical repair work on diverse heavy equipment needs skilled human mechanics.",
    related_sector: "Trades", employment_count: 280000, median_salary: 52000
  },
  {
    title: "Dietitian", title_slug: "dietitian", category: "Healthcare",
    automation_probability: 0.28, description: "Plans nutrition programs and provides dietary counseling for health management.",
    key_tasks: ["Assess nutritional needs","Develop meal plans","Provide nutrition counseling","Monitor dietary progress"],
    risk_factors: ["AI meal planning apps","Automated nutrition analysis"],
    safe_factors: ["Clinical nutrition expertise","Patient counseling","Medical nutrition therapy"],
    ai_impact_summary: "AI apps provide basic nutrition guidance. Clinical dietitians treating complex conditions remain essential.",
    related_sector: "Healthcare", employment_count: 75000, median_salary: 68000
  },
  {
    title: "Digital Forensics Analyst", title_slug: "digital-forensics-analyst", category: "Technology",
    automation_probability: 0.28, description: "Recovers and analyzes digital evidence from computers and devices for investigations.",
    key_tasks: ["Recover digital evidence","Analyze storage media","Document chain of custody","Provide expert testimony"],
    risk_factors: ["AI-powered forensic tools","Automated data recovery"],
    safe_factors: ["Legal expertise","Novel investigation techniques","Court testimony"],
    ai_impact_summary: "AI accelerates data recovery and analysis. Legal procedures and novel investigation methods require human forensic analysts.",
    related_sector: "Tech", employment_count: 20000, median_salary: 85000
  },
  {
    title: "Digital Marketing Manager", title_slug: "digital-marketing-manager", category: "Marketing",
    automation_probability: 0.35, description: "Plans and executes digital marketing campaigns across online channels.",
    key_tasks: ["Develop digital strategies","Manage online campaigns","Analyze digital metrics","Optimize conversion funnels"],
    risk_factors: ["AI ad optimization","Automated campaign management","Programmatic advertising"],
    safe_factors: ["Creative strategy","Brand storytelling","Cross-channel integration"],
    ai_impact_summary: "AI optimizes bids and targeting automatically. Creative strategy and brand integration require human marketing managers.",
    related_sector: "Marketing", employment_count: 80000, median_salary: 85000
  },
  {
    title: "Diplomatic Officer", title_slug: "diplomatic-officer", category: "Government",
    automation_probability: 0.08, description: "Represents national interests abroad and manages international relations.",
    key_tasks: ["Negotiate treaties","Manage diplomatic relations","Report on political developments","Protect citizens abroad"],
    risk_factors: ["AI translation and analysis"],
    safe_factors: ["Diplomatic judgment","Cultural sensitivity","Political negotiation"],
    ai_impact_summary: "AI assists with translation and intelligence analysis. Diplomatic relations and negotiations are fundamentally human activities.",
    related_sector: "Government", employment_count: 15000, median_salary: 95000
  },
  {
    title: "Director of Engineering", title_slug: "director-of-engineering", category: "Technology",
    automation_probability: 0.10, description: "Leads engineering teams and drives technical strategy for organizations.",
    key_tasks: ["Set technical direction","Manage engineering teams","Align tech with business goals","Drive engineering culture"],
    risk_factors: ["AI project management aids"],
    safe_factors: ["Leadership and vision","Team development","Strategic decision-making"],
    ai_impact_summary: "AI aids project tracking and reporting. Technical leadership and team management require human engineering directors.",
    related_sector: "Tech", employment_count: 30000, median_salary: 190000
  },
  {
    title: "Director of Operations", title_slug: "director-of-operations", category: "Operations",
    automation_probability: 0.12, description: "Oversees daily business operations and drives operational efficiency across the organization.",
    key_tasks: ["Manage business operations","Optimize processes","Lead operational teams","Set operational strategy"],
    risk_factors: ["AI process optimization"],
    safe_factors: ["Strategic leadership","Cross-functional coordination","Crisis management"],
    ai_impact_summary: "AI improves process optimization. Strategic operational leadership and organizational management need human directors.",
    related_sector: "Business Services", employment_count: 50000, median_salary: 155000
  },
  {
    title: "Disability Examiner", title_slug: "disability-examiner", category: "Government",
    automation_probability: 0.55, description: "Evaluates disability claims to determine eligibility for benefits programs.",
    key_tasks: ["Review medical records","Assess functional limitations","Determine eligibility","Process claims decisions"],
    risk_factors: ["AI medical record analysis","Automated eligibility screening","Decision support systems"],
    safe_factors: ["Complex case judgment","Appeal handling","Regulatory interpretation"],
    ai_impact_summary: "AI assists with record analysis and initial screening. Complex eligibility decisions and appeals need human examiners.",
    related_sector: "Government", employment_count: 15000, median_salary: 52000
  },
  {
    title: "Disaster Recovery Specialist", title_slug: "disaster-recovery-specialist", category: "Technology",
    automation_probability: 0.30, description: "Plans and implements disaster recovery strategies for IT systems and business operations.",
    key_tasks: ["Develop recovery plans","Conduct disaster drills","Manage backup systems","Coordinate recovery efforts"],
    risk_factors: ["Automated backup systems","AI-powered recovery","Cloud resilience"],
    safe_factors: ["Crisis management","Complex recovery scenarios","Cross-system coordination"],
    ai_impact_summary: "Cloud and automation improve backup reliability. Complex disaster scenarios and recovery coordination need human specialists.",
    related_sector: "Tech", employment_count: 20000, median_salary: 88000
  },
  {
    title: "Dispatcher", title_slug: "dispatcher", category: "Transportation",
    automation_probability: 0.58, description: "Coordinates the dispatch of vehicles, personnel, and equipment for service calls.",
    key_tasks: ["Coordinate vehicle dispatch","Prioritize service calls","Communicate with field teams","Track fleet locations"],
    risk_factors: ["AI route optimization","Automated dispatch systems","GPS tracking"],
    safe_factors: ["Emergency prioritization","Human communication","Unpredictable situations"],
    ai_impact_summary: "AI optimizes routing and handles routine dispatch. Emergency situations and complex coordination need human dispatchers.",
    related_sector: "Transportation", employment_count: 200000, median_salary: 42000
  },
  {
    title: "Dog Trainer", title_slug: "dog-trainer", category: "Agriculture",
    automation_probability: 0.08, description: "Trains dogs in obedience, behavior modification, and specialized tasks.",
    key_tasks: ["Train dogs in commands","Modify behavioral issues","Work with pet owners","Develop training programs"],
    risk_factors: ["AI-powered training aids"],
    safe_factors: ["Animal behavior reading","Physical handling","Owner coaching"],
    ai_impact_summary: "AI apps provide basic training tips. Professional dog training requires reading animal behavior and hands-on skill.",
    related_sector: "Personal Services", employment_count: 20000, median_salary: 35000
  },
  {
    title: "Drafter", title_slug: "drafter", category: "Engineering",
    automation_probability: 0.62, description: "Creates technical drawings and plans using CAD software for engineering projects.",
    key_tasks: ["Create technical drawings","Develop blueprints","Revise designs","Coordinate with engineers"],
    risk_factors: ["AI-generated designs","Parametric modeling","BIM automation"],
    safe_factors: ["Complex custom designs","Engineering interpretation","Quality assurance"],
    ai_impact_summary: "AI and BIM automate standard drafting tasks. Complex and custom design work retains need for skilled drafters.",
    related_sector: "Engineering", employment_count: 200000, median_salary: 58000
  },
  {
    title: "Drone Operator", title_slug: "drone-operator", category: "Technology",
    automation_probability: 0.52, description: "Operates unmanned aerial vehicles for photography, surveying, inspection, and delivery.",
    key_tasks: ["Fly drone missions","Capture aerial imagery","Inspect infrastructure","Process flight data"],
    risk_factors: ["Autonomous flight paths","AI obstacle avoidance","Pre-programmed missions"],
    safe_factors: ["Complex flight environments","Emergency control","Mission planning"],
    ai_impact_summary: "Autonomous flight capabilities grow rapidly. Complex environments and regulatory requirements keep some human operator roles.",
    related_sector: "Tech", employment_count: 25000, median_salary: 58000
  },
  {
    title: "Drug Counselor", title_slug: "drug-counselor", category: "Healthcare",
    automation_probability: 0.12, description: "Provides counseling and support to individuals recovering from substance use disorders.",
    key_tasks: ["Conduct counseling sessions","Develop recovery plans","Facilitate group therapy","Coordinate with treatment teams"],
    risk_factors: ["AI screening tools"],
    safe_factors: ["Therapeutic relationship","Crisis intervention","Group facilitation"],
    ai_impact_summary: "AI may handle initial screening. Recovery counseling requires deep human empathy and sustained therapeutic relationships.",
    related_sector: "Healthcare", employment_count: 95000, median_salary: 48000
  },
  {
    title: "Drywall Installer", title_slug: "drywall-installer", category: "Trades",
    automation_probability: 0.42, description: "Installs and finishes drywall panels in buildings and structures.",
    key_tasks: ["Hang drywall panels","Tape and mud joints","Sand and finish surfaces","Measure and cut materials"],
    risk_factors: ["Robotic drywall installation","Prefabricated panels"],
    safe_factors: ["Varied construction sites","Finishing skill","Custom installations"],
    ai_impact_summary: "Robotic installation exists for standard work. Finishing quality and custom installations need skilled human drywallers.",
    related_sector: "Construction", employment_count: 140000, median_salary: 48000
  }
];

async function main() {
  const client = await pool.connect();
  try {
    let inserted = 0;
    let skipped = 0;
    
    for (const o of occupations) {
      const riskLevel = o.automation_probability >= 0.7 ? 'very-high' : 
                        o.automation_probability >= 0.5 ? 'high' :
                        o.automation_probability >= 0.3 ? 'medium' : 'low';
      const riskScore = Math.round(o.automation_probability * 100);
      
      try {
        const result = await client.query(`
          INSERT INTO occupations (title, title_slug, category, automation_probability, risk_score, risk_level, description, key_tasks, risk_factors, safe_factors, ai_impact_summary, related_sector, employment_count, median_salary)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
          ON CONFLICT (title_slug) DO NOTHING
          RETURNING id
        `, [
          o.title, o.title_slug, o.category, o.automation_probability, riskScore, riskLevel,
          o.description, JSON.stringify(o.key_tasks), JSON.stringify(o.risk_factors),
          JSON.stringify(o.safe_factors), o.ai_impact_summary, o.related_sector,
          o.employment_count, o.median_salary
        ]);
        if (result.rowCount > 0) inserted++;
        else skipped++;
      } catch (e) {
        console.error(`Error inserting ${o.title_slug}:`, e.message);
      }
    }
    
    console.log(`Done! Inserted: ${inserted}, Skipped (duplicate): ${skipped}, Total in batch: ${occupations.length}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
