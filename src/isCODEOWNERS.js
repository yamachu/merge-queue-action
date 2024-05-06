/**
 * @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments
 * @param {{ owner: string; repo: string }} args
 */
export default async ({ github }, args) => {
  const { owner, repo } = args;

  const author = github.triggering_actor;
  const CODEOWNERS = await github.rest.repos.getContent({
    owner,
    repo,
    path: ".github/CODEOWNERS",
  });

  const CODEOWNERS_content = Buffer.from(
    CODEOWNERS.data.content,
    "base64"
  ).toString();
  const CODEOWNERS_lines = CODEOWNERS_content.split("\n");
  const CODEOWNERS_users = CODEOWNERS_lines.filter(
    (line) => line.startsWith("*") || line.startsWith("/")
  )
    .map((line) => line.split(" ").slice(1))
    .flat();

  if (!CODEOWNERS_users.includes(`@${author}`)) {
    throw new Error(
      `Comment trigger user(${author}) is not included in CODEOWNERS.`
    );
  }
};
