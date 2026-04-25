/** Structured logger for Railway log drain. All output goes to stdout as JSON. */

/** Safely extracts a string message from any thrown value. */
export function serializeError(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object') {
    const msg = (err as Record<string, unknown>).message
    if (msg !== undefined) return String(msg)
    return JSON.stringify(err)
  }
  return String(err)
}

type Level = 'info' | 'warn' | 'error'

function log(level: Level, worker: string, msg: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    worker,
    msg,
    ...meta,
  })
  if (level === 'error') {
    process.stderr.write(line + '\n')
  } else {
    process.stdout.write(line + '\n')
  }
}

export function makeLogger(worker: string) {
  return {
    info:  (msg: string, meta?: Record<string, unknown>) => log('info',  worker, msg, meta),
    warn:  (msg: string, meta?: Record<string, unknown>) => log('warn',  worker, msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log('error', worker, msg, meta),
  }
}
