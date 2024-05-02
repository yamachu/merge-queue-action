/**
 * @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments
 * @param {{ owner: string; repo: string; pull_number: number; runId: number }} args
 */
export default async ({ github }, args) => {
  const { owner, repo, pull_number, runId } = args;

  const comment_body = `
Testing: https://github.com/${owner}/${repo}/actions/runs/${runId}
You can view state by GitHub CLI below command:
  - gh run view --repo ${owner}/${repo} ${runId}
  - gh run watch --repo ${owner}/${repo} ${runId}

If you want to cancel the test, you can cancel it by GitHub CLI below command:
  - gh run cancel --repo ${owner}/${repo} ${runId}
`;

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body: comment_body,
  });
};
