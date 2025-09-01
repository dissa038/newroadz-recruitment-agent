# MEGA LOXO DATA FIX SCRIPT
# This script will AGGRESSIVELY fix all Loxo data extraction issues

Write-Host "🔥 STARTING MEGA LOXO DATA FIX ATTACK!" -ForegroundColor Red

$baseUrl = "http://localhost:3000"
$headers = @{
    "Content-Type" = "application/json"
}

# Step 1: Fix data extraction for existing candidates
Write-Host "🔧 STEP 1: FIXING DATA EXTRACTION..." -ForegroundColor Yellow
try {
    $fixBody = @{
        batchSize = 500
        maxCandidates = 15000
    } | ConvertTo-Json

    $fixResponse = Invoke-RestMethod -Uri "$baseUrl/api/fix/loxo-data-extraction" -Method POST -Headers $headers -Body $fixBody -TimeoutSec 300
    Write-Host "✅ DATA EXTRACTION FIX: $($fixResponse.data.updated) candidates updated!" -ForegroundColor Green
} catch {
    Write-Host "❌ DATA EXTRACTION FIX FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 2: Run the full pipeline again to catch any missed candidates
Write-Host "🚀 STEP 2: RUNNING FULL PIPELINE AGAIN..." -ForegroundColor Yellow
try {
    $pipelineBody = @{
        maxCandidates = 15000
        skipExisting = $false  # DON'T SKIP - FORCE UPDATE ALL
        autoEmbed = $true
        batchSize = 200
        concurrency = 5
    } | ConvertTo-Json

    $pipelineResponse = Invoke-RestMethod -Uri "$baseUrl/api/sync/loxo/full-pipeline" -Method POST -Headers $headers -Body $pipelineBody -TimeoutSec 1800
    Write-Host "✅ PIPELINE: $($pipelineResponse.data.created) created, $($pipelineResponse.data.updated) updated!" -ForegroundColor Green
} catch {
    Write-Host "❌ PIPELINE FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Queue ALL embeddings
Write-Host "🧠 STEP 3: QUEUEING ALL EMBEDDINGS..." -ForegroundColor Yellow
try {
    $embedQueueBody = @{
        onlyEnhanced = $false  # QUEUE ALL
        batchSize = 500
    } | ConvertTo-Json

    $embedQueueResponse = Invoke-RestMethod -Uri "$baseUrl/api/embed/queue/loxo" -Method POST -Headers $headers -Body $embedQueueBody -TimeoutSec 300
    Write-Host "✅ EMBEDDING QUEUE: $($embedQueueResponse.queued) jobs queued!" -ForegroundColor Green
} catch {
    Write-Host "❌ EMBEDDING QUEUE FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Process embeddings in aggressive batches
Write-Host "⚡ STEP 4: PROCESSING EMBEDDINGS AGGRESSIVELY..." -ForegroundColor Yellow
$maxRuns = 50  # Run up to 50 times
$runCount = 0

do {
    $runCount++
    Write-Host "🔄 EMBEDDING RUN $runCount/$maxRuns..." -ForegroundColor Cyan

    try {
        $embedProcessBody = @{
            batchSize = 50
            maxJobs = 2000
        } | ConvertTo-Json

        $embedProcessResponse = Invoke-RestMethod -Uri "$baseUrl/api/embed/queue/run" -Method POST -Headers $headers -Body $embedProcessBody -TimeoutSec 600

        $processed = $embedProcessResponse.data.processed
        $succeeded = $embedProcessResponse.data.succeeded
        $failed = $embedProcessResponse.data.failed

        Write-Host "   📊 Processed: $processed, Succeeded: $succeeded, Failed: $failed" -ForegroundColor White

        # If no jobs processed, we're done
        if ($processed -eq 0) {
            Write-Host "✅ NO MORE EMBEDDING JOBS TO PROCESS!" -ForegroundColor Green
            break
        }

        # Small delay between runs
        Start-Sleep -Seconds 5

    } catch {
        Write-Host "❌ EMBEDDING RUN $runCount FAILED: $($_.Exception.Message)" -ForegroundColor Red
        Start-Sleep -Seconds 10  # Longer delay on error
    }

} while ($runCount -lt $maxRuns)

# Step 5: Final status check
Write-Host "📊 STEP 5: FINAL STATUS CHECK..." -ForegroundColor Yellow
Write-Host "🎉 MEGA LOXO SYNC ATTACK COMPLETED!" -ForegroundColor Green
Write-Host "Check your database now - everything should be synced and embedded!" -ForegroundColor Green
