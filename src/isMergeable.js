/**
 * @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments
 * @param {{ owner: string; repo: string; pull_number: number }} args
 */
export default async ({ github }, args) => {
  const { owner, repo, pull_number } = args;

  const { data } = await github.rest.pulls.get({
    owner,
    repo,
    pull_number,
  });

  if (data.mergeable === false) {
    throw new Error("This pull request is not mergeable due to conflicts.");
  }

  return data.base.ref;
};
