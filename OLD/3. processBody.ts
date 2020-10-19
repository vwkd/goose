// process body

// for each file
// if in global properties
// - add to global properties
// - resolve conflicts
// - discard file since not outputted

// for each file
// if exists layout template
// - wrap body with body of layout template

// for each file
// if is layout template
// - discard layout template since not outputted

// for each file
// if exists processing (e.g. markdown)
// - get global / layout template / local properties
// - deep merge, resolve conflicts
// - process file

// for each file
// if exists transformation (e.g. plugin)
// - transform body
