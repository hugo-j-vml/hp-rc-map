// Prototype content taken from the brief and the v2 Figma wireframes.
// Text in [square brackets] is placeholder copy, as in Figma. Nothing here is approved for publishing yet.
window.RC_CONTENT = {
  // The five transition milestones each community moves through (client mock-up, Nov 2026), shown in the profile's
  // About box. Every community gets the same illustrative statuses until HP supplies real ones; dates are placeholders.
  // Not-started milestones are kept here but never shown (see milestoneList() in app.js).
  milestones: [
    { title: "Initial community engagement", status: "completed" },
    { title: "Initial safety upgrades", status: "completed" },
    { title: "Future energy system planning", status: "in-progress" },
    { title: "Community endorsement", status: "not-started" },
    { title: "New energy system delivered", status: "not-started" },
  ],

  regions: [
    // Horizon Power's four service areas, as on its "Service area" poster.
    { id: "kimberley", name: "Kimberley" },
    { id: "pilbara", name: "Pilbara" },
    { id: "gascoyne", name: "Gascoyne/Mid West" },
    { id: "goldfields", name: "Esperance/Goldfields" },
  ],

  programs: [
    {
      id: "ami",
      name: "Smart meters (AMI)",
      shortName: "AMI",
      description: "New power meters that send live updates",
      icon: "meter",
      explainer: {
        title: "What is a smart meter?",
        body: "A new power meter that shows how much power you use in real time. It also helps us keep your power safe and reliable.",
        link: "About the smart meter program",
      },
    },
    {
      id: "regen",
      name: "Power generation (ReGen)",
      shortName: "ReGen",
      description: "New and replaced power stations, including sun, battery and engine systems",
      icon: "power-station",
      explainer: {
        title: "What is ReGen?",
        body: "[Plain-language explainer for the power generation program.]",
        link: "About the power generation program",
      },
    },
    {
      id: "cdnp",
      name: "Poles and wires (CDNP)",
      shortName: "CDNP",
      description: "Safer, more reliable poles, wires and network gear",
      icon: "power-lines",
      explainer: {
        title: "What is CDNP?",
        body: "[Plain-language explainer for the poles and wires program.]",
        link: "About the poles and wires program",
      },
    },
  ],

  // Type of work, from the brief's list of achievements. The first five show by default, as in Figma.
  workTypes: [
    { id: "power-stations", name: "Power stations", icon: "power-station" },
    { id: "smart-meters", name: "Smart meters", icon: "meter" },
    { id: "fuel-tanks", name: "Fuel tanks", icon: "fuel" },
    { id: "waste-tanks", name: "Waste tanks" },
    { id: "engines", name: "Engines" },
    { id: "transformers", name: "Transformers" },
    { id: "starlink", name: "Starlink internet", icon: "wifi" },
    { id: "pvc", name: "PVC replacement" },
    { id: "pole-testing", name: "Pole testing", icon: "power-lines" },
    { id: "earthing", name: "Earthing and protection studies", icon: "security" },
  ],

  statuses: [
    { id: "completed", name: "Completed" },
    { id: "in-progress", name: "In progress" },
    { id: "planned", name: "Planned" },
  ],

  // Sample works from the Figma profile screens. Real works data still to come from Horizon Power.
  works: [
    { community: "papulankutja", program: "regen", type: "power-stations", status: "completed", icon: "battery",
      title: "New hybrid power station: sun, battery and diesel back-up", when: "Completed [2025]" },
    { community: "papulankutja", program: "regen", type: "fuel-tanks", status: "completed", icon: "fuel",
      title: "Fuel tank replacement", when: "Completed [2024]" },
    { community: "papulankutja", program: "cdnp", type: "pole-testing", status: "in-progress", icon: "power-lines",
      title: "Pole testing and safety checks", when: "Underway [2026]" },
    { community: "papulankutja", program: "ami", type: "smart-meters", status: "planned", icon: "meter",
      title: "New power meters that send live updates", when: "Planned [FY27–28]" },
    { community: "kiwirrkurra", program: "ami", type: "smart-meters", status: "completed", icon: "meter",
      title: "Smart meters for 57 homes, the clinic, school and store", when: "Completed [year]" },
  ],

  // The five flagship stories from the brief. Order matches the story list in Figma.
  // The five flagship stories. Headlines, text and photos from HP's "RC highlight communities" document
  // (Nov 2026, cleared for public use). Fields in [brackets] are still placeholders.
  stories: [
    {
      community: "papulankutja",
      summary: "A new energy future for Papulankutja",
      image: "images/papulankutja.jpg",
      imageAlt: "A large group of community members, Horizon Power staff and partners gathered on red dirt at Papulankutja",
      title: "A new energy future for Papulankutja",
      body: [
        "A new hybrid renewable energy system is being delivered for Papulankutja, also known as Blackstone. Jointly funded by the Western Australian and Australian governments, the project will provide safer, more reliable and cleaner power while supporting the community’s long-term energy needs. The project forms part of Horizon Power’s work to improve power services and reduce reliance on diesel across remote Aboriginal communities.",
      ],
      // HP news article that follows the story text. The link text is the article's own title, so it makes sense out of context.
      article: {
        title: "Renewable power secures energy future for Blackstone community",
        url: "https://remotecommunities.horizonpower.com.au/latest-news/preparing-for-summer2/",
      },
      video: "Video · Community visit · 2:30",
      quote: "“[Quote from a community member about what the change means for them, used with their permission.]”",
      quoteBy: "[Name], [role or relationship to community]",
      photos: 12,
      beforeAfter: ["Before · old power station", "After · new power station"],
    },
    {
      community: "kiwirrkurra",
      summary: "Smarter meters, easier access to power",
      image: "images/kiwirrkurra.jpg",
      imageAlt: "Horizon Power and service provider staff in hi-vis standing together on red dirt beside a termite mound at Kiwirrkurra",
      title: "Smarter meters, easier access to power",
      body: [
        "Kiwirrkurra is one of the most remote communities in Horizon Power’s service area. New smart meters now connect 57 households and key facilities, including the medical clinic and school, to safer and more reliable power. Residents have more ways to pay and manage their electricity, including purchasing prepaid power locally at the community store. The work was delivered with Aboriginal-owned Regional Service Provider Pilbara Meta Maya Services.",
      ],
    },
    {
      community: "cockatoo-springs",
      otherNames: ["Ngunulum"],
      summary: "Cleaner energy with less reliance on diesel",
      image: "images/cockatoo-springs.jpg",
      imageAlt: "Four women talking outside a shed at Cockatoo Springs",
      title: "Cleaner energy with less reliance on diesel",
      body: [
        "Cockatoo Springs, also known as Ngunulum, is approximately 30 kilometres from Kununurra. Renewable energy upgrades completed in July now allow the community to operate on 63 per cent renewable energy. The new system is expected to reduce diesel dependency by up to 92 per cent, save approximately 35,000 litres of diesel and avoid 91 tonnes of carbon emissions each year. It has also removed safety risks associated with manually refuelling generators.",
      ],
    },
    {
      community: "chile-creek",
      summary: "Reducing diesel use through renewable energy",
      image: "images/chile-creek.jpg",
      imageAlt: "A community member and a Horizon Power staff member looking at an illustrated booklet together at Chile Creek",
      title: "Reducing diesel use through renewable energy",
      body: [
        "Renewable energy upgrades at Chile Creek are helping reduce reliance on diesel and improve the safety and sustainability of the community’s power supply. The project is part of Horizon Power’s broader transition from early discovery and engagement into on-the-ground delivery across remote communities. Chile Creek is one of the renewable energy case studies used to demonstrate how cleaner generation can improve services in isolated locations.",
      ],
    },
    {
      community: "four-mile",
      summary: "Locally manufactured power for Four Mile",
      image: "images/four-mile.jpg",
      imageAlt: "Aerial view at sunrise of a road train and shipping containers beside a building at Four Mile",
      title: "Locally manufactured power for Four Mile",
      body: [
        "A new standalone power system was commissioned at Four Mile in May 2026 as part of Horizon Power’s ReGen program. The containerised system demonstrates how standardised, locally manufactured energy solutions can support safer and more reliable power in remote locations. The project also contributes to a coordinated delivery model that brings together generation, network improvements and community engagement.",
      ],
    },
  ],

  contact: {
    heading: "[Regional Service Provider name]",
    body: "Yarn with them about power faults, outages or the work happening in your community.",
    phone: "[00 0000 0000]",
    emergency: "In an emergency, call 000.",
  },
};
