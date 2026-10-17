const makeRoadmap = (career, beginner, intermediate, advanced) => ({
  career,
  phases: [
    { name: "Beginner", duration: "4–6 weeks", topics: beginner.map((title, i) => ({ id: `${career}-b${i}`, title, duration: "1–2 weeks", resource: "freeCodeCamp — free learning guides" })) },
    { name: "Intermediate", duration: "6–8 weeks", topics: intermediate.map((title, i) => ({ id: `${career}-i${i}`, title, duration: "2–3 weeks", resource: "Coursera / edX — audit courses for free" })) },
    { name: "Advanced", duration: "6–10 weeks", topics: advanced.map((title, i) => ({ id: `${career}-a${i}`, title, duration: "2–4 weeks", resource: "Official documentation and a portfolio project" })) },
  ],
});

export const roadmaps = [
  makeRoadmap("Frontend Developer", ["HTML and semantic structure", "CSS fundamentals and responsive layouts", "JavaScript essentials"], ["React components and state", "Git and collaborative workflows", "Accessibility and browser testing"], ["TypeScript and scalable architecture", "Performance optimization", "Build and deploy a portfolio project"]),
  makeRoadmap("Data Analyst", ["Excel and spreadsheet analysis", "SQL queries and data cleaning", "Descriptive statistics"], ["Dashboard design with Tableau or Power BI", "Python and Pandas basics", "Communicating data insights"], ["Experiment analysis and metrics", "Automated reporting", "Complete an end-to-end analysis project"]),
  makeRoadmap("Data Scientist", ["Python programming", "Statistics and probability", "Data preparation with Pandas"], ["Supervised machine learning", "Model evaluation and validation", "SQL for analytical datasets"], ["Feature engineering and tuning", "Responsible model practices", "Publish a reproducible capstone"]),
  makeRoadmap("Backend Developer", ["Programming fundamentals", "HTTP and REST concepts", "Relational database basics"], ["Build APIs with Node.js and Express", "Authentication and API testing", "Git and code review"], ["Docker and deployment basics", "System design fundamentals", "Ship a documented API project"]),
  makeRoadmap("UI/UX Designer", ["Design principles and visual hierarchy", "User research foundations", "Wireframes and information architecture"], ["Figma components and prototyping", "Usability testing", "Accessibility for design"], ["Design systems and handoff", "Case study storytelling", "Complete a portfolio case study"]),
  makeRoadmap("Cybersecurity Analyst", ["Networking fundamentals", "Linux command line", "Security principles and threat models"], ["Log analysis and incident response", "Vulnerability assessment basics", "Python scripting for security"], ["Threat hunting and SIEM workflows", "Cloud security foundations", "Document a defensive lab project"]),
];
