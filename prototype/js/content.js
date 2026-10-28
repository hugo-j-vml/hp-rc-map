// Prototype content taken from the brief and the v2 Figma wireframes.
// Text in [square brackets] is placeholder copy, as in Figma. Nothing here is approved for publishing yet.
window.RC_CONTENT = {
  stats: [
    { value: "$65.8M", label: "invested across 3 programs" },
    { value: "{count}", label: "remote communities, all visited by Horizon Power" },
    { value: "13", label: "new local power systems funded" },
    { value: "18", label: "communities with smart meters" },
  ],

  // The four milestones of each community's transition, from HP's Community progress page.
  // Stage 1 is done: HP has visited all communities in person. Counts in [brackets] are illustrative only.
  milestones: [
    { step: "01", title: "Build strong community connections", icon: "connections", count: "{count}",
      note: "All communities visited in person" },
    { step: "02", title: "Complete initial safety inspections and upgrades", icon: "safety", count: 86, placeholder: true },
    { step: "03", title: "Future energy system planning and endorsement", icon: "planning", count: 41, placeholder: true },
    { step: "04", title: "Future energy system delivery", icon: "delivery", count: 12, placeholder: true },
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
  stories: [
    {
      community: "papulankutja",
      summary: "A new power station for more reliable, cleaner power.",
      visited: "[Month 2026]",
      heroCaption: "Hero photo of the community and new power station (with consent)",
      title: "A new power station for Papulankutja",
      body: [
        "[Draft] Papulankutja now has a new power station that uses the sun and a big battery, with diesel only as back-up. That means the lights and fridges stay on more reliably, and less diesel needs to be trucked in.",
        "[Short paragraph about what the community wanted, and how the work was planned together with Traditional Owners and the service provider.]",
      ],
      video: "Video · Community visit · 2:30",
      quote: "“[Quote from a community member about what the change means for them, used with their permission.]”",
      quoteBy: "[Name], [role or relationship to community]",
      photos: 12,
      beforeAfter: ["Before · old power station", "After · new power station"],
    },
    { community: "kiwirrkurra", summary: "Smart meters for 57 homes, the clinic, school and store.", visited: "[Month 2026]" },
    { community: "cockatoo-springs", summary: "[One line on the work here and what changed for the community.]" },
    { community: "chile-creek", summary: "[One line on the work here and what changed for the community.]" },
    { community: "four-mile", label: "Four Mile or Embulgun (TBC)", summary: "[Story still to be chosen by HP.]" },
  ],

  contact: {
    heading: "[Regional Service Provider name]",
    body: "Yarn with them about power faults, outages or the work happening in your community.",
    phone: "[00 0000 0000]",
    emergency: "In an emergency, call 000.",
  },
};
