import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { challenges, validateChallengeCode } from './data/challenges.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Load Firebase configuration
let firebaseConfig = null;
try {
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (err) {
  console.warn('Firebase config file could not be parsed:', err);
}

// Setup Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Setup View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Files
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'static')));

// In-Memory Database Stores
let projects = [
  {
    id: 1,
    title: "VulnScanner Core",
    description: "Automated static analysis engine identifying insecure configurations and dependency vulnerabilities across multi-cloud infrastructure.",
    technology: "Python/AST",
    image: { url: "/uploads/images/preview.jpg" }
  },
  {
    id: 2,
    title: "AuthSentinel SSO",
    description: "Zero-trust identity verification gateway implementing WebAuthn, FIDO2 tokens, and biometric session attestation.",
    technology: "Node.js/OAuth2",
    image: { url: "/uploads/images/preview.jpg" }
  },
  {
    id: 3,
    title: "PacketSniffer Pro",
    description: "Low-latency packet inspection daemon with real-time heuristic flow analysis and automated DDoS mitigating firewall rules.",
    technology: "Go/eBPF",
    image: { url: "/uploads/images/preview.jpg" }
  },
  {
    id: 4,
    title: "CipherStream TLS",
    description: "Hardware-accelerated cryptographic streaming pipeline with quantum-resistant key exchange algorithms.",
    technology: "Rust/C++",
    image: { url: "/uploads/images/preview.jpg" }
  },
  {
    id: 5,
    title: "CloudShield WAF",
    description: "Distributed reverse proxy filtering malicious HTTP requests, SQLi payloads, and cross-site scripting attacks.",
    technology: "TypeScript/Nginx",
    image: { url: "/uploads/images/preview.jpg" }
  },
  {
    id: 6,
    title: "API-Vault HSM",
    description: "High-security secret and credential vault utilizing Shamir's secret sharing with role-based cryptographic signing keys.",
    technology: "Python/Crypto",
    image: { url: "/uploads/images/preview.jpg" }
  }
];

// User Profiles and Authentication Sessions Store
const userProfiles = new Map();

const defaultGuestSubmissions = [
  {
    id: 1,
    challengeId: 1,
    challenge: challenges[0],
    solved_at: new Date(Date.now() - 3600000 * 24),
    is_correct: true,
    submitted_flag: "FLAG{sql_inj3ct10n_d3f34t3d}"
  }
];

function getOrCreateProfile(req, res) {
  let sessionId = req.cookies?.cq_session_id;
  if (!sessionId) {
    sessionId = 'cq_sess_' + Math.random().toString(36).substring(2, 12);
    if (res && res.cookie) {
      res.cookie('cq_session_id', sessionId, { httpOnly: false, maxAge: 86400000 * 30 });
    }
  }

  if (userProfiles.has(sessionId)) {
    return userProfiles.get(sessionId);
  }
  
  // Default unauthenticated operative dossier
  const newProfile = {
    uid: 'guest_operative_x',
    username: 'Operative_X',
    displayName: 'Operative X',
    email: '',
    avatar: '',
    authProvider: null,
    githubLinked: false,
    googleLinked: false,
    xp: 750,
    level: 2,
    role_class: 'BE',
    role_class_display: 'Backend Architect',
    avatar_badge: 'SHIELD_OPERATIVE',
    solved_submissions: [...defaultGuestSubmissions]
  };
  userProfiles.set(sessionId, newProfile);
  return newProfile;
}

// Attach active operative session to all requests
app.use((req, res, next) => {
  req.userProfile = getOrCreateProfile(req, res);
  res.locals.userProfile = req.userProfile;
  res.locals.firebaseConfig = firebaseConfig;
  next();
});

let rooms = [
  {
    id: 1,
    name: "Sprint Hackathon Alpha: Zero-Day Audit",
    description: "Auditing distributed ledger smart contracts and patching race conditions before live mainnet deployment.",
    focus: "Python / AsyncIO / WebSockets",
    created_at: new Date(Date.now() - 3600000 * 2)
  },
  {
    id: 2,
    name: "API Gateway Hardening & Rate Limiting",
    description: "Designing token bucket rate limiters and memory-efficient Redis sliding windows to defend against DDoS attacks.",
    focus: "TypeScript / Express / Redis",
    created_at: new Date(Date.now() - 3600000 * 5)
  },
  {
    id: 3,
    name: "Kernel Exploit Patching & eBPF Filters",
    description: "Implementing real-time Linux kernel telemetry filters using eBPF to detect unauthorized privilege escalation.",
    focus: "C / Linux / eBPF",
    created_at: new Date(Date.now() - 3600000 * 12)
  }
];

// Routes

// Home
app.get('/', (req, res) => {
  res.render('pages/home', {
    userProfile: req.userProfile
  });
});

// Projects & CTF Index
app.get('/projects/', (req, res) => {
  const current_filter = req.query.filter || 'all';
  const current_sort = req.query.sort || 'default';
  const search_query = (req.query.q || '').trim();

  // Filter challenges
  let filteredChallenges = [...challenges];

  if (current_filter !== 'all' && current_filter !== '') {
    filteredChallenges = filteredChallenges.filter(c => {
      const diff = (c.difficulty || '').toLowerCase();
      if (current_filter === 'easy') return diff.includes('easy') || diff === 'e';
      if (current_filter === 'medium') return diff.includes('med') || diff === 'm';
      if (current_filter === 'hard') return diff.includes('hard') || diff === 'h';
      return true;
    });
  }

  if (search_query) {
    const qLower = search_query.toLowerCase();
    filteredChallenges = filteredChallenges.filter(c => 
      c.title.toLowerCase().includes(qLower) || c.description.toLowerCase().includes(qLower)
    );
  }

  // Sort challenges
  if (current_sort === 'xp_high') {
    filteredChallenges.sort((a, b) => b.xp_reward - a.xp_reward);
  } else if (current_sort === 'xp_low') {
    filteredChallenges.sort((a, b) => a.xp_reward - b.xp_reward);
  } else if (current_sort === 'newest') {
    filteredChallenges.sort((a, b) => b.id - a.id);
  }

  // Project pagination (3 per page)
  const projectPageSize = 3;
  const projectCurrentPage = parseInt(req.query.project_page, 10) || 1;
  const projectTotalPages = Math.ceil(projects.length / projectPageSize);
  const paginatedProjects = projects.slice((projectCurrentPage - 1) * projectPageSize, projectCurrentPage * projectPageSize);

  // Challenge pagination (6 per page)
  const challengePageSize = 6;
  const challengeCurrentPage = parseInt(req.query.challenge_page, 10) || 1;
  const challengeTotalPages = Math.ceil(filteredChallenges.length / challengePageSize) || 1;
  const paginatedChallenges = filteredChallenges.slice((challengeCurrentPage - 1) * challengePageSize, challengeCurrentPage * challengePageSize);

  res.render('projects/project_index', {
    projects: paginatedProjects,
    totalProjects: projects.length,
    projectCurrentPage,
    projectTotalPages,
    challenges: paginatedChallenges,
    totalChallenges: challenges.length,
    challengeCurrentPage,
    challengeTotalPages,
    current_filter,
    current_sort,
    search_query,
    userProfile
  });
});

// Project Detail
app.get(['/projects/project/:id/', '/projects/project/:id'], (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const project = projects.find(p => p.id === projectId);
  if (!project) {
    return res.redirect('/projects/');
  }
  res.render('projects/project_detail', {
    project,
    userProfile
  });
});

// CTF Challenge Detail (GET)
app.get(['/projects/challenge/:id/', '/projects/challenge/:id'], (req, res) => {
  const challengeId = parseInt(req.params.id, 10);
  const challenge = challenges.find(c => c.id === challengeId);
  if (!challenge) {
    return res.redirect('/projects/');
  }

  const already_solved = (req.userProfile.solved_submissions || []).some(s => s.challengeId === challengeId && s.is_correct);
  const alertMessage = req.query.msg || null;
  const alertType = req.query.type || 'info';

  res.render('projects/ctf_challenge_detail', {
    challenge,
    already_solved,
    alertMessage,
    alertType,
    userProfile: req.userProfile
  });
});

// CTF Challenge Flag Submission (POST)
app.post(['/projects/challenge/:id/', '/projects/challenge/:id'], (req, res) => {
  const challengeId = parseInt(req.params.id, 10);
  const challenge = challenges.find(c => c.id === challengeId);
  if (!challenge) {
    return res.redirect('/projects/');
  }

  const submittedFlag = (req.body.flag || '').trim();
  const isCorrect = submittedFlag === challenge.flag;

  if (isCorrect) {
    const profile = req.userProfile;
    if (!profile.solved_submissions) profile.solved_submissions = [];
    const already_solved = profile.solved_submissions.some(s => s.challengeId === challengeId && s.is_correct);
    if (!already_solved) {
      profile.xp = (profile.xp || 0) + challenge.xp_reward;
      profile.level = Math.floor(profile.xp / 500) + 1;
      profile.solved_submissions.push({
        id: profile.solved_submissions.length + 1,
        challengeId: challenge.id,
        challenge: challenge,
        solved_at: new Date(),
        is_correct: true,
        submitted_flag: submittedFlag
      });

      const sessionId = req.cookies?.cq_session_id;
      if (sessionId) {
        userProfiles.set(sessionId, profile);
      }
    }
    return res.redirect(`/projects/challenge/${challenge.id}/?type=success&msg=` + encodeURIComponent(`Access Granted! You earned +${challenge.xp_reward} XP.`));
  } else {
    return res.redirect(`/projects/challenge/${challenge.id}/?type=danger&msg=` + encodeURIComponent(`Access Denied: Invalid flag checksum. Try again!`));
  }
});

// Challenges API: List all challenges with predefined test cases
app.get('/api/challenges', (req, res) => {
  const sanitizedChallenges = challenges.map(c => ({
    id: c.id,
    title: c.title,
    category: c.category,
    difficulty: c.difficulty,
    xp_reward: c.xp_reward,
    time_limit_seconds: c.time_limit_seconds || 300,
    description: c.description,
    instructions: c.instructions,
    starter_templates: c.starter_templates,
    test_cases: c.test_cases,
    already_solved: (req.userProfile?.solved_submissions || []).some(s => s.challengeId === c.id && s.is_correct)
  }));
  res.json({ success: true, challenges: sanitizedChallenges });
});

// Challenges API: Get single challenge details
app.get('/api/challenges/:id', (req, res) => {
  const challengeId = parseInt(req.params.id, 10);
  const challenge = challenges.find(c => c.id === challengeId);
  if (!challenge) {
    return res.status(404).json({ success: false, error: 'Challenge not found' });
  }
  const already_solved = (req.userProfile?.solved_submissions || []).some(s => s.challengeId === challengeId && s.is_correct);
  res.json({
    success: true,
    challenge: {
      id: challenge.id,
      title: challenge.title,
      category: challenge.category,
      difficulty: challenge.difficulty,
      xp_reward: challenge.xp_reward,
      time_limit_seconds: challenge.time_limit_seconds || 300,
      description: challenge.description,
      instructions: challenge.instructions,
      vulnerable_code: challenge.vulnerable_code,
      starter_templates: challenge.starter_templates,
      test_cases: challenge.test_cases,
      already_solved
    }
  });
});

// Monaco Editor Code Submission Handler & Test Case Validator API
app.post(['/api/challenges/submit', '/api/challenges/:id/submit'], (req, res) => {
  const challengeId = parseInt(req.params.id || req.body.challengeId, 10);
  const { code, language = 'python', roomId = null, timeExpired = false, elapsedSeconds = null } = req.body;

  if (!challengeId) {
    return res.status(400).json({ success: false, error: 'Target Challenge ID is required.' });
  }

  const challenge = challenges.find(c => c.id === challengeId);
  if (!challenge) {
    return res.status(404).json({ success: false, error: `Challenge #${challengeId} not found.` });
  }

  // Enforce mission timer time limit
  const limitSeconds = challenge.time_limit_seconds || 300;
  if (timeExpired || (typeof elapsedSeconds === 'number' && elapsedSeconds > limitSeconds + 5)) {
    return res.status(403).json({
      success: false,
      error: `Mission time limit expired (${Math.floor(limitSeconds / 60)}m ${limitSeconds % 60}s). Submissions are locked for this attempt. Please restart the mission countdown.`,
      timeExpired: true,
      timeLimitSeconds: limitSeconds,
      challengeId
    });
  }

  // Execute test case validation engine
  const validation = validateChallengeCode(challengeId, code, language);
  if (!validation.success) {
    return res.status(400).json(validation);
  }

  const profile = req.userProfile;
  if (!profile.solved_submissions) {
    profile.solved_submissions = [];
  }

  const alreadySolved = profile.solved_submissions.some(s => s.challengeId === challengeId && s.is_correct);
  let xpAwarded = 0;

  if (validation.allPassed) {
    if (!alreadySolved) {
      xpAwarded = challenge.xp_reward;
      profile.xp = (profile.xp || 0) + xpAwarded;
      profile.level = Math.floor(profile.xp / 500) + 1;
      profile.solved_submissions.push({
        id: profile.solved_submissions.length + 1,
        challengeId: challenge.id,
        challenge: {
          id: challenge.id,
          title: challenge.title,
          difficulty: challenge.difficulty,
          xp_reward: challenge.xp_reward
        },
        solved_at: new Date(),
        is_correct: true,
        submitted_flag: challenge.flag,
        method: 'monaco_test_suite_validation'
      });

      const sessionId = req.cookies?.cq_session_id;
      if (sessionId) {
        userProfiles.set(sessionId, profile);
      }
    }
  }

  res.json({
    ...validation,
    alreadySolved,
    xpAwarded,
    roomId,
    userProfile: {
      username: profile.username,
      xp: profile.xp,
      level: profile.level,
      solvedCount: profile.solved_submissions.filter(s => s.is_correct).length
    }
  });
});

// Player Profile Dossier
app.get(['/projects/profile/', '/projects/profile'], (req, res) => {
  const solved_submissions = (req.userProfile.solved_submissions || []).filter(s => s.is_correct);
  res.render('projects/profile', {
    userProfile: req.userProfile,
    solved_submissions,
    firebaseConfig
  });
});

// Workspace Index
app.get(['/workspace/', '/workspace'], (req, res) => {
  res.render('workspace/workspace_index', {
    rooms,
    userProfile: req.userProfile
  });
});

// Workspace Create Room (GET)
app.get(['/workspace/room/create/', '/workspace/room/create'], (req, res) => {
  res.render('workspace/create_room', {
    userProfile: req.userProfile || userProfile
  });
});

// Workspace Create Room (POST)
app.post(['/workspace/room/create/', '/workspace/room/create'], (req, res) => {
  const { name, description, focus } = req.body;
  const newId = rooms.length ? Math.max(...rooms.map(r => r.id)) + 1 : 1;
  const newRoom = {
    id: newId,
    name: (name || '').trim() || `Room #${newId}`,
    description: (description || '').trim(),
    focus: (focus || '').trim() || 'General Collaborative Session',
    created_at: new Date()
  };
  rooms.unshift(newRoom);
  res.redirect(`/workspace/room/${newRoom.id}/`);
});

// Workspace Room Detail
app.get(['/workspace/room/:id/', '/workspace/room/:id'], (req, res) => {
  const roomId = parseInt(req.params.id, 10);
  const room = rooms.find(r => r.id === roomId);
  if (!room) {
    return res.redirect('/workspace/');
  }
  res.render('workspace/room_detail', {
    room,
    challenges,
    userProfile: req.userProfile || userProfile,
    firebaseConfig
  });
});

// Workspace Edit Room (GET)
app.get(['/workspace/rooms/:id/edit/', '/workspace/rooms/:id/edit'], (req, res) => {
  const roomId = parseInt(req.params.id, 10);
  const room = rooms.find(r => r.id === roomId);
  if (!room) {
    return res.redirect('/workspace/');
  }
  res.render('workspace/edit_room', {
    room,
    userProfile: req.userProfile || userProfile
  });
});

// Workspace Edit Room (POST)
app.post(['/workspace/rooms/:id/edit/', '/workspace/rooms/:id/edit'], (req, res) => {
  const roomId = parseInt(req.params.id, 10);
  const room = rooms.find(r => r.id === roomId);
  if (room) {
    room.name = (req.body.name || '').trim() || room.name;
    room.description = (req.body.description || '').trim();
    room.focus = (req.body.focus || '').trim();
  }
  res.redirect(`/workspace/room/${roomId}/`);
});

// Workspace Delete Room (POST/GET)
app.all(['/workspace/room/:id/delete/', '/workspace/room/:id/delete'], (req, res) => {
  const roomId = parseInt(req.params.id, 10);
  rooms = rooms.filter(r => r.id !== roomId);
  res.redirect('/workspace/');
});

// Route Aliases
app.get('/workspace/project/:id/', (req, res) => res.redirect(`/projects/project/${req.params.id}/`));
app.get('/workspace/challenge/:id/', (req, res) => res.redirect(`/projects/challenge/${req.params.id}/`));
app.get('/workspace/profile/', (req, res) => res.redirect('/projects/profile/'));

// Firebase Auth Session & Profile API Endpoints
app.post('/api/auth/session', (req, res) => {
  const { 
    uid, 
    username, 
    displayName, 
    email, 
    avatar, 
    authProvider,
    googleLinked, 
    githubLinked, 
    xp, 
    level, 
    completedChallenges, 
    role_class 
  } = req.body;

  if (!uid || (!username && !email)) {
    return res.status(400).json({ error: 'Missing required uid or username/email' });
  }

  let sessionId = req.cookies?.cq_session_id;
  if (!sessionId) {
    sessionId = 'sess_' + uid.substring(0, 8) + '_' + Date.now();
  }

  const existing = userProfiles.get(sessionId) || userProfiles.get(uid) || {};
  const currentGuestSubmissions = req.userProfile?.solved_submissions || [];

  // Reconcile solved CTF challenges
  let userSubmissions = existing.solved_submissions && existing.solved_submissions.length > 0 
    ? [...existing.solved_submissions] 
    : [...currentGuestSubmissions];

  if (Array.isArray(completedChallenges)) {
    completedChallenges.forEach(cId => {
      if (!userSubmissions.some(s => s.challengeId === cId)) {
        const ch = challenges.find(c => c.id === cId);
        if (ch) {
          userSubmissions.push({
            id: userSubmissions.length + 1,
            challengeId: ch.id,
            challenge: ch,
            solved_at: new Date(),
            is_correct: true,
            submitted_flag: ch.flag
          });
        }
      }
    });
  }

  // Determine provider identity
  const isGoogle = authProvider === 'google' || googleLinked === true;
  const isGithub = authProvider === 'github' || (githubLinked === true && !isGoogle);
  const resolvedProvider = isGoogle ? 'google' : (isGithub ? 'github' : (existing.authProvider || 'guest'));

  let cleanUsername = (username || '').replace(/^@/, '').trim();
  if (!cleanUsername && email) {
    cleanUsername = email.split('@')[0];
  }
  cleanUsername = cleanUsername.replace(/[^\w.-]/g, '_') || 'Operative';

  let resolvedAvatar = avatar;
  if (!resolvedAvatar) {
    if (isGoogle) {
      resolvedAvatar = 'https://lh3.googleusercontent.com/a/default-user';
    } else if (isGithub) {
      resolvedAvatar = `https://github.com/${cleanUsername}.png`;
    } else {
      resolvedAvatar = existing.avatar || '';
    }
  }

  const calculatedXp = typeof xp === 'number' ? xp : (existing.xp || 750);
  const calculatedLevel = typeof level === 'number' ? level : (Math.floor(calculatedXp / 500) + 1);

  const updatedProfile = {
    uid,
    username: cleanUsername,
    displayName: displayName || cleanUsername,
    email: email || existing.email || '',
    avatar: resolvedAvatar,
    authProvider: resolvedProvider,
    googleLinked: isGoogle,
    githubLinked: isGithub,
    xp: calculatedXp,
    level: calculatedLevel,
    role_class: role_class || existing.role_class || 'ARCHITECT',
    role_class_display: role_class === 'CYBER_SEC' ? 'Cybersecurity Specialist' : 'Cyber Architect',
    avatar_badge: isGoogle ? 'GOOGLE_VERIFIED' : (isGithub ? 'GITHUB_VERIFIED' : 'GUEST_OPERATIVE'),
    solved_submissions: userSubmissions,
    linkedAt: existing.linkedAt || new Date()
  };

  userProfiles.set(sessionId, updatedProfile);
  userProfiles.set(uid, updatedProfile);

  // Set cross-origin secure cookie for iframe preview environment
  res.cookie('cq_session_id', sessionId, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });

  res.json({ success: true, userProfile: updatedProfile });
});

// Save CodeQuest Progress Endpoint (XP, Level, Solved Challenges)
app.post('/api/auth/save-progress', (req, res) => {
  const { xp, level, completedChallenges, role_class } = req.body;
  const profile = req.userProfile;
  if (!profile) {
    return res.status(401).json({ error: 'No active operative session' });
  }

  if (typeof xp === 'number') profile.xp = xp;
  if (typeof level === 'number') profile.level = level;
  if (role_class) {
    profile.role_class = role_class;
    profile.role_class_display = role_class === 'CYBER_SEC' ? 'Cybersecurity Specialist' : 'Cyber Architect';
  }

  if (Array.isArray(completedChallenges)) {
    if (!profile.solved_submissions) profile.solved_submissions = [];
    completedChallenges.forEach(cId => {
      if (!profile.solved_submissions.some(s => s.challengeId === cId)) {
        const ch = challenges.find(c => c.id === cId);
        if (ch) {
          profile.solved_submissions.push({
            id: profile.solved_submissions.length + 1,
            challengeId: ch.id,
            challenge: ch,
            solved_at: new Date(),
            is_correct: true,
            submitted_flag: ch.flag
          });
        }
      }
    });
  }

  const sessionId = req.cookies?.cq_session_id;
  if (sessionId) {
    userProfiles.set(sessionId, profile);
  }
  if (profile.uid) {
    userProfiles.set(profile.uid, profile);
  }

  res.json({ success: true, userProfile: profile });
});

// Logout / Disconnect Active Session (Google or GitHub)
app.post(['/api/auth/logout', '/api/auth/logout/'], (req, res) => {
  const sessionId = req.cookies?.cq_session_id;
  if (sessionId) {
    userProfiles.delete(sessionId);
  }
  res.clearCookie('cq_session_id', {
    secure: true,
    sameSite: 'none'
  });
  res.json({ success: true });
});

// Get Current Operative Session
app.get('/api/auth/me', (req, res) => {
  res.json({ userProfile: req.userProfile });
});

// Firebase Config API endpoint
app.get('/api/firebase-config', (req, res) => {
  res.json(firebaseConfig || {});
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'CodeQuest Arena' });
});

// Start Server on 0.0.0.0:3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CodeQuest Arena running at http://localhost:${PORT}`);
});
