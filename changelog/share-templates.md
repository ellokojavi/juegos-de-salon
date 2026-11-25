level: patch

- **Every share message comes from one set of templates** (`share-templates.js`, D-620): room invites, the app, the video, a game's link, results, tables and invites to a cup, a duel or Uno al día. A test checks every one in the three languages. Fixed on the way: Uno al día's shares leave a blank line after their header like all the others, a duel challenge opens with its header (`⚔️ *Sudoku* · al mejor de 3`), and a room invite sent before the inviter's name arrived says «Te invitaron a jugar» instead of «👋  te invita».
