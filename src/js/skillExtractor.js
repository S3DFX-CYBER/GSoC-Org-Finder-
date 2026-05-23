// src/js/skillExtractor.js

/* global module */

const TECH_DICTIONARY = [
  'python', 'javascript', 'java', 'c++', 'c#', 'ruby', 'rust', 'golang',
  'typescript', 'swift', 'kotlin', 'php', 'scala', 'haskell', 'lua', 'perl',
  'julia', 'matlab', 'dart', 'shell', 'bash', 'assembly', 'sql', 'elixir', 'erlang', 'clojure',
  'fortran', 'ocaml', 'smalltalk', 'pharo', 'd lang', 'verilog', 'verilog-a', 'vhdl', 'fasm', 'tcl', 'scheme',
  'lisp', 'prolog', 'solidity', 'asm', 'x86', 'arm', 'mips', 'risc-v',

  'react', 'angular', 'vue', 'django', 'flask', 'spring', 'spring boot', 'node.js', 'nodejs',
  'express', 'ruby on rails', 'laravel', 'asp.net', 'svelte', 'next.js', 'nextjs', 'tailwind',
  'bootstrap', 'jquery', 'html', 'css', 'graphql', 'rest', 'soap', 'fastapi', 'gin',
  'solidjs', 'remix', 'astro', 'vite', 'webpack', 'babel', 'symfony', 'meteor.js',
  'vuejs', 'reactjs', 'hibernate', 'jakarta ee', 'webrtc', 'electron', 'meteor',
  'html5 canvas', 'canvas', 'wasm', 'webassembly', 'ecmascript', 'mediawiki',

  'android', 'ios', 'flutter', 'react native', 'xamarin', 'ionic', 'swiftui', 'jetpack compose',

  'mysql', 'postgresql', 'mongodb', 'sqlite', 'redis', 'cassandra', 'oracle',
  'elasticsearch', 'mariadb', 'firebase', 'supabase', 'appwrite', 'dynamodb', 'couchdb',
  'postgis', 'big data', 'distributed storage',

  'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'jenkins', 'gitlab ci',
  'github actions', 'terraform', 'ansible', 'linux', 'unix', 'ubuntu', 'centos', 'debian',
  'nginx', 'apache', 'prometheus', 'grafana', 'istio', 'helm', 'tekton', 'ci/cd', 'unikernels',
  'kvm', 'xen', 'qemu', 'virtualization', 'serverless', 'ebpf', 'containerd', 'sdet', 'devops',
  'kernel', 'posix', 'bsd', 'real-time os', 'rtos',

  'machine learning', 'ml', 'artificial intelligence', 'ai', 'deep learning',
  'data science', 'data analysis', 'computer vision', 'nlp', 'natural language processing',
  'robotics', 'ros', 'blockchain', 'cryptography', 'security', 'cybersecurity',
  'penetration testing', 'game dev', 'game development', '3d', 'opengl', 'vulkan', 'webgl',
  'bioinformatics', 'genomics', 'physics', 'simulation', 'computational geometry',
  'networking', 'embedded', 'iot', 'systems programming', 'compilers', 'operating systems',
  'cloud native', 'distributed systems', 'microservices', 'web3', 'xr', 'ar', 'vr',
  'gis', 'geospatial', 'neuroscience', 'computational biology', 'fuzzing', 'malware analysis',
  'reverse engineering', 'hpc', 'eda', 'chip design', 'quantum chemistry', 'astrophysics',
  'biomedical', 'healthcare', 'fintech', 'edtech', 'social impact', 'open knowledge',
  'multi-physics', 'mapping',
  'mass spectrometry', 'meteorology', 'climate science', 'fluid dynamics', 'cfd', 'aerospace',
  'graphics', 'animation', 'audio', 'video', 'multimedia', 'codecs', 'ffmpeg',

  'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'numpy', 'pandas', 'scipy', 'matplotlib',
  'opencv', 'qt', 'gtk', 'cmake', 'make', 'git', 'vim', 'emacs', 'zsh', 'ninja', 'bazel',
  'latex', 'markdown', 'd3.js', 'three.js', 'gstreamer', 'vlc', 'ghidra', 'ida-pro',
  'cuda', 'opencl', 'openmp', 'mpi', 'webgpu', 'antlr', 'xpath', 'z3', 'simd', 'llvm', 'clang',
  'mlir', 'directx'
];

const SKILL_ALIASES = {
  nodejs: 'node.js',
  'next.js': 'nextjs',
  nextjs: 'nextjs',
  reactjs: 'react',
  vuejs: 'vue.js',
  springboot: 'springboot',
  'spring boot': 'springboot',
  'ruby on rails': 'ruby on rails',
  rails: 'ruby on rails',
  meteor: 'meteor.js',
  'meteor.js': 'meteor.js',
  angular: 'angularjs',
  angularjs: 'angularjs',
  go: 'go',
  golang: 'go',
  'c#': 'csharp',
  csharp: 'csharp',
  'd lang': 'd lang',
  fasm: 'fasm',
  'x86 assembly': 'fasm',
  shell: 'shell script',
  bash: 'shell script',
  'shell script': 'shell script',
  ml: 'machine learning',
  'machine learning': 'machine learning',
  ai: 'ai',
  'artificial intelligence': 'ai',
  cv: 'computer vision',
  'computer vision': 'computer vision',
  nlp: 'natural language processing',
  'natural language processing': 'natural language processing',
  security: 'security',
  cybersecurity: 'security',
  'distributed systems': 'distributed systems',
  distributed: 'distributed systems',
  'game development': 'game dev',
  'game dev': 'game dev',
  '3d graphics': '3d',
  graphics: '3d',
  'computational geometry': 'geometry',
  'html5 canvas': 'html5 canvas',
  canvas: 'html5 canvas',
  llvm: 'llvm',
  qemu: 'qemu'
};

const SORTED_TECH_DICTIONARY = [...new Set(TECH_DICTIONARY)]
  .sort((left, right) => right.length - left.length);

const GO_LANGUAGE_KEYWORDS = [
  'programming', 'language', 'developer', 'backend',
  'distributed', 'concurrency', 'goroutines', 'go1.',
  'go developer', 'go programming', 'written in go', 'experience with go',
  'using go', 'i use go', 'go lang', 'go application'
];

const GO_REGEX = /\bgo\b(?!\s+(to|into|for|ahead|back|on|through|with|away|around|up|down|off|out))/i;
const C_CONTEXT_REGEX = /\b(c programming|c language|proficient in c|knowledge of c|written in c|experience with c|using c|c developer|c code|c project)(?![+#\w])/i;
const C_LIST_REGEX = /\b(python|java|c\+\+|rust|javascript|assembly|go|ruby)\s*[,/]\s*c(?![+#\w])|\bc(?![+#\w])\s*[,/]\s*(python|java|c\+\+|rust|javascript|assembly|go|ruby)\b/i;
const R_CONTEXT_REGEX = /\b(r programming|r language|r statistics|r for statistics|rstudio|r studio|r package|r packages|r script|experience with r|using r|proficient in r)\b/i;
const R_LIST_REGEX = /\b(python|julia|matlab|statistics|stata|sas)\s*[,/]\s*r\b|\br\s*[,/]\s*(python|julia|matlab|statistics|stata|sas)\b/i;

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param {string} skill - The skill string to escape.
 * @returns {string} The escaped string.
 */
function escapeForRegExp(skill) {
  return skill.replace(/[-/\\^$*+?.()|[\]{}]/g, String.raw`\$&`);
}

/**
 * Creates a regular expression pattern for matching a skill in text.
 * @param {string} skill - The skill to create a pattern for.
 * @returns {RegExp} The compiled regular expression.
 */
function createDictionaryPattern(skill) {
  const escapedSkill = escapeForRegExp(skill);
  const isSingleCharacter = skill.length === 1;
  const hasSpecialCharacter = ['+', '#', '.'].some(character => skill.includes(character));

  if (isSingleCharacter || hasSpecialCharacter) {
    return new RegExp(
      String.raw`(?<=^|\s|[(\[,/])${escapedSkill}(?=$|\s|[.,:;!)/])`,
      'i'
    );
  }

  return new RegExp(String.raw`\b${escapedSkill}\b`, 'i');
}

const TECH_PATTERNS = SORTED_TECH_DICTIONARY.map(skill => ({
  skill,
  pattern: createDictionaryPattern(skill)
}));

/**
 * Maps a skill to its canonical name if an alias exists.
 * @param {string} skill - The skill name to normalize.
 * @returns {string} The normalized skill name.
 */
function normalizeSkill(skill) {
  return SKILL_ALIASES[skill] || skill;
}

/**
 * Detects skills from a technical dictionary within the provided text.
 * @param {string} normalizedText - The lowercased text to scan.
 * @param {Set<string>} matchedSkills - Set to store detected canonical skills.
 */
function detectDictionarySkills(normalizedText, matchedSkills) {
  TECH_PATTERNS.forEach(({ skill, pattern }) => {
    if (pattern.test(normalizedText)) {
      matchedSkills.add(normalizeSkill(skill));
    }
  });
}

/**
 * Detects a skill based on a contextual condition.
 * @param {Set<string>} matchedSkills - Set of already matched skills.
 * @param {string} skillName - The name of the skill to potentially add.
 * @param {function} shouldAdd - A function that returns true if the skill should be added.
 */
function detectContextualSkill(matchedSkills, skillName, shouldAdd) {
  if (!matchedSkills.has(skillName) && shouldAdd()) {
    matchedSkills.add(skillName);
  }
}

/**
 * Extracts technical skills from a given text string.
 * @param {string} text - The input text (e.g., resume content or GitHub description).
 * @returns {string[]} An array of detected canonical skill names.
 */
function extractSkills(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const normalizedText = text.toLowerCase();
  const matchedSkills = new Set();

  detectDictionarySkills(normalizedText, matchedSkills);

  detectContextualSkill(matchedSkills, 'go', () => {
    const hasGoTechContext = GO_LANGUAGE_KEYWORDS.some(keyword =>
      normalizedText.includes(keyword)
    );

    return (matchedSkills.size > 0 || hasGoTechContext) && GO_REGEX.test(normalizedText);
  });

  detectContextualSkill(matchedSkills, 'c', () =>
    C_CONTEXT_REGEX.test(normalizedText) || C_LIST_REGEX.test(normalizedText)
  );

  detectContextualSkill(matchedSkills, 'r', () =>
    R_CONTEXT_REGEX.test(normalizedText) || R_LIST_REGEX.test(normalizedText)
  );

  return Array.from(matchedSkills);
}

globalThis.normalizeSkill = normalizeSkill;
globalThis.extractSkills = extractSkills;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractSkills,
    normalizeSkill
  };
}
