import { performance } from 'perf_hooks';
import http from 'http';
import { execSync } from 'child_process';

const TARGET_URL = 'http://127.0.0.1:8081/';

function runHttpBenchmark(totalRequests, concurrency) {
  return new Promise((resolve) => {
    let completed = 0;
    let successful = 0;
    let failed = 0;
    const latencies = [];
    const startTime = performance.now();

    const agent = new http.Agent({ keepAlive: true, maxSockets: concurrency });
    let inFlight = 0;
    let reqIndex = 0;

    function launchNext() {
      if (reqIndex >= totalRequests) return;
      reqIndex++;
      inFlight++;
      const reqStart = performance.now();

      const req = http.get(TARGET_URL, { agent }, (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          const dur = performance.now() - reqStart;
          latencies.push(dur);
          if (res.statusCode === 200) successful++;
          else failed++;
          finishRequest();
        });
      });

      req.on('error', () => {
        failed++;
        finishRequest();
      });

      req.end();
    }

    function finishRequest() {
      completed++;
      inFlight--;
      if (completed >= totalRequests) {
        const totalDuration = (performance.now() - startTime) / 1000;
        latencies.sort((a, b) => a - b);
        const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
        const p90 = latencies[Math.floor(latencies.length * 0.9)] || 0;
        const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
        const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
        const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        const rps = totalRequests / totalDuration;

        resolve({
          totalRequests,
          concurrency,
          durationSec: totalDuration.toFixed(2),
          rps: rps.toFixed(1),
          successful,
          failed,
          avgMs: avg.toFixed(2),
          p50Ms: p50.toFixed(2),
          p90Ms: p90.toFixed(2),
          p95Ms: p95.toFixed(2),
          p99Ms: p99.toFixed(2),
        });
      } else {
        launchNext();
      }
    }

    for (let i = 0; i < concurrency; i++) {
      launchNext();
    }
  });
}

function sampleDockerStats() {
  try {
    const raw = execSync('docker stats --no-stream --format "{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}" shadow-tracker-prod', { encoding: 'utf8' }).trim();
    const parts = raw.split('|');
    return {
      container: parts[0],
      cpu: parts[1],
      memUsage: parts[2],
      memPercent: parts[3],
    };
  } catch (e) {
    return { cpu: 'N/A', memUsage: 'N/A', memPercent: 'N/A' };
  }
}

// 2. Maximum Client-Side Data Volume Simulation
function benchmarkMaxDatasetLogic() {
  const initialMem = process.memoryUsage().heapUsed;
  const start = performance.now();

  // Generate maximum usage dataset: 10,000 tasks, 365 daily logs, 5,000 expenses, 500 habits
  const tasks = [];
  for (let i = 0; i < 10000; i++) {
    tasks.push({
      id: `task_${i}`,
      title: `Quarterly Milestone Deliverable #${i}`,
      description: 'Comprehensive high-priority architectural deliverable with extensive notes and tags',
      priority: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
      isCompleted: i % 2 === 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      dueDate: '2026-12-31',
    });
  }

  const dailyLogs = [];
  for (let d = 0; d < 365; d++) {
    dailyLogs.push({
      date: `2026-01-01`,
      rating: 5,
      sleepHours: 7.5,
      mood: 'Focused',
      notes: 'Executed 4 deep work focus blocks and finished all daily sprints without context switching.',
    });
  }

  const expenses = [];
  for (let e = 0; e < 5000; e++) {
    expenses.push({
      id: `exp_${e}`,
      amount: 150 + (e % 1000),
      category: ['Food', 'Bills', 'Shopping', 'Other'][e % 4],
      note: `Expense item index ${e}`,
      date: '2026-09-23',
    });
  }

  // Serialize to JSON (Backup / Export simulation)
  const backupObject = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    tasks,
    dailyLogs,
    expenses,
  };

  const serializeStart = performance.now();
  const serialized = JSON.stringify(backupObject);
  const serializeDuration = performance.now() - serializeStart;

  const parseStart = performance.now();
  const parsed = JSON.parse(serialized);
  const parseDuration = performance.now() - parseStart;

  // AI Context Extraction Simulation (1 Year Window Filtering)
  const aiCtxStart = performance.now();
  const cutoff = new Date(Date.now() - 365 * 86400000).toISOString();
  const activeTasks = parsed.tasks.slice(0, 100);
  const activeLogs = parsed.dailyLogs.slice(0, 30);
  const activeExpenses = parsed.expenses.slice(0, 50);

  const contextData = {
    activeWindow: '1y',
    totalTasks: parsed.tasks.length,
    recentTasks: activeTasks,
    recentLogs: activeLogs,
    recentExpenses: activeExpenses,
  };
  const contextString = JSON.stringify(contextData);
  const tokenEstimate = Math.ceil(contextString.length / 4);
  const aiCtxDuration = performance.now() - aiCtxStart;

  const peakMem = process.memoryUsage().heapUsed;
  const memoryDeltaMb = ((peakMem - initialMem) / 1024 / 1024).toFixed(2);
  const payloadSizeMb = (Buffer.byteLength(serialized, 'utf8') / 1024 / 1024).toFixed(2);

  return {
    itemCount: tasks.length + dailyLogs.length + expenses.length,
    payloadSizeMb,
    memoryDeltaMb,
    serializeMs: serializeDuration.toFixed(2),
    parseMs: parseDuration.toFixed(2),
    aiContextCompileMs: aiCtxDuration.toFixed(2),
    tokenEstimate,
  };
}

async function main() {
  console.log('====================================================');
  console.log('   SHADOW TRACKER MAXIMUM USAGE BENCHMARK SUITE');
  console.log('====================================================\n');

  console.log('--- 1. SAMPLING IDLE DOCKER STATS ---');
  const idleStats = sampleDockerStats();
  console.log(`Container: ${idleStats.container}`);
  console.log(`Idle CPU: ${idleStats.cpu}`);
  console.log(`Idle Memory: ${idleStats.memUsage} (${idleStats.memPercent})\n`);

  console.log('--- 2. RUNNING PEAK HTTP LOAD TEST (3,000 reqs, 60 concurrency) ---');
  const bench1 = await runHttpBenchmark(3000, 60);
  const loadStats = sampleDockerStats();
  console.log(`Throughput: ${bench1.rps} requests/sec`);
  console.log(`Total Duration: ${bench1.durationSec}s`);
  console.log(`Success / Fail: ${bench1.successful} / ${bench1.failed}`);
  console.log(`Latency Avg: ${bench1.avgMs}ms | p50: ${bench1.p50Ms}ms | p90: ${bench1.p90Ms}ms | p99: ${bench1.p99Ms}ms`);
  console.log(`Peak Docker CPU under load: ${loadStats.cpu}`);
  console.log(`Peak Docker Memory under load: ${loadStats.memUsage} (${loadStats.memPercent})\n`);

  console.log('--- 3. MAXIMUM CLIENT-SIDE DATASET STRESS TEST ---');
  const dataBench = benchmarkMaxDatasetLogic();
  console.log(`Simulated Records: ${dataBench.itemCount.toLocaleString()} total items`);
  console.log(`Raw Database Payload Size: ${dataBench.payloadSizeMb} MB`);
  console.log(`Memory Delta for 15k records: ${dataBench.memoryDeltaMb} MB`);
  console.log(`JSON Serialization Time: ${dataBench.serializeMs} ms`);
  console.log(`JSON Parse & Hydration Time: ${dataBench.parseMs} ms`);
  console.log(`AI Context Window Compilation (1 Year): ${dataBench.aiContextCompileMs} ms`);
  console.log(`Estimated Tokens for 1Y Snapshot: ${dataBench.tokenEstimate.toLocaleString()} tokens\n`);

  console.log('====================================================');
  console.log('             BENCHMARK COMPLETED');
  console.log('====================================================');
}

main();
