# Process

1. ember mv \<old-name\> \<new-name\> \<options\>
2. pre-process:
  1. verify:
    * old-name file exists
    * new-name file does not already exist
  2. check for git
    * check for .git in project
    * check to see if file is versioned
  3. beforeMove hook
3. process:
  1. [git] mv \<old-name\> \<new-name\>
4. post-process:
  1. search project for import paths referencing old-name (relative paths as well)
    * get AST for files matching path
    * update instances of old path with new path
  2. afterMove hook
