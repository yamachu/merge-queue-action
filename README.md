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

WIP

see: https://github.com/yamachu/play-actions/blob/master/.github/workflows/new-handler.yml

see: https://github.com/yamachu/play-actions/blob/master/.github/workflows/testing-queue.yml
