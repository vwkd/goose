// read files

// for each file
// - read frontmatter
// - read body
// - read file path
// - read creation date

// for each file
// process metadata
// - file path relative to source folder from full file path
// - file name, from file path
// - file extension, from file path
// - creation date from creation date

// for each file
// process frontmatter
// - validate properties against built-in ones
// - convert strings to object types, e.g. date, URL, etc.
// - (date from FileInfo.birthtime from Deno.lstat())
// - resolve conflicts of local properties
// - return properties as property of file

// for each file
// create object representing file
// - properties of file
// - body of file (RAW)
// - creation date of file
// - path of file
// - file name
// - file extension
// - inputPath
// - outputPath from property.permalink or inputPath
// - creationDate from property.date or creation date