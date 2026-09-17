package runner

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type ExecutionResult struct {
	Language         string  `json:"language"`
	Success          bool    `json:"success"`
	Output           string  `json:"output"`
	Stderr           string  `json:"stderr"`
	ExitCode         int     `json:"exitCode"`
	ExecutionTimeMs  int64   `json:"executionTimeMs"`
	RaceDetected     bool    `json:"raceDetected"`
	RaceWarning      string  `json:"raceWarning,omitempty"`
	GoroutineStats   string  `json:"goroutineStats,omitempty"`
}

func ExecuteGoCode(src string, timeoutSeconds int) ExecutionResult {
	if timeoutSeconds <= 0 || timeoutSeconds > 15 {
		timeoutSeconds = 7
	}

	start := time.Now()
	result := ExecutionResult{
		Language: "go",
		Success:  false,
	}

	// Create temporary sandbox directory
	tmpDir, err := os.MkdirTemp("", "cq_go_sandbox_*")
	if err != nil {
		result.Stderr = fmt.Sprintf("Failed to initialize sandbox: %v", err)
		result.ExitCode = 1
		result.ExecutionTimeMs = time.Since(start).Milliseconds()
		return result
	}
	defer os.RemoveAll(tmpDir)

	goFilePath := filepath.Join(tmpDir, "main.go")
	if err := os.WriteFile(goFilePath, []byte(src), 0644); err != nil {
		result.Stderr = fmt.Sprintf("Failed to write source file: %v", err)
		result.ExitCode = 1
		result.ExecutionTimeMs = time.Since(start).Milliseconds()
		return result
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeoutSeconds)*time.Second)
	defer cancel()

	// Execute Go code
	cmd := exec.CommandContext(ctx, "go", "run", "main.go")
	cmd.Dir = tmpDir
	cmd.Env = append(os.Environ(), "GOPATH="+filepath.Join(tmpDir, ".gopath"), "CGO_ENABLED=0")

	var stdoutBuf, stderrBuf bytes.Buffer
	cmd.Stdout = &stdoutBuf
	cmd.Stderr = &stderrBuf

	execErr := cmd.Run()
	result.ExecutionTimeMs = time.Since(start).Milliseconds()
	result.Output = stdoutBuf.String()
	result.Stderr = stderrBuf.String()

	if ctx.Err() == context.DeadlineExceeded {
		result.Stderr += "\n[SANDBOX WARNING] Execution timed out after limit. Possible infinite loop or deadlock detected."
		result.ExitCode = 124
		return result
	}

	if strings.Contains(result.Stderr, "DATA RACE") || strings.Contains(result.Output, "DATA RACE") {
		result.RaceDetected = true
		result.RaceWarning = "WARNING: Go Runtime Race Detector flagged unsynchronized concurrent read/write operations."
	}

	if execErr != nil {
		if exitErr, ok := execErr.(*exec.ExitError); ok {
			result.ExitCode = exitErr.ExitCode()
		} else {
			result.ExitCode = 1
		}
		result.Success = false
	} else {
		result.Success = true
		result.ExitCode = 0
	}

	return result
}
