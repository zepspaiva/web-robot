git add * || true && git clean -df && git commit -m "." && git push && npm version patch && npm publish