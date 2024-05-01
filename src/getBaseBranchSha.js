/**
 * @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments
 * @param {{ owner: string; repo: string; branchName: string }} args
 */
export default async ({ github }, args) => {
  const { owner, repo, branchName } = args;

  const { data } = await github.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branchName}`,
  });

  return data.object.sha;
};
