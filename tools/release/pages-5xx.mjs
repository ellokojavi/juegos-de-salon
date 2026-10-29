// Did the Pages deploy fail with a server error (5xx), or behind a stuck older deployment? (D-506) publish.yml retries actions/deploy-pages
// only then: a 502 from GitHub (2026-10-29, #985) is worth another try a minute later, while any other
// failure (a bad artifact, missing permissions) would only fail again. It reads the annotations the
// failed step left on the running `publish` job; if it can't read them, it says no.
//
//   node tools/release/pages-5xx.mjs      # exit 0: a 5xx, retry; exit 1: anything else
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * The older deployment GitHub says is still in progress, if that is why it refused (2026-10-29: after
 * #985's 502 its deployment never ended, and every later deploy got "Please cancel <sha> first").
 */
export const stuckDeployment = messages => {
  for (const m of messages) { const x = /in progress deployment\. Please cancel ([0-9a-f]{40}) first/.exec(m); if (x) return x[1]; }
  return '';
};

/** Is any of these messages a 5xx from the Pages API? */
export const serverError = messages => messages.some(m => /\(status: 5\d\d\)|\b50[234] |Server Error/.test(m));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const gh = path => JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8' }));
  const { GITHUB_REPOSITORY: repo, GITHUB_RUN_ID: run, GITHUB_RUN_ATTEMPT: attempt = '1', JOB = 'publish' } = process.env;
  try {
    const job = gh(`repos/${repo}/actions/runs/${run}/attempts/${attempt}/jobs?per_page=100`).jobs.find(j => j.name === JOB);
    // The failed step's annotations may take a few seconds to show up on the job
    let notes = [];
    for (let i = 0; i < 4 && !serverError(notes) && !stuckDeployment(notes); i++) {
      if (i) execFileSync('sleep', ['10']);
      notes = gh(`repos/${repo}/check-runs/${job.id}/annotations`).map(a => a.message || '');
    }
    // A deployment of an older commit left open blocks every new one: this run is newer, so it
    // cancels that one (never its own commit) and retries (D-506)
    const stuck = stuckDeployment(notes);
    if (stuck && stuck !== process.env.GITHUB_SHA) {
      execFileSync('gh', ['api', '-X', 'POST', `repos/${repo}/pages/deployments/${stuck}/cancel`], { stdio: 'inherit' });
      console.log(`cancelled the stuck Pages deployment of ${stuck.slice(0, 7)}: retrying`);
      process.exit(0);
    }
    const yes = serverError(notes);
    console.log(yes ? 'the deploy failed with a 5xx: retrying' : `not a 5xx, no retry: ${notes.join(' | ').slice(0, 300)}`);
    process.exit(yes ? 0 : 1);
  } catch (e) {
    console.log(`couldn't read the error (${String(e.message).split('\n')[0]}): no retry`);
    process.exit(1);
  }
}
