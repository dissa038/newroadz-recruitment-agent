# LOXO PROGRESS MONITOR
Write-Host "🔍 MONITORING LOXO PROGRESS..." -ForegroundColor Green

$baseUrl = "http://localhost:3001"

while ($true) {
    try {
        # Get candidate stats
        $candidateStats = Invoke-RestMethod -Uri "$baseUrl/api/debug/candidate-stats" -Method GET -TimeoutSec 30
        
        # Get embedding job stats  
        $embeddingStats = Invoke-RestMethod -Uri "$baseUrl/api/debug/embedding-stats" -Method GET -TimeoutSec 30
        
        Clear-Host
        Write-Host "🚀 LOXO MEGA SYNC PROGRESS MONITOR" -ForegroundColor Green
        Write-Host "=================================" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "📊 CANDIDATES:" -ForegroundColor Yellow
        Write-Host "  Total: $($candidateStats.total)" -ForegroundColor White
        Write-Host "  Loxo: $($candidateStats.loxo)" -ForegroundColor White
        Write-Host "  With Names: $($candidateStats.withNames)" -ForegroundColor White
        Write-Host "  With Emails: $($candidateStats.withEmails)" -ForegroundColor White
        Write-Host "  Enhanced: $($candidateStats.enhanced)" -ForegroundColor White
        Write-Host "  Fully Embedded: $($candidateStats.embedded)" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "🧠 EMBEDDING JOBS:" -ForegroundColor Yellow
        Write-Host "  Pending: $($embeddingStats.pending)" -ForegroundColor Red
        Write-Host "  In Progress: $($embeddingStats.inProgress)" -ForegroundColor Yellow
        Write-Host "  Completed: $($embeddingStats.completed)" -ForegroundColor Green
        Write-Host "  Failed: $($embeddingStats.failed)" -ForegroundColor Red
        Write-Host ""
        
        $percentComplete = [math]::Round(($embeddingStats.completed / ($embeddingStats.completed + $embeddingStats.pending + $embeddingStats.inProgress)) * 100, 1)
        Write-Host "📈 PROGRESS: $percentComplete% COMPLETE" -ForegroundColor Cyan
        
        if ($embeddingStats.pending -eq 0 -and $embeddingStats.inProgress -eq 0) {
            Write-Host "🎉 ALL EMBEDDING JOBS COMPLETED!" -ForegroundColor Green
            break
        }
        
        Start-Sleep -Seconds 10
        
    } catch {
        Write-Host "❌ Error getting stats: $($_.Exception.Message)" -ForegroundColor Red
        Start-Sleep -Seconds 5
    }
}
