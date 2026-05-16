// src/js/skillExtractor.js

/**
 * skillExtractor.js
 * 
 * A lightweight heuristic NLP module to extract technical skills, programming languages, 
 * frameworks, and domains from unstructured text (e.g., a resume).
 */

const TECH_DICTIONARY = [
  // Languages
  "python", "javascript", "java", "c++", "c", "c#", "ruby", "rust", "golang", 
  "typescript", "swift", "kotlin", "php", "scala", "haskell", "lua", "perl", "r", 
  "julia", "matlab", "dart", "shell", "bash", "assembly", "sql",
  
  // Web & Frameworks
  "react", "angular", "vue", "django", "flask", "spring", "spring boot", "node.js",
  "express", "ruby on rails", "laravel", "asp.net", "svelte", "next.js", "tailwind",
  "bootstrap", "jquery", "html", "css", "graphql", "rest", "soap",

  // Mobile
  "android", "ios", "flutter", "react native", "xamarin", "ionic",

  // Databases
  "mysql", "postgresql", "mongodb", "sqlite", "redis", "cassandra", "oracle", 
  "elasticsearch", "mariadb", "firebase",

  // Cloud & DevOps
  "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "jenkins", "gitlab ci", 
  "github actions", "terraform", "ansible", "linux", "unix", "ubuntu", "centos",
  "nginx", "apache",

  // Domains & Fields
  "machine learning", "ml", "artificial intelligence", "ai", "deep learning", 
  "data science", "data analysis", "computer vision", "nlp", "natural language processing",
  "robotics", "ros", "blockchain", "cryptography", "security", "cybersecurity",
  "penetration testing", "game dev", "game development", "3d", "opengl", "vulkan",
  "bioinformatics", "genomics", "physics", "simulation", "computational geometry",
  "networking", "embedded", "iot", "systems programming", "compilers",
  
  // Tools & Libraries
  "tensorflow", "pytorch", "keras", "scikit-learn", "numpy", "pandas", "scipy",
  "opencv", "qt", "gtk", "cmake", "make", "git", "vim", "emacs"
];

/**
 * Extracts recognized skills from the provided text.
 * 
 * @param {string} text - The unstructured text (e.g. from a resume)
 * @returns {Array<string>} - A list of unique matched skills in lowercase
 */
function extractSkills(text) {
  if (!text || typeof text !== 'string') return [];
  
  const normalizedText = text.toLowerCase();
  const matchedSkills = new Set();
  
  // Simple word boundary checking for exact matches
  // For multi-word skills like "machine learning", we use indexOf or regex
  TECH_DICTIONARY.forEach(skill => {
    // Escape special characters in skill (e.g. C++, Node.js)
    const escapedSkill = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, String.raw`\$&`);
    
    // We want to match word boundaries to avoid matching "go" inside "algorithm"
    // However, C++ and C# end in non-word chars, so we need careful boundary checking
    let regexStr = '';
    const isSingleChar = skill.length === 1;
    
    if (isSingleChar) {
      // Harden boundary check for 1-char tokens to prevent "C" matching inside "C++"
      // Supports comma-delimited lists like "python,c,java"
      regexStr = String.raw`(?:^|\s|[(\[,])` + escapedSkill + String.raw`(?=$|\s|[.,:;!)])`;
    } else {
      // Standardized boundaries for full-sized terms
      if (/[a-z0-9]/i.test(skill[0])) {
        regexStr += String.raw`(?:^|\b|\s)`;
      } else {
        regexStr += String.raw`(?:^|\s)`;
      }
      
      regexStr += escapedSkill;
      
      if (/[a-z0-9]/i.test(skill.at(-1))) {
        regexStr += String.raw`(?:$|\b|\s)`;
      } else {
        regexStr += String.raw`(?:$|\s|[^a-z0-9])`;
      }
    }
    
    const regex = new RegExp(regexStr, 'i');
    
    if (regex.test(normalizedText)) {
      matchedSkills.add(skill);
    }
  });
  
  // Improved Go detector: Case-insensitive to catch "go", but uses negative lookahead to exclude common prose
  const goRegex = /\bgo\b(?!\s+(to|into|for|ahead|back|on|through|with))/i;
  if (goRegex.test(text)) {
    matchedSkills.add("go");
  }
  
  return Array.from(matchedSkills);
}

// Export for global usage
globalThis.extractSkills = extractSkills;
