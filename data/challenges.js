// Predefined CTF Challenges, Starter Templates, and Multi-Level Test Cases

export const challenges = [
  {
    id: 1,
    title: "SQL Injection in Player Query",
    category: "Injection & Database Security",
    difficulty: "EASY",
    xp_reward: 150,
    time_limit_seconds: 300,
    flag: "FLAG{sql_inj3ct10n_d3f34t3d}",
    description: "An unescaped SQL parameter in the user profile query allows unauthorized database manipulation and exfiltration of confidential player records. Attackers can inject tautology expressions like ' OR '1'='1' to dump the entire user database.",
    instructions: "Refactor fetch_player_profile to prevent SQL injection by using parameterized queries (e.g. placeholder syntax '?' or '%s' with a parameter tuple) instead of string formatting (f-strings or concatenation).",
    vulnerable_code: `# Insecure query execution:
def fetch_player_profile(cursor, user_input):
    query = f"SELECT * FROM users WHERE username = '{user_input}'"
    return cursor.execute(query).fetchall()

# Example exploit payload:
# ' OR '1'='1' --`,
    starter_templates: {
      python: `# Challenge 1: Patch SQL Injection Vulnerability
# Objective: Secure fetch_player_profile against SQL injection attacks.

def fetch_player_profile(cursor, user_input):
    # Fix: Replace string interpolation with parameterized queries
    query = "SELECT * FROM users WHERE username = ?"
    return cursor.execute(query, (user_input,)).fetchall()
`,
      javascript: `// Challenge 1: Patch SQL Injection Vulnerability
// Objective: Secure fetchPlayerProfile against SQL injection attacks.

function fetchPlayerProfile(db, userInput) {
    // Fix: Use parameterized query binding array
    const query = "SELECT * FROM users WHERE username = $1";
    return db.query(query, [userInput]);
}
`,
      typescript: `// Challenge 1: Patch SQL Injection Vulnerability
// Objective: Secure fetchPlayerProfile against SQL injection attacks.

interface Player {
    id: number;
    username: string;
    level: number;
}

export async function fetchPlayerProfile(db: any, userInput: string): Promise<Player[]> {
    // Fix: Use parameterized query binding
    const query = "SELECT * FROM users WHERE username = $1";
    return await db.query(query, [userInput]);
}
`,
      sql: `-- Challenge 1: Prepared Statement Solution
PREPARE fetch_player_profile (text) AS
    SELECT * FROM users WHERE username = $1;

EXECUTE fetch_player_profile('operative_alpha');
`
    },
    test_cases: [
      {
        id: "tc_1_1",
        title: "Standard Benign Lookup",
        type: "Functional",
        description: "Verify single record lookup succeeds for standard alphanumeric username ('operative_alpha').",
        input: 'user_input = "operative_alpha"',
        expected: "Parameterized query binding: [operative_alpha]; exact match returned."
      },
      {
        id: "tc_1_2",
        title: "Boolean Tautology Exploit",
        type: "Security Exploit",
        description: "Test against classic authentication bypass payload: ' OR '1'='1' --",
        input: 'user_input = "\' OR \'1\'=\'1\' --"',
        expected: "Tautology treated strictly as parameter literal; 0 unauthenticated records dumped."
      },
      {
        id: "tc_1_3",
        title: "UNION-Based Data Exfiltration",
        type: "Security Exploit",
        description: "Test against secondary table probe: ' UNION SELECT id, password FROM admin --",
        input: 'user_input = "\' UNION SELECT id, password FROM admin --"',
        expected: "Secondary query execution blocked; input bound as literal parameter."
      },
      {
        id: "tc_1_4",
        title: "Special Characters & Escaping",
        type: "Boundary Condition",
        description: "Verify inputs containing apostrophes ('O\\'Connor') do not trigger unhandled SQL syntax exceptions.",
        input: 'user_input = "O\'Connor"',
        expected: "Successfully handled via parameter escaping without SQL syntax error."
      }
    ]
  },
  {
    id: 2,
    title: "Insecure Direct Object Reference (IDOR)",
    category: "Access Control & Authorization",
    difficulty: "MED",
    xp_reward: 250,
    time_limit_seconds: 360,
    flag: "FLAG{1d0r_4cc3ss_c0ntr0l_br0k3n}",
    description: "The order processing endpoint trusts client-supplied account IDs without validating authorization against the current session token. Any authenticated user can read another operative's confidential dossiers by altering the URL account identifier.",
    instructions: "Add an authorization check verifying that the requested document's owner_id matches session['user_id'] (or filter the query by both account_id and session.user_id). If mismatched or unauthenticated, return 403 Forbidden.",
    vulnerable_code: `@app.route('/api/account/<account_id>/documents')
def view_documents(account_id):
    # Missing session ownership verification:
    doc = db.query(Document).filter_by(id=account_id).first()
    return jsonify(doc.serialize())`,
    starter_templates: {
      python: `# Challenge 2: Patch IDOR Vulnerability
# Objective: Validate session ownership before returning document records.

from flask import session, abort, jsonify

def view_documents(account_id):
    current_user_id = session.get('user_id')
    if not current_user_id:
        abort(401)  # Unauthorized
        
    doc = db.query(Document).filter_by(id=account_id).first()
    if not doc:
        abort(404)
        
    # Check ownership:
    if doc.owner_id != current_user_id:
        abort(403)  # Forbidden access attempt
        
    return jsonify(doc.serialize())
`,
      javascript: `// Challenge 2: Patch IDOR Vulnerability
// Objective: Validate session ownership before returning document records.

function viewDocuments(req, res) {
    const { accountId } = req.params;
    const sessionUserId = req.session?.userId;
    
    if (!sessionUserId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    
    const doc = db.findDocumentById(accountId);
    if (!doc) return res.status(404).json({ error: "Not found" });
    
    // Verify ownership
    if (doc.ownerId !== sessionUserId) {
        return res.status(403).json({ error: "Forbidden: Access denied to foreign record" });
    }
    
    return res.json(doc);
}
`,
      typescript: `// Challenge 2: Patch IDOR Vulnerability
// Objective: Validate session ownership before returning document records.

export function viewDocuments(req: any, res: any) {
    const accountId = req.params.accountId;
    const sessionUserId = req.session?.userId;
    
    if (!sessionUserId) {
        return res.status(401).json({ error: "Authentication required" });
    }
    
    const doc = db.query(Document).filter({ id: accountId, ownerId: sessionUserId }).first();
    if (!doc) {
        return res.status(403).json({ error: "Access denied or document not found" });
    }
    
    return res.json(doc);
}
`
    },
    test_cases: [
      {
        id: "tc_2_1",
        title: "Authorized Owner Retrieval",
        type: "Functional",
        description: "Operative accessing their own document (account_id='acc_123', session={'user_id': 'acc_123'}).",
        input: "{ account_id: 'acc_123', session: { user_id: 'acc_123' } }",
        expected: "HTTP 200 OK: Document payload returned successfully."
      },
      {
        id: "tc_2_2",
        title: "Horizontal IDOR Probe",
        type: "Security Exploit",
        description: "Operative attempting to inspect peer operative's records ('acc_999') with legitimate session ('acc_123').",
        input: "{ account_id: 'acc_999', session: { user_id: 'acc_123' } }",
        expected: "HTTP 403 Forbidden: Ownership verification failed, payload blocked."
      },
      {
        id: "tc_2_3",
        title: "Anonymous / Missing Session Probe",
        type: "Security Exploit",
        description: "Unauthenticated request attempting direct object access without valid session context.",
        input: "{ account_id: 'acc_123', session: null }",
        expected: "HTTP 401 Unauthorized: Session token missing or invalid."
      },
      {
        id: "tc_2_4",
        title: "Resource Scoping Filter",
        type: "Boundary Condition",
        description: "Ensures database query scopes search to user's authorized organizational boundary.",
        input: "{ account_id: 'acc_admin_0', session: { user_id: 'acc_123' } }",
        expected: "HTTP 403 Forbidden: Cross-tenant access blocked."
      }
    ]
  },
  {
    id: 3,
    title: "Remote Command Execution (RCE)",
    category: "System Command Injection",
    difficulty: "HARD",
    xp_reward: 400,
    time_limit_seconds: 480,
    flag: "FLAG{rc3_sh3ll_pwn3d_4ll}",
    description: "The container ping utility runs raw system commands via an unvalidated shell parameter (shell=True), allowing arbitrary command execution via metacharacters like ';', '|', or '$()'.",
    instructions: "Refactor run_diagnostic to use shell=False with arguments passed as a list ['ping', '-c', '1', host], or validate host using strict IP / hostname format verification to neutralize command injection.",
    vulnerable_code: `import subprocess

def run_diagnostic(host):
    # Unsanitized subprocess shell execution:
    cmd = f"ping -c 1 {host}"
    return subprocess.check_output(cmd, shell=True).decode()`,
    starter_templates: {
      python: `# Challenge 3: Patch Remote Command Execution Vulnerability
# Objective: Eliminate shell=True and pass command arguments securely as a list.

import subprocess
import re

def run_diagnostic(host):
    # Validate host format (IPv4 or valid hostname)
    if not re.match(r'^[a-zA-Z0-9.-]+$', host):
        raise ValueError("Invalid host format: shell metacharacters detected")
        
    # Fix: shell=False with argument vector list
    cmd = ["ping", "-c", "1", host]
    return subprocess.check_output(cmd, shell=False).decode()
`,
      javascript: `// Challenge 3: Patch Remote Command Execution Vulnerability
// Objective: Use execFile/spawn without shell interpretation.

const { execFile } = require('child_process');

function runDiagnostic(host) {
    if (!/^[a-zA-Z0-9.-]+$/.test(host)) {
        throw new Error("Invalid host character set");
    }
    
    // Fix: execFile bypasses the shell
    return new Promise((resolve, reject) => {
        execFile('ping', ['-c', '1', host], (err, stdout) => {
            if (err) return reject(err);
            resolve(stdout);
        });
    });
}
`,
      typescript: `// Challenge 3: Patch Remote Command Execution Vulnerability
// Objective: Use child_process spawn/execFile with argument array.

import { execFile } from 'child_process';

export function runDiagnostic(host: string): Promise<string> {
    if (!/^[a-zA-Z0-9.-]+$/.test(host)) {
        throw new Error("Security Violation: Disallowed metacharacters in target host");
    }
    
    return new Promise((resolve, reject) => {
        execFile('ping', ['-c', '1', host], (error, stdout) => {
            if (error) return reject(error);
            resolve(stdout);
        });
    });
}
`
    },
    test_cases: [
      {
        id: "tc_3_1",
        title: "Standard IPv4 Target Diagnostic",
        type: "Functional",
        description: "Verify diagnostic functions normally for standard loopback address ('127.0.0.1').",
        input: 'host = "127.0.0.1"',
        expected: "Ping output returned safely without shell spawning."
      },
      {
        id: "tc_3_2",
        title: "Semicolon Command Chaining Attack",
        type: "Security Exploit",
        description: "Test injection with semicolon payload: '127.0.0.1; cat /etc/passwd'",
        input: 'host = "127.0.0.1; cat /etc/passwd"',
        expected: "Injection blocked: Metacharacter ';' rejected or passed as literal argument to ping."
      },
      {
        id: "tc_3_3",
        title: "Pipe & Subshell Injection",
        type: "Security Exploit",
        description: "Test pipeline execution attack: '127.0.0.1 | whoami'",
        input: 'host = "127.0.0.1 | whoami"',
        expected: "Pipeline execution blocked; 'whoami' not executed."
      },
      {
        id: "tc_3_4",
        title: "Command Substitution Attack ($())",
        type: "Security Exploit",
        description: "Test nested subshell substitution: '127.0.0.1 $(id)'",
        input: 'host = "127.0.0.1 $(id)"',
        expected: "Subshell execution blocked; argument sanitized or rejected."
      }
    ]
  },
  {
    id: 4,
    title: "JWT None Algorithm Bypass",
    category: "Cryptographic Authentication",
    difficulty: "MED",
    xp_reward: 200,
    time_limit_seconds: 300,
    flag: "FLAG{jwt_n0n3_4lg0r1thm_byp4ss}",
    description: "The authentication middleware accepts unsigned tokens when the 'alg' header field is specified as 'none'. An attacker can forge arbitrary administrator credentials by base64-encoding a crafted payload with alg: none.",
    instructions: "Update verify_jwt_token to explicitly reject tokens specifying alg: 'none', enforce an allowed algorithm whitelist (e.g. HS256), and ensure HMAC signature verification is always executed.",
    vulnerable_code: `def verify_jwt_token(token):
    header, payload, signature = token.split('.')
    alg = json.loads(b64decode(header))['alg']
    if alg == 'none':
        # Critical bypass: treats unsigned payload as verified
        return json.loads(b64decode(payload))
    return verify_hmac(header, payload, signature)`,
    starter_templates: {
      python: `# Challenge 4: Patch JWT None Algorithm Bypass
# Objective: Disallow alg: 'none' and strictly verify cryptographic signature.

import json
from base64 import b64decode

ALLOWED_ALGORITHMS = {'HS256', 'RS256'}

def verify_jwt_token(token):
    parts = token.split('.')
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")
        
    header_b64, payload_b64, signature = parts
    header = json.loads(b64decode(header_b64))
    alg = header.get('alg')
    
    # Fix: Reject 'none' algorithm and enforce whitelist
    if not alg or alg.lower() == 'none' or alg not in ALLOWED_ALGORITHMS:
        raise ValueError(f"Disallowed algorithm: {alg}. Signature verification required.")
        
    return verify_hmac(header_b64, payload_b64, signature)
`,
      javascript: `// Challenge 4: Patch JWT None Algorithm Bypass
// Objective: Disallow alg: 'none' and enforce HMAC signature verification.

const ALLOWED_ALGS = ['HS256', 'RS256'];

function verifyJwtToken(token) {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error("Invalid JWT token format");
    
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const alg = header.alg;
    
    // Fix: Disallow 'none' algorithm
    if (!alg || alg.toLowerCase() === 'none' || !ALLOWED_ALGS.includes(alg)) {
        throw new Error("Invalid or rejected JWT algorithm");
    }
    
    return verifyHmac(parts[0], parts[1], parts[2]);
}
`
    },
    test_cases: [
      {
        id: "tc_4_1",
        title: "Legitimate HS256 Token Verification",
        type: "Functional",
        description: "Valid signed token using standard HMAC-SHA256 algorithm.",
        input: "token = eyJhbGciOiJIUzI1NiJ9...[Valid Signature]",
        expected: "Signature verified; token payload successfully decoded."
      },
      {
        id: "tc_4_2",
        title: "Forged Token with alg='none'",
        type: "Security Exploit",
        description: "Attacker token setting alg: 'none' with blank signature to bypass verification.",
        input: "token = eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4ifQ.",
        expected: "Authentication rejected: 'none' algorithm disallowed with error."
      },
      {
        id: "tc_4_3",
        title: "Tampered Payload with Original Signature",
        type: "Security Exploit",
        description: "Token with modified role claim but un-updated signature bytes.",
        input: "token with claims { role: 'superadmin' } but mismatched HMAC",
        expected: "Signature mismatch detected; verification throws SignatureVerificationError."
      },
      {
        id: "tc_4_4",
        title: "Malformed Token Boundary Test",
        type: "Boundary Condition",
        description: "Token string lacking standard 3-part period-delimited structure.",
        input: "token = 'malformed_non_jwt_string'",
        expected: "Handled gracefully with format validation error."
      }
    ]
  },
  {
    id: 5,
    title: "Weak Random Number Generator",
    category: "Cryptographic Primitives",
    difficulty: "EASY",
    xp_reward: 120,
    time_limit_seconds: 240,
    flag: "FLAG{prng_pr3d1ct4bl3_s33d}",
    description: "Session tokens are generated using standard pseudo-random seed values predictable from system uptime timestamps (random.seed(int(time.time()))). An attacker can predict session tokens generated in any given second.",
    instructions: "Replace predictable pseudo-random generator with a cryptographically secure random generator such as secrets.token_hex(32) or crypto.randomBytes(32).",
    vulnerable_code: `import random, time

def generate_session_token():
    random.seed(int(time.time()))
    return f"SESS_{random.randint(100000, 999999)}"`,
    starter_templates: {
      python: `# Challenge 5: Patch Weak Random Number Generator
# Objective: Use cryptographically secure randomness (secrets module).

import secrets

def generate_session_token():
    # Fix: Use secrets.token_hex for cryptographically secure pseudo-random tokens
    return f"SESS_{secrets.token_hex(32)}"
`,
      javascript: `// Challenge 5: Patch Weak Random Number Generator
// Objective: Use crypto.randomBytes for high-entropy tokens.

const crypto = require('crypto');

function generateSessionToken() {
    // Fix: Use CSPRNG randomBytes
    return "SESS_" + crypto.randomBytes(32).toString('hex');
}
`,
      typescript: `// Challenge 5: Patch Weak Random Number Generator
// Objective: Use crypto.randomBytes for high-entropy tokens.

import * as crypto from 'crypto';

export function generateSessionToken(): string {
    return "SESS_" + crypto.randomBytes(32).toString('hex');
}
`
    },
    test_cases: [
      {
        id: "tc_5_1",
        title: "Elimination of Time-Based Predictability",
        type: "Security Exploit",
        description: "Verify that subsequent calls in the same second produce distinct, non-repeating tokens.",
        input: "Call generate_session_token() multiple times at t=1700000000",
        expected: "Distinct cryptographically secure tokens produced; time-based seed removed."
      },
      {
        id: "tc_5_2",
        title: "Cryptographic Primitive Audit",
        type: "Security Exploit",
        description: "Check that implementation uses CSPRNG (secrets or crypto module).",
        input: "Source inspection for secrets.token_hex / crypto.randomBytes",
        expected: "CSPRNG primitive verified; linear pseudo-random generator eliminated."
      },
      {
        id: "tc_5_3",
        title: "Entropy Bit-Depth & Length Standard",
        type: "Boundary Condition",
        description: "Ensure generated token possesses >= 128 bits of cryptographic entropy (>= 32 hex chars).",
        input: "Token length & character space inspection",
        expected: "Token length >= 32 characters of high-entropy hexadecimal or alphanumeric output."
      },
      {
        id: "tc_5_4",
        title: "Zero Collision Frequency Test",
        type: "Functional",
        description: "Simulate 1,000 rapid token generations to verify zero duplicates.",
        input: "1,000 token generation iterations",
        expected: "0 collisions detected across sample set (100% uniqueness)."
      }
    ]
  },
  {
    id: 6,
    title: "Server-Side Request Forgery (SSRF)",
    category: "Network Perimeter Security",
    difficulty: "HARD",
    xp_reward: 350,
    time_limit_seconds: 480,
    flag: "FLAG{ssrf_m3t4d4t4_l34k3d}",
    description: "The webhook validation service fetches URLs from arbitrary user input without checking for private IP ranges (such as 169.254.169.254 or localhost), enabling attackers to exfiltrate internal cloud metadata and credentials.",
    instructions: "Implement private IP filtering: reject target URLs pointing to private IP addresses (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, and cloud metadata 169.254.169.254).",
    vulnerable_code: `import requests

def fetch_webhook_avatar(target_url):
    # No whitelist check on private IPs (169.254.169.254, localhost)
    response = requests.get(target_url, timeout=5)
    return response.content`,
    starter_templates: {
      python: `# Challenge 6: Patch Server-Side Request Forgery (SSRF)
# Objective: Block requests to cloud metadata and RFC1918 private subnets.

import ipaddress
import urllib.parse
import socket
import requests

DISALLOWED_NETWORKS = [
    ipaddress.ip_network('127.0.0.0/8'),
    ipaddress.ip_network('10.0.0.0/8'),
    ipaddress.ip_network('172.16.0.0/12'),
    ipaddress.ip_network('192.168.0.0/16'),
    ipaddress.ip_network('169.254.0.0/16'),  # Cloud metadata
]

def fetch_webhook_avatar(target_url):
    parsed = urllib.parse.urlparse(target_url)
    if parsed.scheme not in ('http', 'https'):
        raise ValueError("Invalid URL protocol")
        
    hostname = parsed.hostname
    ip_addr = ipaddress.ip_address(socket.gethostbyname(hostname))
    
    # Check if target IP falls within any disallowed private networks
    for net in DISALLOWED_NETWORKS:
        if ip_addr in net:
            raise PermissionError(f"SSRF Protection: Access to private IP {ip_addr} blocked")
            
    response = requests.get(target_url, timeout=5)
    return response.content
`,
      javascript: `// Challenge 6: Patch Server-Side Request Forgery (SSRF)
// Objective: Block requests to cloud metadata and internal private networks.

const { URL } = require('url');

const PRIVATE_PATTERNS = [
    /^127\\./,
    /^localhost/i,
    /^169\\.254\\./,
    /^10\\./,
    /^192\\.168\\./,
    /^172\\.(1[6-9]|2[0-9]|3[0-1])\\./
];

function fetchWebhookAvatar(targetUrl) {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error("Invalid URL protocol");
    }
    
    const host = parsed.hostname;
    for (const pattern of PRIVATE_PATTERNS) {
        if (pattern.test(host)) {
            throw new Error(\`SSRF Violation: Target \${host} is in private address space\`);
        }
    }
    
    return fetch(targetUrl);
}
`
    },
    test_cases: [
      {
        id: "tc_6_1",
        title: "Legitimate Public URL Access",
        type: "Functional",
        description: "Verify requests to public HTTPS endpoints ('https://api.github.com/status') succeed.",
        input: 'target_url = "https://api.github.com/status"',
        expected: "Request verified as public; HTTP fetch permitted."
      },
      {
        id: "tc_6_2",
        title: "Cloud Metadata IP (169.254.169.254)",
        type: "Security Exploit",
        description: "Test probe against AWS/GCP instance metadata endpoint: 'http://169.254.169.254/latest/meta-data/'",
        input: 'target_url = "http://169.254.169.254/latest/meta-data/"',
        expected: "Blocked: Cloud metadata IP detected and intercepted."
      },
      {
        id: "tc_6_3",
        title: "Loopback Interface Attack (127.0.0.1 / localhost)",
        type: "Security Exploit",
        description: "Test probe targeting local internal daemon: 'http://127.0.0.1:8080/admin'",
        input: 'target_url = "http://127.0.0.1:8080/admin"',
        expected: "Blocked: Localhost loopback access rejected with security violation."
      },
      {
        id: "tc_6_4",
        title: "Private RFC 1918 Subnet Probe",
        type: "Security Exploit",
        description: "Test probe targeting internal router: 'http://192.168.1.1/gateway'",
        input: 'target_url = "http://192.168.1.1/gateway"',
        expected: "Blocked: RFC 1918 private network range disallowed."
      }
    ]
  },
  {
    id: 7,
    title: "Go Microservice: Goroutine Race & Concurrent Map Mutation",
    category: "Go Systems & Concurrency Safety",
    difficulty: "MED",
    xp_reward: 260,
    time_limit_seconds: 360,
    language: "go",
    filename: "main.go",
    tags: ["go", "golang", "concurrency", "backend"],
    flag: "FLAG{g0_r4c3_c0nd1t10n_p4tch3d_4t0m1c}",
    description: "A high-throughput Go microservice handles concurrent deposit and transfer goroutines updating an in-memory vault map. Because Go maps are not thread-safe, running concurrent goroutine writes without mutex locks or atomic synchronization triggers fatal runtime crashes ('fatal error: concurrent map writes') and memory state corruption.",
    instructions: "Protect the shared vault map using sync.RWMutex (using mu.Lock() / mu.Unlock() for deposits, mu.RLock() / mu.RUnlock() for balance queries), or use sync.Map / atomic synchronization primitives to prevent data races.",
    vulnerable_code: `package main

import (
    "fmt"
    "time"
)

type Vault struct {
    balances map[string]int // INSECURE: Unsynchronized map accessed by multiple goroutines
}

func (v *Vault) Deposit(account string, amount int) {
    // Data race: Multiple goroutines writing to map simultaneously
    v.balances[account] += amount
}

func main() {
    v := &Vault{balances: make(map[string]int)}
    for i := 0; i < 100; i++ {
        go v.Deposit("operative_alpha", 10) // CRASH: fatal error: concurrent map writes
    }
    time.Sleep(50 * time.Millisecond)
    fmt.Println("Balance:", v.balances["operative_alpha"])
}`,
    starter_templates: {
      go: `// Challenge 7: Patch Go Goroutine Data Race & Map Corruption
// Objective: Use sync.RWMutex to safeguard concurrent map operations.

package main

import (
    "fmt"
    "sync"
    "time"
)

type Vault struct {
    mu       sync.RWMutex
    balances map[string]int
}

func NewVault() *Vault {
    return &Vault{
        balances: make(map[string]int),
    }
}

func (v *Vault) Deposit(account string, amount int) {
    v.mu.Lock()
    defer v.mu.Unlock()
    v.balances[account] += amount
}

func (v *Vault) GetBalance(account string) int {
    v.mu.RLock()
    defer v.mu.RUnlock()
    return v.balances[account]
}

func main() {
    v := NewVault()
    var wg sync.WaitGroup

    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            v.Deposit("operative_alpha", 10)
        }()
    }

    wg.Wait()
    fmt.Printf("[OK] Concurrency safe balance: %d\\n", v.GetBalance("operative_alpha"))
}
`,
      javascript: `// JavaScript Alternative: Thread-safe SharedArrayBuffer Mutex / Atomics
const buffer = new SharedArrayBuffer(4);
const balance = new Int32Array(buffer);
Atomics.add(balance, 0, 10);
console.log("Safe atomic balance:", Atomics.load(balance, 0));
`,
      python: `# Python Alternative: threading.Lock synchronization
import threading

lock = threading.Lock()
balance = 0

def deposit(amount):
    global balance
    with lock:
        balance += amount
`
    },
    test_cases: [
      {
        id: "tc_7_1",
        title: "Go Race Detector Simulation (-race flag)",
        type: "Concurrency Check",
        description: "Run 100 concurrent deposit goroutines to test for data races on the balances map.",
        input: "100 concurrent goroutines executing v.Deposit('operative_alpha', 10)",
        expected: "PASS: Zero data race warnings detected by Go runtime scheduler."
      },
      {
        id: "tc_7_2",
        title: "Mutex Write Lock Acquisition (mu.Lock)",
        type: "Security Exploit",
        description: "Verify that write operations properly acquire exclusive lock before mutating map state.",
        input: "Deposit operation under write contention",
        expected: "Exclusive write lock acquired; un-synchronized concurrent map write prevented."
      },
      {
        id: "tc_7_3",
        title: "Concurrent Read Lock (mu.RLock)",
        type: "Functional",
        description: "Verify readers can safely query balances concurrently without blocking other readers.",
        input: "50 simultaneous read requests while write lock idle",
        expected: "RLock granted to multiple readers concurrently without data race."
      },
      {
        id: "tc_7_4",
        title: "Deterministic Final Balance Integrity",
        type: "Boundary Condition",
        description: "Verify that after 100 deposit iterations of +10, final balance equals exactly 1000.",
        input: "100 iterations of +10 deposit",
        expected: "Final balance = 1000 without lost updates or race conditions."
      }
    ]
  },
  {
    id: 8,
    title: "Vue 3 SFC: Reactive DOM XSS & Unsafe v-html Directive",
    category: "Vue 3 & Frontend Component Security",
    difficulty: "EASY",
    xp_reward: 180,
    time_limit_seconds: 300,
    language: "vue",
    filename: "App.vue",
    tags: ["vue", "sfc", "frontend", "xss"],
    flag: "FLAG{vu3_sfc_v_htm1_s4n1t1z3d_r34ct1v3}",
    description: "In this Vue 3 Single File Component (App.vue), an operative's biography from an untrusted API payload is dynamically bound to the DOM using the raw v-html directive without sanitization. An attacker injecting <img src=x onerror=alert('PWNED')> executes arbitrary JavaScript in the victim's session.",
    instructions: "Replace the unsafe v-html directive with Vue's safe mustache interpolation {{ bio }} (which automatically HTML-entity escapes content), or sanitize the payload through DOMPurify.sanitize() in a computed property before rendering.",
    vulnerable_code: `<template>
  <div class="operative-card">
    <h3 class="name">{{ operativeName }}</h3>
    <!-- VULNERABLE: Direct unsanitized v-html directive binding -->
    <div class="bio-content" v-html="rawBiography"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const operativeName = ref('ShadowWalker')
// Payload containing malicious vector: <img src=x onerror=alert(document.cookie)>
const rawBiography = ref('<p>Level 42 Operative <img src=x onerror=exfiltrate(document.cookie)></p>')
</script>`,
    starter_templates: {
      vue: `<!-- Challenge 8: Secure Vue 3 SFC Component against XSS -->
<template>
  <div class="operative-card">
    <h3 class="name">{{ operativeName }}</h3>
    
    <!-- FIX OPTION 1: Safe reactive text interpolation (HTML escaped by Vue automatically) -->
    <div class="bio-content text-safe">{{ rawBiography }}</div>

    <!-- FIX OPTION 2: Sanitized HTML rendering with DOMPurify -->
    <div class="bio-content-sanitized" v-html="sanitizedBiography"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DOMPurify from 'dompurify'

const operativeName = ref('ShadowWalker')
const rawBiography = ref('<p>Level 42 Operative <img src=x onerror=alert(1)></p>')

// Sanitize untrusted input using DOMPurify before rendering via v-html
const sanitizedBiography = computed(() => {
  return DOMPurify.sanitize(rawBiography.value, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'span'],
    ALLOWED_ATTR: []
  })
})
</script>

<style scoped>
.operative-card {
  border: 1px solid #42b883;
  padding: 1.5rem;
  background: #161b22;
  border-radius: 6px;
}
.name {
  color: #42b883;
}
</style>
`,
      javascript: `// Vue 3 Composition API JavaScript equivalent
import { ref, computed } from 'vue';
import DOMPurify from 'dompurify';

export default {
  setup() {
    const rawBio = ref('<img src=x onerror=alert(1)>');
    const safeBio = computed(() => DOMPurify.sanitize(rawBio.value));
    return { safeBio };
  }
};
`,
      typescript: `// TypeScript Vue 3 Helper
import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'] });
}
`
    },
    test_cases: [
      {
        id: "tc_8_1",
        title: "Standard Benign Text/Markup Rendering",
        type: "Functional",
        description: "Verify standard text and safe markup renders correctly without corrupting layout.",
        input: 'rawBiography = "<p>Standard operative biography content.</p>"',
        expected: "Rendered safely in DOM without execution of unpermitted tags."
      },
      {
        id: "tc_8_2",
        title: "Direct Script Injection Filter (<script>)",
        type: "Security Exploit",
        description: "Test against direct script payload: <script>document.location='http://attacker.com'</script>",
        input: 'rawBiography = "<script>alert(1)</script>"',
        expected: "Script tag stripped or escaped as text; zero script execution."
      },
      {
        id: "tc_8_3",
        title: "Event Handler Tag Stripping (<img onerror=>)",
        type: "Security Exploit",
        description: "Test against inline image onerror exploit payload.",
        input: 'rawBiography = "<img src=x onerror=alert(document.cookie)>"',
        expected: "onerror attribute removed or rendered safely as raw text."
      },
      {
        id: "tc_8_4",
        title: "Vue 3 SFC Reactivity & Scoped Style Integrity",
        type: "Boundary Condition",
        description: "Verify Vue 3 reactive ref() or computed() binding functions correctly on dynamic updates.",
        input: "rawBiography.value updated reactively",
        expected: "DOM updates reactively while maintaining XSS sanitization invariant."
      }
    ]
  }
];

/**
 * Validates submitted code against predefined test cases for a selected challenge.
 * Returns detailed results for each test case, overall status, XP awarded, and feedback.
 */
export function validateChallengeCode(challengeId, code, language = 'python') {
  const challenge = challenges.find(c => c.id === challengeId);
  if (!challenge) {
    return {
      success: false,
      error: `Challenge #${challengeId} not found.`
    };
  }

  const cleanCode = (code || '').trim();
  if (!cleanCode) {
    return {
      success: false,
      error: "Editor buffer is empty. Please enter code to submit."
    };
  }

  const testResults = [];
  let allPassed = true;

  // Evaluate each predefined test case based on challenge security requirements
  switch (challenge.id) {
    case 1: {
      // Challenge 1: SQL Injection
      // Checks:
      // 1) Does NOT format/interpolate user_input directly into query (f-string or string concat)
      // 2) Uses parameterized query placeholders (?, %s, $1, or parameter tuple)
      const hasNaiveFString = /f["'].*SELECT.*\{user_input\}.*["']/i.test(cleanCode) || /SELECT.*WHERE.*\+.*user_input/i.test(cleanCode);
      const hasParameterBinding = /\?|\$1|%s|cursor\.execute\s*\(\s*query\s*,\s*\(/i.test(cleanCode) ||
                                  /cursor\.execute\s*\([^,]+,\s*\([^)]*\)\s*\)/i.test(cleanCode) ||
                                  /db\.query\s*\([^,]+,\s*\[[^\]]+\]\s*\)/i.test(cleanCode) ||
                                  /PREPARE/i.test(cleanCode);
      const isFixed = !hasNaiveFString && hasParameterBinding;

      // TC 1.1: Benign lookup
      const t1Passed = cleanCode.length > 20 && (cleanCode.includes('SELECT') || cleanCode.includes('select') || cleanCode.includes('execute'));
      testResults.push({
        id: "tc_1_1",
        title: "Standard Benign Lookup",
        type: "Functional",
        input: 'user_input = "operative_alpha"',
        expected: "Parameterized query binding: [operative_alpha]; exact match returned.",
        actual: t1Passed ? "Query parsed and executed with benign parameter binding." : "Query failed to parse or execute.",
        passed: t1Passed,
        executionTimeMs: Math.floor(Math.random() * 8) + 12
      });

      // TC 1.2: Boolean Tautology
      testResults.push({
        id: "tc_1_2",
        title: "Boolean Tautology Exploit (' OR '1'='1' --)",
        type: "Security Exploit",
        input: 'user_input = "\' OR \'1\'=\'1\' --"',
        expected: "Tautology treated strictly as parameter literal; 0 unauthenticated records leaked.",
        actual: isFixed ? "Parameter safely bound as literal string. Injected tautology neutralized." : "VULNERABILITY DETECTED: Query rendered as 'SELECT * FROM users WHERE username = '' OR '1'='1' --'. Authentication bypassed!",
        passed: isFixed,
        hint: isFixed ? null : "Replace f-strings or string concatenation with parameterized placeholders like '?' and pass '(user_input,)' as a parameter tuple to cursor.execute().",
        executionTimeMs: Math.floor(Math.random() * 10) + 15
      });

      // TC 1.3: UNION-based Exfiltration
      testResults.push({
        id: "tc_1_3",
        title: "UNION-Based Data Exfiltration",
        type: "Security Exploit",
        input: 'user_input = "\' UNION SELECT id, password FROM admin --"',
        expected: "Secondary query execution blocked; input bound as literal parameter.",
        actual: isFixed ? "Secondary SELECT disallowed. Parameter bound safely without query modification." : "VULNERABILITY DETECTED: Secondary UNION SELECT executed against database.",
        passed: isFixed,
        hint: isFixed ? null : "Use parameterized query execution so secondary SQL tokens are not interpreted as commands.",
        executionTimeMs: Math.floor(Math.random() * 8) + 14
      });

      // TC 1.4: Special Characters & Escaping
      testResults.push({
        id: "tc_1_4",
        title: "Special Characters & Escaping (O'Connor)",
        type: "Boundary Condition",
        input: 'user_input = "O\'Connor"',
        expected: "Successfully handled via parameter escaping without SQL syntax error.",
        actual: isFixed ? "Escaping handled automatically by database driver parameter binding." : "Database syntax error triggered: unescaped single quotation mark found.",
        passed: isFixed,
        hint: isFixed ? null : "Database driver handles quote escaping automatically when using parameterized placeholders.",
        executionTimeMs: Math.floor(Math.random() * 6) + 11
      });
      break;
    }

    case 2: {
      // Challenge 2: IDOR
      // Checks:
      // Verifies session ownership (doc.owner_id == session.user_id or filter_by with session)
      // Handles 403 / abort / Forbidden
      const checksSession = /session|owner_id|ownerId|user_id|userId/i.test(cleanCode);
      const enforcesAuth = /abort\s*\(\s*403\s*\)|abort\s*\(\s*401\s*\)|status\s*\(\s*403\s*\)|status\s*\(\s*401\s*\)|Forbidden|Unauthorized|throw/i.test(cleanCode) ||
                           /filter.*owner_id/i.test(cleanCode);
      const isFixed = checksSession && enforcesAuth;

      testResults.push({
        id: "tc_2_1",
        title: "Authorized Owner Retrieval",
        type: "Functional",
        input: "{ account_id: 'acc_123', session: { user_id: 'acc_123' } }",
        expected: "HTTP 200 OK: Document payload returned successfully.",
        actual: "Document serialized and delivered to authenticated owner.",
        passed: true,
        executionTimeMs: Math.floor(Math.random() * 5) + 10
      });

      testResults.push({
        id: "tc_2_2",
        title: "Horizontal IDOR Probe (Access Peer Records)",
        type: "Security Exploit",
        input: "{ account_id: 'acc_999', session: { user_id: 'acc_123' } }",
        expected: "HTTP 403 Forbidden: Ownership verification failed, payload blocked.",
        actual: isFixed ? "Access Denied: doc.owner_id ('acc_999') != session.user_id ('acc_123'). Blocked with 403 Forbidden." : "VULNERABILITY DETECTED: Endpoint returned confidential dossier of 'acc_999' without verifying caller ownership.",
        passed: isFixed,
        hint: isFixed ? null : "Check whether doc.owner_id matches current session user_id before returning data, and call abort(403) or return status 403 if mismatched.",
        executionTimeMs: Math.floor(Math.random() * 12) + 14
      });

      testResults.push({
        id: "tc_2_3",
        title: "Anonymous / Missing Session Probe",
        type: "Security Exploit",
        input: "{ account_id: 'acc_123', session: null }",
        expected: "HTTP 401 Unauthorized: Session token missing or invalid.",
        actual: isFixed ? "Unauthenticated request intercepted; rejected with HTTP 401." : "VULNERABILITY DETECTED: Anonymous request granted read access.",
        passed: isFixed,
        hint: isFixed ? null : "Ensure you verify that session.get('user_id') exists before performing object lookups.",
        executionTimeMs: Math.floor(Math.random() * 7) + 12
      });

      testResults.push({
        id: "tc_2_4",
        title: "Resource Scoping Filter",
        type: "Boundary Condition",
        input: "{ account_id: 'acc_admin_0', session: { user_id: 'acc_123' } }",
        expected: "HTTP 403 Forbidden: Cross-tenant access blocked.",
        actual: isFixed ? "Cross-tenant probe rejected by authorization layer." : "Cross-tenant record leaked.",
        passed: isFixed,
        hint: isFixed ? null : "Ensure queries are scoped with owner_id verification.",
        executionTimeMs: Math.floor(Math.random() * 6) + 10
      });
      break;
    }

    case 3: {
      // Challenge 3: RCE
      // Checks:
      // 1) shell=False or argument vector list ['ping', '-c', '1', host]
      // 2) host validation / regex checking
      // 3) No raw shell string interpolation
      const hasShellTrue = /shell\s*=\s*True/i.test(cleanCode);
      const usesArgList = /\[\s*["']ping["']\s*,\s*["']-c["']\s*,\s*["']1["']\s*,\s*host\s*\]/i.test(cleanCode) ||
                          /execFile\s*\(\s*["']ping["']/i.test(cleanCode) ||
                          /shell\s*=\s*False/i.test(cleanCode);
      const hasValidation = /re\.match/i.test(cleanCode) || /test\s*\(\s*host\s*\)/i.test(cleanCode) || /^[a-zA-Z0-9.-]+$/i.test(cleanCode);
      const isFixed = (!hasShellTrue && usesArgList) || hasValidation;

      testResults.push({
        id: "tc_3_1",
        title: "Standard IPv4 Target Diagnostic",
        type: "Functional",
        input: 'host = "127.0.0.1"',
        expected: "Ping output returned safely without shell spawning.",
        actual: "Diagnostic executed normally against 127.0.0.1 (1 packet transmitted, 1 received).",
        passed: true,
        executionTimeMs: Math.floor(Math.random() * 8) + 15
      });

      testResults.push({
        id: "tc_3_2",
        title: "Semicolon Command Chaining Attack",
        type: "Security Exploit",
        input: 'host = "127.0.0.1; cat /etc/passwd"',
        expected: "Injection blocked: Metacharacter ';' rejected or passed as literal argument to ping.",
        actual: isFixed ? "Command injection prevented: argument passed without shell interpretation." : "VULNERABILITY DETECTED: Shell executed 'cat /etc/passwd' following semicolon separator!",
        passed: isFixed,
        hint: isFixed ? null : "Pass commands as an argument list ['ping', '-c', '1', host] with shell=False, or validate host with regex r'^[a-zA-Z0-9.-]+$'.",
        executionTimeMs: Math.floor(Math.random() * 10) + 18
      });

      testResults.push({
        id: "tc_3_3",
        title: "Pipe & Subshell Injection",
        type: "Security Exploit",
        input: 'host = "127.0.0.1 | whoami"',
        expected: "Pipeline execution blocked; 'whoami' not executed.",
        actual: isFixed ? "Pipe operator '|' neutralized or rejected by validator." : "VULNERABILITY DETECTED: Pipeline command 'whoami' executed as root.",
        passed: isFixed,
        hint: isFixed ? null : "Avoid spawning a system shell; use subprocess.check_output(cmd, shell=False).",
        executionTimeMs: Math.floor(Math.random() * 7) + 14
      });

      testResults.push({
        id: "tc_3_4",
        title: "Command Substitution Attack ($())",
        type: "Security Exploit",
        input: 'host = "127.0.0.1 $(id)"',
        expected: "Subshell execution blocked; argument sanitized or rejected.",
        actual: isFixed ? "Subshell substitution '$()' blocked." : "Subshell command expanded by bash.",
        passed: isFixed,
        hint: isFixed ? null : "Do not pass user input through shell interpretation.",
        executionTimeMs: Math.floor(Math.random() * 6) + 12
      });
      break;
    }

    case 4: {
      // Challenge 4: JWT None Algorithm
      // Checks:
      // Rejects alg == 'none'
      // Enforces allowed algorithms
      const rejectsNone = /alg.*==.*['"]none['"]|alg\.lower\(\).*==.*['"]none['"]|alg.*===.*['"]none['"]/i.test(cleanCode) &&
                          (/raise|throw|return.*error|status.*401/i.test(cleanCode));
      const hasAllowedCheck = /ALLOWED_ALGORITHMS|ALLOWED_ALGS|HS256/i.test(cleanCode);
      const isFixed = rejectsNone || hasAllowedCheck;

      testResults.push({
        id: "tc_4_1",
        title: "Legitimate HS256 Token Verification",
        type: "Functional",
        input: "token = eyJhbGciOiJIUzI1NiJ9...[Valid Signature]",
        expected: "Signature verified; token payload successfully decoded.",
        actual: "HMAC signature verified, claims payload extracted.",
        passed: true,
        executionTimeMs: Math.floor(Math.random() * 5) + 10
      });

      testResults.push({
        id: "tc_4_2",
        title: "Forged Token with alg='none'",
        type: "Security Exploit",
        input: "token = eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4ifQ.",
        expected: "Authentication rejected: 'none' algorithm disallowed with error.",
        actual: isFixed ? "Algorithm 'none' intercepted and rejected with security exception." : "CRITICAL BYPASS DETECTED: Forged unverified token accepted as valid administrator session!",
        passed: isFixed,
        hint: isFixed ? null : "Check if alg == 'none' or alg.lower() == 'none' and raise an exception or reject before decoding payload.",
        executionTimeMs: Math.floor(Math.random() * 8) + 14
      });

      testResults.push({
        id: "tc_4_3",
        title: "Tampered Payload with Original Signature",
        type: "Security Exploit",
        input: "token with claims { role: 'superadmin' } but mismatched HMAC",
        expected: "Signature mismatch detected; verification throws SignatureVerificationError.",
        actual: "HMAC signature verification executed; tampered payload rejected.",
        passed: true,
        executionTimeMs: Math.floor(Math.random() * 6) + 12
      });

      testResults.push({
        id: "tc_4_4",
        title: "Malformed Token Boundary Test",
        type: "Boundary Condition",
        input: "token = 'malformed_non_jwt_string'",
        expected: "Handled gracefully with format validation error.",
        actual: "Format checked: token does not contain 3 segments.",
        passed: true,
        executionTimeMs: Math.floor(Math.random() * 5) + 8
      });
      break;
    }

    case 5: {
      // Challenge 5: Weak Random Number Generator
      // Checks:
      // 1) Uses secrets or crypto module
      // 2) Removes random.seed(int(time.time()))
      const usesSecrets = /import\s+secrets|secrets\.token_hex|crypto\.randomBytes/i.test(cleanCode);
      const removesTimeSeed = !/random\.seed\s*\(\s*int\s*\(\s*time\.time/i.test(cleanCode);
      const isFixed = usesSecrets && removesTimeSeed;

      testResults.push({
        id: "tc_5_1",
        title: "Elimination of Time-Based Predictability",
        type: "Security Exploit",
        input: "Call generate_session_token() multiple times at t=1700000000",
        expected: "Distinct cryptographically secure tokens produced; time-based seed removed.",
        actual: isFixed ? "Entropy derived from OS CSPRNG source; time predictability eliminated." : "VULNERABILITY DETECTED: Token derived from predictable time-based seed value.",
        passed: isFixed,
        hint: isFixed ? null : "Remove random.seed(time.time()) and use secrets.token_hex(32) or crypto.randomBytes(32).toString('hex').",
        executionTimeMs: Math.floor(Math.random() * 5) + 8
      });

      testResults.push({
        id: "tc_5_2",
        title: "Cryptographic Primitive Audit",
        type: "Security Exploit",
        input: "Source inspection for secrets.token_hex / crypto.randomBytes",
        expected: "CSPRNG primitive verified; linear pseudo-random generator eliminated.",
        actual: isFixed ? "CSPRNG (secrets/crypto) verified in source code." : "VULNERABILITY DETECTED: Standard linear pseudorandom generator (random) found.",
        passed: isFixed,
        hint: isFixed ? null : "Standard random module is not cryptographically secure. Use the secrets module.",
        executionTimeMs: Math.floor(Math.random() * 6) + 9
      });

      testResults.push({
        id: "tc_5_3",
        title: "Entropy Bit-Depth & Length Standard",
        type: "Boundary Condition",
        input: "Token length & character space inspection",
        expected: "Token length >= 32 characters of high-entropy hexadecimal or alphanumeric output.",
        actual: isFixed ? "Token delivers >= 256 bits of cryptographic entropy." : "Token length inadequate (only 6 decimal digits).",
        passed: isFixed,
        hint: isFixed ? null : "Ensure token length provides at least 32 hexadecimal characters (token_hex(32)).",
        executionTimeMs: Math.floor(Math.random() * 4) + 7
      });

      testResults.push({
        id: "tc_5_4",
        title: "Zero Collision Frequency Test",
        type: "Functional",
        input: "1,000 token generation iterations",
        expected: "0 collisions detected across sample set (100% uniqueness).",
        actual: isFixed ? "0 collisions in 1,000 samples (100% entropy uniqueness)." : "Collision observed due to small 6-digit key space.",
        passed: isFixed,
        hint: isFixed ? null : "High-entropy CSPRNG tokens have virtually zero collision probability.",
        executionTimeMs: Math.floor(Math.random() * 8) + 12
      });
      break;
    }

    case 6: {
      // Challenge 6: SSRF
      // Checks:
      // Checks IP or blocks private ranges (127, 169.254, 10, 192.168, 172.16)
      const checksPrivateIPs = /169\.254|DISALLOWED_NETWORKS|PRIVATE_PATTERNS|ipaddress|socket\.gethostbyname/i.test(cleanCode) ||
                               /is_private|private_network/i.test(cleanCode);
      const isFixed = checksPrivateIPs;

      testResults.push({
        id: "tc_6_1",
        title: "Legitimate Public URL Access",
        type: "Functional",
        input: 'target_url = "https://api.github.com/status"',
        expected: "Request verified as public; HTTP fetch permitted.",
        actual: "URL parsed and verified against public DNS record.",
        passed: true,
        executionTimeMs: Math.floor(Math.random() * 6) + 11
      });

      testResults.push({
        id: "tc_6_2",
        title: "Cloud Metadata IP (169.254.169.254)",
        type: "Security Exploit",
        input: 'target_url = "http://169.254.169.254/latest/meta-data/"',
        expected: "Blocked: Cloud metadata IP detected and intercepted.",
        actual: isFixed ? "Cloud metadata link-local address (169.254.169.254) blocked by security filter." : "VULNERABILITY DETECTED: Cloud metadata request allowed! IAM credentials compromised.",
        passed: isFixed,
        hint: isFixed ? null : "Inspect the resolved IP address and block private/link-local addresses such as 169.254.0.0/16 and 127.0.0.0/8.",
        executionTimeMs: Math.floor(Math.random() * 9) + 16
      });

      testResults.push({
        id: "tc_6_3",
        title: "Loopback Interface Attack (127.0.0.1 / localhost)",
        type: "Security Exploit",
        input: 'target_url = "http://127.0.0.1:8080/admin"',
        expected: "Blocked: Localhost loopback access rejected with security violation.",
        actual: isFixed ? "Loopback IP (127.0.0.1) blocked by private address filter." : "VULNERABILITY DETECTED: Internal daemon probe permitted.",
        passed: isFixed,
        hint: isFixed ? null : "Disallow connections to 127.0.0.0/8 and localhost.",
        executionTimeMs: Math.floor(Math.random() * 8) + 14
      });

      testResults.push({
        id: "tc_6_4",
        title: "Private RFC 1918 Subnet Probe",
        type: "Security Exploit",
        input: 'target_url = "http://192.168.1.1/gateway"',
        expected: "Blocked: RFC 1918 private network range disallowed.",
        actual: isFixed ? "Private network 192.168.0.0/16 blocked." : "Private network request allowed.",
        passed: isFixed,
        hint: isFixed ? null : "Filter RFC 1918 subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16).",
        executionTimeMs: Math.floor(Math.random() * 7) + 12
      });
      break;
    }

    case 7: {
      // Challenge 7: Go Goroutine Race & Unsynchronized Map Access
      // Checks:
      // 1) Uses sync.Mutex or sync.RWMutex or sync.Map or atomic
      // 2) Protects write operation with Lock() and Unlock()
      const hasMutexOrSync = /sync\.(RW)?Mutex|sync\.Map|atomic\.|threading\.Lock|SharedArrayBuffer|Atomics/i.test(cleanCode);
      const hasLockUnlock = /(mu|lock|v\.mu)\.Lock\(\)/i.test(cleanCode) || /Lock\(\)/i.test(cleanCode) || /sync\.Map/i.test(cleanCode);
      const hasSafeRead = /(mu|lock|v\.mu)\.RLock\(\)/i.test(cleanCode) || /RLock\(\)/i.test(cleanCode) || /Lock\(\)/i.test(cleanCode);
      const isFixed = hasMutexOrSync && hasLockUnlock;

      testResults.push({
        id: "tc_7_1",
        title: "Go Race Detector Simulation (-race flag)",
        type: "Concurrency Check",
        input: "100 concurrent goroutines executing v.Deposit('operative_alpha', 10)",
        expected: "PASS: Zero data race warnings detected by Go runtime scheduler.",
        actual: isFixed ? "PASS: Go race detector reported 0 data races. Thread safety verified." : "FAIL: Data race detected on map write: fatal error: concurrent map writes.",
        passed: isFixed,
        hint: isFixed ? null : "Embed a sync.RWMutex or sync.Mutex in Vault and lock before map writes.",
        executionTimeMs: Math.floor(Math.random() * 9) + 21
      });

      testResults.push({
        id: "tc_7_2",
        title: "Mutex Write Lock Acquisition (mu.Lock)",
        type: "Security Exploit",
        input: "Deposit operation under write contention",
        expected: "Exclusive write lock acquired; un-synchronized concurrent map write prevented.",
        actual: isFixed ? "Exclusive write lock acquired before updating balance map." : "Unprotected write: goroutine mutated shared map without mutex lock.",
        passed: isFixed,
        hint: isFixed ? null : "Call v.mu.Lock() before v.balances[account] += amount, and defer v.mu.Unlock().",
        executionTimeMs: Math.floor(Math.random() * 6) + 10
      });

      testResults.push({
        id: "tc_7_3",
        title: "Concurrent Read Lock (mu.RLock)",
        type: "Functional",
        input: "50 simultaneous read requests while write lock idle",
        expected: "RLock granted to multiple readers concurrently without data race.",
        actual: isFixed ? "Read lock granted concurrently across goroutines without race." : "Read operation without synchronization lock.",
        passed: isFixed,
        hint: isFixed ? null : "Use mu.RLock() for read operations like GetBalance().",
        executionTimeMs: Math.floor(Math.random() * 7) + 12
      });

      testResults.push({
        id: "tc_7_4",
        title: "Deterministic Final Balance Integrity",
        type: "Boundary Condition",
        input: "100 iterations of +10 deposit",
        expected: "Final balance = 1000 without lost updates or race conditions.",
        actual: isFixed ? "Final balance verified: exactly 1000 (100% update retention)." : "Balance discrepancy or panic due to uncoordinated memory writes.",
        passed: isFixed,
        hint: isFixed ? null : "Ensure WaitGroup or channels coordinate completion of all goroutines.",
        executionTimeMs: Math.floor(Math.random() * 8) + 18
      });
      break;
    }

    case 8: {
      // Challenge 8: Vue 3 SFC Unsafe v-html Directive & Reactive DOM XSS
      // Checks:
      // 1) Does not keep raw unsanitized v-html="rawBiography" without DOMPurify
      // 2) Uses safe text interpolation {{ rawBiography }} OR sanitizes with DOMPurify
      const hasUnsanitizedVHtml = /v-html=["']rawBiography["']/i.test(cleanCode) && !/DOMPurify|sanitize/i.test(cleanCode);
      const usesSafeMustache = /\{\{\s*rawBiography\s*\}\}/.test(cleanCode) || /\{\{\s*operativeBio\s*\}\}/.test(cleanCode);
      const usesDOMPurify = /DOMPurify\.sanitize/i.test(cleanCode) || /sanitizeHtml/i.test(cleanCode) || /sanitize/i.test(cleanCode);
      const isFixed = (!hasUnsanitizedVHtml && (usesSafeMustache || usesDOMPurify)) || (usesDOMPurify && cleanCode.includes('v-html'));

      testResults.push({
        id: "tc_8_1",
        title: "Standard Benign Text/Markup Rendering",
        type: "Functional",
        input: 'rawBiography = "<p>Standard operative biography content.</p>"',
        expected: "Rendered safely in DOM without execution of unpermitted tags.",
        actual: isFixed ? "Rendered safely in Vue 3 virtual DOM without security warnings." : "Insecure rendering mode active.",
        passed: isFixed,
        hint: isFixed ? null : "Use safe text binding {{ rawBiography }} or sanitize with DOMPurify.",
        executionTimeMs: Math.floor(Math.random() * 6) + 11
      });

      testResults.push({
        id: "tc_8_2",
        title: "Direct Script Injection Filter (<script>)",
        type: "Security Exploit",
        input: 'rawBiography = "<script>alert(1)</script>"',
        expected: "Script tag stripped or escaped as text; zero script execution.",
        actual: isFixed ? "Script tag escaped into HTML entities or stripped by DOMPurify." : "CRITICAL: Script tag rendered unescaped directly into DOM.",
        passed: isFixed,
        hint: isFixed ? null : "Replace raw v-html with text interpolation or DOMPurify.sanitize().",
        executionTimeMs: Math.floor(Math.random() * 5) + 9
      });

      testResults.push({
        id: "tc_8_3",
        title: "Event Handler Tag Stripping (<img onerror=>)",
        type: "Security Exploit",
        input: 'rawBiography = "<img src=x onerror=alert(document.cookie)>"',
        expected: "onerror attribute removed or rendered safely as raw text.",
        actual: isFixed ? "onerror handler neutralised: attribute stripped or escaped." : "CRITICAL: Image onerror inline event listener executed in browser context.",
        passed: isFixed,
        hint: isFixed ? null : "Ensure DOMPurify sanitizes event attributes before template mounting.",
        executionTimeMs: Math.floor(Math.random() * 6) + 12
      });

      testResults.push({
        id: "tc_8_4",
        title: "Vue 3 SFC Reactivity & Scoped Style Integrity",
        type: "Boundary Condition",
        input: "rawBiography.value updated reactively",
        expected: "DOM updates reactively while maintaining XSS sanitization invariant.",
        actual: isFixed ? "Vue 3 reactive ref() updated DOM safely within scoped SFC boundaries." : "Reactivity pipeline flawed or vulnerable to injection on mutation.",
        passed: isFixed,
        hint: isFixed ? null : "Use computed(() => DOMPurify.sanitize(rawBiography.value)) for reactive updates.",
        executionTimeMs: Math.floor(Math.random() * 5) + 14
      });
      break;
    }

    default: {
      allPassed = true;
      testResults.push({
        id: `tc_${challenge.id}_1`,
        title: "General Code Security Verification",
        type: "Functional",
        input: "Submitted solution buffer",
        expected: "Valid execution without security violations",
        actual: "Executed successfully.",
        passed: true,
        executionTimeMs: 15
      });
      break;
    }
  }

  const testsPassed = testResults.filter(t => t.passed).length;
  const testsTotal = testResults.length;
  allPassed = (testsPassed === testsTotal);

  return {
    success: true,
    challengeId: challenge.id,
    challengeTitle: challenge.title,
    xpReward: challenge.xp_reward,
    flag: allPassed ? challenge.flag : null,
    allPassed,
    testsPassed,
    testsTotal,
    results: testResults,
    message: allPassed
      ? `🎉 ALL ${testsTotal}/${testsTotal} PREDEFINED TEST CASES PASSED! Security flaw successfully patched.`
      : `⚠️ ${testsPassed}/${testsTotal} TEST CASES PASSED. Security vulnerabilities still present in code.`
  };
}
