(function () {
  const draft = "Content is being prepared for publication.";
  const coming = "More archive material will be added here.";
  const asset = (name) => `/assets/trap-house/${name}`;
  const siteUrl = "https://imhighoncrackandihaveagun.com";
  const defaultSocialImage = asset("ihocaihag-rectangle-logo.png");
  const socialLinks = [
    { key: "instagram", label: "Instagram", href: "https://instagram.com/ihocaihag" },
    { key: "tiktok", label: "TikTok", href: "https://tiktok.com/@ihocaihagofficial" },
    { key: "threads", label: "Threads", href: "https://threads.net/@ihocaihag" },
    { key: "youtube", label: "YouTube", href: "https://youtube.com/@imhighoncrackandihaveagun" },
    { key: "x", label: "X", href: "https://x.com/comradejizzy" },
    { key: "patreon", label: "Patreon", href: "https://patreon.com/IMHIGHONCRACKANDIHAVEAGUN" },
    { key: "discord", label: "Discord", href: "https://discord.gg/64MKTrGGsD" }
  ];
  const projectTitle = "IM HIGH ON CRACK AND I HAVE A GUN";
  const projectShortName = "IHOCAIHAG";
  const creatorName = "Ryan Homanics";
  const projectOneLiner = "What one person’s collapse can tell us about ourselves—and the world around us.";
  const projectShortDescription = "A six-year archive of videos, photographs, notebooks, interviews, art, screenshots, artifacts, and evidence—turned into a book, documentary, and soundtrack tracing one person’s tailspin into collapse. A record of what happened, what survived, and what the wreckage can tell us about addiction, recovery, society, and the reality we build around ourselves.";
  const projectOrigin = "This project began in the early days of the COVID pandemic, as a couple’s fentanyl relapse started becoming a runaway train. Even then, I knew the footage would be used by someone, someday, for some impactful reason. Six years later—and four years after the death of my ride or die—that archive has become the source of a book, documentary, and soundtrack built from what survived.";
  const whyTitleExists = "IM HIGH ON CRACK AND I HAVE A GUN is not a slogan, a threat, a flex, or an invitation to imitate anything inside this project. It is an alarm bell. A title pulled from the kind of reality most people would rather look away from, attached to a project built to make them look anyway. The words are supposed to stop you for a second. What comes after them is the reason the project exists: six years of evidence showing how a person can collapse in plain sight, what addiction actually does to a life, and what that collapse can reveal about the world surrounding it.";
  const disclaimer = "DISCLAIMER: This is documentary, art, and archive material about addiction, psychosis, grief, survival, systems, and unsafe behavior. It is not instruction, medical advice, a challenge, or encouragement to imitate anything shown.";
  const triggerWarning = "TRIGGER WARNING: This project contains extremely graphic depictions of drug use, addiction, and self-destructive behavior. Some material may be especially difficult or triggering for people in early recovery or sobriety.";
  const supportResource = "SAMHSA National Helpline: 1-800-662-4357";
  const creatorBio = [
    "I am a son, a brother, newly an uncle, a cat dad, a former good friend, an author, a student, someone who once considered himself a rock-solid blue-collar worker—and, at times, a complete trash bag.",
    "I earned a bachelor’s degree in sociology, with a concentration in deviance, from California University of Pennsylvania in 2021. I am currently one semester away from completing a master’s degree in Security and Intelligence Studies through the University of Pittsburgh’s School of Public and International Affairs.",
    "My work has always come from the same place: a need to understand why people do what they do, why societies become what they become, and how the forces surrounding us shape the lives we think we are choosing for ourselves."
  ];
  const whyMakingThis = [
    "At 22 years old, I would have given almost anything to know what I know now. Somewhere out there right now is another 22-year-old version of me—someone about to learn the same lessons by repeatedly beating their head against the wall because nobody ever found a way to make those lessons understandable before the damage was done.",
    "I cannot go back and give that version of myself what he needed. But I may be able to give it to someone else.",
    "I am also making this because one thing I have always been is perceptive, analytical, and able to put ideas into words. Since I was young, I have been driven by the need to understand reality. Since I was a teenager, I have been trying to understand society. Somewhere along the way, those two questions became impossible to separate.",
    "The more I tried to understand my own collapse, the more clearly I began to see the systems, incentives, pressures, contradictions, and patterns surrounding it. This project is my attempt to put that understanding somewhere other people can finally see it too—especially the people who have been searching for an explanation in the dark for far too long."
  ];
  const whyDocumentedIt = "Because even when I did not believe I would live long enough to see any of this presented, I still believed the archive might eventually reach at least one person in a way that made keeping it worthwhile.";
  const dopesickConnection = [
    "Dopesick: The American Addiction to Heroin and Profit laid the groundwork for one of the central arguments I still carry today: capitalism is not standing outside the drug epidemic trying to solve it. It is one of the forces that helped create the conditions that allowed the epidemic to grow, mutate, and become profitable in the first place. We cannot expect the same logic driving the problem to suddenly hand us the solution.",
    "Just as I have changed since writing that book, the drug epidemic has changed too. The substances changed. The markets changed. The technology changed. The forms of desperation changed. But the underlying machinery did not disappear. This project is where those earlier ideas collide with six more years of lived experience, collapse, grief, addiction, documentation, and survival."
  ];
  const firstBookTransition = [
    "Everything.",
    "A complete breaking down to the foundation—and an attempt to put it all back together underneath a constant artillery barrage."
  ];
  const trapPassGeneralCopy = "A place to lock in your own part of the project. Proof you were here—and that you cared enough to become part of what it was becoming.";
  const trapHouseGeneralCopy = "The place where this can finally move beyond being one person’s drug-use story and become a self-built community—where we put our talents together and discover what kinds of things we can actually do together.";
  const dropsDescription = "Trailers, soundtrack pieces, and raw footage from the archive. Start with January 22: The Blast Crater.";
  const mapDescription = "Follow the nine foundational threads through the archive. Select a numbered point on the map to open its definition and trace how it appears across the six-year story.";
  const storeDescription = "Official books, documentary access, apparel, and Trap Pass releases connected to the project.";
  const january22Description = "January 22 is the blast crater where all nine foundational threads became visible at once.";
  const archiveTags = ["addiction", "psychosis", "grief", "cats", "home", "money", "platforms", "driving", "crack", "Palestine", "writing", "recovery", "love"];
  const threadDefinition = [
    "Imagine reality as an invisible field of microscopic and massive threads—floating, interacting, pulling, tangling, constricting, stretching, and weaving through one another.",
    "Every person emanates their own threads. Those threads interact with the threads of everyone around them, as well as the larger threads of the society and systems they were born into. How those forces meet, pull, tighten, break, and become woven together helps determine the course of a life.",
    "Some threads are intensely personal. Some stretch across entire societies. Some barely move until another thread suddenly yanks them in a completely different direction.",
    "The archive is mapped through those threads. January 22 is the blast crater where they all became visible at once."
  ];
  const foundationalThreads = [
    {
      number: "01",
      slug: "roaring-rivers-silent-seas",
      title: "ROARING RIVERS / SILENT SEAS",
      shortExcerpt: "The fundamental truths beneath everything else.",
      heroImage: {
        imageSrc: asset("thread-01-roaring-rivers-silent-seas.png?v=20260717-12"),
        imageAlt: "Ryan kneeling on wooden stairs while holding a black cat beneath a Palestinian flag",
        objectPosition: "center 30%",
        mobileObjectPosition: "center 24%",
        heroPosition: "center 20%",
        mobileHeroPosition: "center 16%"
      },
      definition: [
        "The fundamental truths beneath everything else—the things that shape our moral compass, mental health, decision-making, sense of purpose, and what we believe to be unequivocally true.",
        "Some of those truths move loudly through us like roaring rivers. Others sit beneath everything like silent seas. Either way, they become the foundation from which the rest of our threads move."
      ],
      january22: "Palestine should be free.",
      sixYearLayer: [
        "I was in a master’s program for Security and Intelligence Studies on October 7, 2023. From that point forward, I watched events unfold in real time, wrote reports about them, and turned my own algorithm into a livestreamed front-row seat to the suffering of the Palestinian people.",
        "I watched some of the most traumatic imagery imaginable—the kind where your brain needs several seconds before it accepts that, yes, it really is seeing what it thinks it is seeing. And that was from watching through a screen. I could only imagine the psychological injuries being inflicted on the people actually living through it, in a population where so many are children.",
        "All of this came less than a year after Ellie’s death.",
        "The threads here never stopped spewing."
      ]
    },
    {
      number: "02",
      slug: "craving-the-chase-for-comfort",
      title: "CRAVING THE CHASE FOR COMFORT",
      shortExcerpt: "The thing a person pursues because they believe reaching it will provide comfort, satisfaction, relief, or peace.",
      heroImage: {
        imageSrc: asset("thread-02-craving-the-chase-for-comfort.png?v=20260717-12"),
        imageAlt: "Ryan wearing protective goggles and headphones while lighting a pipe",
        objectPosition: "center 42%",
        mobileObjectPosition: "center 34%",
        heroPosition: "center 18%",
        mobileHeroPosition: "center 16%"
      },
      definition: [
        "The thing a person pursues because they believe reaching it will provide comfort, satisfaction, relief, or peace.",
        "Everyone has something they move toward.",
        "It can be as simple as getting home, sitting on the couch, and watching television after a long day. It can also become the pursuit of a chemical feeling at all costs—even above relationships, money, food, sleep, safety, or the most basic survival instincts.",
        "The target changes.",
        "The chase remains."
      ],
      january22: "Crack. 7-OH. Gabapentin. Phenibut. Xanax.",
      sixYearLayer: [
        "For years, I kept searching for new chemical combinations capable of smothering, burying, or delaying the need to confront the traumas underneath everything else.",
        "The comfort never lasted.",
        "So the chase kept expanding."
      ]
    },
    {
      number: "03",
      slug: "the-ticking-of-time",
      title: "THE TICKING OF TIME",
      shortExcerpt: "Time is one of the great constants we created to put existence into order.",
      heroImage: {
        imageSrc: asset("thread-03-the-ticking-of-time.png?v=20260717-12"),
        imageAlt: "Side-by-side childhood and adult photographs of Ryan with his sister",
        objectPosition: "center center",
        mobileObjectPosition: "center 34%",
        heroPosition: "center top",
        mobileHeroPosition: "center top"
      },
      definition: [
        "Time is one of the great constants we created to put existence into order.",
        "It gives us direction. Measurement. Sequence. A way to understand where we are in relation to the movement of everything around us.",
        "We count days. Deadlines. Anniversaries. Clean time. Years lost. Time remaining. The moment before something happened and the life that existed afterward.",
        "We use time to convince ourselves that life is moving in a straight line, even when it is not."
      ],
      january22: "In my state of mind that night, I believed getting a video to go viral could start a chain of dominoes that would eventually help free Palestine.",
      sixYearLayer: [
        "For long stretches of those six years, I experienced time almost entirely as the distance between one urgent need and the next:",
        "How long until I could get more money?",
        "How long until I could get more drugs?",
        "How long until the discomfort stopped?",
        "Life became measured less in days, months, and years than in the shrinking distance between relief and needing relief again."
      ]
    },
    {
      number: "04",
      slug: "infinite-interactions",
      title: "INFINITE INTERACTIONS",
      shortExcerpt: "The bonds created whenever our threads touch the threads of another person.",
      heroImage: {
        imageSrc: asset("thread-04-infinite-interactions.png?v=20260717-12"),
        imageAlt: "Ryan posing with four coworkers in a warehouse aisle",
        objectPosition: "center 36%",
        mobileObjectPosition: "center 30%",
        heroPosition: "center 22%",
        mobileHeroPosition: "center 20%"
      },
      definition: [
        "The bonds created whenever our threads touch the threads of another person.",
        "Our threads affect theirs. The condition of their threads affects ours.",
        "Some interactions barely brush against us. Others pull with such sudden force that the entire direction of a life changes.",
        "A stranger can become permanent.",
        "Someone permanent can suddenly disappear.",
        "One interaction can rearrange everything that follows."
      ],
      january22: "At around 4:00 in the morning, while on my way to post the video and end my life, I stopped a random person on the street and asked whether they would free Palestine.",
      sixYearLayer: [
        "The people I met during those years—and many of the people you will eventually meet through interviews—became some of my closest friends.",
        "The bonds formed in that world could become incredibly deep, incredibly fast.",
        "There are not many places I can compare them to. Maybe war. Maybe other environments where people are forced into extreme circumstances together.",
        "When survival, danger, desperation, loyalty, betrayal, and dependence all exist in the same space, people can become woven into one another in ways that are difficult to explain from the outside."
      ]
    },
    {
      number: "05",
      slug: "how-a-home-can-hurt-or-heal",
      title: "HOW A HOME CAN HURT OR HEAL",
      shortExcerpt: "Home is a person’s headquarters.",
      heroImage: {
        imageSrc: asset("thread-05-how-a-home-can-hurt-or-heal.png?v=20260717-12"),
        imageAlt: "Ryan playing video games with a black cat resting on his chest",
        objectPosition: "center 46%",
        mobileObjectPosition: "center 38%",
        heroPosition: "center 50%",
        mobileHeroPosition: "center 42%"
      },
      definition: [
        "Home is a person’s headquarters.",
        "At its best, it provides foundation, security, protection, calm, and somewhere to put the rest of life back into order.",
        "It is where we process what happened outside. Where we examine our other threads. Where we try to understand how the outside world has acted upon us before stepping back into it.",
        "Without a safe and healing headquarters—physically, emotionally, or psychologically—it becomes much harder to organize our own threads well enough to interact with the threads of the outside world.",
        "A home can heal.",
        "A home can also become another source of injury."
      ],
      january22: "Trying to make sense of the biggest decision of my life through a laptop in the bathroom of an abandoned building—and nearly losing my life there.",
      sixYearLayer: [
        "After the home Ellie and I shared was gone, my library became my hideaway.",
        "It became the place where I could retreat from the outside world. Where I could curl up, get high, disappear into myself, and hope the world outside would simply float past me.",
        "It was shelter.",
        "It was isolation.",
        "It was both."
      ]
    },
    {
      number: "06",
      slug: "the-shape-we-see-ourself",
      title: "THE SHAPE WE SEE OURSELF",
      shortExcerpt: "The internal picture a person carries of who they are and what their existence means to everyone around them.",
      heroImage: {
        imageSrc: asset("thread-06-the-shape-we-see-ourself.jpg?v=20260717-12"),
        imageAlt: "Ryan standing indoors and kissing a wooden-stock rifle",
        objectPosition: "center 28%",
        mobileObjectPosition: "center 22%",
        heroPosition: "center 16%",
        mobileHeroPosition: "center 18%"
      },
      definition: [
        "The internal picture a person carries of who they are and what their existence means to everyone around them.",
        "This is the thread of the mind.",
        "Self-worth. Ego. Shame. Identity. Confidence. Distortion.",
        "It is the difference between who we are, who other people believe we are, and the version of ourselves we are capable of seeing from inside our own head.",
        "The greater the distortion, the further those versions can drift apart."
      ],
      january22: "Believing that the value I brought to the lives of the people I loved had become nonexistent.",
      sixYearLayer: [
        "Over six years, my sense of personal worth steadily deteriorated.",
        "As it got worse, I began to believe that everything I had once been proud of about myself had disappeared—and that none of it would ever come back.",
        "The person I remembered being and the person I believed I had become moved further and further apart.",
        "Eventually, I stopped believing there was a road between them."
      ]
    },
    {
      number: "07",
      slug: "love-lost",
      title: "LOVE LOST",
      shortExcerpt: "What happens to our threads when a source of love disappears.",
      heroImage: {
        imageSrc: asset("thread-07-love-lost.png?v=20260717-12"),
        imageAlt: "Ryan and Ellie standing together beside a tree",
        objectPosition: "center 25%",
        mobileObjectPosition: "center 20%",
        heroPosition: "center 2%",
        mobileHeroPosition: "center top"
      },
      definition: [
        "What happens to our threads when a source of love disappears.",
        "A death.",
        "A breakup.",
        "A friendship ending.",
        "A person leaving.",
        "Love does not simply vanish when its source is gone. The shape it created remains woven into everything it touched.",
        "Different kinds of love leave different kinds of absences, and those absences continue pulling on the rest of our lives long after the person is gone."
      ],
      january22: "Making the plan with Ellie, who, in my state of mind that night, returned to speak through the flag in my window.",
      sixYearLayer: [
        "Ellie. Ellie. Ellie.",
        "When the person who was your ride or die becomes only a memory, it changes you forever.",
        "Her absence did not become one isolated event in the archive.",
        "It moved through everything."
      ]
    },
    {
      number: "08",
      slug: "love-found",
      title: "LOVE FOUND",
      shortExcerpt: "What happens when a new source of love enters a life.",
      heroImage: {
        imageSrc: asset("thread-08-love-found.png?v=20260717-12"),
        imageAlt: "Ryan and Ellie posing with George Orwell's son at a public event",
        objectPosition: "center 42%",
        mobileObjectPosition: "center 34%",
        heroPosition: "center 22%",
        mobileHeroPosition: "center 20%"
      },
      definition: [
        "What happens when a new source of love enters a life.",
        "A relationship.",
        "The birth of a child.",
        "A friendship.",
        "A new pet.",
        "A person who suddenly matters.",
        "Love may be the thread with the greatest ability to expand, tighten, redirect, and reorganize everything around it.",
        "A new source of love can alter every other thread a person carries."
      ],
      january22: "In my state of mind that night, I recognized my niece Eliana as a literal angel whose purity and innocence became connected to the belief that Palestine would be freed as long as I wrote her name on a piece of paper.",
      sixYearLayer: [
        "Over time, I found a place inside myself that learned to recognize and return the same kinds of energy I received from the outside world.",
        "Love stopped being only something I had lost.",
        "It became something I could still find.",
        "Something I could still give.",
        "Something that could still reach me."
      ]
    },
    {
      number: "09",
      slug: "systems-of-rigid-design",
      title: "SYSTEMS OF RIGID DESIGN",
      shortExcerpt: "The institutions, governments, economies, platforms, and systems surrounding every individual life.",
      heroImage: {
        imageSrc: asset("thread-09-systems-of-rigid-design.png?v=20260717-12"),
        imageAlt: "Ryan being detained by NYPD officers during a public protest",
        objectPosition: "center 46%",
        mobileObjectPosition: "center 40%",
        heroPosition: "center 18%",
        mobileHeroPosition: "center 22%"
      },
      definition: [
        "The institutions, governments, economies, platforms, and systems surrounding every individual life.",
        "These are the thickest and most rigid threads.",
        "Unlike the threads of a single person, they can stretch across millions of lives at once. They can reward, punish, restrict, redirect, and reshape individual lives with enormous force.",
        "One person’s thread is usually weak against them.",
        "But when enough individual threads become woven together and begin pulling in the same direction, that imbalance can change."
      ],
      january22: "Crying out and attempting to turn my tiny individual thread into one capable of wrapping together the threads of millions into a larger force directed toward freeing Palestine.",
      sixYearLayer: [
        "I had already spent more than a decade as a left-wing activist.",
        "I had been beaten, tear-gassed, arrested, and visited by the FBI.",
        "As political developments in the country increasingly felt, to me, like movement toward fascism, the outside world became another source of pressure—another thing I wanted to hide from.",
        "The systems surrounding my life did not feel distant or theoretical.",
        "I had felt them physically.",
        "I had watched them act on people.",
        "And I had spent years trying to understand whether one person could ever meaningfully push back."
      ]
    }
  ].map((thread) => ({
    ...thread,
    description: thread.shortExcerpt || thread.definition[0],
    status: "Foundational Thread",
    buttonLabel: "Open Thread",
    buttonHref: `/threads/${thread.slug}/?v=20260717-12`,
    relatedThreadSlugs: [],
    tags: [],
    evidenceItems: [],
    relatedDrops: [],
    heroImage: thread.heroImage || null,
    cardImage: null
  }));

  const threadMapHotspots = [
    { slug: "roaring-rivers-silent-seas", left: 18.2, top: 6.5, width: 19.2, height: 19.5, photoLeft: 18.9, photoTop: 7.6, photoWidth: 7.2, photoHeight: 13.5, photoPosition: "center 28%" },
    { slug: "craving-the-chase-for-comfort", left: 38.0, top: 2.5, width: 20.0, height: 19.5, photoLeft: 38.6, photoTop: 4.5, photoWidth: 8.1, photoHeight: 14.9, photoPosition: "center 34%" },
    { slug: "the-ticking-of-time", left: 59.6, top: 5.5, width: 19.4, height: 20.5, photoLeft: 60.3, photoTop: 6.5, photoWidth: 7.4, photoHeight: 14.5, photoPosition: "center 28%" },
    { slug: "infinite-interactions", left: 61.2, top: 30.0, width: 18.2, height: 22.5, photoLeft: 63.7, photoTop: 32.9, photoWidth: 8.1, photoHeight: 15.1, photoPosition: "center 30%" },
    { slug: "how-a-home-can-hurt-or-heal", left: 63.4, top: 53.0, width: 18.0, height: 20.5, photoLeft: 64.0, photoTop: 56.8, photoWidth: 8.0, photoHeight: 15.5, photoPosition: "center 46%" },
    { slug: "the-shape-we-see-ourself", left: 55.6, top: 70.5, width: 17.0, height: 22.0, photoLeft: 56.0, photoTop: 73.1, photoWidth: 5.7, photoHeight: 15.9, photoPosition: "center 26%" },
    { slug: "love-lost", left: 37.2, top: 73.0, width: 19.0, height: 19.0, photoLeft: 38.5, photoTop: 75.1, photoWidth: 7.6, photoHeight: 15.5, photoPosition: "center 24%" },
    { slug: "love-found", left: 17.6, top: 59.5, width: 19.5, height: 24.0, photoLeft: 18.3, photoTop: 64.3, photoWidth: 7.9, photoHeight: 16.0, photoPosition: "center 32%" },
    { slug: "systems-of-rigid-design", left: 14.5, top: 40.0, width: 20.0, height: 22.0, photoLeft: 15.1, photoTop: 40.3, photoWidth: 8.0, photoHeight: 16.8, photoPosition: "center 38%" }
  ].map((hotspot) => {
    const thread = foundationalThreads.find((item) => item.slug === hotspot.slug);
    return {
      ...hotspot,
      number: thread?.number || "",
      title: thread?.title || hotspot.slug,
      photoImageSrc: thread?.heroImage?.imageSrc || "",
      href: `/threads/${hotspot.slug}/?v=20260717-12`
    };
  });

  const sharedHero = {
    eyebrow: "6 YEARS OF COLLAPSE, SURVIVAL, AND FINDING SOMETHING WORTH LIVING FOR",
    headline: projectTitle,
    body: "A six-year archive of videos, photographs, notebooks, interviews, art, screenshots, artifacts, and evidence—turned into a book, documentary, and soundtrack tracing one person’s tailspin into collapse.",
    smallNote: projectOneLiner,
    actions: [
      { label: "Watch Official Drops", href: "/drops/", primary: true },
      { label: "Open The Map", href: "/map/" },
      { label: "Get Trap Pass", href: "/trap-pass/" },
      { label: "Enter Trap House", href: "/trap-house/" }
    ],
    imageSrc: asset("home-main-banner-sharp-approved.png"),
    imageAlt: "IHOCAIHAG documentary banner with the masked portrait and project archive",
    backgroundPosition: "center center",
    mobileBackgroundPosition: "92% center"
  };

  window.IHOCAIHAGSiteContent = {
    draft,
    coming,
    globalContent: {
      projectTitle,
      projectShortName,
      creatorName,
      website: siteUrl,
      oneLiner: projectOneLiner,
      shortDescription: projectShortDescription,
      origin: projectOrigin,
      whyTitleExists,
      disclaimer,
      triggerWarning,
      supportResource
    },

    navigation: {
      main: [
        { label: "Home", href: "/", page: "home" },
        { label: "About", href: "/about/", page: "about" },
        { label: "Thread Map", href: "/map/", page: "map" },
        { label: "Book", href: "/book/", page: "book" },
        { label: "Doc", href: "/documentary/", page: "documentary" },
        { label: "Drops", href: "/drops/", page: "drops" },
        { label: "Trap Pass", href: "/trap-pass/", page: "trap-pass" },
        { label: "Trap House", href: "/trap-house/", page: "trap-house" },
        { label: "Store", href: "/store/", page: "store" }
      ],
      pass: {
        signedInLabel: "My Pass",
        signedInHref: "/my-pass/",
        signedOutLabel: "Get Trap Pass",
        signedOutHref: "/trap-pass/"
      }
    },

    links: {
      website: siteUrl,
      instagram: "https://instagram.com/ihocaihag",
      tiktok: "https://tiktok.com/@ihocaihagofficial",
      threads: "https://threads.net/@ihocaihag",
      youtube: "https://youtube.com/@imhighoncrackandihaveagun",
      x: "https://x.com/comradejizzy",
      patreon: "https://patreon.com/IMHIGHONCRACKANDIHAVEAGUN",
      discord: "https://discord.gg/64MKTrGGsD",
      spotify: "https://open.spotify.com/artist/7GUAmAkkpLLESm0Fig1NWZ",
      appleMusic: "https://music.apple.com/search?term=IHOCAIHAG"
    },

    socialLinks,

    seoContent: {
      siteUrl,
      favicon: asset("ihocaihag-rectangle-logo.png"),
      defaults: {
        title: projectShortName,
        description: projectOneLiner,
        ogTitle: projectTitle,
        ogDescription: projectShortDescription,
        ogImage: defaultSocialImage,
        twitterTitle: projectTitle,
        twitterDescription: projectOneLiner,
        twitterImage: defaultSocialImage,
        canonicalUrl: siteUrl
      },
      routes: {
        home: {
          title: projectTitle,
          description: projectShortDescription,
          canonicalUrl: `${siteUrl}/`,
          ogImage: asset("home-main-banner-sharp-approved.png"),
          twitterImage: asset("home-main-banner-sharp-approved.png")
        },
        map: { title: `Thread Map | ${projectShortName}`, description: mapDescription, canonicalUrl: `${siteUrl}/map/`, ogImage: asset("thread-map-interactive-approved.png"), twitterImage: asset("thread-map-interactive-approved.png") },
        "january-22": { title: `January 22 | ${projectShortName}`, description: january22Description, canonicalUrl: `${siteUrl}/map/january-22/` },
        drops: { title: `Official Drops | ${projectShortName}`, description: dropsDescription, canonicalUrl: `${siteUrl}/drops/`, ogImage: asset("official-drops-approved.png"), twitterImage: asset("official-drops-approved.png") },
        "trap-pass": { title: `Trap Pass | ${projectShortName}`, description: "Your personal key into the project—and proof you were here while it was still being built.", canonicalUrl: `${siteUrl}/trap-pass/` },
        "trap-house": { title: `Trap House | ${projectShortName}`, description: "Where WE come together, talk back, and build whatever we decide is worth building.", canonicalUrl: `${siteUrl}/trap-house/` },
        store: { title: `Store | ${projectShortName}`, description: storeDescription, canonicalUrl: `${siteUrl}/store/`, ogImage: asset("home-store-approved.png"), twitterImage: asset("home-store-approved.png") },
        about: { title: `About | ${projectShortName}`, description: "This is not a recovery commercial.", canonicalUrl: `${siteUrl}/about/` },
        book: { title: `Book | ${projectShortName}`, description: "A story you won’t believe you read until you see the receipts.", canonicalUrl: `${siteUrl}/book/` },
        documentary: { title: `Documentary | ${projectShortName}`, description: "Six years of footage recorded from inside active addiction.", canonicalUrl: `${siteUrl}/documentary/`, ogImage: asset("documentary-cover-approved.png"), twitterImage: asset("documentary-cover-approved.png") },
        "my-pass": { title: `My Pass | ${projectShortName}`, description: "Look up and view your Trap Pass.", canonicalUrl: `${siteUrl}/my-pass/` },
        pass: { title: `Public Pass | ${projectShortName}`, description: "Public Trap Pass view.", canonicalUrl: `${siteUrl}/pass/` },
        "thread-detail": { title: `Thread | ${projectShortName}`, description: "A foundational thread inside the IHOCAIHAG map.", canonicalUrl: `${siteUrl}/threads/` },
        "checkout-success": { title: `Checkout | ${projectShortName}`, canonicalUrl: `${siteUrl}/checkout/success/` },
        "trap-verify": { title: `Pass Verification | ${projectShortName}`, canonicalUrl: `${siteUrl}/trap/verify/` }
      }
    },

    uiContent: {
      brand: {
        label: "IHOCAIHAG",
        domain: "imhighoncrackandihaveagun.com"
      },
      placeholders: {
        draft,
        coming,
        imageSlot: "IMAGE SLOT",
        comingSoon: "Coming soon."
      },
      states: {
        loading: "Loading...",
        error: "Something went wrong.",
        empty: "Nothing here yet.",
        comingSoon: "Coming soon.",
        unavailable: "Unavailable."
      },
      sections: {
        threadGrid: { eyebrow: "Nine Foundational Threads", headline: "Foundational Threads", body: threadDefinition[0] },
        currentWave: { eyebrow: "Current Wave" },
        trapPassTiers: { eyebrow: "Three Tiers", headline: "Choose Your Level", body: "Your tier shows whether you hold the Free, Cash For Trash, or physical Handy Sass level. Upgrading your tier never erases when you entered." },
        passHistory: { eyebrow: "Release History", headline: "Prior Trap Pass Releases", body: "Your entry wave records when you locked in with the project. It stays part of your identity even as your wallet grows." },
        discordCta: { eyebrow: "Join Discord", headline: "Enter Trap House", body: trapHouseGeneralCopy },
        dropTable: { eyebrow: "Drop Table", headline: "Official Products", body: "Official project objects, preorders, and access." }
      },
      forms: {
        email: "Email",
        checkoutEmail: "Email for checkout",
        trapIdentity: "Trap identity (optional)",
        discordUsername: "Discord username (optional and private)",
        passId: "Holder ID or card serial",
        verificationToken: "Holder ID or card serial",
        claimFreePass: "Claim Free Pass",
        myPass: "Open My Pass",
        viewPublicPass: "Open Holder Profile",
        verifyPass: "Check Your Pass"
      },
      passLabels: {
        sample: "SAMPLE WALLET",
        publicPass: "Holder Profile",
        myPass: "My Pass",
        existingPass: "Wallet Found",
        passReady: "Wallet Ready",
        passId: "Permanent Holder ID",
        publicPassId: "Permanent Holder ID",
        cardSerial: "Card Serial",
        wave: "Wave",
        tier: "Tier",
        holder: "Trap Identity",
        status: "Status",
        memberSince: "Member Since",
        publicThreadTags: "Public Threads",
        publicView: "Public Profile",
        previewOnly: "Preview Only"
      },
      actions: {
        open: "Open",
        openMap: "Open Map",
        joinTrapHouse: "Join Trap House",
        upgradePass: "Upgrade Tier",
        editDisplayName: "Edit Trap Identity",
        manageBilling: "Manage Billing",
        copyPassId: "Copy Holder ID",
        copied: "Copied",
        preorder: "Preorder",
        viewPublicProfile: "View Public Profile",
        downloadFront: "Download Front PNG",
        downloadBack: "Download Back PNG",
        flipCard: "Flip Card",
        claimNewPass: "Claim New Pass",
        buyPhysicalPass: "Buy Physical Pass",
        saveProfile: "Save Profile",
        signOut: "Close Wallet",
        copyUnlockCode: "Copy Personal Unlock Code",
        emailUnlockCode: "Email Your Code"
      },
      checkout: {
        closed: "Paid checkout is not open yet.",
        closedButton: "Checkout Opening Soon",
        ready: "Checkout ready.",
        checking: "Checking checkout.",
        checkingButton: "Checking Checkout...",
        opening: "Opening checkout.",
        openingButton: "Opening checkout...",
        failed: "Checkout unavailable."
      }
    },

    footerContent: {
      eyebrow: projectShortName,
      headline: projectTitle,
      body: projectOneLiner,
      safetyText: disclaimer,
      triggerWarningText: triggerWarning,
      supportLabel: supportResource,
      utilityLinks: [
        { label: "Store", href: "/store/" }
      ],
      socialLinks
    },

    homeContent: {
      hero: sharedHero,
      fiveWays: {
        eyebrow: "Start Here",
        headline: "Five Ways Into The Same Story",
        body: projectOneLiner,
        cards: [
          {
            label: "Book",
            headline: "A story you won’t believe you read until you see the receipts.",
            question: "What if the same brain that cannot stop inflicting its own destruction is the same kind of brain determining the world around you?",
            body: "The book follows one person’s collapse from the inside, then follows the pattern outward. Addiction becomes more than an individual story—it becomes a way of examining power, money, systems, compulsion, and what happens when the logic of “more” is allowed to run without a stopping point.",
            buttonLabel: "Open Book",
            href: "/book/"
          },
          {
            label: "Raw Documentary",
            headline: "Raw Documentary",
            question: "What does addiction look like when it stops being told from a safe, sanitized perspective with an agenda?",
            body: [
              "Prepare to experience addiction in its rawest, most unsanitized, uncomfortable, chaotic, and complex form yet.",
              "Confessions, interviews, documentation, footage, analysis, and mental fragmentation collide inside a record that was being created while the collapse was still happening."
            ],
            buttonLabel: "Open Documentary",
            href: "/documentary/"
          },
          {
            label: "Soundtrack",
            headline: "The sounds of the collapse.",
            body: "Songs, noise, memory, and emotion pulled from the same years as the footage and writing. Not background music for the story—the part of it that had to be heard instead of explained.",
            buttonLabel: "Watch Official Drops",
            href: "/drops/"
          },
          {
            label: "Trap Pass",
            headline: "CLAIM A PIECE OF THE STORY",
            body: trapPassGeneralCopy,
            buttonLabel: "Claim Free Pass",
            href: "/trap-pass/"
          },
          {
            label: "Trap House",
            headline: "WHERE THE PROJECT GROWS FROM MINE TO OURS",
            body: trapHouseGeneralCopy,
            buttonLabel: "Enter Trap House",
            href: "/trap-house/"
          }
        ]
      },
      previews: [
        {
          id: "map",
          eyebrow: "Map",
          headline: "Open The Map",
          body: threadDefinition[0],
          buttonLabel: "Open The Map",
          buttonHref: "/map/",
          imageSrc: asset("home-open-map-drawer-approved.png"),
          imageAlt: "Open drawer containing project artifacts, cash, and drug-use evidence beneath Dopesick artwork",
          objectPosition: "center 56%",
          mobileObjectPosition: "center 48%"
        },
        {
          id: "official-drops",
          eyebrow: "Official Drops",
          headline: "Watch Official Drops",
          body: dropsDescription,
          buttonLabel: "Watch Official Drops",
          buttonHref: "/drops/",
          imageSrc: asset("home-official-drops-approved.png"),
          imageAlt: "Ryan seated in the project workspace",
          imageFit: "cover",
          objectPosition: "center center"
        },
        {
          id: "trap-pass",
          eyebrow: "Trap Pass",
          headline: "Get Trap Pass",
          body: "Your personal key into the project—and proof you were here while it was still being built.",
          buttonLabel: "Get Trap Pass",
          buttonHref: "/trap-pass/",
          imageSrc: asset("home-trap-pass-approved.png"),
          imageAlt: "Ride Or Dies Trap Pass ticket"
        },
        {
          id: "trap-house",
          eyebrow: "Trap House",
          headline: "WHERE THE PROJECT GROWS FROM MINE TO OURS",
          body: trapHouseGeneralCopy,
          buttonLabel: "Enter Trap House",
          buttonHref: "/trap-house/",
          imageSrc: asset("trap-house-approved.png"),
          imageAlt: "The Trap House logo"
        },
        {
          id: "store",
          eyebrow: "Store",
          headline: "Store",
          body: storeDescription,
          buttonLabel: "Open Store",
          buttonHref: "/store/",
          imageSrc: asset("home-store-approved.png"),
          imageAlt: "IHOCAIHAG Street Arrest collector figure set"
        }
      ]
    },

    dropsContent: {
      hero: {
        eyebrow: "Official Drops",
        headline: "Official Drops",
        body: dropsDescription,
        smallNote: "Start with January 22: The Blast Crater.",
        ctaPrimaryLabel: "Watch Official Drops",
        ctaPrimaryHref: "https://youtube.com/@imhighoncrackandihaveagun",
        ctaSecondaryLabel: "Open The Map",
        ctaSecondaryHref: "/map/",
        imageSrc: asset("official-drops-approved.png"),
        imageAlt: "IHOCAIHAG documentary DVD displayed with archive evidence",
        imageFit: "contain",
        backgroundPosition: "right center",
        mobileBackgroundPosition: "center top"
      },
      featuredDrop: {
        title: "Jan 22nd: The Blast Crater",
        status: "Featured Drop",
        description: "Start with this one.",
        thumbnail: "",
        imageAlt: "Featured drop thumbnail slot",
        youtubeUrl: "https://www.youtube.com/watch?v=etqV9snaQ2I&t=1s",
        embed: {
          type: "youtube",
          src: "https://www.youtube.com/embed/etqV9snaQ2I?si=YOxrDeuKxJEm2EkR&start=1",
          title: "IHOCAIHAG featured drop"
        },
        tags: []
      },
      whatDropsHere: {
        eyebrow: "Drop Table",
        headline: "What Drops Here",
        body: "Featured footage, trailers, and soundtrack pieces from the same archive."
      },
      cards: [
        {
          label: "Trailers",
          body: "Official trailers and first looks at the documentary.",
          buttonLabel: "Watch Trailer",
          buttonHref: "https://www.youtube.com/watch?v=PZNJUtX1Tss",
          embed: {
            type: "youtube",
            src: "https://www.youtube.com/embed/PZNJUtX1Tss?si=1dsXHBZ6EcRfXVSJ",
            title: "IHOCAIHAG trailer"
          }
        },
        {
          label: "Prelaunch Trailer",
          body: "The prelaunch trailer for IM HIGH ON CRACK AND I HAVE A GUN.",
          buttonLabel: "Watch Prelaunch Trailer",
          buttonHref: "https://www.instagram.com/reel/Da7bS3XMP6c/",
          embed: {
            type: "instagram",
            permalink: "https://www.instagram.com/reel/Da7bS3XMP6c/",
            title: "IHOCAIHAG prelaunch trailer on Instagram"
          }
        },
        {
          label: "Soundtrack Pieces",
          body: "Music and performance pieces pulled from the same years as the footage and writing.",
          buttonLabel: "Open Soundtrack Piece",
          buttonHref: "https://www.instagram.com/reel/DaxuKyqM3ac/",
          embed: {
            type: "instagram",
            permalink: "https://www.instagram.com/reel/DaxuKyqM3ac/",
            title: "IHOCAIHAG soundtrack piece on Instagram"
          }
        }
      ]
    },

    mapContent: {
      hero: {
        eyebrow: "Map",
        headline: "Map",
        body: mapDescription,
        ctaPrimaryLabel: "Open The Map",
        ctaPrimaryHref: "#thread-board",
        imageSrc: asset("threads-page-approved.png"),
        imageAlt: "Thread archive spread with notebooks, photographs, typewriter, and project objects",
        backgroundPosition: "center center",
        mobileBackgroundPosition: "center top"
      },
      whatAreThreads: {
        eyebrow: "What Are Threads?",
        headline: "What Are Threads?",
        body: threadDefinition
      },
      boardIntro: {
        eyebrow: "Nine Foundational Threads",
        headline: "The Thread Map",
        body: "Select any numbered thread on the map to open its definition.",
        imageSrc: asset("thread-map-interactive-approved.png"),
        imageAlt: "The IHOCAIHAG Thread Map connecting nine foundational threads",
        hotspots: threadMapHotspots
      },
      originPanel: {
        eyebrow: "January 22 / Blast Crater",
        headline: "January 22",
        body: january22Description,
        imageSrc: asset("pink-notebook-desk.png"),
        imageAlt: "January 22 feature image slot",
        buttonLabel: "Open January 22",
        buttonHref: "/map/january-22/",
        manifestations: foundationalThreads.map((thread) => ({
          number: thread.number,
          title: thread.title,
          slug: thread.slug,
          body: thread.january22
        }))
      },
      evidenceConnection: {
        eyebrow: "Evidence / Archive Connection",
        headline: "Evidence / Archive Connection",
        body: "Clips, photographs, screenshots, notebook pages, songs, chapters, artifacts, interviews, and drops become evidence nodes inside the same map.",
        types: ["Clips", "Photos", "Screenshots", "Notebook Pages", "Songs", "Chapters", "Artifacts", "Interviews", "Drops"]
      },
      threads: foundationalThreads
    },

    january22Content: {
      hero: {
        eyebrow: "January 22 / Blast Crater",
        headline: "January 22",
        body: january22Description,
        ctaPrimaryLabel: "Back To Map",
        ctaPrimaryHref: "/map/",
        imageSrc: asset("pink-notebook-desk.png"),
        imageAlt: "January 22 feature image slot"
      },
      manifestations: foundationalThreads.map((thread) => ({
        number: thread.number,
        title: thread.title,
        slug: thread.slug,
        body: thread.january22
      })),
      missingSections: []
    },

    threadContent: {
      hero: {
        eyebrow: "Thread",
        headline: "Foundational Thread",
        body: "Each thread explains an invisible force running through the archive.",
        ctaPrimaryLabel: "Back To Map",
        ctaPrimaryHref: "/map/",
        ctaSecondaryLabel: "Watch Official Drops",
        ctaSecondaryHref: "/drops/",
        imageSrc: "",
        imageAlt: "Thread hero image slot"
      },
      sectionLabels: {
        principle: "The Principle",
        january22: "January 22: Blast Crater Manifestation",
        sixYearLayer: "Six-Year Layer",
        evidence: "Evidence",
        crosses: "Threads It Crosses",
        relatedTags: "Related Tags",
        relatedDrops: "Related Drops"
      },
      evidenceIntro: "Archive evidence will appear with a thread when it has been reviewed and cleared for publication.",
      threads: foundationalThreads
    },

    trapPassContent: {
      hero: {
        eyebrow: "Trap Pass",
        headline: "CLAIM A PIECE OF THE STORY",
        body: trapPassGeneralCopy,
        smallNote: "One permanent identity. A wallet that grows with every Trap Pass release you claim.",
        ctaPrimaryLabel: "Claim Free Pass",
        ctaPrimaryHref: "#claim",
        ctaSecondaryLabel: "My Pass",
        ctaSecondaryHref: "/my-pass/",
        imageSrc: asset("trap-pass-claim-story-banner-approved.png"),
        imageAlt: "IHOCAIHAG Claim A Piece Of The Story poster",
        imageFit: "contain",
        backgroundPosition: "right center",
        mobileBackgroundPosition: "center top"
      },
      whatIs: {
        eyebrow: "What Is A Trap Pass?",
        headline: "Identity. Collectible. Access Key.",
        body: [
          "A Trap Pass is one permanent holder identity, a wallet of collectible releases, and an access key into the project.",
          "Your entry wave records when you locked in with the project. It stays part of your identity even as your wallet grows.",
          "Your tier shows whether you hold the Free, Cash For Trash, or physical Handy Sass level. Upgrading your tier never erases when you entered."
        ]
      },
      currentRelease: {
        eyebrow: "Current Release",
        displayTitle: "No Brakes",
        smallNote: "Gen 2 Wave 1",
        body: "Claim the current release into one permanent wallet. NO BRAKES is the release. Free, Cash For Trash, and Handy Sass are tiers.",
        imageSrc: asset("trap-pass-no-brakes-current-approved.png"),
        imageAlt: "No Brakes Gen 2 Wave 1 Trap Pass"
      },
      tiers: [
        {
          id: "free-pass",
          label: "Free Pass",
          price: "Free",
          description: "A permanent entry into the Trap Pass system. Claim your identity, receive your holder number, add the current release to your wallet, and return to collect future Trap Passes as they are released.",
          benefits: ["Permanent holder identity", "Current-release collectible", "Private wallet", "Optional public profile", "PNG pass downloads"],
          buttonLabel: "Claim Free Pass",
          buttonHref: "#claim",
          stripePriceId: "",
          templateId: "gen_2_wave_1_no_brakes",
          tier: "Free Pass",
          imageSrc: asset("trap-pass-free-no-brakes-approved.png"),
          imageAlt: "Free No Brakes Gen 2 Wave 1 Trap Pass"
        },
        {
          id: "cash-for-trash",
          label: "Cash For Trash Trap Pass",
          price: "$4.99/month",
          annualPrice: "$44.91/year",
          annualStatus: "Annual checkout not yet activated.",
          description: "The paid digital tier. Choose monthly or annual access, receive the green-and-copper holder treatment, and unlock a personal code you can send directly to Ryan for your opening personal unlock.",
          benefits: ["Green-and-copper holder treatment", "Private personal unlock code", "Monthly checkout available", "Annual structure ready"],
          buttonLabel: "Upgrade Tier",
          buttonHref: "/store/#cash-for-trash",
          stripePriceId: "",
          templateId: "gen_2_wave_1_no_brakes",
          tier: "Cash For Trash Trap Pass",
          imageSrc: asset("trap-pass-cash-for-trash-approved.png"),
          imageAlt: "Cash For Trash Gen 2 Wave 1 Trap Pass"
        },
        {
          id: "handy-sass",
          label: "Handy Sass Trap Pass",
          price: "$39.99",
          description: "The signed physical and lifetime tier. Includes a serialized physical Trap Pass based on your original entry wave, lifetime Handy Sass status, a handwritten thank-you, future premium content, a manually assigned Discord role, and temporary Cash For Trash access.",
          benefits: ["Signed physical card", "Lifetime Handy Sass status", "Handwritten thank-you", "Temporary Cash For Trash access", "Duration to be announced."],
          buttonLabel: "Buy Physical Pass",
          buttonHref: "/store/#handy-sass",
          stripePriceId: "",
          templateId: "gen_2_wave_1_no_brakes",
          tier: "Handy Sass Trap Pass",
          imageSrc: asset("store-handy-sass-approved.png"),
          imageAlt: "Handy Sass lifetime physical Trap Pass"
        }
      ],
      claimForm: {
        eyebrow: "Claim",
        headline: "Claim Free Pass",
        body: "One verified email owns one permanent holder identity. A new release is added to that same wallet instead of creating another account.",
        privacyNote: "Your email and optional Discord username stay private. Your public profile is off unless you choose to enable it."
      },
      sampleWallet: {
        label: "SAMPLE WALLET",
        holderId: "TP-0100",
        trapIdentity: "Example Holder",
        originalEntryWave: "No Brakes",
        tier: "Free Pass",
        cardSerial: "NB-0100",
        status: "Preview Only",
        imageSrc: asset("trap-pass-no-brakes-current-approved.png"),
        imageAlt: "No Brakes Gen 2 Wave 1 Trap Pass"
      },
      history: [
        {
          generation: "Generation 1",
          title: "Wave 1 — Ride Or Dies",
          prefix: "ROD",
          claimStatus: "Manual verification only",
          imageSrc: asset("trap-pass-wave1-ride-or-dies-approved.png"),
          imageAlt: "Ride Or Dies Wave 1 Trap Pass showing Ryan and Rue in the car"
        },
        {
          generation: "Generation 1",
          title: "Wave 2 — When 3 Deer Appear",
          prefix: "W3D",
          claimStatus: "Manual verification only",
          imageSrc: asset("trap-pass-wave2-when-3-deer-appear-approved.png"),
          imageAlt: "When 3 Deer Appear Wave 2 Trap Pass showing Ryan and Ellie with three deer"
        },
        {
          generation: "Generation 1",
          title: "Wave 3 — All Hands On Deck",
          prefix: "AHD",
          claimStatus: "Manual verification only",
          imageSrc: asset("trap-pass-wave3-all-hands-on-deck-approved.png"),
          imageAlt: "All Hands On Deck Wave 3 Trap Pass showing Ryan without a shirt"
        },
        {
          generation: "Generation 1",
          title: "Wave 4 — Bring The Storm",
          prefix: "BTS",
          claimStatus: "Manual verification only",
          imageSrc: asset("trap-pass-wave4-bring-the-storm-approved.png"),
          imageAlt: "Bring The Storm Wave 4 Trap Pass showing Ryan wearing the shirt"
        }
      ],
      validation: {
        eyebrow: "Check Your Pass",
        headline: "Exact Serial Validation",
        body: "Check a permanent holder ID or collectible card serial. Validation confirms only whether the pass is valid."
      },
      privacy: {
        eyebrow: "Privacy",
        headline: "You Decide What Becomes Public",
        body: "Email, billing information, private unlock codes, Discord usernames, and private wallet records are never shown on a public holder profile."
      }
    },

    trapHouseContent: {
      hero: {
        eyebrow: "Trap House",
        headline: "WHERE THE PROJECT GROWS FROM MINE TO OURS",
        body: trapHouseGeneralCopy,
        smallNote: "Discord invite: https://discord.gg/64MKTrGGsD",
        ctaPrimaryLabel: "Enter Trap House",
        ctaPrimaryHref: "https://discord.gg/64MKTrGGsD",
        ctaSecondaryLabel: "Get Trap Pass",
        ctaSecondaryHref: "/trap-pass/",
        imageSrc: asset("trap-house-approved.png"),
        imageAlt: "The Trap House logo"
      },
      discordInviteUrl: "https://discord.gg/64MKTrGGsD",
      communityCards: [
        {
          label: "The Shooting Gallery",
          imageSrc: asset("discord-shooting-gallery.png"),
          imageAlt: "The Shooting Gallery Discord channel room with project members gathered together"
        },
        {
          label: "The Room With The Bluetooth Speaker",
          imageSrc: asset("discord-bluetooth-speaker-room.png"),
          imageAlt: "The Room With The Bluetooth Speaker Discord channel graphic"
        },
        {
          label: "Tell Me I'm Trash",
          imageSrc: asset("discord-tell-me-im-trash.png"),
          imageAlt: "Tell Me I'm Trash Discord feedback channel graphic"
        }
      ],
      passRoleNote: {
        eyebrow: "Pass Roles",
        headline: "Pass Roles",
        body: "Trap Pass holders can receive Discord roles tied to their entry wave or tier. Roles identify participation; they do not expose private wallet or billing details."
      },
      rulesNote: {
        eyebrow: "Rules / Safety",
        headline: "Rules / Safety",
        body: "Respect privacy, consent, and the people behind the archive. No harassment, threats, doxxing, drug sales, or instructions for unsafe or illegal behavior."
      }
    },

    storeContent: {
      hero: {
        eyebrow: "Store",
        headline: "SHOP THE PROJECT",
        body: "Choose an official project item, then complete payment securely through Stripe Checkout.",
        ctaPrimaryLabel: "View Store Items",
        ctaPrimaryHref: "#drop-table",
        ctaSecondaryLabel: "Get Trap Pass",
        ctaSecondaryHref: "/trap-pass/",
        imageSrc: asset("home-store-approved.png"),
        imageAlt: "IHOCAIHAG Street Arrest collector figure set"
      },
      products: [
        {
          id: "og-crack-pack",
          key: "og_crack_pack",
          name: "The OG Crack Pack",
          displayTitle: "The OG Crack Pack",
          category: "Bundle",
          price: "$99.99",
          billingInterval: "One-time",
          status: "Store Item",
          description: "Physical preorder bundle / OG Crack Pack.",
          benefits: [],
          buttonLabel: "Buy Through Stripe",
          buttonHref: "#",
          stripePriceId: "",
          imageSrc: asset("store-og-crack-pack-approved.png"),
          imageAlt: "The OG Crack Pack limited edition redemption ticket",
          imageFit: "contain"
        },
        {
          id: "raw-doc",
          key: "raw_doc_preorder",
          name: "Raw Documentary First-Day Access",
          displayTitle: "Raw Documentary\nFirst-Day Access",
          category: "Documentary",
          price: "$9.99",
          billingInterval: "One-time",
          status: "Store Item",
          description: "Digital first-day access to selected raw documentary material.",
          benefits: [],
          buttonLabel: "Buy Through Stripe",
          buttonHref: "#",
          stripePriceId: "",
          imageSrc: asset("documentary-dvd-cover.png"),
          imageAlt: "Raw documentary cover",
          imageFit: "contain"
        },
        {
          id: "black-tee",
          key: "black_tee",
          name: "Official IHOCAIHAG Black Tee",
          displayTitle: "Official IHOCAIHAG\nBlack Tee",
          category: "Merch",
          price: "$27.99",
          billingInterval: "One-time",
          status: "Store Item",
          description: "Official black IHOCAIHAG project shirt.",
          benefits: [],
          buttonLabel: "Buy Through Stripe",
          buttonHref: "#",
          stripePriceId: "",
          imageSrc: "/store-shirt-black.webp",
          imageAlt: "Official black IHOCAIHAG shirt"
        },
        {
          id: "hardcover",
          key: "hardcover_preorder",
          name: "Hardcover Book Preorder",
          displayTitle: "Hardcover Book\nPreorder",
          category: "Book",
          price: "$39.99",
          billingInterval: "One-time",
          status: "Store Item",
          description: "Hardcover preorder for the IHOCAIHAG book.",
          benefits: [],
          buttonLabel: "Buy Through Stripe",
          buttonHref: "#",
          stripePriceId: "",
          imageSrc: asset("store-hardcover-book-approved.png"),
          imageAlt: "IHOCAIHAG hardcover book mockup featuring the masked cover portrait",
          imageFit: "contain"
        },
        {
          id: "handy-sass",
          key: "handy_sass_pass",
          name: "Handy Sass Trap Pass",
          displayTitle: "Handy Sass\nTrap Pass",
          category: "Trap Pass Tier",
          price: "$39.99",
          billingInterval: "One-time",
          status: "Not Available Yet",
          description: "Physical lifetime Trap Pass with a mailed collectible card.",
          benefits: [],
          buttonLabel: "Unavailable",
          buttonHref: "#",
          checkoutEnabled: false,
          stripePriceId: "",
          imageSrc: asset("store-handy-sass-approved.png"),
          imageAlt: "Handy Sass lifetime physical Trap Pass",
          imageFit: "contain"
        },
        {
          id: "cash-for-trash",
          key: "cash_for_trash_monthly",
          name: "Cash For Trash Trap Pass",
          displayTitle: "Cash For Trash\nTrap Pass",
          category: "Trap Pass Tier",
          price: "$4.99/mo",
          billingInterval: "Monthly",
          status: "Not Available Yet",
          description: "Monthly digital Trap Pass membership.",
          benefits: [],
          buttonLabel: "Unavailable",
          buttonHref: "#",
          checkoutEnabled: false,
          stripePriceId: "",
          imageSrc: asset("trap-pass-cash-for-trash-approved.png"),
          imageAlt: "Cash For Trash Gen 2 Wave 1 Trap Pass",
          imageFit: "contain"
        }
      ],
      featuredTrapPass: {
        eyebrow: "Trap Pass Feature",
        headline: "Trap Pass",
        body: "Wave is when someone entered. Tier is the type and depth. Pass is the individual key and identity.",
        imageSrc: asset("trap-pass-no-brakes-current-approved.png"),
        imageAlt: "No Brakes Gen 2 Wave 1 Trap Pass"
      },
      objectBundle: {
        eyebrow: "Physical Archive Feature",
        headline: "Physical Archive",
        body: "Books, apparel, and project objects that carry pieces of the archive into the physical world.",
        imageSrc: asset("store-hardcover-book-approved.png"),
        imageAlt: "IHOCAIHAG hardcover book"
      },
      disclaimer: {
        eyebrow: "Purchase Note",
        headline: "Purchase Note",
        body: "Review the item and order details before payment. Confirmation is sent to the email used at checkout."
      }
    },

    aboutContent: {
      hero: {
        eyebrow: "About",
        headline: "THIS IS NOT A RECOVERY COMMERCIAL",
        editorial: true,
        body: [
          "IM HIGH ON CRACK AND I HAVE A GUN is a six-year self-documented archive of addiction, grief, psychosis, survival, love, destruction, and the strange things a person can still create while their life is collapsing around them. Built from thousands of videos, photographs, notebooks, interviews, screenshots, artifacts, songs, and pieces of evidence, the archive has become a book, documentary, soundtrack, and living record of what happened.",
          "But this is not only a story about one person using drugs. It is an attempt to show addiction from the inside—to understand how a person can know exactly what they are destroying, watch themselves destroy it anyway, and still wake up the next day trapped inside the same loop. Then it asks the bigger question: what happens when we recognize that same behavior in the world around us?"
        ],
        smallNote: projectOneLiner,
        ctaPrimaryLabel: "Open The Map",
        ctaPrimaryHref: "/map/",
        ctaSecondaryLabel: "Watch Official Drops",
        ctaSecondaryHref: "/drops/",
        imageSrc: asset("author-main-portrait.png"),
        imageAlt: "Ryan image slot"
      },
      whatIs: {
        eyebrow: "What Is IHOCAIHAG?",
        headline: "What Is IHOCAIHAG?",
        body: projectShortDescription,
        cards: [
          {
            label: "Why It Is Raw",
            body: [
              "Because it shows addiction from inside the foxhole instead of from a podium in a church basement.",
              "The footage was not recreated after the fact by someone trying to remember what the chaos felt like. The cameras were already rolling. The notebooks were already being filled. The screenshots, conversations, mistakes, contradictions, and evidence were accumulating while the collapse was still happening. The chaos is no longer being wrangled into whatever shape can survive a social-media terms-of-service agreement."
            ]
          },
          {
            label: "Why It Exists",
            featured: true,
            body: [
              "It exists for every sister crying alone in her car because she cannot understand why her sibling keeps burning their life to the ground and snorting the ashes.",
              "For every significant other trying to understand how their best friend, their rock, and the person they trusted most suddenly became manipulative, dishonest, deceptive, and impossible to recognize.",
              "For every parent forced to watch helplessly as the person they brought into this world becomes trapped inside a nightmare implosion of their own making—and cannot understand why love, consequences, promises, or fear seem unable to make them stop.",
              "For every child who grew up hearing, “I promise I’ll be there this time,” only to spend years wondering why they still struggle to trust anyone who says they will.",
              "It exists to show what an addicted person’s life can actually look like from the inside: how they think, what their days become, what the endless survival math feels like, how the lying starts, how the rationalizations work, how love can remain completely real while behavior becomes increasingly destructive, and how the same nightmare can repeat day after day even when the person trapped inside it knows exactly where it is leading.",
              "Not to excuse the damage. Not to erase the people hurt by it. To make the machinery visible."
            ]
          },
          {
            label: "Where To Start",
            body: [
              "Start wherever something grabs you. Watch a drop. Open the map. Follow a thread. Read a piece of the writing. Listen to the soundtrack.",
              "There is no single correct order because the story itself did not happen in one clean line. Everything crosses back through everything else. Pick the wire that catches your attention and follow it until you understand why it was connected."
            ]
          },
          {
            label: "What It Is Not",
            body: [
              "It is not a recovery commercial. It is not a how-to. It is not a challenge, a threat, a flex, or an invitation to imitate the behavior documented inside it.",
              "It is also not an attempt to turn addiction into a clean morality play with one villain, one lesson, and a hopeful song playing over the credits. People were hurt. People were loved. People lied. People tried. People failed each other and saved each other, sometimes in the same day.",
              "This project exists inside those contradictions."
            ]
          }
        ]
      },
      creator: {
        eyebrow: "Creator",
        headline: creatorName,
        bio: creatorBio,
        imageSrc: asset("author-bio-poster.png"),
        imageAlt: "Ryan Homanics image slot",
        buttons: [
          { label: "Official Drops", href: "/drops/" },
          { label: "Open Store", href: "/store/" }
        ]
      },
      priorWork: {
        eyebrow: "Prior Work",
        headline: "DOPESICK: THE AMERICAN ADDICTION TO HEROIN AND PROFIT",
        body: dopesickConnection,
        imageSrc: asset("dopesick-author-photo-approved.png"),
        imageAlt: "Ryan holding a copy of Dopesick: The American Addiction to Heroin and Profit",
        imageFit: "contain"
      },
      whyMakingThis: {
        eyebrow: "Why I’m Making This",
        headline: "WHY I’M MAKING THIS",
        body: whyMakingThis
      },
      whyDocumentedIt: {
        eyebrow: "Why I Documented It",
        headline: "WHY I DOCUMENTED IT",
        body: whyDocumentedIt
      },
      firstBookTransition: {
        eyebrow: "Between The First Book And This Archive",
        headline: "WHAT HAPPENED BETWEEN THE FIRST BOOK AND THIS ARCHIVE?",
        body: firstBookTransition
      },
      disclaimer: {
        eyebrow: "Disclaimer",
        headline: "Disclaimer",
        body: [whyTitleExists, disclaimer, triggerWarning, supportResource]
      }
    },

    bookContent: {
      hero: {
        eyebrow: "Book",
        headline: "The book I shouldn’t have lived to send out of a pen.",
        body: "What if the same brain that cannot stop inflicting its own destruction is the same kind of brain determining the world around you?",
        smallNote: "The book follows one person’s collapse from the inside, then follows the pattern outward.",
        ctaPrimaryLabel: "Preorder",
        ctaPrimaryHref: "/store/#hardcover",
        ctaSecondaryLabel: "Open The Map",
        ctaSecondaryHref: "/map/",
        imageSrc: asset("book-banner-preorder-approved.png"),
        imageAlt: "IHOCAIHAG book artwork featuring Ryan beside a childhood portrait",
        imageFit: "contain",
        backgroundPosition: "right center",
        mobileBackgroundPosition: "center top"
      },
      imagePanel: {
        imageSrc: asset("book-overview-hardcover-approved.png"),
        imageAlt: "IHOCAIHAG hardcover book featuring the masked cover portrait",
        imageFit: "contain"
      },
      overview: {
        eyebrow: "Overview",
        headline: "Welcome To The Dirt Show",
        introTitle: "IM HIGH ON CRACK AND I HAVE A GUN",
        introText: "is a raw documentary memoir built from six years of videos, photographs, notebooks, interviews, screenshots, artifacts, and writing created while the collapse was still happening.",
        body: [
          "Ryan Homanics was working as a roofer, studying Security and Intelligence at the graduate level, caring for five beehives, maintaining relationships, and presenting the appearance of a functioning life—all while carrying multiple chemical dependencies and smoking crack every day. The only person who fully understood how dangerous the tightrope had become died halfway through it.",
          "For as long as he could remember, Ryan had been afraid of losing the people he loved. When Ellie died, that childhood fear stopped being something waiting in the distance and became something he had to face head-on. Instead, he ran. Grief was buried beneath enormous quantities of crack, opiates, gabapentin, phenibut, and anything else capable of creating a few more hours of distance between him and what had happened. Eventually, the only remaining drive in life was to become as chemically numb as the body could physically tolerate.",
          "But even that was not enough.",
          "When the chemicals could no longer bury the grief, the fear, the shame, or the parts of himself he had spent a lifetime avoiding, there was nowhere left to run. With every escape route exhausted, the choice became brutally simple: face it or die. The only way out was to go through it.",
          "The book follows that confrontation inward, into the addicted mind and the search to understand what reality even is. How do we know which version of ourselves is real? How much of what we perceive is shaped by trauma, chemicals, grief, memory, algorithms, institutions, and the people surrounding us? What happens when the mind understands exactly what it is destroying but continues destroying it anyway?",
          "Then the story follows that machinery outward.",
          "The same cravings, compulsions, rationalizations, and endless pursuit of more do not exist only inside people society labels addicts. They appear inside corporations, economies, governments, platforms, and institutions capable of inflicting destruction on a scale no individual person could ever reach.",
          "But the book is not satisfied with documenting collapse. It also asks what recovery could become if it evolved alongside the world we actually live in.",
          "What would a recovery collective look like if it was built for an age of social isolation, algorithmic reality, collapsing trust, political instability, digital communities, changing drugs, and people who no longer recognize themselves inside the traditional recovery models available to them? What could happen if people stopped being treated only as broken individuals and began combining their experiences, talents, knowledge, creativity, and survival into something they built together?",
          "This is not a recovery commercial, and it is not a clean story told safely after the danger passed.",
          "It is a record of a person trying to understand reality while losing his grip on it, running from the thing he feared most, and eventually discovering that survival required turning around and walking directly through everything he had spent years trying not to feel."
        ],
        closingStatement: "This book does not simply explain addiction. It shows what addiction feels like—and asks what one person’s collapse can teach us about reality, recovery, ourselves, and the world built around us."
      },
      connectCards: [
        {
          label: "The Archive Brings The Words Of The Book To Life",
          body: [
            "The book spans the entire six-year relapse that followed the clean time and success surrounding Ryan Homanics’s 2018 book, Dopesick: The American Addiction to Heroin and Profit.",
            "It begins in the early days of the COVID pandemic, when a couple moved into a home together and relapsed on opiates. What started there progressed through fentanyl and tranq dope, expanded into benzodiazepines and stimulants, and escalated with devastating speed. Her death in 2022 became the rupture that pushed everything into an even more severe spiral—one that eventually culminated in a suicidal decision and a psychosis-level implosion in late January 2026, following a sequence of events you will almost certainly struggle to believe until you see the receipts.",
            "The story continues through the present day. Throughout all six years, the cameras kept recording, the notebooks kept filling, the screenshots kept accumulating, and the evidence kept being preserved. Videos, photographs, interviews, writings, messages, audio, artwork, documents, and physical artifacts were documented and cataloged as the collapse unfolded.",
            "Together, that material now exceeds four terabytes and forms the IHOCAIHAG Archive."
          ]
        },
        {
          label: "The Threads Connect And Intertwine With Every Single Part Of The Project",
          body: [
            "The book follows the six-year relapse as it happened, but the Threads show the deeper forces moving through it: grief, love, comfort, time, identity, home, human connection, personal truth, and the systems surrounding every individual life.",
            "A single moment in the book may belong to several Threads at once. A night of drug use may also be about Craving the Chase for Comfort, Love Lost, The Shape We See Ourself, and The Ticking of Time. A room may be both shelter and isolation. A new relationship may become a source of love while also changing every other force around it. A political event occurring thousands of miles away may collide with grief, psychosis, purpose, and the belief that one person must somehow act.",
            "The Threads allow the book to move beyond a simple timeline of what happened. They show how one event pulls on another, how private pain becomes connected to larger systems, and how a life is shaped by forces that are often invisible until they tighten, break, or become tangled together."
          ]
        }
      ],
      cta: {
        eyebrow: "Preorder",
        headline: "Limited Signed 1st Edition Numbered Preorder Of The First 50 Copies Of The Book",
        body: "Be one of the first 50 to secure a chronologically numbered, signed hardcover book.",
        ctaPrimaryLabel: "Preorder",
        ctaPrimaryHref: "/store/#hardcover"
      }
    },

    documentaryContent: {
      hero: {
        eyebrow: "Documentary",
        headline: projectTitle,
        body: "This is not the filmed version of the book. It is the part of the project that can only exist through footage.",
        smallNote: "Six years of cameras already rolling inside active addiction.",
        ctaPrimaryLabel: "Watch Official Drops",
        ctaPrimaryHref: "/drops/",
        ctaSecondaryLabel: "Open The Book",
        ctaSecondaryHref: "/book/",
        imageSrc: asset("documentary-banner-gun-pipe-approved.png"),
        imageAlt: "Ryan holding a gun and glass pipe during the documented collapse",
        imageFit: "contain",
        backgroundPosition: "right center",
        mobileBackgroundPosition: "center top"
      },
      imagePanel: {
        imageSrc: asset("documentary-cover-approved.png"),
        imageAlt: "IHOCAIHAG documentary cover",
        imageFit: "contain"
      },
      synopsis: {
        eyebrow: "Documentary",
        headline: "Synopsis",
        introTitle: projectTitle,
        introText: "is not the filmed version of the book. It is the part of the project that can only exist through footage.",
        body: [
          "The documentary is built from six years of cameras already rolling inside active addiction. It does not look back and try to reconstruct what happened. It places the viewer inside the rooms, cars, arguments, sleepless nights, desperate errands, physical decline, compulsive routines, fractured thinking, and brief flashes of love that were recorded while the consequences were still unfolding.",
          "The footage is intentionally raw, graphic, chaotic, and difficult to watch. It shows addiction without the distance created by reenactments, polished interviews, tasteful editing, or a finished recovery story guiding the viewer toward a comfortable conclusion. The camera catches what people usually hide, what platforms usually remove, and what most documentaries only describe after it is over.",
          "Across more than four terabytes of videos, photographs, audio, screenshots, interviews, and other evidence, the film reveals the repetitive machinery of addiction: waking up and immediately calculating what chemicals remain, finding money, locating drugs, hiding the truth, maintaining the appearance of a normal life, and starting the entire cycle again before the damage from the previous one can even be understood.",
          "The documentary also captures the contradictions that sanitized portrayals often erase. Violence and tenderness can exist in the same room. Love can remain real while trust is being destroyed. A person can understand exactly what they are doing, explain it with complete clarity, and still remain unable to stop. Moments of humor, intelligence, creativity, fear, paranoia, exhaustion, and self-awareness collide without arranging themselves into a simple lesson.",
          "This is not a film asking the viewer to stand outside addiction and judge it.",
          "It asks them to sit inside it long enough to recognize its rhythm, its logic, its ugliness, and the human being who still exists beneath it."
        ],
        closingStatement: "The book explains the larger story. The documentary makes you witness what that story actually looked and sounded like."
      }
    },

    passContent: {
      hero: {
        eyebrow: "My Pass",
        headline: "YOUR TRAP PASS WALLET",
        body: "One permanent identity. A wallet that grows with every Trap Pass release you claim.",
        smallNote: "Your entry wave never changes when you upgrade or collect another release."
      },
      publicHero: {
        eyebrow: "Trap Pass",
        headline: "HOLDER PROFILE",
        body: "A holder-controlled public view of one permanent Trap Pass identity.",
        smallNote: "Private profiles reveal only whether the holder ID is valid."
      },
      verifyHero: {
        eyebrow: "Trap Pass",
        headline: "CHECK YOUR PASS",
        body: "Enter an exact permanent holder ID or collectible card serial.",
        smallNote: "No names, email searches, partial matches, or public holder directory."
      },
      recovery: {
        eyebrow: "Open My Pass",
        headline: "Use Your Verified Email",
        body: "Your private wallet opens only after email ownership is verified. Entering an email alone never reveals a wallet."
      },
      explainer: {
        eyebrow: "What A Trap Pass Is",
        headline: "CLAIM A PIECE OF THE STORY",
        body: trapPassGeneralCopy
      },
      publicPrivateMessage: "VALID TRAP PASS. This holder’s profile is private.",
      invalidMessage: "INVALID TRAP PASS"
    },

    trapPassAdminContent: {
      hero: {
        eyebrow: "Private Trap Pass Administration",
        headline: "TRAP PASS ADMIN",
        body: "Protected holder, wallet, release, and serial controls.",
        smallNote: "Every production action requires server-side authorization."
      }
    },

    checkoutSuccessContent: {
      hero: {
        eyebrow: "Checkout",
        headline: "PROCESSING PAYMENT",
        body: "We are confirming your order. Confirmation will go to the email used at checkout.",
        smallNote: "Returning to this page does not by itself complete an order."
      },
      status: {
        eyebrow: "What Happens Next",
        headline: "Order Confirmation",
        body: "Keep an eye on your checkout email for the confirmed order and fulfillment details."
      }
    },

    legacyContent: {
      default: {
        eyebrow: "IHOCAIHAG",
        headline: "IHOCAIHAG",
        body: projectShortDescription,
        ctaPrimaryLabel: "Open The Map",
        ctaPrimaryHref: "/map/",
        ctaSecondaryLabel: "Get Trap Pass",
        ctaSecondaryHref: "/trap-pass/"
      },
      archive: { eyebrow: "Archive", headline: "Archive", body: "The archive is the evidence behind the book, documentary, soundtrack, and Threads.", ctaPrimaryLabel: "Open The Map", ctaPrimaryHref: "/map/" },
      preorders: { eyebrow: "Store", headline: "Store", body: storeDescription, ctaPrimaryLabel: "Open Store", ctaPrimaryHref: "/store/" },
      "check-pass": { eyebrow: "Trap Pass", headline: "Check Pass", body: "Open your wallet or validate a Trap Pass holder ID or card serial.", ctaPrimaryLabel: "My Pass", ctaPrimaryHref: "/my-pass/" },
      threads: { eyebrow: "Map", headline: "Threads", body: mapDescription, ctaPrimaryLabel: "Open The Map", ctaPrimaryHref: "/map/" },
      "start-here": { eyebrow: "Start Here", headline: "Start Here", body: projectShortDescription, ctaPrimaryLabel: "Open The Map", ctaPrimaryHref: "/map/" },
      dopesick: { eyebrow: "Book", headline: "Dopesick", body: dopesickConnection, ctaPrimaryLabel: "Open The Book", ctaPrimaryHref: "/book/" },
      discord: { eyebrow: "Trap House", headline: "Trap House", body: trapHouseGeneralCopy, ctaPrimaryLabel: "Enter Trap House", ctaPrimaryHref: "https://discord.gg/64MKTrGGsD" }
    }
  };
})();
