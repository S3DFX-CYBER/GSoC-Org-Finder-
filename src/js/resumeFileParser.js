// src/js/resumeFileParser.js — client-side resume text extraction (.txt, .pdf, .docx)

/* global pdfjsLib, mammoth, extractSkills */

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const PDF_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * @param {File} file
 * @returns {'txt'|'pdf'|'docx'|null}
 */
function getResumeFileKind(file) {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();

  if (name.endsWith('.pdf') || type === 'application/pdf') return 'pdf';
  if (
    name.endsWith('.docx') ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }
  if (name.endsWith('.txt') || type === 'text/plain') return 'txt';
  return null;
}

async function readTxtFile(file) {
  return file.text();
}

async function readPdfFile(file) {
  if (typeof pdfjsLib === 'undefined') {
    throw new TypeError('PDF support failed to load. Refresh the page and try again.');
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const parts = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    parts.push(pageText);
  }

  const text = parts.join('\n').replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (typeof text !== 'string' || text.length === 0) {
    throw new TypeError(
      'Could not extract text from this PDF. Use a text-based PDF or paste your resume manually.'
    );
  }
  return text;
}

async function readDocxFile(file) {
  if (typeof mammoth === 'undefined') {
    throw new TypeError('DOCX support failed to load. Refresh the page and try again.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = (result.value || '').replace(/[^\S\n]+/g, ' ').trim();

  if (typeof text !== 'string' || text.length === 0) {
    throw new TypeError(
      'Could not extract text from this Word file. Try another file or paste your resume manually.'
    );
  }
  return text;
}

/**
 * Extract plain text from a resume file for skill matching.
 * @param {File} file
 * @returns {Promise<string>}
 */
async function readResumeFile(file) {
  if (!file) {
    throw new TypeError('No file selected.');
  }

  if (typeof Blob !== 'undefined' && !(file instanceof Blob)) {
    throw new TypeError('Expected a File or Blob for resume upload.');
  }

  if (typeof file.size !== 'number' || file.size > MAX_RESUME_BYTES) {
    throw new RangeError('File is too large. Please use a resume under 5 MB.');
  }

  const kind = getResumeFileKind(file);
  if (!kind) {
    throw new TypeError('Unsupported file type. Please upload a .txt, .pdf, or .docx file.');
  }

  switch (kind) {
    case 'txt':
      return readTxtFile(file);
    case 'pdf':
      return readPdfFile(file);
    case 'docx':
      return readDocxFile(file);
    default:
      throw new TypeError('Unsupported file type. Please upload a .txt, .pdf, or .docx file.');
  }
}

const GITHUB_RESERVED_PATHS = new Set([
  'about', 'apps', 'archive', 'blame', 'blob', 'collections', 'contact',
  'copilot', 'customer-stories', 'discussions', 'enterprise', 'events',
  'explore', 'features', 'gist', 'gists', 'join', 'login', 'marketplace',
  'media', 'mobile', 'new', 'notifications', 'orgs', 'organizations',
  'packages', 'pricing', 'projects', 'pull', 'issues', 'releases', 'repos',
  'security', 'settings', 'signup', 'site', 'sponsors', 'sponsoring', 'stars',
  'team', 'topics', 'trending', 'tree', 'users', 'wiki',
]);

const GITHUB_USER_CAPTURE = '([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})';

/**
 * Normalize resume text so broken PDF/DOCX URLs still match.
 * @param {string} text
 * @returns {string}
 */
function normalizeResumeTextForGitHub(text) {
  return text
    .replace(/\u200b|\u00a0/g, ' ')
    .replace(/https?\s*:\s*\/\s*/gi, 'https://')
    .replace(/github\s*\.\s*com/gi, 'github.com')
    .replace(/\bgit\s+hub\s*\.?\s*com/gi, 'github.com')
    .replace(/(github\.com)\s*\/\s*/gi, '$1/')
    .replace(
      /github\.com\s+([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})(?=[\s.,;)\]"']|$)/gi,
      'github.com/$1'
    );
}

/**
 * @param {string} name
 * @returns {boolean}
 */
function isValidGitHubUsername(name) {
  if (!name) return false;
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(name)) return false;
  return !GITHUB_RESERVED_PATHS.has(name.toLowerCase());
}

/**
 * Pull a GitHub username from resume text (profile URLs, labeled lines).
 * @param {string} text
 * @returns {string}
 */
function extractGitHubUsername(text) {
  if (!text) return '';

  const normalized = normalizeResumeTextForGitHub(text);

  const urlRe = new RegExp(
    String.raw`(?:https?://)?(?:www\.)?github\.com/${GITHUB_USER_CAPTURE}(?=[/?#\s,;)\]"']|$)`,
    'gi'
  );

  let match;
  while ((match = urlRe.exec(normalized)) !== null) {
    if (isValidGitHubUsername(match[1])) {
      return match[1];
    }
  }

  const labeledPatterns = [
    /github\s*(?:profile|username|handle|user|account|link|id)?\s*[:@|–\-]\s*(?!https?:\/\/)@?([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})/gi,
    /github\s*[-–]\s*(?!https?:\/\/)@?([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})/gi,
    /github\s+@(?!https?:\/\/)([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})/gi,
    /(?:^|[\s,;|])(?:@)?([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})\s*(?:\||•)\s*github/gim,
  ];

  for (const pattern of labeledPatterns) {
    pattern.lastIndex = 0;
    while ((match = pattern.exec(normalized)) !== null) {
      if (isValidGitHubUsername(match[1])) {
        return match[1];
      }
    }
  }

  return '';
}

/**
 * Build a concise skills string for the Resume / Skills field.
 * @param {string} text
 * @returns {string}
 */
function buildSkillsSummary(text) {
  if (typeof extractSkills === 'function') {
    const skills = extractSkills(text);
    if (skills.length > 0) {
      return skills.join(', ');
    }
  }
  return '';
}

/**
 * Parse raw resume text into GitHub username and skills summary.
 * @param {string} rawText
 * @returns {{ githubUsername: string, skillsText: string, rawText: string }}
 */
function parseResumeContent(rawText) {
  if (typeof rawText !== 'string') {
    throw new TypeError('Resume content must be a string.');
  }

  const text = rawText.trim();
  if (text.length === 0) {
    throw new TypeError('Resume file appears to be empty.');
  }

  const githubUsername = extractGitHubUsername(text);
  let skillsText = buildSkillsSummary(text);

  if (!skillsText) {
    skillsText = text.replace(/\s+/g, ' ').slice(0, 4000);
  }

  return { githubUsername, skillsText, rawText: text };
}

/**
 * Read and parse a resume file; returns fields for the AI Recommender form.
 * @param {File} file
 * @returns {Promise<{ githubUsername: string, skillsText: string, rawText: string }>}
 */
async function parseResumeFile(file) {
  const rawText = await readResumeFile(file);
  return parseResumeContent(rawText);
}

globalThis.readResumeFile = readResumeFile;
globalThis.parseResumeFile = parseResumeFile;
globalThis.parseResumeContent = parseResumeContent;
globalThis.extractGitHubUsername = extractGitHubUsername;
globalThis.RESUME_FILE_ACCEPT =
  '.txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
