import pino from 'pino'

// Create logger with minimal configuration for Edge Runtime compatibility
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  browser: {
    asObject: true
  }
})

// Logger for Apollo webhook processing
export const apolloLogger = logger.child({ service: 'apollo-webhook' })

// Logger for Loxo sync operations
export const loxoLogger = logger.child({ service: 'loxo-sync' })

// Logger for embedding operations
export const embeddingLogger = logger.child({ service: 'embedding-pipeline' })

// Logger for AI operations
export const aiLogger = logger.child({ service: 'ai-agent' })

// Logger for deduplication
export const dedupLogger = logger.child({ service: 'deduplication' })

// Logger for CV processing
export const cvLogger = logger.child({ service: 'cv-processing' })

// Helper function to create contextual loggers
export function createContextLogger(context: Record<string, any>) {
  return logger.child(context)
}

// Error tracking helper
export function logError(error: Error, context?: Record<string, any>) {
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...context
  }, 'Error occurred')
}

// Performance tracking helper
export function createPerformanceLogger(operation: string, context?: Record<string, any>) {
  const start = Date.now()
  const perfLogger = logger.child({ operation, ...context })
  
  return {
    info: (message: string, data?: any) => perfLogger.info(data, message),
    error: (message: string, error?: Error) => perfLogger.error({ error }, message),
    complete: (message?: string, data?: any) => {
      const duration = Date.now() - start
      perfLogger.info({ 
        duration_ms: duration,
        ...data 
      }, message || `${operation} completed`)
    }
  }
}

// Batch operation logger
export function createBatchLogger(operation: string, totalItems: number) {
  let processed = 0
  let errors = 0
  const batchLogger = logger.child({ 
    operation, 
    batch_total: totalItems 
  })
  
  return {
    logProgress: (itemsProcessed: number, currentItem?: any) => {
      processed = itemsProcessed
      if (processed % 10 === 0 || processed === totalItems) {
        batchLogger.info({
          progress: `${processed}/${totalItems}`,
          percentage: Math.round((processed / totalItems) * 100),
          current_item: currentItem?.id || currentItem?.name
        }, `Batch progress: ${processed}/${totalItems}`)
      }
    },
    logError: (error: Error, item?: any) => {
      errors++
      batchLogger.error({
        error: {
          name: error.name,
          message: error.message
        },
        item_id: item?.id,
        total_errors: errors
      }, 'Batch item processing error')
    },
    complete: (successCount?: number) => {
      batchLogger.info({
        total_processed: processed,
        total_errors: errors,
        success_count: successCount || (processed - errors),
        success_rate: Math.round(((successCount || (processed - errors)) / totalItems) * 100)
      }, `Batch operation completed: ${operation}`)
    }
  }
}

export default logger