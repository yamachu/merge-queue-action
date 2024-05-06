/**
 * @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments
 * @param {{ owner: string; repo: string, actor: string }} args
 */
export default async ({ github }, args) => {
  const { owner, repo, actor } = args;

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

  if (!CODEOWNERS_users.includes(`@${actor}`)) {
    throw new Error(
      `Comment trigger user(${actor}) is not included in CODEOWNERS.`
    );
  }
};
