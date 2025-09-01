# MEGA LOXO ATTACK SCRIPT
Write-Host "🔥 STARTING MEGA LOXO ATTACK!" -ForegroundColor Red

$baseUrl = "http://localhost:3000"

# Step 1: Fix data extraction
Write-Host "🔧 FIXING DATA EXTRACTION..." -ForegroundColor Yellow
try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/api/fix/loxo-data-extraction" -Method POST -ContentType "application/json" -Body '{"batchSize": 500, "maxCandidates": 15000}' -TimeoutSec 300
    Write-Host "✅ FIXED: $($response1.data.updated) candidates!" -ForegroundColor Green
} catch {
    Write-Host "❌ FIX FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 2: Run pipeline
Write-Host "🚀 RUNNING PIPELINE..." -ForegroundColor Yellow
try {
    $response2 = Invoke-RestMethod -Uri "$baseUrl/api/sync/loxo/full-pipeline" -Method POST -ContentType "application/json" -Body '{"maxCandidates": 15000, "skipExisting": false, "autoEmbed": true, "batchSize": 200, "concurrency": 5}' -TimeoutSec 1800
    Write-Host "✅ PIPELINE: $($response2.data.created) created, $($response2.data.updated) updated!" -ForegroundColor Green
} catch {
    Write-Host "❌ PIPELINE FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Queue embeddings
Write-Host "🧠 QUEUEING EMBEDDINGS..." -ForegroundColor Yellow
try {
    $response3 = Invoke-RestMethod -Uri "$baseUrl/api/embed/queue/loxo" -Method POST -ContentType "application/json" -Body '{"onlyEnhanced": false, "batchSize": 500}' -TimeoutSec 300
    Write-Host "✅ QUEUED: $($response3.queued) embedding jobs!" -ForegroundColor Green
} catch {
    Write-Host "❌ QUEUE FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Process embeddings aggressively
Write-Host "⚡ PROCESSING EMBEDDINGS..." -ForegroundColor Yellow
for ($i = 1; $i -le 20; $i++) {
    Write-Host "🔄 EMBEDDING RUN $i/20..." -ForegroundColor Cyan
    try {
        $response4 = Invoke-RestMethod -Uri "$baseUrl/api/embed/queue/run" -Method POST -ContentType "application/json" -Body '{"batchSize": 50, "maxJobs": 2000}' -TimeoutSec 600
        $processed = $response4.data.processed
        Write-Host "   📊 Processed: $processed" -ForegroundColor White
        
        if ($processed -eq 0) {
            Write-Host "✅ NO MORE JOBS!" -ForegroundColor Green
            break
        }
        Start-Sleep -Seconds 3
    } catch {
        Write-Host "❌ RUN $i FAILED: $($_.Exception.Message)" -ForegroundColor Red
        Start-Sleep -Seconds 5
    }
}

Write-Host "🎉 MEGA LOXO ATTACK COMPLETED!" -ForegroundColor Green
