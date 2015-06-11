## Command: ember move
While the `ember move` command will essentially be a proxy for `git mv`, the more important role it will serve is updating any references to the source path inside a project. User prompting with diffs should be done with any change, bypassable with the `--force` option. If the file changes folder depth, any import statements with relative paths will also be updated.

It will be used by the `ember rename` command, as well as by future migration tools in ember-watson. The aim is to keep it as basic as possible to allow building upon it with other commands.

If the file is versioned, use `git mv` to keep the version history (check via `git ls-files --error-unmatch <file_name>; echo $?`). If not, use `mv` or `move`.

### Usage
ember move [mv]: `ember mv <source> <dest> [options]...`

The source and dest arguments should be paths to files, directories will be ignored. Paths should either be relative to the executing path, or start with a `/` to start from the project root.

#### Arguments
| name | description |
| ---- | ----------- |
| source | path to file from current dir or project root |
| dest | path to destination from current dir or project root |

#### Options
| name | description |
| ---- | ----------- |
| dry-run | run and log output without actually executing |
| verbose | log all actions |
| force | overwrite any existing destination files |

### Examples:
Given the following app structure:
```
app
├── components
│   └── foo-bar.js
│   └── bar
│       └── foo-baz.js
├── routes
...
```
```
// using project root paths
ember mv /app/components/foo-bar.js /app/components/bar-foo.js

// this will work if run if foo-bar.js exists in the executing path
ember mv foo-bar.js bar-foo.js

// relative path examples
ember mv foo-bar.js foo/bar-foo.js
ember mv ../../foo.js foo.js
ember mv ./foo.js bar.js

// moving from relative path to root path
ember mv foo-bar.js /app/components/bar/foo-bar.js
```

### Process

1. `ember mv <source> <dest> [options]...`
2. pre-process:
  1. pre-verify:
    * SOURCE file exists
    * DEST file does not already exist
  2. check for git
    * check for .git in project
    * check to see if file is versioned
  3. check dest dir exists
  4. beforeMove hook
  5. prompt user
3. process:
  1. create dest dir(s) if they don't already exist
  2. `[git] [mv,move] <source> <dest>`
4. post-process:
  1. search project for import paths referencing source path (relative paths as well)
    * get AST for files matching path
    * update instances of source path with dest path
  2. afterMove hook
