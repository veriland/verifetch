# Contributing to VeriFetch 🚀

Thank you for your interest in contributing to VeriFetch! To maintain the highest standard of open-source security and stability, the Veriland team explicitly strictly regulates how code is introduced to the `main` branch. 

Please read the following policies carefully before submitting any patches or feature updates.

## ⛔ Rule 1: No Direct Pushes to `main`
The `main` branch is protected by robust GitHub server-side restrictions.
- You **cannot push** directly to `main`. 
- Every external code modification must be presented via a **Pull Request (PR)**.

## 🛠️ Rule 2: Pull Request Formalities
When you have finished testing your code locally, open a Pull Request against the `veriland/verifetch` repository. 
1. **Approval Required**: Your PR will not be merged until it receives manual approval from a Veriland maintainer. 
2. **Automated CI (Continuous Integration)**: The moment you open your PR, a GitHub Action background server will automatically spawn (`.github/workflows/build.yml`) and aggressively attempt to compile the entire project. If your commits contain breaking type errors or syntax failures, the Action will fail and your PR will be **blocked** globally.

## 🏷️ Rule 3: Versioning (Maintainers Only)
To cut a new official release of VeriFetch, the repository uses **Automated Remote Packaging** driven by Semantic Versioning tags.

**DO NOT** manually modify "version" in `package.json` under your PR!
**DO NOT** run `vsce package` and push your binary `.vsix` file into the remote branch!

When your PR is approved and merged, a Maintainer will trigger the release system automatically by assigning a version tag:
1. They will run `npm version patch` (or `minor`, or `major`).
2. They will push the tag to GitHub: `git push --tags`.
3. Our private, highly-secured CD engine (`.github/workflows/release.yml`) will detect the tag, cleanly build your newly merged code, package the entire extension natively into a pristine `.vsix` bundled file, and instantly cut a public GitHub release for the global community to download.
