level: patch

- **Panel: a burst of identical "saw the campaign" rows is one row.** The Nov 9–10 fix stopped a phone from writing one row per view only when it can remember what it saw; a browser with no storage still wrote four rows in a second (Nov 11, 02:34). The timeline now joins rows with the same campaign, name and country within two minutes into one, marked "N times in a row".
