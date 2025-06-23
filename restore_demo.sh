#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# CLI parsing — expect: onehubdb restore --dump <file|url> [--target <dsn>] [--namespace <ns>]
# -----------------------------------------------------------------------------
if [[ "${1:-}" != "restore" ]]; then
  echo "Usage: $(basename "$0") restore --dump <file|url> [--target <dsn>] [--namespace <k8s-namespace>]" >&2
  exit 1
fi
shift  # drop the 'restore' sub-command

DUMP=""
TARGET=""
NAMESPACE="default"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dump)
      DUMP="$2"; shift 2 ;;
    --target)
      TARGET="$2"; shift 2 ;;
    --namespace)
      NAMESPACE="$2"; shift 2 ;;
    *)
      echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

[[ -z "$DUMP" ]] && { echo "❌ --dump is required" >&2; exit 1; }

# -----------------------------------------------------------------------------

DUMP_DIR="/dump"  # retained for compatibility; not actively used
# YAML_FILE="k8s/restore-sandbox-job.yaml"
# YAML_FILE="$(cd "$(dirname "$0")" && pwd)/k8s/restore-sandbox-job.yaml"
YAML_FILE="$(dirname "$0")/k8s/restore-sandbox-job.yaml"
PLACEHOLDER="http://host.minikube.internal:8000/exampledump-good.dump"
# Change the port for the temporary HTTP server to avoid conflict with FastAPI
PORT=8001
JOB_NAME="restore-sandbox-job-$(date +%s)"
TMP_YAML="$(mktemp)"

INPUT="$DUMP"

if [[ -f "$INPUT" ]]; then
  FILE_DIR=$(dirname "$INPUT")
  FILE_NAME=$(basename "$INPUT")
  python3 -m http.server "$PORT" --directory "$FILE_DIR" >/dev/null 2>&1 &
  HTTP_PID=$!
  trap 'kill $HTTP_PID 2>/dev/null || true' EXIT
  DUMP_URL="http://host.minikube.internal:${PORT}/${FILE_NAME}"
else
  DUMP_URL="$INPUT"
fi

echo "Spinning up restore sandbox"
sed "s/restore-sandbox-job/$JOB_NAME/" "$YAML_FILE" \
  | sed "s|$PLACEHOLDER|$DUMP_URL|" \
  | sed "s|TARGET_DSN_PLACEHOLDER|$TARGET|" > "$TMP_YAML"

# shellcheck disable=SC2086
kubectl apply --validate=false -n "$NAMESPACE" -f "$TMP_YAML" >/dev/null
rm "$TMP_YAML"

# Wait for pod to exist and get its name
while true; do
  POD_NAME=$(kubectl get pods -l job-name="$JOB_NAME" -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
  if [[ -n "$POD_NAME" ]]; then
    break
  fi
  sleep 1
done

# Wait for the restore container to finish
while true; do
  PHASE=$(kubectl get pod "$POD_NAME" -n "$NAMESPACE" -o jsonpath='{.status.phase}' 2>/dev/null)
  if [[ "$PHASE" == "Succeeded" || "$PHASE" == "Failed" ]]; then
    break
  fi
  sleep 2
done

kubectl logs "$POD_NAME" -n "$NAMESPACE" -c restore

if [[ -n "${HTTP_PID:-}" ]]; then
  kill "$HTTP_PID" 2>/dev/null || true
fi
