# Merge Queue Action

現在 GitHub Enterprise Cloud のみで提供されている Merge Queue のような機能を GitHub Actions で提供する Custom Actions です。

## 提供する機能

[popuko](https://github.com/voyagegroup/popuko) が提供している機能を参考に、以下の機能を提供します。

- Merge の Queuing 機能
  - ただし、GitHub Actions の Concurrency 機能を利用しているため、順序の保証はできません。

## 提供する Actions

- yamachu/merge-queue-action/precheck (optional)
  - Merge Queue に追加する前の事前チェックを行う Action
    - この Action が成功した場合のみ、Merge Queue に追加されます
    - Merge 可能な PR かどうかのチェックを行うなどに利用できます
    - CODEONWERS に記載されたユーザからの GitHub Actions のトリガーであるかのチェックを行うなどに利用できます
- yamachu/merge-queue-action/pretesting
  - テスト実行前に、merge 先と merge したブランチを作成した tmp ブランチを作成し、テストを実行できるようにします
- yamachu/merge-queue-action/posttesting
  - テスト実行後に、tmp ブランチを削除し、実際に merge します
  - 当該 actions 経由じゃない merge を検知し、HEAD が進んでいる場合は、merge せずにエラーを返します

## 使い方

### yamachu/merge-queue-action/precheck

Pull Requests のコメントをトリガにして、Merge Queue に追加する前の事前チェックを行う Action です。

#### Permissions

- contents: read
- issues: write
- pull-requests: write

Pull Request にコメントを追加するため、`issues` と `pull-requests` の write 権限が必要です。

#### Inputs

- required-codeowners:
  - CODEOWNERS に記載されているユーザのみがトリガーできるようにします
  - default: "true"

#### Outputs

- base-branch:
  - マージ先のブランチ名

#### Example

```yaml
name: precheck
on:
  issue_comment:
    types: [created]

jobs:
  precheck:
    runs-on: ubuntu-latest
    if: (contains(github.event.comment.body, '/mq') && github.event.issue.pull_request != null)
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: yamachu/merge-queue-action/precheck@v1
        with:
          required-codeowners: "true"
        id: precheck
      - name: Set base branch
        run: echo "base-branch=${{ steps.precheck.outputs.base-branch }}" >> $GITHUB_ENV
```

### yamachu/merge-queue-action/pretesting

Pull Requests のコメントをトリガにして、テスト実行前に、merge 先と merge したブランチを作成した tmp ブランチを作成し、テストを実行できるようにします。

#### Permissions

- contents: write
- issues: write
- pull-requests: write

Pull Request にコメントを追加するため、`issues` と `pull-requests` の write 権限が必要です。
また、tmp ブランチを作成するため、`contents` の write 権限が必要です。

#### Inputs

- github-token:
  - GitHub Token
- pr-number:
  - Pull Request の番号
- tmp-ci-branch: (optional)
  - テストを実行するための tmp ブランチ名
  - default: "auto.tmp"
- merge-user-email: (optional)
  - commit を行うユーザのメールアドレス
- merge-user-name: (optional)
  - commit を行うユーザの名前

#### Outputs

- base-branch:
  - マージ先のブランチ名
- base-branch-sha:
  - マージ先のブランチの SHA
  - この Actions 経由ではなく、テスト実行中に変更された場合に、エラーを返すために利用します

#### Example

```yaml
name: pretesting
on:
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Associated Pull Requests number'
        required: true
      tmp-ci-branch:
        description: 'Temporary CI branch name'
        required: true

jobs:
  pretesting:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: yamachu/merge-queue-action/pretesting@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          pr-number: ${{ github.event.inputs.issue_number }}
          tmp-ci-branch: ${{ github.event.inputs.tmp-ci-branch }}
        id: pretesting
      - name: Set base branch
        run: echo "base-branch=${{ steps.pretesting.outputs.base-branch }}" >> $GITHUB_ENV
      - name: Set base branch SHA
        run: echo "base-branch-sha=${{ steps.pretesting.outputs.base-branch-sha }}" >> $GITHUB_ENV
```

### yamachu/merge-queue-action/posttesting

テスト実行後に、tmp ブランチを削除し、実際に merge します。

#### Permissions

- contents: write
- pull-requests: write

#### Inputs

- github-token:
- pr-number:
- base-branch-sha:
- base-branch:
- merge-user-email: (optional)
- merge-user-name: (optional)

## Example

### CommentHandler

Pull Requests に `/mq` というコメントを追加することで、Merge Queue に追加することができるサンプル。

auto.${PR_NUMBER} というブランチを作成し、テストを実行するための workflow をトリガーします。
後述する `testing-queue.yml` がトリガーされます。

`merge-queue-trigger-handler.yml`

```yaml
name: Handle Merge Queue Trigger
on:
  issue_comment:
    types: [created]

jobs:
  CommentHandle:
    if: (contains(github.event.comment.body, '/mq') && github.event.issue.pull_request != null)
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
      actions: write
    steps:
      - uses: yamachu/merge-queue-action/precheck@main
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: |
          git push origin HEAD:auto.${{ github.event.issue.number }}
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Dispatch workflow via GitHub CLI
        run: >
          gh workflow run -R ${{ github.event.repository.full_name }}
          -f issue_number=${{ github.event.issue.number }}
          -f tmp-ci-branch=auto.${{ github.event.issue.number }}
          --ref auto.${{ github.event.issue.number }} testing-queue.yml
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### TestingQueue

`CommentHandler` がトリガーされた際に、テストを実行するための workflow。

テストには Reusable Workflow として、`test.yml` を利用します。
この `test.yml` は

```yml
on:
  workflow_call:
    inputs:
      checkout-ref:
        description: 'The ref to checkout'
        required: false
        type: string
```

として、`checkout-ref` という引数を受け取ります。

また、TestingQueue として利用する workflow は、concurrency を利用して、同時に実行される workflow を制限する必要があります。

`testing-queue.yml`

```yaml
name: Testing Queue Runner
on:
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Associated Pull Requests number'
        required: true
      tmp-ci-branch:
        description: 'Temporary CI branch name'
        required: true
concurrency:
  group: merge-queue
  cancel-in-progress: false

jobs:
  PreTesting:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    outputs:
      base-branch: ${{ steps.pretesting.outputs.base-branch }}
      base-branch-sha: ${{ steps.pretesting.outputs.base-branch-sha }}
    steps:
      - uses: yamachu/merge-queue-action/pretesting@main
        id: pretesting
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          pr-number: ${{ github.event.inputs.issue_number }}
          tmp-ci-branch: ${{ github.event.inputs.tmp-ci-branch }}

  Test:
    uses: ./.github/workflows/test.yml
    with:
      checkout-ref: ${{ github.event.inputs.tmp-ci-branch }}
    needs: [PreTesting]

  PostTesting:
    runs-on: ubuntu-latest
    needs: [PreTesting, Test]
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: yamachu/merge-queue-action/posttesting@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          base-branch: ${{ needs.PreTesting.outputs.base-branch }}
          base-branch-sha: ${{ needs.PreTesting.outputs.base-branch-sha }}
          pr-number: ${{ github.event.inputs.issue_number }}
      - run:
          git push origin --delete ${{ github.event.inputs.tmp-ci-branch }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
