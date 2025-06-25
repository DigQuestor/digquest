import { createRoot } from "react-dom/client";
import App from "./App";
import "../index.css";

// Add meta tags for SEO
const meta = document.createElement('meta');
meta.name = 'description';
meta.content = 'DigQuest - A community for metal detecting enthusiasts focusing on wellbeing, discoveries, and connecting with like-minded people.';
document.head.appendChild(meta);

// Add Open Graph tags
const ogTitle = document.createElement('meta');
ogTitle.property = 'og:title';
ogTitle.content = 'DigQuest - Metal Detecting for Wellbeing';
document.head.appendChild(ogTitle);

const ogDescription = document.createElement('meta');
ogDescription.property = 'og:description';
ogDescription.content = 'Join our community of metal detecting enthusiasts improving wellbeing one find at a time.';
document.head.appendChild(ogDescription);

const ogType = document.createElement('meta');
ogType.property = 'og:type';
ogType.content = 'website';
document.head.appendChild(ogType);

// Set document title
document.title = 'DigQuest - Metal Detecting for Wellbeing';

createRoot(document.getElementById("root")!).render(<App />);
