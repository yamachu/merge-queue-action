/**
 * @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments
 * @param {{ owner: string; repo: string; pull_number: number; runId: number }} args
 */
export default async ({ github }, args) => {
  const { owner, repo, pull_number, runId } = args;

  const comment_body = `Queuing: https://github.com/${owner}/${repo}/actions/runs/${runId}`;

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body: comment_body,
  });
};
