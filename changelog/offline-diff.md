level: patch

- **Offline mode downloads only what changed**: on a new release the service worker copies every `?h=` file an older release already kept instead of downloading all ~4.5 MB again; only pages, unhashed files and changed files go to the network.
