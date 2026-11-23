level: patch

- **The end-to-end log says why a push tests the whole PR**: no earlier commit passed, a merge of main
  (D-610), a compare too long to trust, or GitHub failing to answer. Before, every case read «no earlier
  commit of this PR passed».
