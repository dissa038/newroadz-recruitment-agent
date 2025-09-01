# COMPLETE LOXO SYNC SCRIPT - GET EVERYTHING IN DATABASE FULLY EMBEDDED
Write-Host "🚀 STARTING COMPLETE LOXO SYNC..." -ForegroundColor Green

$baseUrl = "http://localhost:3000"

# Function to make API calls with retry
function Invoke-APICall {
    param($Url, $Body, $TimeoutSec = 300)
    
    $maxRetries = 3
    for ($retry = 1; $retry -le $maxRetries; $retry++) {
        try {
            return Invoke-RestMethod -Uri $Url -Method POST -ContentType "application/json" -Body $Body -TimeoutSec $TimeoutSec
        } catch {
            Write-Host "❌ Attempt $retry failed: $($_.Exception.Message)" -ForegroundColor Red
            if ($retry -eq $maxRetries) { throw }
            Start-Sleep -Seconds 5
        }
    }
}

# Step 1: Fix existing data extraction issues
Write-Host "🔧 Step 1: Fixing data extraction for existing candidates..." -ForegroundColor Yellow
try {
    $fixResponse = Invoke-APICall -Url "$baseUrl/api/fix/loxo-data-extraction" -Body '{"batchSize": 1000, "maxCandidates": 20000}' -TimeoutSec 600
    Write-Host "✅ Fixed data for $($fixResponse.data.updated) candidates" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Data fix had issues, continuing anyway..." -ForegroundColor Yellow
}

# Step 2: Run full pipeline to get ALL candidates
Write-Host "📥 Step 2: Running full pipeline to sync ALL Loxo candidates..." -ForegroundColor Yellow
try {
    $pipelineResponse = Invoke-APICall -Url "$baseUrl/api/sync/loxo/full-pipeline" -Body '{"maxCandidates": 20000, "skipExisting": false, "autoEmbed": true, "batchSize": 150, "concurrency": 4}' -TimeoutSec 2400
    Write-Host "✅ Pipeline completed: $($pipelineResponse.data.created) created, $($pipelineResponse.data.updated) updated" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Pipeline had issues, continuing to embeddings..." -ForegroundColor Yellow
}

# Step 3: Queue ALL possible embeddings
Write-Host "🧠 Step 3: Queueing ALL embeddings..." -ForegroundColor Yellow
try {
    $queueResponse = Invoke-APICall -Url "$baseUrl/api/embed/queue/universal" -Body '{"sources": ["loxo"], "onlyWithContent": false, "batchSize": 1000, "priority": 200}' -TimeoutSec 300
    Write-Host "✅ Queued $($queueResponse.total) embedding jobs" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Universal queue failed, trying Loxo-specific queue..." -ForegroundColor Yellow
    try {
        $loxoQueueResponse = Invoke-APICall -Url "$baseUrl/api/embed/queue/loxo" -Body '{"onlyEnhanced": false, "batchSize": 1000}' -TimeoutSec 300
        Write-Host "✅ Queued $($loxoQueueResponse.queued) Loxo embedding jobs" -ForegroundColor Green
    } catch {
        Write-Host "❌ Both embedding queues failed!" -ForegroundColor Red
    }
}

# Step 4: Process ALL embeddings until done
Write-Host "⚡ Step 4: Processing ALL embeddings until complete..." -ForegroundColor Yellow
$totalProcessed = 0
$maxRuns = 100
$consecutiveEmptyRuns = 0

for ($run = 1; $run -le $maxRuns; $run++) {
    Write-Host "🔄 Embedding run $run/$maxRuns..." -ForegroundColor Cyan
    
    try {
        $embedResponse = Invoke-APICall -Url "$baseUrl/api/embed/queue/run" -Body '{"batchSize": 25, "maxJobs": 1000}' -TimeoutSec 900
        
        $processed = $embedResponse.data.processed
        $succeeded = $embedResponse.data.succeeded
        $failed = $embedResponse.data.failed
        
        $totalProcessed += $processed
        
        Write-Host "   📊 Run $run - Processed: $processed, Succeeded: $succeeded, Failed: $failed, Total: $totalProcessed" -ForegroundColor White
        
        if ($processed -eq 0) {
            $consecutiveEmptyRuns++
            if ($consecutiveEmptyRuns -ge 3) {
                Write-Host "✅ No more embedding jobs to process!" -ForegroundColor Green
                break
            }
        } else {
            $consecutiveEmptyRuns = 0
        }
        
        # Adaptive delay based on success rate
        if ($failed -gt ($succeeded / 2)) {
            Start-Sleep -Seconds 10  # Longer delay if many failures
        } else {
            Start-Sleep -Seconds 3   # Short delay if going well
        }
        
    } catch {
        Write-Host "❌ Embedding run $run failed: $($_.Exception.Message)" -ForegroundColor Red
        Start-Sleep -Seconds 15
    }
}

# Final status
Write-Host "🎉 COMPLETE LOXO SYNC FINISHED!" -ForegroundColor Green
Write-Host "📊 Total embeddings processed: $totalProcessed" -ForegroundColor Green
Write-Host "✅ Check your database - all Loxo data should now be synced and embedded!" -ForegroundColor Green
