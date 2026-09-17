package analyzer

import (
	"go/ast"
	"go/parser"
	"go/token"
	"strings"
)

type AnalysisReport struct {
	Language        string   `json:"language"`
	LinesOfCode     int      `json:"linesOfCode"`
	ValidSyntax     bool     `json:"validSyntax"`
	SyntaxError     string   `json:"syntaxError,omitempty"`
	GoroutineCount  int      `json:"goroutineCount"`
	MutexLocks      int      `json:"mutexLocks"`
	ChannelOps      int      `json:"channelOps"`
	SafetyScore     int      `json:"safetyScore"`
	DetectedIssues  []string `json:"detectedIssues"`
	Recommendations []string `json:"recommendations"`
	IsThreadSafe    bool     `json:"isThreadSafe"`
}

func AnalyzeGoCode(src string) AnalysisReport {
	report := AnalysisReport{
		Language:        "go",
		LinesOfCode:     len(strings.Split(src, "\n")),
		ValidSyntax:     true,
		DetectedIssues:  make([]string, 0),
		Recommendations: make([]string, 0),
		SafetyScore:     100,
	}

	fset := token.NewFileSet()
	node, err := parser.ParseFile(fset, "sandbox.go", src, parser.ParseComments)
	if err != nil {
		report.ValidSyntax = false
		report.SyntaxError = err.Error()
		report.SafetyScore = 0
		report.DetectedIssues = append(report.DetectedIssues, "Go parser encountered syntax error: "+err.Error())
		return report
	}

	hasMutex := false
	hasSyncPackage := false
	hasGoroutines := false

	// Inspect AST nodes
	ast.Inspect(node, func(n ast.Node) bool {
		switch x := n.(type) {
		case *ast.ImportSpec:
			if x.Path != nil && strings.Trim(x.Path.Value, "\"") == "sync" {
				hasSyncPackage = true
			}
		case *ast.GoStmt:
			report.GoroutineCount++
			hasGoroutines = true
		case *ast.CallExpr:
			// Check for Lock() or Unlock()
			if sel, ok := x.Fun.(*ast.SelectorExpr); ok {
				if sel.Sel.Name == "Lock" || sel.Sel.Name == "Unlock" || sel.Sel.Name == "RLock" || sel.Sel.Name == "RUnlock" {
					report.MutexLocks++
					hasMutex = true
				}
			}
		case *ast.SendStmt:
			report.ChannelOps++
		case *ast.UnaryExpr:
			if x.Op == token.ARROW {
				report.ChannelOps++
			}
		}
		return true
	})

	// Concurrency security evaluation
	if hasGoroutines && !hasMutex && report.ChannelOps == 0 {
		report.SafetyScore -= 45
		report.DetectedIssues = append(report.DetectedIssues, "CRITICAL: Multiple goroutines spawned without sync.Mutex or Channel synchronization. High risk of concurrent memory race.")
		report.Recommendations = append(report.Recommendations, "Add 'sync.Mutex' or sync channel pipeline to protect shared state.")
	}

	if hasGoroutines && hasMutex && report.MutexLocks%2 != 0 {
		report.SafetyScore -= 20
		report.DetectedIssues = append(report.DetectedIssues, "WARNING: Asymmetric Lock/Unlock call count detected. Ensure all Lock() calls have matching defer Unlock().")
		report.Recommendations = append(report.Recommendations, "Use 'defer mu.Unlock()' immediately after acquiring the lock.")
	}

	if !hasSyncPackage && hasGoroutines {
		report.SafetyScore -= 25
		report.DetectedIssues = append(report.DetectedIssues, "WARNING: Goroutines active but 'sync' package is not imported.")
	}

	if report.SafetyScore >= 80 {
		report.IsThreadSafe = true
		report.Recommendations = append(report.Recommendations, "Architecture demonstrates robust thread-safe synchronization principles.")
	} else {
		report.IsThreadSafe = false
	}

	return report
}
