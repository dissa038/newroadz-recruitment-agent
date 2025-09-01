# DIRECT LOXO SYNC - NO BULLSHIT
Write-Host "🚀 STARTING DIRECT LOXO SYNC..." -ForegroundColor Green

# Step 1: Fix data extraction
Write-Host "🔧 Fixing data extraction..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/fix/loxo-data-extraction" -Method POST -ContentType "application/json" -Body '{"batchSize": 1000}' -TimeoutSec 600
    Write-Host "✅ Fixed: $($response.data.updated) candidates" -ForegroundColor Green
} catch {
    Write-Host "❌ Fix failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 2: Full pipeline
Write-Host "📥 Running full pipeline..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/sync/loxo/full-pipeline" -Method POST -ContentType "application/json" -Body '{"maxCandidates": 20000, "skipExisting": false, "autoEmbed": true}' -TimeoutSec 2400
    Write-Host "✅ Pipeline done!" -ForegroundColor Green
} catch {
    Write-Host "❌ Pipeline failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Queue embeddings
Write-Host "🧠 Queueing embeddings..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/embed/queue/loxo" -Method POST -ContentType "application/json" -Body '{"onlyEnhanced": false}' -TimeoutSec 300
    Write-Host "✅ Queued: $($response.queued) jobs" -ForegroundColor Green
} catch {
    Write-Host "❌ Queue failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Process embeddings
Write-Host "⚡ Processing embeddings..." -ForegroundColor Yellow
$totalProcessed = 0

for ($i = 1; $i -le 50; $i++) {
    Write-Host "Run $i/50..." -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/embed/queue/run" -Method POST -ContentType "application/json" -Body '{"batchSize": 30, "maxJobs": 1500}' -TimeoutSec 900
        $processed = $response.data.processed
        $totalProcessed += $processed
        Write-Host "  Processed: $processed (Total: $totalProcessed)" -ForegroundColor White
        
        if ($processed -eq 0) {
            Write-Host "✅ Done!" -ForegroundColor Green
            break
        }
        Start-Sleep -Seconds 5
    } catch {
        Write-Host "❌ Run $i failed" -ForegroundColor Red
        Start-Sleep -Seconds 10
    }
}

Write-Host "🎉 SYNC COMPLETE! Total processed: $totalProcessed" -ForegroundColor Green
