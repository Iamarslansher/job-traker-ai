export const STAGES = ["wishlist", "applied", "interviewing", "offer", "rejected"] as const;

export type JobStatus = (typeof STAGES)[number];

export type Job = {
  id: string;
  userId?: string;
  jobTitle: string;
  companyName: string;
  location: string;
  status: JobStatus;
  salary: string;
  jobDescription: string;
  keyRequirements: string[];
  notes: string;
  createdAt: string;
};

export const stageLabels: Record<JobStatus, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

export const demoJobs: Job[] = [
  {
    id: "demo-figma", jobTitle: "Senior Product Designer", companyName: "Figma", location: "Remote",
    status: "wishlist", salary: "$145k – $190k", jobDescription: "Help shape collaborative design tools for teams everywhere.",
    keyRequirements: ["Product design", "Figma", "Design systems"], notes: "", createdAt: "2026-10-14T12:00:00.000Z",
  },
  {
    id: "demo-linear", jobTitle: "Frontend Engineer", companyName: "Linear", location: "San Francisco, CA",
    status: "wishlist", salary: "$160k – $210k", jobDescription: "Build a fast, thoughtful product experience for modern software teams.",
    keyRequirements: ["React", "TypeScript", "Product thinking"], notes: "", createdAt: "2026-10-12T12:00:00.000Z",
  },
  {
    id: "demo-notion", jobTitle: "Software Engineer, Growth", companyName: "Notion", location: "New York, NY",
    status: "applied", salary: "$150k – $185k", jobDescription: "Help more people discover and get value from Notion.",
    keyRequirements: ["Full-stack", " experimentation", "SQL"], notes: "Applied through company site.", createdAt: "2026-10-10T12:00:00.000Z",
  },
  {
    id: "demo-vercel", jobTitle: "Product Engineer", companyName: "Vercel", location: "Remote",
    status: "applied", salary: "$145k – $200k", jobDescription: "Make the web better for developers building on the platform.",
    keyRequirements: ["Next.js", "React", "Web performance"], notes: "", createdAt: "2026-10-08T12:00:00.000Z",
  },
  {
    id: "demo-stripe", jobTitle: "Frontend Engineer", companyName: "Stripe", location: "Seattle, WA",
    status: "interviewing", salary: "$170k – $225k", jobDescription: "Build delightful payments experiences used by millions of businesses.",
    keyRequirements: ["JavaScript", "Accessibility", "Payments"], notes: "Technical round next Thursday.", createdAt: "2026-10-05T12:00:00.000Z",
  },
  {
    id: "demo-airbnb", jobTitle: "UI Engineer", companyName: "Airbnb", location: "Remote",
    status: "interviewing", salary: "$155k – $205k", jobDescription: "Create clear and welcoming experiences for a global community.",
    keyRequirements: ["Design systems", "React", "CSS"], notes: "Recruiter screen completed.", createdAt: "2026-10-03T12:00:00.000Z",
  },
  {
    id: "demo-shopify", jobTitle: "Developer Experience Engineer", companyName: "Shopify", location: "Remote",
    status: "offer", salary: "$165k – $220k", jobDescription: "Empower developers building commerce experiences on Shopify.",
    keyRequirements: ["Developer tools", "GraphQL", "Open source"], notes: "Offer received. Review package by Friday.", createdAt: "2026-09-28T12:00:00.000Z",
  },
  {
    id: "demo-meta", jobTitle: "Product Designer", companyName: "Meta", location: "Menlo Park, CA",
    status: "rejected", salary: "$140k – $185k", jobDescription: "Design products that bring people closer together.",
    keyRequirements: ["Interaction design", "Prototyping", "Research"], notes: "Keep in touch for future roles.", createdAt: "2026-09-25T12:00:00.000Z",
  },
];
