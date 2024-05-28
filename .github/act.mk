ACTOR := yamachu

test/merge-queue-trigger:
	act -W ./workflows/merge-queue-trigger.yml -e ./fixtures/merge-queue-trigger-event.json -s GITHUB_TOKEN=$$(gh auth token) -a $(ACTOR)
